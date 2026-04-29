"""
apps/usuarios/views.py
────────────────────────────────────────────────────────────────
UsuarioViewSet + vistas de autenticación (LoginView, RefreshView, MeView).

Rutas del ViewSet (generadas por router):
  GET    /api/v1/usuarios/          → list
  POST   /api/v1/usuarios/          → create
  GET    /api/v1/usuarios/{id}/     → retrieve
  PATCH  /api/v1/usuarios/{id}/     → partial_update
  DELETE /api/v1/usuarios/{id}/     → destroy (soft delete)

Rutas de auth (manuales en urls.py):
  POST   /api/v1/auth/login/
  POST   /api/v1/auth/refresh/
  POST   /api/v1/auth/logout/
  GET    /api/v1/auth/me/
  PATCH  /api/v1/auth/me/
  POST   /api/v1/auth/cambiar-password/
"""
import logging

from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from core.pagination import StandardPagination
from core.permissions import IsEmpresaAdmin, IsEmpresaUser, IsSupervisorOrAdmin
from core.responses import success_response, created_response, no_content_response, error_response
from .serializers import (
    CustomTokenObtainPairSerializer,
    UsuarioMeSerializer,
    UsuarioListSerializer,
    UsuarioCreateSerializer,
    UsuarioUpdateSerializer,
    CambiarPasswordSerializer,
)

User = get_user_model()
logger = logging.getLogger(__name__)


# ─── Autenticación ────────────────────────────────────────────

class LoginView(TokenObtainPairView):
    """
    POST /api/v1/auth/login/

    Body: { "email": "...", "password": "..." }

    Response:
    {
        "access":  "<jwt_access>",
        "refresh": "<jwt_refresh>",
        "usuario": { id, email, nombre, rol, empresa_id, ... }
    }

    Payload del access token:
    {
        "user_id": "uuid",
        "email": "...",
        "empresa_id": "uuid",
        "empresa_nombre": "...",
        "rol": "admin",
        "nombre": "Juan Pérez"
    }
    """
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        logger.info("Login exitoso: email=%s", request.data.get("email", "?"))
        return success_response(data=response.data, message="Login exitoso.")


class RefreshView(TokenRefreshView):
    """
    POST /api/v1/auth/refresh/
    Body: { "refresh": "<token>" }
    Retorna nuevo access token (y nuevo refresh si ROTATE_REFRESH_TOKENS=True).
    """
    permission_classes = [AllowAny]


class LogoutView(APIView):
    """
    POST /api/v1/auth/logout/
    Body: { "refresh": "<token>" }
    Blacklistea el refresh token para invalidar la sesión.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return error_response(
                message="El campo 'refresh' es requerido.",
                code="MISSING_REFRESH_TOKEN",
            )
        try:
            RefreshToken(refresh_token).blacklist()
            logger.info("Logout: token invalidado para user_id=%s", request.user.id)
            return no_content_response("Sesión cerrada exitosamente.")
        except TokenError as exc:
            return error_response(message=str(exc), code="INVALID_TOKEN")


class MeView(APIView):
    """
    GET   /api/v1/auth/me/    → Perfil del usuario autenticado
    PATCH /api/v1/auth/me/    → Actualizar nombre, apellido, teléfono, avatar
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UsuarioMeSerializer(request.user)
        return success_response(data=serializer.data)

    def patch(self, request):
        serializer = UsuarioUpdateSerializer(
            request.user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(
            data=UsuarioMeSerializer(request.user).data,
            message="Perfil actualizado correctamente.",
        )


class CambiarPasswordView(APIView):
    """
    POST /api/v1/auth/cambiar-password/
    Body: { password_actual, password_nuevo, password_confirm }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CambiarPasswordSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["password_nuevo"])
        request.user.save(update_fields=["password", "updated_at"])
        return no_content_response("Contraseña actualizada exitosamente.")


# ─── ViewSet de Usuarios ──────────────────────────────────────

class UsuarioViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de usuarios dentro de una empresa.

    Permisos:
      list / create / destroy   → IsEmpresaAdmin
      retrieve / update         → IsSupervisorOrAdmin
    """
    pagination_class = StandardPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["email", "nombre", "apellido"]
    ordering_fields = ["nombre", "apellido", "rol", "created_at"]
    ordering = ["nombre"]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_permissions(self):
        if self.action in ("list", "create", "destroy"):
            return [IsAuthenticated(), IsEmpresaAdmin()]
        return [IsAuthenticated(), IsSupervisorOrAdmin()]

    def get_serializer_class(self):
        if self.action == "create":
            return UsuarioCreateSerializer
        if self.action in ("partial_update", "update"):
            return UsuarioUpdateSerializer
        if self.action == "list":
            return UsuarioListSerializer
        return UsuarioMeSerializer

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return User.objects.none()
        # Filtramos manualmente por empresa del request
        # (Usuario no hereda TenantModel para evitar circular import)
        return User.objects.filter(
            empresa_id=self.request.user.empresa_id,
            is_deleted=False,
        ).select_related("empresa")

    @transaction.atomic
    def perform_create(self, serializer):
        serializer.save()
        logger.info(
            "Usuario creado: email=%s en empresa_id=%s por user=%s",
            serializer.instance.email,
            self.request.user.empresa_id,
            self.request.user.email,
        )

    def perform_destroy(self, instance):
        """Soft delete + desactivar usuario."""
        instance.is_active = False
        instance.soft_delete(commit=False)
        instance.save(
            update_fields=["is_active", "is_deleted", "deleted_at", "updated_at"]
        )
        logger.info(
            "Usuario soft-deleted: id=%s por user=%s",
            instance.id, self.request.user.email,
        )

    @action(detail=True, methods=["patch"], url_path="cambiar-rol")
    def cambiar_rol(self, request, pk=None):
        """
        PATCH /api/v1/usuarios/{id}/cambiar-rol/
        Body: { "rol": "vendedor" }
        Solo ADMIN puede cambiar roles.
        """
        from core.permissions import IsEmpresaAdmin
        self.check_permissions(request)

        usuario = self.get_object()
        nuevo_rol = request.data.get("rol")

        from apps.usuarios.models import RolChoices
        roles_validos = [r[0] for r in RolChoices.choices]
        if nuevo_rol not in roles_validos:
            return error_response(
                message=f"Rol inválido. Opciones: {roles_validos}",
                code="INVALID_ROL",
            )

        usuario.rol = nuevo_rol
        usuario.save(update_fields=["rol", "updated_at"])
        return success_response(
            data=UsuarioMeSerializer(usuario).data,
            message=f"Rol cambiado a '{nuevo_rol}' correctamente.",
        )
