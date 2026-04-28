"""
modules/compras/tests.py
"""
from decimal import Decimal
from django.test import TestCase
from apps.empresas.models import Empresa
from apps.usuarios.models import Usuario, RolChoices
from modules.inventario.models import Producto, Proveedor
from modules.caja.services import abrir_caja
from .models import Compra, CompraEstado
from .services import crear_compra_completa

class ComprasTestCase(TestCase):
    def setUp(self):
        self.empresa = Empresa.objects.create(nombre="Test Corp", documento_fiscal="123")
        self.user = Usuario.objects.create_user(
            email="admin@test.com", nombre="Admin", password="123", 
            empresa=self.empresa, rol=RolChoices.ADMIN
        )
        self.proveedor = Proveedor.objects.create(empresa=self.empresa, nombre="Proveedor X", documento="999")
        self.producto = Producto.objects.create(
            empresa=self.empresa,
            nombre="Producto A",
            sku="A001",
            precio_costo=Decimal("100.00"),
            stock_actual=Decimal("0.00")
        )
        self.caja = abrir_caja(self.user, self.empresa, Decimal("1000.00"))

    def test_compra_efectivo_aumenta_stock_y_resta_caja(self):
        items_data = [{'producto': self.producto, 'cantidad': 10, 'precio_unitario': 50}]
        compra = crear_compra_completa(
            self.user, self.empresa, self.proveedor, items_data, 
            "FACT-001", "EFECTIVO"
        )
        
        self.producto.refresh_from_db()
        self.assertEqual(self.producto.stock_actual, Decimal("10.00"))
        self.assertEqual(self.producto.precio_costo, Decimal("50.00")) # Se actualizó el costo
        
        self.assertEqual(self.caja.movimientos.count(), 1)
        self.assertEqual(self.caja.movimientos.first().monto, Decimal("500.00"))
        
    def test_compra_credito_genera_deuda(self):
        items_data = [{'producto': self.producto, 'cantidad': 5, 'precio_unitario': 100}]
        compra = crear_compra_completa(
            self.user, self.empresa, self.proveedor, items_data, 
            "FACT-002", "CUENTA_CORRIENTE"
        )
        
        self.assertEqual(self.proveedor.cuenta_corriente.saldo_actual, Decimal("500.00"))
        # No debe haber movimientos en caja
        self.assertEqual(self.caja.movimientos.count(), 0)
