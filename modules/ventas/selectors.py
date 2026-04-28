"""
modules/ventas/selectors.py
────────────────────────────────────────────────────────────────
Selectores para reportes de ventas.
"""
from django.db.models import Sum, Count, F
from django.utils import timezone
from .models import Venta, VentaItem, VentaEstado

def get_ventas_diarias(empresa_id):
    """Retorna resumen de ventas del día actual."""
    hoy = timezone.now().date()
    ventas = Venta.objects.for_empresa(empresa_id).filter(
        fecha__date=hoy,
        estado=VentaEstado.CONFIRMADA
    )
    
    return {
        "cantidad": ventas.count(),
        "total_recaudado": ventas.aggregate(s=Sum('total'))['s'] or 0,
        "por_metodo": ventas.values('metodo_pago').annotate(total=Sum('total'))
    }

def get_productos_mas_vendidos(empresa_id, limit=10):
    """Ranking de productos más vendidos por cantidad."""
    return VentaItem.objects.for_empresa(empresa_id).filter(
        venta__estado=VentaEstado.CONFIRMADA
    ).values(
        'producto__nombre', 'producto__sku'
    ).annotate(
        cantidad_total=Sum('cantidad'),
        recaudacion_total=Sum('subtotal')
    ).order_by('-cantidad_total')[:limit]
