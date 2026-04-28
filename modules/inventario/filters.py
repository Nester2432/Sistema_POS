"""
modules/inventario/filters.py
"""
import django_filters
from .models import Producto, MovimientoStock

class ProductoFilter(django_filters.FilterSet):
    nombre = django_filters.CharFilter(lookup_expr='icontains')
    stock_bajo = django_filters.BooleanFilter(method='filter_stock_bajo')

    class Meta:
        model = Producto
        fields = ['categoria', 'marca', 'proveedor', 'activo', 'sku', 'codigo_barras']

    def filter_stock_bajo(self, queryset, name, value):
        if value:
            from django.db.models import F
            return queryset.filter(stock_actual__lte=F('stock_minimo'))
        return queryset

class MovimientoStockFilter(django_filters.FilterSet):
    fecha_desde = django_filters.DateTimeFilter(field_name="fecha", lookup_expr='gte')
    fecha_hasta = django_filters.DateTimeFilter(field_name="fecha", lookup_expr='lte')

    class Meta:
        model = MovimientoStock
        fields = ['producto', 'tipo', 'usuario']
