"""
modules/ventas/tests_pdf.py
────────────────────────────────────────────────────────────────
Tests para validación de generación de Ticket PDF.
"""
from decimal import Decimal
from django.test import TestCase
from apps.empresas.models import Empresa
from apps.usuarios.models import Usuario, RolChoices
from modules.inventario.models import Producto
from modules.sucursales.models import Sucursal, StockSucursal
from .models import Venta
from .services import crear_venta_completa
from .services_pdf import generar_ticket_pdf
from modules.caja.services import abrir_caja

class TicketPDFTestCase(TestCase):
    def setUp(self):
        self.empresa = Empresa.objects.create(nombre="Test Corp")
        self.sucursal = Sucursal.objects.create(
            empresa=self.empresa,
            nombre="Sucursal Central",
            codigo="CENTRAL",
            es_principal=True
        )
        self.user = Usuario.objects.create_user(
            email="test@test.com", nombre="Tester", password="123", 
            empresa=self.empresa, rol=RolChoices.ADMIN
        )
        self.producto = Producto.objects.create(
            empresa=self.empresa,
            nombre="Producto Test",
            sku="T01",
            precio_venta=Decimal("100.00"),
            stock_actual=Decimal("10")
        )
        # Asignar stock a la sucursal
        StockSucursal.objects.create(
            empresa=self.empresa,
            sucursal=self.sucursal,
            producto=self.producto,
            stock_actual=Decimal("100")
        )
        self.caja = abrir_caja(self.user, self.empresa, Decimal("1000"))

    def test_generar_pdf_exitoso(self):
        """Validar que se genere un PDF con contenido binario."""
        items_data = [{'producto': self.producto, 'cantidad': 1}]
        pagos_data = [{'metodo_pago': 'EFECTIVO', 'monto': Decimal("100.00")}]
        
        venta = crear_venta_completa(
            usuario=self.user,
            empresa=self.empresa,
            items_data=items_data,
            tipo_comprobante="TICKET",
            pagos_data=pagos_data
        )
        
        pdf_bytes = generar_ticket_pdf(venta)
        
        # Un PDF válido debe empezar con %PDF
        self.assertTrue(pdf_bytes.startswith(b'%PDF'))
        self.assertGreater(len(pdf_bytes), 1000) # Debe tener contenido

    def test_generar_pdf_multi_pago(self):
        """Validar PDF con pagos divididos."""
        items_data = [{'producto': self.producto, 'cantidad': 2}] # 200
        pagos_data = [
            {'metodo_pago': 'EFECTIVO', 'monto': Decimal("50.00")},
            {'metodo_pago': 'TARJETA', 'monto': Decimal("150.00")}
        ]
        
        venta = crear_venta_completa(self.user, self.empresa, items_data, "TICKET", pagos_data)
        pdf_bytes = generar_ticket_pdf(venta)
        
        self.assertTrue(pdf_bytes.startswith(b'%PDF'))
