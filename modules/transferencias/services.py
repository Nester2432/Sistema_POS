from django.db import transaction
from django.core.exceptions import ValidationError
from decimal import Decimal

from .models import TransferenciaStock, TransferenciaItem, EstadoTransferencia
from modules.inventario.services import registrar_movimiento_stock
from modules.inventario.models import TipoMovimiento
from modules.sucursales.models import StockSucursal
from modules.inventario.models import Producto

@transaction.atomic
def crear_transferencia(usuario, empresa, sucursal_origen, sucursal_destino, observaciones, items_data):
    """
    Crea una transferencia en estado BORRADOR junto con sus ítems.
    """
    if sucursal_origen == sucursal_destino:
        raise ValidationError("La sucursal de origen y destino no pueden ser la misma.")
        
    transferencia = TransferenciaStock.objects.create(
        empresa=empresa,
        sucursal_origen=sucursal_origen,
        sucursal_destino=sucursal_destino,
        usuario=usuario,
        estado=EstadoTransferencia.BORRADOR,
        observaciones=observaciones
    )
    
    for item in items_data:
        TransferenciaItem.objects.create(
            empresa=empresa,
            transferencia=transferencia,
            producto=item['producto'],
            cantidad=Decimal(str(item['cantidad']))
        )
        
    return transferencia

@transaction.atomic
def confirmar_transferencia(transferencia_id, usuario):
    """
    Confirma una transferencia: Descuenta de origen, ingresa a destino.
    Bloquea las filas de StockSucursal origen con select_for_update() para evitar condiciones de carrera.
    """
    # Bloqueamos la transferencia para evitar dobles confirmaciones
    transferencia = TransferenciaStock.objects.select_for_update().get(id=transferencia_id)
    
    if transferencia.estado != EstadoTransferencia.BORRADOR:
        raise ValidationError("Solo se pueden confirmar transferencias en estado BORRADOR.")
        
    items = transferencia.items.all()
    if not items.exists():
        raise ValidationError("La transferencia no tiene productos para mover.")

    # Ordenar por ID de producto para evitar deadlocks
    producto_ids = [item.producto_id for item in items]
    
    # Bloquear los registros de StockSucursal Origen
    stocks_origen = StockSucursal.objects.select_for_update().filter(
        sucursal=transferencia.sucursal_origen,
        producto_id__in=producto_ids
    )
    
    stock_dict = {s.producto_id: s for s in stocks_origen}
    
    # Validar que exista el stock antes de empezar a mover
    for item in items:
        stock_disp = stock_dict.get(item.producto_id)
        if not stock_disp or stock_disp.stock_actual < item.cantidad:
            raise ValidationError(f"Stock insuficiente para {item.producto.nombre} en la sucursal de origen.")

    motivo_base = f"Transferencia {transferencia.numero_transferencia or 'TR-DRAFT'}"

    # Ejecutar Movimientos
    for item in items:
        # 1. Descontar de origen
        registrar_movimiento_stock(
            producto=item.producto,
            tipo=TipoMovimiento.EGRESO_TRANSFERENCIA,
            cantidad=item.cantidad,
            usuario=usuario,
            motivo=f"{motivo_base} hacia {transferencia.sucursal_destino.nombre}",
            sucursal=transferencia.sucursal_origen
        )
        
        # 2. Sumar en destino
        registrar_movimiento_stock(
            producto=item.producto,
            tipo=TipoMovimiento.INGRESO_TRANSFERENCIA,
            cantidad=item.cantidad,
            usuario=usuario,
            motivo=f"{motivo_base} desde {transferencia.sucursal_origen.nombre}",
            sucursal=transferencia.sucursal_destino
        )

    # 3. Cambiar estado
    transferencia.estado = EstadoTransferencia.CONFIRMADA
    transferencia.save(update_fields=['estado', 'numero_transferencia', 'updated_at']) # save genera el numero si faltaba

    return transferencia

@transaction.atomic
def cancelar_transferencia(transferencia_id):
    """
    Cancela una transferencia en estado BORRADOR.
    """
    transferencia = TransferenciaStock.objects.select_for_update().get(id=transferencia_id)
    
    if transferencia.estado != EstadoTransferencia.BORRADOR:
        raise ValidationError("Solo se pueden cancelar transferencias en estado BORRADOR.")
        
    transferencia.estado = EstadoTransferencia.CANCELADA
    transferencia.save(update_fields=['estado', 'updated_at'])
    
    return transferencia
