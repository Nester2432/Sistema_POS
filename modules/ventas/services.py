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

from .models import Venta, VentaItem, VentaEstado, TipoComprobante
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
    metodo_pago: str,
    cliente=None, # Instancia de Cliente
    cliente_nombre: str = "Consumidor Final",
    cliente_documento: str = "",
    descuento_total: Decimal = Decimal("0.00"),
    observaciones: str = ""
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
        metodo_pago=metodo_pago,
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
        cantidad = Decimal(str(item['cantidad']))
        precio_unitario = producto.precio_venta
        descuento_item = Decimal(str(item.get('descuento', 0)))
        
        item_subtotal = (precio_unitario - descuento_item) * cantidad
        
        # Crear VentaItem
        VentaItem.objects.create(
            empresa=empresa,
            venta=venta,
            producto=producto,
            cantidad=cantidad,
            precio_unitario=precio_unitario,
            descuento=descuento_item,
            subtotal=item_subtotal
        )
        
        # 4. Descontar Stock
        registrar_movimiento_stock(
            producto=producto,
            tipo=StockMovTipo.EGRESO,
            cantidad=cantidad,
            usuario=usuario,
            motivo=f"Venta {venta.numero_comprobante}"
        )
        
        subtotal_venta += item_subtotal

    # 5. Finalizar Totales
    venta.subtotal = subtotal_venta
    # Simplificación: impuestos incluidos en el precio o calculados sobre subtotal
    # Aquí asumimos que el total es subtotal - descuento_total
    venta.total = subtotal_venta - descuento_total
    venta.save()

    # 6. Registrar Cobro o Deuda
    if metodo_pago == "CUENTA_CORRIENTE":
        if not cliente:
            raise ValidationError("Debe seleccionar un cliente para vender a Cuenta Corriente.")
        
        from modules.clientes.services import registrar_debito_venta
        registrar_debito_venta(venta, usuario)
    else:
        registrar_movimiento_caja(
            caja=caja,
            tipo=CajaMovTipo.VENTA,
            monto=venta.total,
            concepto=f"Venta {venta.numero_comprobante}",
            usuario=usuario,
            metodo_pago=metodo_pago,
            referencia=str(venta.id)
        )

    return venta

@transaction.atomic
def anular_venta(venta: Venta, usuario_anula) -> Venta:
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
            motivo=f"Anulación de Venta {venta.numero_comprobante}"
        )

    # 2. Registrar Devolución en Caja (si la caja original sigue abierta o en la actual)
    caja_actual = obtener_caja_abierta_usuario(usuario_anula, venta.empresa_id)
    if not caja_actual:
        # Si no hay caja abierta, usamos la de la venta original (pero validando estado)
        caja_actual = venta.caja
    
    if caja_actual.estado == "ABIERTA":
        registrar_movimiento_caja(
            caja=caja_actual,
            tipo=CajaMovTipo.DEVOLUCION,
            monto=venta.total,
            concepto=f"Devolución por Anulación {venta.numero_comprobante}",
            usuario=usuario_anula,
            metodo_pago=venta.metodo_pago,
            referencia=str(venta.id)
        )
    else:
        logger.warning(f"Venta {venta.numero_comprobante} anulada sin movimiento de caja (caja cerrada).")

    # 3. Marcar Anulada
    venta.estado = VentaEstado.ANULADA
    venta.save(update_fields=['estado', 'updated_at'])
    
    return venta
