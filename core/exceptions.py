"""
core/exceptions.py
────────────────────────────────────────────────────────────────
Manejador de excepciones centralizado para DRF.
Normaliza todas las respuestas de error al formato:
{
    "ok": false,
    "code": "ERROR_CODE",
    "message": "Descripción legible",
    "errors": { ... }   # solo en errores de validación
}
"""
import logging

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Handler custom para DRF. Configurado en REST_FRAMEWORK['EXCEPTION_HANDLER'].
    """
    # Llama al handler por defecto de DRF primero
    response = exception_handler(exc, context)

    if response is not None:
        # Normalizar la respuesta de error
        error_data = {
            "ok": False,
            "code": _get_error_code(exc, response),
            "message": _get_error_message(response),
        }

        # Incluir detalle de errores de validación
        if isinstance(response.data, dict) and "detail" not in response.data:
            error_data["errors"] = response.data
        elif isinstance(response.data, list):
            error_data["errors"] = response.data

        response.data = error_data

    else:
        # Errores no manejados por DRF (500)
        logger.exception("Error no manejado: %s", exc)
        response = Response(
            {
                "ok": False,
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Error interno del servidor. Por favor intente nuevamente.",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return response


def _get_error_code(exc, response) -> str:
    """Genera un código de error legible según el tipo de excepción."""
    from rest_framework import exceptions as drf_exc

    mapping = {
        drf_exc.AuthenticationFailed: "AUTHENTICATION_FAILED",
        drf_exc.NotAuthenticated: "NOT_AUTHENTICATED",
        drf_exc.PermissionDenied: "PERMISSION_DENIED",
        drf_exc.NotFound: "NOT_FOUND",
        drf_exc.MethodNotAllowed: "METHOD_NOT_ALLOWED",
        drf_exc.Throttled: "RATE_LIMITED",
        drf_exc.ValidationError: "VALIDATION_ERROR",
    }
    return mapping.get(type(exc), f"HTTP_{response.status_code}")


def _get_error_message(response) -> str:
    """Extrae mensaje de error limpio de la respuesta DRF."""
    data = response.data
    if isinstance(data, dict):
        detail = data.get("detail", "")
        if detail:
            return str(detail)
    return "Se produjo un error en la solicitud."


# ─── Excepciones custom del negocio ──────────────────────────

class EmpresaNoEncontrada(Exception):
    """El JWT no contiene empresa_id válido."""
    pass


class AccesoDenegadoEmpresa(Exception):
    """El usuario no pertenece a la empresa del request."""
    pass
