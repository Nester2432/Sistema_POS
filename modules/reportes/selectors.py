"""
modules/reportes/selectors.py
────────────────────────────────────────────────────────────────
Selectors optimizados para Dashboard y Reportes.
Utiliza agregaciones de DB para máxima performance.
"""
from django.db.models import Sum, Count, Avg, F, Q
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from modules.ventas.models import Venta, VentaItem, VentaEstado
from modules.inventario.models import Producto
from modules.caja.models import Caja, CajaEstado, MovimientoCaja
from modules.clientes.models import Cliente

def get_dashboard_stats(empresa_id):
    """Resumen ejecutivo para el dashboard principal."""
    hoy = timezone.now().date()
    hace_7_dias = hoy - timedelta(days=7)
    
    # 1. Ventas (Venta.total es confiable para el dashboard)
    ventas_qs = Venta.objects.for_empresa(empresa_id).filter(estado=VentaEstado.CONFIRMADA)
    
    ventas_hoy = ventas_qs.filter(fecha__date=hoy).aggregate(total=Sum('total'), cant=Count('id'))
    
    # Ventas recientes (Últimas 5)
    ventas_recientes = ventas_qs.order_by('-fecha')[:5]

    # 2. Inventario & Caja
    productos_bajo_stock = Producto.objects.for_empresa(empresa_id).filter(
        activo=True, stock_actual__lte=F('stock_minimo')
    ).count()
    
    # Valor Inventario (Costo)
    valor_inventario = Producto.objects.for_empresa(empresa_id).filter(activo=True).aggregate(
        total=Sum(F('stock_actual') * F('precio_costo'))
    )['total'] or 0

    # 3. Métodos de Pago Hoy (Usar VentaPago para precisión total)
    from modules.ventas.models import VentaPago
    pagos_hoy = VentaPago.objects.filter(
        venta__empresa_id=empresa_id,
        venta__estado=VentaEstado.CONFIRMADA,
        fecha__date=hoy
    ).values('metodo_pago').annotate(total=Sum('monto'))
    
    pagos_dict = {p['metodo_pago']: p['total'] for p in pagos_hoy}

    # 4. Clientes Nuevos (Ejemplo: últimos 30 días)
    clientes_nuevos = Cliente.objects.for_empresa(empresa_id).filter(
        fecha_registro__date__gte=hoy - timedelta(days=30)
    ).count() if hasattr(Cliente, 'fecha_registro') else Cliente.objects.for_empresa(empresa_id).count()

    return {
        "ventas_dia": ventas_hoy['total'] or 0,
        "cantidad_ventas_hoy": ventas_hoy['cant'],
        "clientes_nuevos": clientes_nuevos,
        "stock_bajo": productos_bajo_stock,
        "valor_inventario": valor_inventario,
        "ventas_recientes": [
            {
                "id": v.id,
                "cliente_nombre": v.cliente_nombre,
                "total": v.total,
                "fecha": v.fecha,
                "metodo_pago": v.metodo_pago
            } for v in ventas_recientes
        ],
        "pagos_por_metodo": pagos_dict,
        "tendencia_ventas": 0 # TODO: Implementar lógica de tendencia si se desea
    }

def get_reporte_ventas(empresa_id, fecha_inicio=None, fecha_fin=None):
    """Detalle de ventas con filtros y KPIs."""
    qs = Venta.objects.for_empresa(empresa_id).select_related('usuario', 'cliente')
    
    if fecha_inicio: qs = qs.filter(fecha__date__gte=fecha_inicio)
    if fecha_fin: qs = qs.filter(fecha__date__lte=fecha_fin)

    stats = qs.aggregate(
        total_recaudado=Sum('total'),
        promedio_ticket=Avg('total'),
        cantidad_ventas=Count('id'),
        total_anuladas=Count('id', filter=Q(estado=VentaEstado.ANULADA))
    )

    # Desglose por método
    por_metodo = qs.filter(estado=VentaEstado.CONFIRMADA).values('metodo_pago').annotate(
        total=Sum('total'), cant=Count('id')
    )

    return {
        "stats": stats,
        "desglose_pago": list(por_metodo),
        "ventas": qs.order_by('-fecha')[:100] # Limitamos a las últimas 100
    }

def get_reporte_inventario(empresa_id):
    """KPIs de inventario."""
    productos = Producto.objects.for_empresa(empresa_id).filter(activo=True)
    
    valor_total = productos.aggregate(
        costo_total=Sum(F('stock_actual') * F('precio_costo')),
        venta_total=Sum(F('stock_actual') * F('precio_venta'))
    )

    bajo_stock = productos.filter(stock_actual__lte=F('stock_minimo'))
    sin_stock = productos.filter(stock_actual=0)

    return {
        "valor_inventario_costo": valor_total['costo_total'] or 0,
        "valor_inventario_venta": valor_total['venta_total'] or 0,
        "productos_bajo_stock_cant": bajo_stock.count(),
        "productos_sin_stock_cant": sin_stock.count(),
        "lista_bajo_stock": bajo_stock.values('nombre', 'sku', 'stock_actual', 'stock_minimo')
    }
