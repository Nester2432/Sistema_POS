"""
modules/clientes/services.py
────────────────────────────────────────────────────────────────
Servicios para Clientes y Cuenta Corriente.
Incluye integración con Caja para cobros.
"""
from django.db import transaction
from django.core.exceptions import ValidationError
from decimal import Decimal

from .models import Cliente, CuentaCorriente, MovimientoCuentaCorriente, TipoMovimientoCC
from modules.caja.services import registrar_movimiento_caja, obtener_caja_abierta_usuario
from modules.caja.models import TipoMovimientoCaja as CajaMovTipo

@transaction.atomic
def crear_cliente_con_cuenta(empresa, usuario, **datos_cliente) -> Cliente:
    """Crea un cliente e inicializa su cuenta corriente."""
    # Validar documento único por empresa
    doc = datos_cliente.get('documento')
    if Cliente.objects.for_empresa(empresa.id).filter(documento=doc).exists():
        raise ValidationError(f"Ya existe un cliente con documento {doc}.")

    cliente = Cliente.objects.create(empresa=empresa, **datos_cliente)
    
    # Crear CC
    CuentaCorriente.objects.create(
        empresa=empresa,
        cliente=cliente,
        limite_credito=datos_cliente.get('limite_credito', 0)
    )
    
    return cliente

@transaction.atomic
def registrar_debito_venta(venta, usuario) -> MovimientoCuentaCorriente:
    """Registra la deuda de una venta en la CC del cliente."""
    if not hasattr(venta, 'cliente_id_manual'): # Referencia manual si no usamos FK en Venta aún
        # En una fase real, el modelo Venta tendría una FK a Cliente. 
        # Aquí asumiremos que el sistema lo pasa.
        pass

    cc = venta.cliente.cuenta_corriente
    if not cc.activa:
        raise ValidationError("La cuenta corriente del cliente está suspendida.")

    monto = venta.total
    # Validar límite (salvo admin/supervisor)
    if usuario.rol not in ['admin', 'supervisor']:
        if cc.limite_credito > 0 and (cc.saldo_actual + monto) > cc.limite_credito:
            raise ValidationError(f"El cliente supera su límite de crédito ({cc.limite_credito}).")

    mov = MovimientoCuentaCorriente.objects.create(
        empresa=venta.empresa,
        cuenta=cc,
        tipo=TipoMovimientoCC.DEBITO,
        concepto=f"Deuda por Venta {venta.numero_comprobante}",
        monto=monto,
        venta=venta,
        usuario=usuario
    )
    
    cc.saldo_actual += monto
    cc.save()
    return mov

@transaction.atomic
def registrar_movimiento_cc(cliente, monto: Decimal, tipo: str, concepto: str, usuario, referencia: str = None) -> MovimientoCuentaCorriente:
    """
    Registra un movimiento genérico en la CC (Débito o Crédito).
    Útil para Split Payments o ajustes.
    """
    cc = cliente.cuenta_corriente
    if not cc.activa:
        raise ValidationError("La cuenta corriente del cliente está suspendida.")

    if tipo == 'DEBITO':
        # Validar límite (salvo admin/supervisor)
        if usuario.rol not in ['admin', 'supervisor']:
            if cc.limite_credito > 0 and (cc.saldo_actual + monto) > cc.limite_credito:
                raise ValidationError(f"El cliente supera su límite de crédito ({cc.limite_credito}).")
        cc.saldo_actual += monto
    else:
        cc.saldo_actual -= monto

    mov = MovimientoCuentaCorriente.objects.create(
        empresa=cliente.empresa,
        cuenta=cc,
        tipo=tipo,
        concepto=concepto,
        monto=monto,
        referencia=referencia,
        usuario=usuario
    )
    
    cc.save()
    return mov

@transaction.atomic
def registrar_pago_cc(cliente, monto: Decimal, usuario, metodo_pago: str, concepto: str = "Pago de cuenta corriente") -> MovimientoCuentaCorriente:
    """Registra un pago del cliente, reduce deuda e ingresa dinero en caja."""
    cc = cliente.cuenta_corriente
    if monto <= 0:
        raise ValidationError("El monto del pago debe ser positivo.")

    # 1. Registrar ingreso en Caja
    caja = obtener_caja_abierta_usuario(usuario, cliente.empresa_id)
    if not caja:
        raise ValidationError("No puedes recibir pagos sin una caja abierta.")

    registrar_movimiento_caja(
        caja=caja,
        tipo=CajaMovTipo.INGRESO,
        monto=monto,
        concepto=f"Pago CC Cliente: {cliente.nombre_completo}",
        usuario=usuario,
        metodo_pago=metodo_pago
    )

    # 2. Registrar crédito en CC
    mov = MovimientoCuentaCorriente.objects.create(
        empresa=cliente.empresa,
        cuenta=cc,
        tipo=TipoMovimientoCC.CREDITO,
        concepto=concepto,
        monto=monto,
        caja=caja,
        usuario=usuario
    )
    
    cc.saldo_actual -= monto
    cc.save()
    return mov
