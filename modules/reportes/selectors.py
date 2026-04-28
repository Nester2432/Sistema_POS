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
    inicio_mes = hoy.replace(day=1)

    # 1. Ventas
    ventas_qs = Venta.objects.for_empresa(empresa_id).filter(estado=VentaEstado.CONFIRMADA)
    
    ventas_hoy = ventas_qs.filter(fecha__date=hoy).aggregate(total=Sum('total'), cant=Count('id'))
    ventas_7_dias = ventas_qs.filter(fecha__date__gte=hace_7_dias).aggregate(total=Sum('total'))
    ventas_mes = ventas_qs.filter(fecha__date__gte=inicio_mes).aggregate(total=Sum('total'))

    # 2. Inventario & Caja
    productos_bajo_stock = Producto.objects.for_empresa(empresa_id).filter(
        activo=True, stock_actual__lte=F('stock_minimo')
    ).count()
    
    caja_abierta = Caja.objects.for_empresa(empresa_id).filter(estado=CajaEstado.ABIERTA).exists()

    # 3. Clientes
    clientes_deuda = Cliente.objects.for_empresa(empresa_id).filter(
        cuenta_corriente__saldo_actual__gt=0
    ).aggregate(total_deuda=Sum('cuenta_corriente__saldo_actual'), cant=Count('id'))

    # 4. Métodos de pago y Ranking
    metodos_pago = ventas_qs.filter(fecha__date=hoy).values('metodo_pago').annotate(
        total=Sum('total')
    ).order_by('-total')

    ranking_productos = VentaItem.objects.for_empresa(empresa_id).filter(
        venta__estado=VentaEstado.CONFIRMADA,
        venta__fecha__date__gte=hace_7_dias
    ).values('producto__nombre').annotate(
        cantidad=Sum('cantidad')
    ).order_by('-cantidad')[:5]

    return {
        "ventas_hoy": ventas_hoy['total'] or 0,
        "cantidad_ventas_hoy": ventas_hoy['cant'],
        "ventas_semana": ventas_7_dias['total'] or 0,
        "ventas_mes": ventas_mes['total'] or 0,
        "caja_abierta": caja_abierta,
        "productos_bajo_stock": productos_bajo_stock,
        "clientes_deuda_total": clientes_deuda['total_deuda'] or 0,
        "clientes_deuda_cant": clientes_deuda['cant'],
        "metodos_pago_hoy": list(metodos_pago),
        "top_productos_semana": list(ranking_productos)
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
