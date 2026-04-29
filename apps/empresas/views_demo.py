"""
apps/empresas/views_demo.py
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.core.management import call_command
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from core.responses import success_response, error_response
from apps.usuarios.serializers import UsuarioMeSerializer
import logging
import traceback

User = get_user_model()
logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_demo(request):
    """
    Resetea los datos de la demo y devuelve los tokens de acceso directamente.
    Flujo: 
    1. Ejecuta seed_demo.
    2. Obtiene el usuario admin@demo.com.
    3. Genera tokens JWT.
    4. Devuelve respuesta unificada.
    """
    try:
        # 1. Ejecutar el comando de seed
        logger.info("Iniciando reset de demo...")
        call_command('seed_demo')
        
        # 2. Obtener el usuario demo
        user = User.objects.get(email="admin@demo.com")
        
        # 3. Generar Tokens
        refresh = RefreshToken.for_user(user)
        # Inyectar claims manuales que el serializer normal inyecta en el login
        # (Aunque el store del front extrae del cuerpo de respuesta, es buena práctica)
        
        data = {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "usuario": UsuarioMeSerializer(user).data
        }
        
        logger.info("Demo reseteada y tokens generados para admin@demo.com")
        return success_response(data=data, message="Demo iniciada correctamente.")
        
    except Exception as e:
        logger.error(f"Error en reset_demo: {str(e)}")
        traceback.print_exc()
        return error_response(message=f"Error al inicializar la demo: {str(e)}")
