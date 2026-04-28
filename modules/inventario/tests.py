"""
modules/inventario/tests.py
────────────────────────────────────────────────────────────────
Tests básicos para el módulo de inventario.
Verifica aislamiento de stock y lógica de transacciones.
"""
from decimal import Decimal
from django.test import TestCase
from django.core.exceptions import ValidationError
from apps.empresas.models import Empresa
from apps.usuarios.models import Usuario, RolChoices
from .models import Producto, TipoMovimiento
from .services import registrar_movimiento_stock, ajustar_stock_manual

class InventarioTestCase(TestCase):
    def setUp(self):
        self.empresa = Empresa.objects.create(nombre="Test Corp", documento_fiscal="123")
        self.user = Usuario.objects.create_user(
            email="test@test.com", nombre="Tester", password="123", 
            empresa=self.empresa, rol=RolChoices.ADMIN
        )
        self.producto = Producto.objects.create(
            empresa=self.empresa,
            nombre="Producto Test",
            sku="TEST-01",
            precio_costo=Decimal("10.00"),
            precio_venta=Decimal("15.00"),
            stock_actual=Decimal("10.00")
        )

    def test_registrar_ingreso(self):
        """Validar que un ingreso aumente el stock y cree historial."""
        registrar_movimiento_stock(
            producto=self.producto,
            tipo=TipoMovimiento.INGRESO,
            cantidad=Decimal("5.00"),
            usuario=self.user
        )
        self.producto.refresh_from_db()
        self.assertEqual(self.producto.stock_actual, Decimal("15.00"))
        self.assertEqual(self.producto.movimientos.count(), 1)

    def test_no_permitir_stock_negativo(self):
        """Validar que un egreso mayor al stock falle."""
        with self.assertRaises(ValidationError):
            registrar_movimiento_stock(
                producto=self.producto,
                tipo=TipoMovimiento.EGRESO,
                cantidad=Decimal("20.00"),
                usuario=self.user
            )

    def test_ajuste_stock(self):
        """Validar ajuste manual de stock."""
        ajustar_stock_manual(self.producto, Decimal("50.00"), self.user)
        self.producto.refresh_from_db()
        self.assertEqual(self.producto.stock_actual, Decimal("50.00"))

    def test_exportar_excel(self):
        """Validar que la exportación genere un archivo con contenido."""
        from .services import exportar_productos_excel
        excel_data = exportar_productos_excel(self.empresa.id)
        self.assertTrue(len(excel_data) > 0)

    def test_importar_csv(self):
        """Validar importación masiva y registro de stock inicial."""
        import io
        from .services import importar_productos_desde_csv
        
        csv_content = (
            "nombre,sku,codigo_barras,precio_costo,precio_venta,stock_actual,stock_minimo\n"
            "Nuevo Produc,SKU-NEW-01,12345,10.00,20.00,100,10"
        )
        file = io.BytesIO(csv_content.encode('utf-8'))
        file.name = "test.csv"
        
        resultado = importar_productos_desde_csv(file, self.empresa, self.user)
        
        self.assertEqual(resultado['creados'], 1)
        self.assertEqual(len(resultado['errores']), 0)
        
        # Verificar que el producto se creó con stock vía movimiento
        producto = Producto.objects.get(sku="SKU-NEW-01")
        self.assertEqual(producto.stock_actual, Decimal("100.00"))
        self.assertEqual(producto.movimientos.count(), 1)
        self.assertEqual(producto.movimientos.first().tipo, TipoMovimiento.INGRESO)
