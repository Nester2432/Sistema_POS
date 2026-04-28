"""
modules/caja/services.py
────────────────────────────────────────────────────────────────
Lógica de negocio transaccional para el módulo de Caja.
"""
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
from decimal import Decimal

from .models import Caja, CajaEstado, MovimientoCaja, TipoMovimientoCaja

def obtener_caja_abierta_usuario(usuario, empresa_id):
    """Retorna la caja actualmente abierta para un usuario."""
    return Caja.objects.for_empresa(empresa_id).filter(
        usuario_apertura=usuario,
        estado=CajaEstado.ABIERTA
    ).first()

@transaction.atomic
def abrir_caja(usuario, empresa, saldo_inicial: Decimal) -> Caja:
    """Abre una nueva sesión de caja."""
    # Validar que no tenga una caja ya abierta
    if obtener_caja_abierta_usuario(usuario, empresa.id):
        raise ValidationError("Ya tienes una caja abierta. Debes cerrarla antes de abrir una nueva.")

    return Caja.objects.create(
        empresa=empresa,
        usuario_apertura=usuario,
        saldo_inicial=saldo_inicial,
        estado=CajaEstado.ABIERTA
    )

@transaction.atomic
def registrar_movimiento_caja(
    caja: Caja,
    tipo: str,
    monto: Decimal,
    concepto: str,
    usuario,
    metodo_pago: str,
    referencia: str = ""
) -> MovimientoCaja:
    """Registra un ingreso o egreso en una caja abierta."""
    if caja.estado != CajaEstado.ABIERTA:
        raise ValidationError("No se pueden registrar movimientos en una caja cerrada.")
    
    if monto <= 0:
        raise ValidationError("El monto debe ser mayor a cero.")

    return MovimientoCaja.objects.create(
        empresa=caja.empresa,
        caja=caja,
        tipo=tipo,
        monto=monto,
        concepto=concepto,
        metodo_pago=metodo_pago,
        usuario=usuario,
        referencia=referencia
    )

@transaction.atomic
def cerrar_caja(caja: Caja, saldo_declarado: Decimal, usuario_cierre, observaciones: str = "") -> Caja:
    """Realiza el arqueo y cierra la caja."""
    if caja.estado != CajaEstado.ABIERTA:
        raise ValidationError("Esta caja ya se encuentra cerrada.")

    # Calcular saldo del sistema (Efectivo)
    # Sumar ingresos (VENTA, INGRESO) y restar egresos (EGRESO, DEVOLUCION)
    # Solo consideramos EFECTIVO para el arqueo físico usualmente, 
    # pero aquí calcularemos el total neto esperado de la caja.
    
    movimientos = caja.movimientos.all()
    total_ingresos = sum(m.monto for m in movimientos if m.tipo in [TipoMovimientoCaja.INGRESO, TipoMovimientoCaja.VENTA])
    total_egresos = sum(m.monto for m in movimientos if m.tipo in [TipoMovimientoCaja.EGRESO, TipoMovimientoCaja.DEVOLUCION])
    
    saldo_calculado = caja.saldo_inicial + total_ingresos - total_egresos
    
    caja.saldo_final_calculado = saldo_calculado
    caja.saldo_final_declarado = saldo_declarado
    caja.diferencia = saldo_declarado - saldo_calculado
    
    caja.estado = CajaEstado.CERRADA
    caja.fecha_cierre = timezone.now()
    caja.usuario_cierre = usuario_cierre
    caja.observaciones = observaciones
    
    caja.save()
    return caja
