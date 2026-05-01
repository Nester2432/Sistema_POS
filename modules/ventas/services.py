"""
modules/ventas/services.py
────────────────────────────────────────────────────────────────
Lógica central para el proceso de venta.
Integra Inventario y Caja en una transacción atómica.
"""
from django.db import transaction
from django.core.exceptions import ValidationError
from decimal import Decimal
import logging

from .models import Venta, VentaItem, VentaPago, VentaEstado, TipoComprobante
from modules.inventario.services import registrar_movimiento_stock
from modules.inventario.models import TipoMovimiento as StockMovTipo
from modules.caja.services import registrar_movimiento_caja, obtener_caja_abierta_usuario
from modules.caja.models import TipoMovimientoCaja as CajaMovTipo

logger = logging.getLogger(__name__)

def generar_numero_comprobante(empresa_id, tipo: str) -> str:
    """Genera un correlativo simple: TIK-000001, FACT-000001."""
    prefijos = {
        TipoComprobante.TICKET: "TIK",
        TipoComprobante.FACTURA_A: "FA",
        TipoComprobante.FACTURA_B: "FB",
        TipoComprobante.FACTURA_C: "FC",
    }
    prefijo = prefijos.get(tipo, "VTA")
    
    ultima_venta = Venta.objects.for_empresa(empresa_id).filter(tipo_comprobante=tipo).order_by('-fecha').first()
    
    if not ultima_venta:
        return f"{prefijo}-000001"
    
    try:
        ultimo_numero = int(ultima_venta.numero_comprobante.split('-')[-1])
        nuevo_numero = ultimo_numero + 1
    except:
        nuevo_numero = 1
        
    return f"{prefijo}-{str(nuevo_numero).zfill(6)}"

@transaction.atomic
def crear_venta_completa(
    usuario,
    empresa,
    items_data: list,
    tipo_comprobante: str,
    pagos_data: list, # Lista de dicts: {'metodo_pago': str, 'monto': Decimal, 'referencia': str}
    cliente=None, # Instancia de Cliente
    cliente_nombre: str = "Consumidor Final",
    cliente_documento: str = "",
    descuento_total: Decimal = Decimal("0.00"),
    observaciones: str = "",
    sucursal=None # Instancia de Sucursal activa (Fase 1A)
) -> Venta:
    """
    Orquesta la creación de una venta completa:
    1. Valida Caja abierta.
    2. Valida Stock.
    3. Crea Venta y VentaItems.
    4. Descuenta Stock.
    5. Registra Movimiento de Caja O Deuda en CC.
    """
    # 1. Validar Caja
    caja = obtener_caja_abierta_usuario(usuario, empresa.id)
    if not caja:
        raise ValidationError("No puedes realizar ventas sin una caja abierta.")

    # 2. Preparar cabecera
    venta = Venta(
        empresa=empresa,
        caja=caja,
        usuario=usuario,
        cliente=cliente,
        cliente_nombre=cliente_nombre if not cliente else cliente.nombre_completo,
        cliente_documento=cliente_documento if not cliente else cliente.documento,
        numero_comprobante=generar_numero_comprobante(empresa.id, tipo_comprobante),
        tipo_comprobante=tipo_comprobante,
        descuento_total=descuento_total,
        observaciones=observaciones,
        estado=VentaEstado.CONFIRMADA # Se confirma de inmediato en el POS
    )
    
    # Necesitamos ID para los items, pero lo guardaremos al final para el total
    venta.save() 

    subtotal_venta = Decimal("0.00")
    
    # 3. Procesar Items
    for item in items_data:
        producto = item['producto']
        variante = item.get('variante')
        cantidad = Decimal(str(item['cantidad']))

        # Validaciones de variantes
        if producto.tiene_variantes and not variante:
            raise ValidationError(f"El producto '{producto.nombre}' requiere selección de variante.")
        
        if variante and variante.producto_padre_id != producto.id:
            raise ValidationError(f"La variante seleccionada no pertenece al producto '{producto.nombre}'.")

        # Lógica de precio: variante sobreescribe al padre si > 0
        precio_unitario = producto.precio_venta
        if variante and variante.precio_venta > 0:
            precio_unitario = variante.precio_venta
            
        descuento_item = Decimal(str(item.get('descuento', 0)))
        item_subtotal = (precio_unitario - descuento_item) * cantidad
        
        # Crear VentaItem
        VentaItem.objects.create(
            empresa=empresa,
            venta=venta,
            producto=producto,
            variante=variante,
            cantidad=cantidad,
            precio_unitario=precio_unitario,
            descuento=descuento_item,
            subtotal=item_subtotal
        )
        
        # 4. Descontar Stock
        registrar_movimiento_stock(
            producto=producto,
            variante=variante,
            tipo=StockMovTipo.EGRESO,
            cantidad=cantidad,
            usuario=usuario,
            motivo=f"Venta {venta.numero_comprobante}",
            sucursal=sucursal
        )
        
        subtotal_venta += item_subtotal

    # 5. Finalizar Totales
    venta.subtotal = subtotal_venta
    # Simplificación: impuestos incluidos en el precio o calculados sobre subtotal
    # Aquí asumimos que el total es subtotal - descuento_total
    venta.total = subtotal_venta - descuento_total
    
    # 6. Validar y Registrar Pagos
    total_pagado = sum(Decimal(str(p['monto'])) for p in pagos_data)
    if total_pagado != venta.total:
        raise ValidationError(f"La suma de los pagos ({total_pagado}) no coincide con el total de la venta ({venta.total}).")

    # Seteamos el metodo_pago legacy
    if len(pagos_data) == 1:
        venta.metodo_pago = pagos_data[0]['metodo_pago']
    else:
        venta.metodo_pago = "MIXTO"
    
    venta.save()

    for p_data in pagos_data:
        monto_pago = Decimal(str(p_data['monto']))
        metodo = p_data['metodo_pago']
        referencia_pago = p_data.get('referencia', '')

        # Crear registro de pago
        VentaPago.objects.create(
            empresa=empresa,
            venta=venta,
            metodo_pago=metodo,
            monto=monto_pago,
            referencia=referencia_pago
        )

        # Integración con Caja o CC
        if metodo == "CUENTA_CORRIENTE":
            if not cliente:
                raise ValidationError("Debe seleccionar un cliente para vender a Cuenta Corriente.")
            from modules.clientes.services import registrar_debito_venta
            # Nota: registrar_debito_venta asume el total de la venta, 
            # pero aquí el cliente podría pagar una parte en efectivo y otra en CC.
            # Necesitamos un servicio que registre el monto específico.
            # Por ahora, simulamos o extendemos el de clientes si es necesario.
            # Como el requerimiento dice "registrar débito en cuenta corriente", 
            # asumiremos que registrar_debito_venta puede recibir un monto.
            from modules.clientes.services import registrar_movimiento_cc
            registrar_movimiento_cc(
                cliente=cliente,
                monto=monto_pago,
                tipo='DEBITO',
                concepto=f"Venta {venta.numero_comprobante} (Parte CC)",
                usuario=usuario,
                referencia=str(venta.id)
            )
        else:
            registrar_movimiento_caja(
                caja=caja,
                tipo=CajaMovTipo.VENTA,
                monto=monto_pago,
                concepto=f"Venta {venta.numero_comprobante}",
                usuario=usuario,
                metodo_pago=metodo,
                referencia=str(venta.id)
            )

    return venta

