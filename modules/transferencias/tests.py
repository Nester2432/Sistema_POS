from django.test import TestCase
from django.core.exceptions import ValidationError
from decimal import Decimal

from apps.empresas.models import Empresa
from apps.usuarios.models import Usuario
from modules.sucursales.models import Sucursal, StockSucursal
from modules.inventario.models import Producto, Categoria, TipoMovimiento
from modules.inventario.services import registrar_movimiento_stock
from .models import TransferenciaStock, TransferenciaItem, EstadoTransferencia
from .services import crear_transferencia, confirmar_transferencia, cancelar_transferencia

class TransferenciasTestCase(TestCase):
    def setUp(self):
        self.empresa_a = Empresa.objects.create(nombre="Empresa A", documento_fiscal="111")
        self.empresa_b = Empresa.objects.create(nombre="Empresa B", documento_fiscal="222")

        self.user_a = Usuario.objects.create_user(
            email="admin@test.com", password="pwd", 
            empresa=self.empresa_a, nombre="Admin", rol="admin"
        )

        self.sucursal_1 = Sucursal.objects.create(empresa=self.empresa_a, nombre="S1", codigo="S1", es_principal=True)
        self.sucursal_2 = Sucursal.objects.create(empresa=self.empresa_a, nombre="S2", codigo="S2")
        self.sucursal_b = Sucursal.objects.create(empresa=self.empresa_b, nombre="SB", codigo="SB")

        self.categoria = Categoria.objects.create(empresa=self.empresa_a, nombre="Cat")
        self.producto = Producto.objects.create(
            empresa=self.empresa_a, categoria=self.categoria,
            nombre="Prod", sku="PROD-1", precio_costo=Decimal("10"), precio_venta=Decimal("20")
        )

        # Dar 100 de stock inicial en Sucursal 1
        registrar_movimiento_stock(
            producto=self.producto, tipo=TipoMovimiento.INGRESO,
            cantidad=Decimal("100"), usuario=self.user_a, sucursal=self.sucursal_1
        )

    def test_creacion_falla_si_origen_igual_destino(self):
        with self.assertRaisesMessage(ValidationError, "La sucursal de origen y destino no pueden ser la misma"):
            crear_transferencia(
                usuario=self.user_a, empresa=self.empresa_a,
                sucursal_origen=self.sucursal_1, sucursal_destino=self.sucursal_1,
                observaciones="", items_data=[{'producto': self.producto, 'cantidad': 10}]
            )

    def test_creacion_falla_cross_tenant(self):
        with self.assertRaisesMessage(ValidationError, "La sucursal de destino no pertenece a la misma empresa"):
            transf = TransferenciaStock(
                empresa=self.empresa_a, sucursal_origen=self.sucursal_1,
                sucursal_destino=self.sucursal_b, usuario=self.user_a
            )
            transf.clean()

    def test_transferencia_exitosa_ajusta_stock(self):
        # 1. Crear
        transf = crear_transferencia(
            usuario=self.user_a, empresa=self.empresa_a,
            sucursal_origen=self.sucursal_1, sucursal_destino=self.sucursal_2,
            observaciones="Test", items_data=[{'producto': self.producto, 'cantidad': Decimal("40")}]
        )
        self.assertEqual(transf.estado, EstadoTransferencia.BORRADOR)
        self.assertIsNone(transf.numero_transferencia)

        # 2. Confirmar
        transf = confirmar_transferencia(transf.id, self.user_a)

        self.assertEqual(transf.estado, EstadoTransferencia.CONFIRMADA)
        self.assertIsNotNone(transf.numero_transferencia)

        # 3. Verificar stocks
        stock_s1 = StockSucursal.objects.get(sucursal=self.sucursal_1, producto=self.producto)
        stock_s2 = StockSucursal.objects.get(sucursal=self.sucursal_2, producto=self.producto)

        self.assertEqual(stock_s1.stock_actual, Decimal("60")) # 100 - 40
        self.assertEqual(stock_s2.stock_actual, Decimal("40")) # 0 + 40

    def test_confirmar_falla_sin_stock(self):
        # Tratar de enviar 150 desde S1 (tiene 100)
        transf = crear_transferencia(
            usuario=self.user_a, empresa=self.empresa_a,
            sucursal_origen=self.sucursal_1, sucursal_destino=self.sucursal_2,
            observaciones="Test Overdraft", items_data=[{'producto': self.producto, 'cantidad': Decimal("150")}]
        )
        
        with self.assertRaisesMessage(ValidationError, "Stock insuficiente"):
            confirmar_transferencia(transf.id, self.user_a)

        # Stock debe seguir en 100
        stock_s1 = StockSucursal.objects.get(sucursal=self.sucursal_1, producto=self.producto)
        self.assertEqual(stock_s1.stock_actual, Decimal("100"))

    def test_cancelar_transferencia(self):
        transf = crear_transferencia(
            usuario=self.user_a, empresa=self.empresa_a,
            sucursal_origen=self.sucursal_1, sucursal_destino=self.sucursal_2,
            observaciones="Test", items_data=[{'producto': self.producto, 'cantidad': Decimal("10")}]
        )
        transf = cancelar_transferencia(transf.id)
        self.assertEqual(transf.estado, EstadoTransferencia.CANCELADA)
        
        # Ya no se puede confirmar
        with self.assertRaisesMessage(ValidationError, "Solo se pueden confirmar transferencias en estado BORRADOR."):
            confirmar_transferencia(transf.id, self.user_a)
