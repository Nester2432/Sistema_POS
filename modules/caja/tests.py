"""
modules/caja/tests.py
"""
from decimal import Decimal
from django.test import TestCase
from django.core.exceptions import ValidationError
from apps.empresas.models import Empresa
from apps.usuarios.models import Usuario, RolChoices
from .models import Caja, CajaEstado, TipoMovimientoCaja, MetodoPago
from .services import abrir_caja, cerrar_caja, registrar_movimiento_caja

class CajaTestCase(TestCase):
    def setUp(self):
        self.empresa = Empresa.objects.create(nombre="Test Corp", documento_fiscal="123")
        self.user = Usuario.objects.create_user(
            email="cajero@test.com", nombre="Cajero", password="123", 
            empresa=self.empresa, rol=RolChoices.CAJERO
        )

    def test_abrir_caja(self):
        caja = abrir_caja(self.user, self.empresa, Decimal("100.00"))
        self.assertEqual(caja.estado, CajaEstado.ABIERTA)
        self.assertEqual(caja.saldo_inicial, Decimal("100.00"))

    def test_no_permitir_doble_apertura(self):
        abrir_caja(self.user, self.empresa, Decimal("100.00"))
        with self.assertRaises(ValidationError):
            abrir_caja(self.user, self.empresa, Decimal("50.00"))

    def test_cerrar_caja_con_diferencia(self):
        caja = abrir_caja(self.user, self.empresa, Decimal("100.00"))
        # Ingreso de 50
        registrar_movimiento_caja(caja, TipoMovimientoCaja.INGRESO, Decimal("50.00"), "Ingreso test", self.user, MetodoPago.EFECTIVO)
        
        # Saldo sistema: 150. Declarado: 140. Diferencia: -10.
        caja_cerrada = cerrar_caja(caja, Decimal("140.00"), self.user)
        
        self.assertEqual(caja_cerrada.estado, CajaEstado.CERRADA)
        self.assertEqual(caja_cerrada.saldo_final_calculado, Decimal("150.00"))
        self.assertEqual(caja_cerrada.diferencia, Decimal("-10.00"))
