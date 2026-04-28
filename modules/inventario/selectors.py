"""
modules/inventario/selectors.py
────────────────────────────────────────────────────────────────
Selectores para consultas optimizadas de inventario.
Evita N+1 y encapsula lógica de filtrado compleja.
"""
from django.db.models import QuerySet, F, Q
from .models import Producto, MovimientoStock

def get_productos_list(empresa_id) -> QuerySet:
    """Retorna queryset de productos optimizado con select_related."""
    return Producto.objects.for_empresa(empresa_id).select_related(
        'categoria', 'marca', 'proveedor'
    )

def get_productos_stock_bajo(empresa_id) -> QuerySet:
    """Filtra productos donde el stock_actual <= stock_minimo."""
    return get_productos_list(empresa_id).filter(
        stock_actual__lte=F('stock_minimo'),
        activo=True
    )

def get_movimientos_producto(producto_id, empresa_id) -> QuerySet:
    """Retorna historial de movimientos de un producto específico."""
    return MovimientoStock.objects.for_empresa(empresa_id).filter(
        producto_id=producto_id
    ).select_related('usuario', 'producto')

def buscar_productos(empresa_id, query: str) -> QuerySet:
    """Búsqueda por nombre, SKU o código de barras."""
    return get_productos_list(empresa_id).filter(
        Q(nombre__icontains=query) |
        Q(sku__icontains=query) |
        Q(codigo_barras__icontains=query)
    )

def get_historial_stock(producto_id, empresa_id) -> QuerySet:
    """Retorna historial de movimientos ordenado por fecha descendente."""
    return MovimientoStock.objects.for_empresa(empresa_id).filter(
        producto_id=producto_id
    ).select_related('usuario', 'producto').order_by('-fecha')
