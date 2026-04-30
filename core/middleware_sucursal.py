"""
core/middleware_sucursal.py
────────────────────────────────────────────────────────────────
SucursalMiddleware: Detecta e inyecta la sucursal actual del request.
Depende de que EmpresaMiddleware ya haya ejecutado (requiere request.empresa).
"""
import logging
from django.http import JsonResponse
from modules.sucursales.models import Sucursal

logger = logging.getLogger(__name__)

class SucursalMiddleware:
    """
    Middleware que inyecta request.sucursal basado en X-Sucursal-ID.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 1. Asegurar limpieza inicial
        request.sucursal = None
        
        # 2. Si no hay empresa (endpoint público o login), saltar.
        if not getattr(request, 'empresa', None):
            return self.get_response(request)

        # 3. Leer header
        sucursal_id = request.headers.get('X-Sucursal-ID')

        if sucursal_id:
            # 4. Header proporcionado -> Validar estrictamente
            try:
                # Buscamos la sucursal asegurándonos que sea de la empresa actual y esté activa
                sucursal = Sucursal.objects.get(id=sucursal_id, empresa=request.empresa)
                
                if not sucursal.activo:
                    logger.warning(f"Intento de acceso a sucursal inactiva: {sucursal_id} por usuario {request.user}")
                    return JsonResponse({"error": "La sucursal seleccionada se encuentra inactiva."}, status=403)
                
                request.sucursal = sucursal

            except Sucursal.DoesNotExist:
                # REGLA CRÍTICA: No hacer fallback si el ID es inválido. Retornar 403.
                logger.warning(f"Header X-Sucursal-ID inválido ({sucursal_id}) para empresa {request.empresa.id}")
                return JsonResponse({"error": "No tienes acceso a esta sucursal o no existe."}, status=403)
            except ValueError:
                # Caso en que el UUID no sea válido
                return JsonResponse({"error": "Identificador de sucursal mal formado."}, status=400)
                
        else:
            # 5. Sin header -> Fallback a Sucursal Principal
            sucursal_principal = Sucursal.objects.for_empresa(request.empresa.id).filter(es_principal=True, activo=True).first()
            if sucursal_principal:
                request.sucursal = sucursal_principal
            else:
                # Si por alguna razón la empresa no tiene principal (error de data), lo dejamos en None.
                # Ya los servicios manejarán los errores correspondientes si es requerida.
                pass

        # 6. Continuar con el request
        response = self.get_response(request)
        return response
