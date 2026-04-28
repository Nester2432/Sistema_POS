"""
modules/ventas/tests.py
────────────────────────────────────────────────────────────────
Tests de integración para el flujo de Venta POS.
"""
from decimal import Decimal
from django.test import TestCase
from django.core.exceptions import ValidationError
from apps.empresas.models import Empresa
from apps.usuarios.models import Usuario, RolChoices
from modules.inventario.models import Producto
from modules.caja.services import abrir_caja
from .models import Venta, VentaEstado
from .services import crear_venta_completa, anular_venta

class VentasTestCase(TestCase):
    def setUp(self):
        self.empresa = Empresa.objects.create(nombre="Test Corp", documento_fiscal="123")
        self.user = Usuario.objects.create_user(
            email="pos@test.com", nombre="Cajero", password="123", 
            empresa=self.empresa, rol=RolChoices.ADMIN
        )
        self.producto = Producto.objects.create(
            empresa=self.empresa,
            nombre="Coca Cola",
            sku="COCA-01",
            precio_costo=Decimal("10.00"),
            precio_venta=Decimal("15.00"),
            stock_actual=Decimal("100.00")
        )
        # Necesitamos caja abierta para vender
        self.caja = abrir_caja(self.user, self.empresa, Decimal("100.00"))

    def test_venta_exitosa(self):
        """Validar que una venta descuente stock y registre en caja."""
        items_data = [
            {'producto': self.producto, 'cantidad': 2}
        ]
        venta = crear_venta_completa(
            usuario=self.user,
            empresa=self.empresa,
            items_data=items_data,
            tipo_comprobante="TICKET",
            metodo_pago="EFECTIVO"
        )
        
        self.assertEqual(venta.total, Decimal("30.00"))
        self.assertEqual(venta.estado, VentaEstado.CONFIRMADA)
        
        # Verificar stock
        self.producto.refresh_from_db()
        self.assertEqual(self.producto.stock_actual, Decimal("98.00"))
        
        # Verificar caja
        self.assertEqual(self.caja.movimientos.count(), 1)
        self.assertEqual(self.caja.movimientos.first().monto, Decimal("30.00"))

    def test_no_vender_sin_stock(self):
        """Validar error si se intenta vender más de lo que hay."""
        items_data = [{'producto': self.producto, 'cantidad': 200}]
        with self.assertRaises(ValidationError):
            crear_venta_completa(
                self.user, self.empresa, items_data, "TICKET", "EFECTIVO"
            )

    def test_anular_venta(self):
        """Validar que anular devuelva stock."""
        items_data = [{'producto': self.producto, 'cantidad': 10}]
        venta = crear_venta_completa(self.user, self.empresa, items_data, "TICKET", "EFECTIVO")
        
        self.producto.refresh_from_db()
        self.assertEqual(self.producto.stock_actual, Decimal("90.00"))
        
        anular_venta(venta, self.user)
        
        self.producto.refresh_from_db()
        self.assertEqual(self.producto.stock_actual, Decimal("100.00"))
        self.assertEqual(venta.estado, VentaEstado.ANULADA)
