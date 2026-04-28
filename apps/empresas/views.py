"""
apps/empresas/views.py
────────────────────────────────────────────────────────────────
EmpresaViewSet: gestión de empresas vía ModelViewSet.

Rutas generadas por el router:
  GET    /api/v1/empresas/              → list
  POST   /api/v1/empresas/              → create
  GET    /api/v1/empresas/{id}/         → retrieve
  PATCH  /api/v1/empresas/{id}/         → partial_update
  DELETE /api/v1/empresas/{id}/         → destroy (soft delete)
  GET    /api/v1/empresas/mi_empresa/   → acción custom
  PATCH  /api/v1/empresas/mi_empresa/   → acción custom
"""
import logging

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.permissions import IsAuthenticated, IsAdminUser

from core.pagination import StandardPagination
from core.permissions import IsSuperAdmin, IsEmpresaAdmin, IsEmpresaUser
from core.responses import success_response, created_response, no_content_response
from .models import Empresa
from .serializers import EmpresaSerializer, EmpresaCreateSerializer

logger = logging.getLogger(__name__)


class EmpresaViewSet(viewsets.ModelViewSet):
    """
    ViewSet completo para gestión de empresas.

    Acceso:
      - list / create / retrieve / update / destroy → IsSuperAdmin
      - mi_empresa (GET/PATCH) → IsEmpresaUser (cualquier usuario de la empresa)
    """
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ["nombre", "documento_fiscal", "email_contacto"]
    ordering_fields = ["nombre", "plan", "created_at"]
    ordering = ["nombre"]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_permissions(self):
        if self.action == "mi_empresa":
            return [IsAuthenticated(), IsEmpresaUser()]
        return [IsAuthenticated(), IsSuperAdmin()]

    def get_serializer_class(self):
        if self.action == "create":
            return EmpresaCreateSerializer
        return EmpresaSerializer

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Empresa.objects.none()
        return Empresa.objects.with_deleted().filter(is_deleted=False)

    def perform_destroy(self, instance):
        """Soft delete en lugar de borrado físico."""
        instance.soft_delete()
        logger.info(
            "Empresa soft-deleted: id=%s por superadmin=%s",
            instance.id, self.request.user.email,
        )

    # ─── Acciones custom ──────────────────────────────────────

    @action(detail=False, methods=["get", "patch"], url_path="mi-empresa")
    def mi_empresa(self, request):
        """
        GET   /api/v1/empresas/mi-empresa/  → Datos de la empresa del usuario
        PATCH /api/v1/empresas/mi-empresa/  → Actualizar datos de la empresa
        """
        empresa = request.empresa
        if not empresa:
            from core.responses import error_response
            return error_response(
                message="No se pudo determinar tu empresa.",
                code="NO_EMPRESA_CONTEXT",
                http_status=status.HTTP_400_BAD_REQUEST,
            )

        if request.method == "PATCH":
            serializer = EmpresaSerializer(
                empresa, data=request.data, partial=True
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return success_response(
                data=serializer.data,
                message="Empresa actualizada correctamente.",
            )

        serializer = EmpresaSerializer(empresa)
        return success_response(data=serializer.data)
