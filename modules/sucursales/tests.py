from django.test import TestCase
from decimal import Decimal

from apps.empresas.models import Empresa
from apps.usuarios.models import Usuario
from modules.inventario.models import Producto, Categoria
from modules.sucursales.models import Sucursal, StockSucursal
from modules.inventario.services import registrar_movimiento_stock
from modules.inventario.models import TipoMovimiento
from modules.ventas.services import crear_venta_completa
from modules.caja.models import Caja
from modules.compras.services import crear_compra_completa
from modules.inventario.models import Proveedor

class SucursalesTestCase(TestCase):
    def setUp(self):
        # 1. Crear Empresas
        self.empresa_a = Empresa.objects.create(nombre="Empresa A", documento_fiscal="111")
        self.empresa_b = Empresa.objects.create(nombre="Empresa B", documento_fiscal="222")

        # 2. Crear Usuarios
        self.user_a = Usuario.objects.create_user(
            email="user_a@test.com", password="pwd", 
            empresa=self.empresa_a, nombre="User A", rol="admin"
        )
        self.user_b = Usuario.objects.create_user(
            email="user_b@test.com", password="pwd", 
            empresa=self.empresa_b, nombre="User B", rol="admin"
        )

        # La migración de datos ya crea sucursales principales si se corre, 
        # pero en tests unitarios solemos crearlas explícitamente o confiar en señales.
        # Aquí las crearemos explícitamente para asegurar el setup aislado.
        self.sucursal_principal_a = Sucursal.objects.create(
            empresa=self.empresa_a, nombre="Principal A", codigo="PRIN-A", es_principal=True
        )
        self.sucursal_secundaria_a = Sucursal.objects.create(
            empresa=self.empresa_a, nombre="Secundaria A", codigo="SEC-A"
        )
        self.sucursal_b = Sucursal.objects.create(
            empresa=self.empresa_b, nombre="Principal B", codigo="PRIN-B", es_principal=True
        )

        # 3. Crear Producto
        self.categoria = Categoria.objects.create(empresa=self.empresa_a, nombre="Cat A")
        self.producto = Producto.objects.create(
            empresa=self.empresa_a,
            categoria=self.categoria,
            nombre="Producto Test",
            sku="SKU-001",
            precio_costo=Decimal("10.00"),
            precio_venta=Decimal("20.00"),
            stock_actual=Decimal("0.00")
        )

        # 4. Crear Caja (requerida para ventas y compras en efectivo)
        self.caja_a = Caja.objects.create(
            empresa=self.empresa_a,
            usuario_apertura=self.user_a,
            saldo_inicial=Decimal("100.00"),
            estado="ABIERTA"
        )

    def test_creacion_sucursal_y_aislamiento(self):
        """Prueba que Empresa A no acceda a sucursales de Empresa B."""
        # Usuario A no debería ver sucursales de Empresa B si se usa el manager
        sucursales_a = Sucursal.objects.for_empresa(self.empresa_a.id)
        self.assertEqual(sucursales_a.count(), 2)
        
        sucursales_b = Sucursal.objects.for_empresa(self.empresa_b.id)
        self.assertEqual(sucursales_b.count(), 1)
        
        # Verificar aislamiento explícito
        for suc in sucursales_a:
            self.assertEqual(suc.empresa_id, self.empresa_a.id)

    def test_movimiento_stock_fallback_principal(self):
        """Si no se especifica sucursal, el stock debe ir a la principal."""
        registrar_movimiento_stock(
            producto=self.producto,
            tipo=TipoMovimiento.INGRESO,
            cantidad=Decimal("50.00"),
            usuario=self.user_a
        )
        
        # Verificar StockSucursal en principal
        stock_prin = StockSucursal.objects.get(sucursal=self.sucursal_principal_a, producto=self.producto)
        self.assertEqual(stock_prin.stock_actual, Decimal("50.00"))
        
        # Verificar que la secundaria no tenga stock
        stock_sec = StockSucursal.objects.filter(sucursal=self.sucursal_secundaria_a, producto=self.producto).first()
        self.assertIsNone(stock_sec)

        # Compatibilidad: Producto global también debió subir a 50
        self.producto.refresh_from_db()
        self.assertEqual(self.producto.stock_actual, Decimal("50.00"))

    def test_venta_descuenta_stock_sucursal_activa(self):
        """Una venta en una sucursal específica debe descontar de esa y no de otra."""
        # 1. Ingresar stock en la secundaria (30) y en la principal (10)
        registrar_movimiento_stock(
            producto=self.producto, tipo=TipoMovimiento.INGRESO,
            cantidad=Decimal("30.00"), usuario=self.user_a, sucursal=self.sucursal_secundaria_a
        )
        registrar_movimiento_stock(
            producto=self.producto, tipo=TipoMovimiento.INGRESO,
            cantidad=Decimal("10.00"), usuario=self.user_a, sucursal=self.sucursal_principal_a
        )
        
        self.producto.refresh_from_db()
        self.assertEqual(self.producto.stock_actual, Decimal("40.00")) # Global

        # 2. Vender 5 unidades en Sucursal Secundaria
        crear_venta_completa(
            usuario=self.user_a,
            empresa=self.empresa_a,
            items_data=[{
                'producto': self.producto,
                'cantidad': 5,
                'precio_unitario': 20.00
            }],
            tipo_comprobante="TICKET",
            metodo_pago="EFECTIVO",
            sucursal=self.sucursal_secundaria_a
        )

        # 3. Verificar Stocks
        stock_sec = StockSucursal.objects.get(sucursal=self.sucursal_secundaria_a, producto=self.producto)
        self.assertEqual(stock_sec.stock_actual, Decimal("25.00")) # 30 - 5 = 25

        stock_prin = StockSucursal.objects.get(sucursal=self.sucursal_principal_a, producto=self.producto)
        self.assertEqual(stock_prin.stock_actual, Decimal("10.00")) # Intacto

        self.producto.refresh_from_db()
        self.assertEqual(self.producto.stock_actual, Decimal("35.00")) # Global (40 - 5 = 35)

    def test_compra_ingresa_stock_sucursal_correcta(self):
        """Una compra debe impactar positivamente la sucursal indicada."""
        proveedor = Proveedor.objects.create(empresa=self.empresa_a, nombre="Prov Test")
        
        crear_compra_completa(
            usuario=self.user_a,
            empresa=self.empresa_a,
            proveedor=proveedor,
            items_data=[{
                'producto': self.producto,
                'cantidad': 100,
                'precio_unitario': 10.00
            }],
            numero_comprobante="F001",
            metodo_pago="EFECTIVO",
            sucursal=self.sucursal_secundaria_a
        )

        stock_sec = StockSucursal.objects.get(sucursal=self.sucursal_secundaria_a, producto=self.producto)
        self.assertEqual(stock_sec.stock_actual, Decimal("100.00"))

        # Principal sin cambios
        stock_prin_exists = StockSucursal.objects.filter(sucursal=self.sucursal_principal_a, producto=self.producto).exists()
        self.assertFalse(stock_prin_exists)

