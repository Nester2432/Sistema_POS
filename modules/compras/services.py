"""
modules/compras/services.py
────────────────────────────────────────────────────────────────
Lógica de negocio para Compras y Abastecimiento.
Aumenta stock y gestiona pagos/deudas.
"""
from django.db import transaction
from django.core.exceptions import ValidationError
from decimal import Decimal

from .models import Compra, CompraItem, CompraEstado, CuentaCorrienteProveedor
from modules.inventario.services import registrar_movimiento_stock
from modules.inventario.models import TipoMovimiento as StockMovTipo
from modules.caja.services import registrar_movimiento_caja, obtener_caja_abierta_usuario
from modules.caja.models import TipoMovimientoCaja as CajaMovTipo

@transaction.atomic
def crear_compra_completa(
    usuario,
    empresa,
    proveedor,
    items_data: list,
    numero_comprobante: str,
    metodo_pago: str, # EFECTIVO, CUENTA_CORRIENTE
    tipo_comprobante: str = "FACTURA",
    impuestos: Decimal = Decimal("0.00"),
    observaciones: str = ""
) -> Compra:
    """
    Registra una compra y actualiza stock/finanzas.
    """
    # 1. Preparar Cabecera
    compra = Compra(
        empresa=empresa,
        proveedor=proveedor,
        usuario=usuario,
        numero_comprobante=numero_comprobante,
        tipo_comprobante=tipo_comprobante,
        metodo_pago=metodo_pago,
        impuestos=impuestos,
        observaciones=observaciones,
        estado=CompraEstado.CONFIRMADA
    )
    
    # Validar si se paga de caja
    caja = None
    if metodo_pago == "EFECTIVO":
        caja = obtener_caja_abierta_usuario(usuario, empresa.id)
        if not caja:
            raise ValidationError("Se requiere una caja abierta para pagar la compra en efectivo.")
        compra.caja = caja

    compra.save()

    total_items = Decimal("0.00")
    
    # 2. Procesar Items e Inventario
    for item in items_data:
        producto = item['producto']
        cantidad = Decimal(str(item['cantidad']))
        precio_unitario = Decimal(str(item['precio_unitario']))
        item_subtotal = cantidad * precio_unitario
        
        CompraItem.objects.create(
            empresa=empresa,
            compra=compra,
            producto=producto,
            cantidad=cantidad,
            precio_unitario=precio_unitario,
            subtotal=item_subtotal
        )
        
        # Aumentar Stock
        registrar_movimiento_stock(
            producto=producto,
            tipo=StockMovTipo.INGRESO,
            cantidad=cantidad,
            usuario=usuario,
            motivo=f"Compra {numero_comprobante}"
        )
        
        # Opcional: Actualizar precio de costo del producto
        producto.precio_costo = precio_unitario
        producto.save(update_fields=['precio_costo', 'updated_at'])
        
        total_items += item_subtotal

    compra.subtotal = total_items
    compra.total = total_items + impuestos
    compra.save()

    # 3. Finanzas (Caja o Deuda)
    if metodo_pago == "EFECTIVO" and caja:
        registrar_movimiento_caja(
            caja=caja,
            tipo=CajaMovTipo.EGRESO,
            monto=compra.total,
            concepto=f"Pago Compra {numero_comprobante} - {proveedor.nombre}",
            usuario=usuario,
            metodo_pago="EFECTIVO",
            referencia=str(compra.id)
        )
    elif metodo_pago == "CUENTA_CORRIENTE":
        cc, _ = CuentaCorrienteProveedor.objects.get_or_create(empresa=empresa, proveedor=proveedor)
        cc.saldo_actual += compra.total
        cc.save()

    return compra

@transaction.atomic
def anular_compra(compra: Compra, usuario_anula) -> Compra:
    """Anula la compra y revierte stock y finanzas."""
    if compra.estado == CompraEstado.ANULADA:
        raise ValidationError("Esta compra ya está anulada.")

    # 1. Revertir Stock
    for item in compra.items.all():
        registrar_movimiento_stock(
            producto=item.producto,
            tipo=StockMovTipo.EGRESO,
            cantidad=item.cantidad,
            usuario=usuario_anula,
            motivo=f"Anulación de Compra {compra.numero_comprobante}"
        )

    # 2. Revertir Finanzas
    if compra.metodo_pago == "EFECTIVO" and compra.caja:
        if compra.caja.estado == "ABIERTA":
            registrar_movimiento_caja(
                caja=compra.caja,
                tipo=CajaMovTipo.INGRESO,
                monto=compra.total,
                concepto=f"Reintegro por Anulación Compra {compra.numero_comprobante}",
                usuario=usuario_anula,
                metodo_pago="EFECTIVO"
            )
    elif compra.metodo_pago == "CUENTA_CORRIENTE":
        cc = compra.proveedor.cuenta_corriente
        cc.saldo_actual -= compra.total
        cc.save()

    compra.estado = CompraEstado.ANULADA
    compra.save()
    return compra
