"""
modules/ventas/tests.py
────────────────────────────────────────────────────────────────
Tests de integración para el flujo de Venta POS con Split Payments.
"""
from decimal import Decimal
from django.test import TestCase
from django.core.exceptions import ValidationError
from apps.empresas.models import Empresa
from apps.usuarios.models import Usuario, RolChoices
from modules.inventario.models import Producto
from modules.caja.services import abrir_caja
from modules.clientes.models import Cliente
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
        self.cliente = Cliente.objects.create(
            empresa=self.empresa,
            nombre="Juan Perez",
            documento="44555666"
        )
        # Necesitamos caja abierta para vender
        self.caja = abrir_caja(self.user, self.empresa, Decimal("100.00"))

    def test_venta_pago_unico(self):
        """Venta con un solo pago (Efectivo)."""
        items_data = [{'producto': self.producto, 'cantidad': 2}]
        pagos_data = [{'metodo_pago': 'EFECTIVO', 'monto': Decimal("30.00")}]
        
        venta = crear_venta_completa(
            usuario=self.user,
            empresa=self.empresa,
            items_data=items_data,
            tipo_comprobante="TICKET",
            pagos_data=pagos_data
        )
        
        self.assertEqual(venta.total, Decimal("30.00"))
        self.assertEqual(venta.metodo_pago, "EFECTIVO") # Legacy check
        self.assertEqual(venta.pagos.count(), 1)
        self.assertEqual(self.caja.movimientos.filter(metodo_pago='EFECTIVO').count(), 1)

    def test_venta_split_payment(self):
        """Venta con dos pagos (Efectivo + Tarjeta)."""
        items_data = [{'producto': self.producto, 'cantidad': 10}] # Total: 150
        pagos_data = [
            {'metodo_pago': 'EFECTIVO', 'monto': Decimal("50.00")},
            {'metodo_pago': 'TARJETA', 'monto': Decimal("100.00")}
        ]
        
        venta = crear_venta_completa(
            usuario=self.user,
            empresa=self.empresa,
            items_data=items_data,
            tipo_comprobante="TICKET",
            pagos_data=pagos_data
        )
        
        self.assertEqual(venta.total, Decimal("150.00"))
        self.assertEqual(venta.metodo_pago, "MIXTO") # Legacy check
        self.assertEqual(venta.pagos.count(), 2)
        
        # Verificar movimientos de caja separados
        self.assertEqual(self.caja.movimientos.count(), 2)
        self.assertTrue(self.caja.movimientos.filter(metodo_pago='EFECTIVO', monto=50).exists())
        self.assertTrue(self.caja.movimientos.filter(metodo_pago='TARJETA', monto=100).exists())

    def test_venta_cuenta_corriente(self):
        """Venta con un pago en CC."""
        items_data = [{'producto': self.producto, 'cantidad': 1}] # Total: 15
        pagos_data = [{'metodo_pago': 'CUENTA_CORRIENTE', 'monto': Decimal("15.00")}]
        
        venta = crear_venta_completa(
            usuario=self.user,
            empresa=self.empresa,
            items_data=items_data,
            tipo_comprobante="TICKET",
            pagos_data=pagos_data,
            cliente=self.cliente
        )
        
        self.assertEqual(venta.total, Decimal("15.00"))
        # El saldo del cliente debería haber aumentado
        self.cliente.refresh_from_db()
        self.assertEqual(self.cliente.saldo, Decimal("15.00"))
        # No debería haber movimientos en caja
        self.assertEqual(self.caja.movimientos.count(), 0)

    def test_error_suma_pagos_incorrecta(self):
        """Error si la suma de pagos no coincide con el total."""
        items_data = [{'producto': self.producto, 'cantidad': 1}] # Total: 15
        pagos_data = [{'metodo_pago': 'EFECTIVO', 'monto': Decimal("10.00")}]
        
        with self.assertRaises(ValidationError):
            crear_venta_completa(
                self.user, self.empresa, items_data, "TICKET", pagos_data
            )

    def test_anular_venta_multi_pago(self):
        """Anulación devuelve dinero de todos los pagos."""
        items_data = [{'producto': self.producto, 'cantidad': 2}] # Total: 30
        pagos_data = [
            {'metodo_pago': 'EFECTIVO', 'monto': Decimal("10.00")},
            {'metodo_pago': 'TRANSFERENCIA', 'monto': Decimal("20.00")}
        ]
        venta = crear_venta_completa(self.user, self.empresa, items_data, "TICKET", pagos_data)
        
        # Anular
        anular_venta(venta, self.user)
        
        self.assertEqual(venta.estado, VentaEstado.ANULADA)
        # Debería haber 2 movimientos de devolución en caja
        self.assertEqual(self.caja.movimientos.filter(tipo='DEVOLUCION').count(), 2)
        self.assertTrue(self.caja.movimientos.filter(metodo_pago='EFECTIVO', monto=10).exists())
        self.assertTrue(self.caja.movimientos.filter(metodo_pago='TRANSFERENCIA', monto=20).exists())
