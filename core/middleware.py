"""
core/middleware.py
────────────────────────────────────────────────────────────────
EmpresaMiddleware: detecta la empresa del tenant en cada request.

Estrategia (en orden de prioridad):
  1. request.user: si el usuario está autenticado vía sesión Django
     y tiene empresa asignada, se usa directamente. (casos edge: admin)
  2. JWT Bearer header: decodifica el payload (sin verificar firma,
     SimpleJWT lo hace en la capa DRF) y extrae empresa_id.
  3. Thread-local: se setea como apoyo para que los EmpresaScopedManagers
     puedan filtrar sin acceso al request (signals, tareas, etc.)

Seguridad:
  - Este middleware NO autentica al usuario (eso lo hace JWTAuthentication en DRF).
  - Solo extrae empresa_id para aislamiento de datos.
  - La validación real (usuario pertenece a empresa) la hacen los permisos DRF.
  - Thread-local se limpia al finalizar cada request (fail-safe).
"""
import logging

import jwt
from django.conf import settings

from core.managers import set_current_empresa

logger = logging.getLogger(__name__)


class EmpresaMiddleware:
    """
    Middleware que detecta la empresa del request e inyecta:
        request.empresa_id   UUID de la empresa
        request.empresa      Instancia del modelo Empresa

    Y setea thread-local para que los managers filtren correctamente.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # ── Reset al inicio de cada request (thread safety) ───
        set_current_empresa(None)
        request.empresa_id = None
        request.empresa = None

        empresa_id = self._detectar_empresa_id(request)

        if empresa_id:
            empresa = self._cargar_empresa(empresa_id)
            if empresa:
                request.empresa_id = str(empresa.id)
                request.empresa = empresa
                set_current_empresa(str(empresa.id))
            else:
                logger.warning(
                    "empresa_id=%s extraído del JWT/sesión no existe o está inactiva.",
                    empresa_id,
                )

        response = self.get_response(request)

        # ── Limpieza al finalizar el request (fail-safe) ──────
        set_current_empresa(None)

        return response

    # ─── Detección de empresa ─────────────────────────────────

    def _detectar_empresa_id(self, request):
        """
        Detecta empresa_id desde múltiples fuentes, en orden de prioridad.
        Retorna el empresa_id como string o None.
        """
        # 1. Desde request.user (sesiones Django / admin)
        empresa_id = self._desde_usuario(request)
        if empresa_id:
            return empresa_id

        # 2. Desde JWT Bearer header (principal para APIs)
        empresa_id = self._desde_jwt(request)
        if empresa_id:
            return empresa_id

        return None

    @staticmethod
    def _desde_usuario(request) -> str | None:
        """
        Intenta obtener empresa_id desde request.user.
        Solo aplica si ya hay un usuario autenticado en la sesión de Django
        (ej: en el admin, o si se usa SessionAuthentication junto con JWT).
        """
        user = getattr(request, "user", None)
        if user and user.is_authenticated and not user.is_anonymous:
            empresa_id = getattr(user, "empresa_id", None)
            if empresa_id:
                return str(empresa_id)
        return None

    @staticmethod
    def _desde_jwt(request) -> str | None:
        """
        Decodifica el JWT Bearer sin verificar la firma para extraer empresa_id.
        La verificación real de la firma la hace JWTAuthentication en las vistas DRF.
        """
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header.startswith("Bearer "):
            return None

        token = auth_header.split(" ", 1)[1].strip()

        try:
            payload = jwt.decode(
                token,
                options={"verify_signature": False},
                algorithms=["HS256"],
            )
            empresa_id = payload.get("empresa_id")
            return str(empresa_id) if empresa_id else None
        except jwt.DecodeError:
            logger.debug("JWT malformado en EmpresaMiddleware.")
            return None
        except Exception as exc:
            logger.error("Error inesperado en EmpresaMiddleware._desde_jwt: %s", exc)
            return None

    @staticmethod
    def _cargar_empresa(empresa_id: str):
        """
        Carga la Empresa desde BD. Solo empresas activas son válidas.
        En producción esto puede cachearse con Redis (TTL corto).
        """
        try:
            from apps.empresas.models import Empresa
            return Empresa.objects.with_deleted().filter(
                id=empresa_id,
                activo=True,
                is_deleted=False,
            ).first()
        except Exception as exc:
            logger.error("Error cargando empresa_id=%s: %s", empresa_id, exc)
            return None
