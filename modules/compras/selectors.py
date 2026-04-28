"""
modules/compras/selectors.py
"""
from django.db.models import Sum, Count
from .models import Compra, CompraEstado, CuentaCorrienteProveedor

def get_reporte_compras(empresa_id, fecha_inicio=None, fecha_fin=None):
    qs = Compra.objects.for_empresa(empresa_id).filter(estado=CompraEstado.CONFIRMADA)
    if fecha_inicio: qs = qs.filter(fecha__date__gte=fecha_inicio)
    if fecha_fin: qs = qs.filter(fecha__date__lte=fecha_fin)
    
    return {
        "total_comprado": qs.aggregate(s=Sum('total'))['s'] or 0,
        "cantidad_compras": qs.count(),
        "por_proveedor": qs.values('proveedor__nombre').annotate(total=Sum('total'))
    }

def get_deudas_proveedores(empresa_id):
    """Ranking de proveedores a los que debemos dinero."""
    return CuentaCorrienteProveedor.objects.for_empresa(empresa_id).filter(
        saldo_actual__gt=0
    ).select_related('proveedor').order_by('-saldo_actual')