class SucursalMiddlewareTestCase(TestCase):
    def setUp(self):
        self.empresa_a = Empresa.objects.create(nombre="Empresa A", documento_fiscal="111")
        self.empresa_b = Empresa.objects.create(nombre="Empresa B", documento_fiscal="222")

        self.sucursal_prin = Sucursal.objects.create(
            empresa=self.empresa_a, nombre="Prin", codigo="PRIN", es_principal=True
        )
        self.sucursal_sec = Sucursal.objects.create(
            empresa=self.empresa_a, nombre="Sec", codigo="SEC"
        )
        self.sucursal_b = Sucursal.objects.create(
            empresa=self.empresa_b, nombre="Prin B", codigo="PRIN-B", es_principal=True
        )

        from django.test import RequestFactory
        self.factory = RequestFactory()

    def _get_middleware(self):
        from core.middleware_sucursal import SucursalMiddleware
        # Mock get_response that returns a 200 OK
        from django.http import HttpResponse
        def get_response(request):
            return HttpResponse(status=200)
        return SucursalMiddleware(get_response)

    def test_sin_header_usa_principal(self):
        request = self.factory.get('/')
        request.empresa = self.empresa_a
        
        middleware = self._get_middleware()
        response = middleware(request)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(request.sucursal, self.sucursal_prin)

    def test_con_header_valido_usa_sucursal(self):
        request = self.factory.get('/', HTTP_X_SUCURSAL_ID=str(self.sucursal_sec.id))
        request.empresa = self.empresa_a
        
        middleware = self._get_middleware()
        response = middleware(request)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(request.sucursal, self.sucursal_sec)

    def test_con_header_invalido_devuelve_403(self):
        request = self.factory.get('/', HTTP_X_SUCURSAL_ID=str(self.sucursal_b.id))
        request.empresa = self.empresa_a # Intento de acceder a sucursal de B desde empresa A
        
        middleware = self._get_middleware()
        response = middleware(request)
        
        # Debe fallar y no setear sucursal, devolviendo 403
        self.assertEqual(response.status_code, 403)
        import json
        data = json.loads(response.content)
        self.assertIn("error", data)

