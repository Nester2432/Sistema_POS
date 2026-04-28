"""
core/filters.py
────────────────────────────────────────────────────────────────
Filtros base reutilizables para todos los ViewSets del sistema.

Requiere django-filter instalado.

Uso en un ViewSet:
    from core.filters import EmpresaScopedFilterSet
    from django_filters.rest_framework import DjangoFilterBackend
    from rest_framework.filters import SearchFilter, OrderingFilter

    class ProductoViewSet(viewsets.ModelViewSet):
        filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
        filterset_class = ProductoFilterSet
        search_fields = ["nombre", "codigo"]
        ordering_fields = ["nombre", "precio", "created_at"]
        ordering = ["-created_at"]
"""
import django_filters
from django_filters import rest_framework as filters


class BaseFilterSet(filters.FilterSet):
    """
    FilterSet base con filtros comunes de auditoría.
    Los modelos que hereden de BaseModel pueden usar este filterSet.
    """
    created_after = django_filters.DateTimeFilter(
        field_name="created_at",
        lookup_expr="gte",
        label="Creado desde",
    )
    created_before = django_filters.DateTimeFilter(
        field_name="created_at",
        lookup_expr="lte",
        label="Creado hasta",
    )


class ActiveFilterMixin(filters.FilterSet):
    """
    Mixin para filtrar por estado activo/inactivo en modelos
    que tengan un campo `activo` o `is_active`.
    """
    activo = django_filters.BooleanFilter(
        field_name="activo",
        label="Solo activos",
    )


class EmpresaScopedFilterSet(BaseFilterSet):
    """
    FilterSet para modelos que pertenecen a una empresa (TenantModel).
    El filtro por empresa ya lo hace el EmpresaScopedManager,
    pero este FilterSet permite filtros adicionales dentro de la empresa.
    """

    class Meta:
        # Subclases deben definir model y fields
        abstract = True
