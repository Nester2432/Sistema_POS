"""
apps/empresas/views_demo.py
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.core.management import call_command
from core.responses import success_response, error_response

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_demo(request):
    """Resetea y vuelve a poblar los datos de la demo."""
    try:
        call_command('seed_demo')
        return success_response(message="Datos demo reseteados correctamente.")
    except Exception as e:
        return error_response(message=str(e))
