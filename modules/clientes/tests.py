"""
modules/clientes/tests.py
"""
from decimal import Decimal
from django.test import TestCase
from apps.empresas.models import Empresa
from apps.usuarios.models import Usuario, RolChoices
from modules.caja.services import abrir_caja
from .models import Cliente, CuentaCorriente, TipoMovimientoCC
from .services import crear_cliente_con_cuenta, registrar_pago_cc

class ClientesTestCase(TestCase):
    def setUp(self):
        self.empresa = Empresa.objects.create(nombre="Test Corp", documento_fiscal="123")
        self.user = Usuario.objects.create_user(
            email="admin@test.com", nombre="Admin", password="123", 
            empresa=self.empresa, rol=RolChoices.ADMIN
        )
        self.cliente = crear_cliente_con_cuenta(
            empresa=self.empresa,
            usuario=self.user,
            nombre="Juan",
            apellido="Perez",
            documento="20304050"
        )

    def test_creacion_cliente_y_cc(self):
        self.assertEqual(self.cliente.cuenta_corriente.saldo_actual, Decimal("0.00"))
        self.assertTrue(self.cliente.cuenta_corriente.activa)

    def test_registrar_pago_cc(self):
        # Necesitamos caja abierta para recibir pagos
        abrir_caja(self.user, self.empresa, Decimal("100.00"))
        
        # El cliente paga 50 (queda con saldo -50, a favor)
        registrar_pago_cc(self.cliente, Decimal("50.00"), self.user, "EFECTIVO")
        
        self.cliente.cuenta_corriente.refresh_from_db()
        self.assertEqual(self.cliente.cuenta_corriente.saldo_actual, Decimal("-50.00"))
        self.assertEqual(self.cliente.cuenta_corriente.movimientos.count(), 1)
        self.assertEqual(self.cliente.cuenta_corriente.movimientos.first().tipo, TipoMovimientoCC.CREDITO)
