from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from modules.inventario.models import Producto
from apps.empresas.models import Empresa

User = get_user_model()

@api_view(['GET'])
@permission_classes([AllowAny])
def debug_session(request):
    """
    Diagnóstico PÚBLICO para la demo.
    """
    try:
        user = User.objects.get(email="admin@demo.com")
        empresa = user.empresa
        
        productos_empresa = Producto.objects.filter(empresa=empresa).count()
        total_productos_bd = Producto.objects.count()
        
        return Response({
            "status": "success",
            "diagnostico": {
                "demo_user_email": user.email,
                "empresa_vinculada": empresa.nombre if empresa else "NINGUNA",
                "empresa_id": str(empresa.id) if empresa else None,
                "productos_en_esta_empresa": productos_empresa,
                "productos_totales_bd": total_productos_bd,
                "empresa_activa": empresa.activo if empresa else False
            }
        })
    except User.DoesNotExist:
        return Response({
            "status": "error",
            "message": "El usuario admin@demo.com no existe. El seed no se ha ejecutado correctamente."
        })
    except Exception as e:
        return Response({
            "status": "error",
            "message": str(e)
        })