@transaction.atomic
def anular_venta(venta: Venta, usuario_anula, sucursal=None) -> Venta:
    """
    Anula una venta:
    Solo Admin o Supervisor.
    """
    if usuario_anula.rol not in ['admin', 'supervisor']:
        raise ValidationError("No tienes permisos para anular ventas.")

    if venta.estado == VentaEstado.ANULADA:
        raise ValidationError("Esta venta ya se encuentra anulada.")

    # 1. Devolver Stock
    for item in venta.items.all():
        registrar_movimiento_stock(
            producto=item.producto,
            tipo=StockMovTipo.INGRESO,
            cantidad=item.cantidad,
            usuario=usuario_anula,
            motivo=f"Anulación de Venta {venta.numero_comprobante}",
            sucursal=sucursal
        )

    # 2. Revertir Pagos
    caja_actual = obtener_caja_abierta_usuario(usuario_anula, venta.empresa_id)
    if not caja_actual:
        caja_actual = venta.caja
    
    for pago in venta.pagos.all():
        if pago.metodo_pago == "CUENTA_CORRIENTE":
            from modules.clientes.services import registrar_movimiento_cc
            registrar_movimiento_cc(
                cliente=venta.cliente,
                monto=pago.monto,
                tipo='CREDITO',
                concepto=f"Anulación Venta {venta.numero_comprobante} (Reversión CC)",
                usuario=usuario_anula,
                referencia=str(venta.id)
            )
        else:
            if caja_actual.estado == "ABIERTA":
                registrar_movimiento_caja(
                    caja=caja_actual,
                    tipo=CajaMovTipo.DEVOLUCION,
                    monto=pago.monto,
                    concepto=f"Devolución por Anulación {venta.numero_comprobante} ({pago.metodo_pago})",
                    usuario=usuario_anula,
                    metodo_pago=pago.metodo_pago,
                    referencia=str(venta.id)
                )
    else:
        logger.warning(f"Venta {venta.numero_comprobante} anulada sin movimiento de caja (caja cerrada).")

    # 3. Marcar Anulada
    venta.estado = VentaEstado.ANULADA
    venta.save(update_fields=['estado', 'updated_at'])
    
    return venta
