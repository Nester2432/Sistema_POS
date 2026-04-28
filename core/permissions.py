"""
core/permissions.py
────────────────────────────────────────────────────────────────
Permisos DRF reutilizables para el sistema POS SaaS.

Jerarquía de permisos:
  IsSuperAdmin       → Superusuario de plataforma (is_superuser=True)
  IsEmpresaAdmin     → Admin dentro de su empresa (rol=ADMIN)
  IsSupervisorOrAdmin→ ADMIN o SUPERVISOR de la empresa
  IsEmpresaUser      → Cualquier usuario autenticado con empresa válida
  IsSameEmpresa      → El objeto pertenece a la empresa del usuario (object-level)

Uso en ViewSets:
    permission_classes = [IsAuthenticated, IsEmpresaUser]
    permission_classes = [IsAuthenticated, IsEmpresaAdmin]
"""
from rest_framework.permissions import BasePermission

from apps.usuarios.models import RolChoices


class IsSuperAdmin(BasePermission):
    """
    Solo superusuarios de plataforma (is_superuser=True).
    No pertenecen a ninguna empresa. Acceso total al sistema.
    Usar solo en endpoints de administración SaaS.
    """
    message = "Se requiere acceso de superadministrador de plataforma."

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_superuser
        )


class IsEmpresaUser(BasePermission):
    """
    Cualquier usuario autenticado que pertenezca a una empresa válida.
    Es el permiso mínimo para acceder a cualquier endpoint de negocio.

    Verifica:
      1. Usuario autenticado
      2. Usuario tiene empresa asignada
      3. La empresa del usuario coincide con la empresa del request
         (middleware la detectó desde el JWT)
    """
    message = "Debes estar autenticado y pertenecer a una empresa activa."

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        # Superadmins no tienen empresa → tienen acceso propio
        if request.user.is_superuser:
            return True
        # El usuario debe tener empresa
        if not request.user.empresa_id:
            return False
        # La empresa del JWT (middleware) debe coincidir con la del usuario
        # Esto previene que un token manipulado cambie el empresa_id
        if request.empresa_id and str(request.user.empresa_id) != str(request.empresa_id):
            self.message = "El token no corresponde a tu empresa."
            return False
        return True


class IsEmpresaAdmin(BasePermission):
    """
    Solo usuarios con rol ADMIN dentro de su empresa.
    Para operaciones de configuración y gestión de usuarios.
    """
    message = "Se requiere rol de administrador en la empresa."

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return (
            bool(request.user.empresa_id)
            and request.user.rol == RolChoices.ADMIN
        )


class IsSupervisorOrAdmin(BasePermission):
    """
    ADMIN o SUPERVISOR de la empresa.
    Para acceso a reportes y supervisión de operaciones.
    """
    message = "Se requiere rol de supervisor o administrador."

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return (
            bool(request.user.empresa_id)
            and request.user.rol in (RolChoices.ADMIN, RolChoices.SUPERVISOR)
        )


class IsSameEmpresa(BasePermission):
    """
    Verifica a nivel de objeto que el recurso pertenece a la empresa del usuario.
    Usar en has_object_permission para defensa en profundidad.

    Ejemplo:
        def get_object(self):
            obj = super().get_object()
            self.check_object_permissions(self.request, obj)
            return obj
    """
    message = "No tienes permiso para acceder a este recurso de otra empresa."

    def has_object_permission(self, request, view, obj) -> bool:
        if request.user.is_superuser:
            return True
        if not hasattr(obj, "empresa_id"):
            return True
        return str(obj.empresa_id) == str(request.user.empresa_id)
