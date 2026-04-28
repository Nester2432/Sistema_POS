"""
core/pagination.py
────────────────────────────────────────────────────────────────
Clases de paginación reutilizables para todas las APIs.

Respuesta normalizada:
{
    "ok": true,
    "count": 100,
    "total_pages": 4,
    "page": 1,
    "page_size": 25,
    "next": "http://.../api/v1/...?page=2",
    "previous": null,
    "results": [...]
}
"""
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardPagination(PageNumberPagination):
    """
    Paginación estándar del sistema. 25 items por página.
    Permite al cliente ajustar con ?page_size=N (máx 100).
    """
    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100
    page_query_param = "page"

    def get_paginated_response(self, data):
        return Response({
            "ok": True,
            "count": self.page.paginator.count,
            "total_pages": self.page.paginator.num_pages,
            "page": self.page.number,
            "page_size": self.get_page_size(self.request),
            "next": self.get_next_link(),
            "previous": self.get_previous_link(),
            "results": data,
        })

    def get_paginated_response_schema(self, schema):
        return {
            "type": "object",
            "properties": {
                "ok": {"type": "boolean"},
                "count": {"type": "integer"},
                "total_pages": {"type": "integer"},
                "page": {"type": "integer"},
                "page_size": {"type": "integer"},
                "next": {"type": "string", "nullable": True},
                "previous": {"type": "string", "nullable": True},
                "results": schema,
            },
        }


class LargePagination(PageNumberPagination):
    """Para endpoints que necesitan más items por página (ej: reportes)."""
    page_size = 100
    page_size_query_param = "page_size"
    max_page_size = 500

    def get_paginated_response(self, data):
        return Response({
            "ok": True,
            "count": self.page.paginator.count,
            "total_pages": self.page.paginator.num_pages,
            "page": self.page.number,
            "next": self.get_next_link(),
            "previous": self.get_previous_link(),
            "results": data,
        })


class SmallPagination(PageNumberPagination):
    """Para listados compactos (ej: selects/dropdowns en el frontend)."""
    page_size = 10
    max_page_size = 50

    def get_paginated_response(self, data):
        return Response({
            "ok": True,
            "count": self.page.paginator.count,
            "next": self.get_next_link(),
            "previous": self.get_previous_link(),
            "results": data,
        })
