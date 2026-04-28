"""
core/responses.py
────────────────────────────────────────────────────────────────
Helpers para construir respuestas DRF normalizadas.

Todas las respuestas del sistema siguen el formato:
{
    "ok": true | false,
    "message": "Descripción opcional",
    "data": { ... } | null
}

Uso:
    from core.responses import success_response, error_response

    return success_response(data=serializer.data, message="Creado correctamente")
    return error_response(message="No encontrado", status=404)
"""
from rest_framework import status
from rest_framework.response import Response


def success_response(
    data=None,
    message: str = "",
    http_status: int = status.HTTP_200_OK,
) -> Response:
    """
    Respuesta exitosa normalizada.

    Args:
        data:        Payload de la respuesta (dict, list, None)
        message:     Mensaje opcional para el cliente
        http_status: Código HTTP (default 200)

    Returns:
        Response DRF con formato { ok, message, data }
    """
    body = {"ok": True}
    if message:
        body["message"] = message
    if data is not None:
        body["data"] = data
    return Response(body, status=http_status)


def created_response(data=None, message: str = "Recurso creado correctamente.") -> Response:
    """Atajo para respuestas 201 Created."""
    return success_response(data=data, message=message, http_status=status.HTTP_201_CREATED)


def no_content_response(message: str = "Operación realizada correctamente.") -> Response:
    """Atajo para respuestas 204 No Content con mensaje."""
    return Response({"ok": True, "message": message}, status=status.HTTP_200_OK)


def error_response(
    message: str,
    code: str = "ERROR",
    errors=None,
    http_status: int = status.HTTP_400_BAD_REQUEST,
) -> Response:
    """
    Respuesta de error normalizada.

    Args:
        message:     Descripción del error para el cliente
        code:        Código de error en SCREAMING_SNAKE_CASE
        errors:      Detalle de errores de validación (dict o list)
        http_status: Código HTTP (default 400)
    """
    body: dict = {"ok": False, "code": code, "message": message}
    if errors is not None:
        body["errors"] = errors
    return Response(body, status=http_status)


def not_found_response(message: str = "Recurso no encontrado.") -> Response:
    return error_response(message=message, code="NOT_FOUND", http_status=status.HTTP_404_NOT_FOUND)


def forbidden_response(message: str = "No tienes permisos para esta acción.") -> Response:
    return error_response(message=message, code="FORBIDDEN", http_status=status.HTTP_403_FORBIDDEN)


def validation_error_response(errors, message: str = "Error de validación.") -> Response:
    return error_response(
        message=message,
        code="VALIDATION_ERROR",
        errors=errors,
        http_status=status.HTTP_422_UNPROCESSABLE_ENTITY,
    )
