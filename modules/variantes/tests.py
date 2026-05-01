from django.test import TestCase
from rest_framework.test import APIClient
from decimal import Decimal
from django.core.exceptions import ValidationError

from apps.empresas.models import Empresa
from apps.usuarios.models import Usuario, RolChoices
from modules.inventario.models import Producto, Categoria, TipoMovimiento
from modules.sucursales.models import Sucursal, StockSucursal
from modules.variantes.models import AtributoProducto, ValorAtributoProducto, ProductoVariante
from modules.ventas.services import crear_venta_completa

class VariantesTestCase(TestCase):
    def setUp(self):
        self.empresa = Empresa.objects.create(nombre="Test Corp", documento_fiscal="12345")
        self.usuario = Usuario.objects.create_user(
            email="test@test.com", password="password123", 
            nombre="Test User",
            empresa=self.empresa, rol=RolChoices.ADMIN
        )
        self.sucursal = Sucursal.objects.create(
            empresa=self.empresa, nombre="Central", codigo="C1", es_principal=True
        )
        self.categoria = Categoria.objects.create(empresa=self.empresa, nombre="General")
        
        self.producto = Producto.objects.create(
            empresa=self.empresa, nombre="Remera", sku="REM-01", 
            precio_venta=Decimal("1000.00"), categoria=self.categoria
        )
        
        self.atributo = AtributoProducto.objects.create(empresa=self.empresa, nombre="Talle")
        self.valor_m = ValorAtributoProducto.objects.create(empresa=self.empresa, atributo=self.atributo, valor="M")
        
        self.variante = ProductoVariante.objects.create(
            empresa=self.empresa, producto_padre=self.producto, sku="REM-01-M",
            precio_venta=Decimal("1200.00")
        )
        from modules.variantes.models import VarianteValor
        VarianteValor.objects.create(variante=self.variante, atributo=self.atributo, valor=self.valor_m)
        self.producto.tiene_variantes = True
        self.producto.save()

    def test_venta_variante_descuenta_stock_correcto(self):
        # 1. Cargar stock a la variante
        from modules.inventario.services import registrar_movimiento_stock
        registrar_movimiento_stock(
            producto=self.producto, variante=self.variante,
            tipo=TipoMovimiento.INGRESO, cantidad=Decimal("10.00"),
            usuario=self.usuario, sucursal=self.sucursal
        )
        
        stock_var = StockSucursal.objects.get(producto=self.producto, variante=self.variante, sucursal=self.sucursal)
        self.assertEqual(stock_var.stock_actual, Decimal("10.00"))
        
        # 2. Vender variante
        items = [{"producto": self.producto, "variante": self.variante, "cantidad": 2}]
        from modules.caja.services import abrir_caja
        caja = abrir_caja(self.usuario, self.empresa, Decimal("1000.00"))
        
        crear_venta_completa(self.usuario, self.empresa, items, "TICKET", "EFECTIVO")
        
        # 3. Verificar stock
        stock_var.refresh_from_db()
        self.assertEqual(stock_var.stock_actual, Decimal("8.00"))

    def test_no_vender_padre_con_variantes_sin_especificar(self):
        self.producto.tiene_variantes = True
        self.producto.save()
        
        items = [{"producto": self.producto, "cantidad": 1}]
        from modules.caja.services import abrir_caja
        caja = abrir_caja(self.usuario, self.empresa, Decimal("1000.00"))
        
        with self.assertRaises(ValidationError):
            crear_venta_completa(self.usuario, self.empresa, items, "TICKET", "EFECTIVO")

    def test_precio_heredado_del_padre(self):
        # Crear variante con precio 0
        variante_s = ProductoVariante.objects.create(
            empresa=self.empresa, producto_padre=self.producto, sku="REM-01-S",
            precio_venta=Decimal("0.00")
        )
        
        self.assertEqual(variante_s.get_precio_venta, self.producto.precio_venta)
        self.assertEqual(self.variante.get_precio_venta, Decimal("1200.00"))
