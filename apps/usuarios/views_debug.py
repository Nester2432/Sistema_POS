from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from modules.inventario.models import Producto
from apps.empresas.models import Empresa

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def debug_session(request):
    """
    Vista de diagnóstico para verificar el estado de la sesión y los datos.
    """
    user = request.user
    empresa_id_context = getattr(request, 'empresa_id', 'No detectado por middleware')
    
    # Contar productos de la empresa del usuario
    productos_count = Producto.objects.filter(empresa=user.empresa).count()
    
    # Contar productos totales en la BD (para saber si hay algo)
    total_productos_bd = Producto.objects.count()
    
    # Datos de la empresa
    empresa_info = {
        "id": str(user.empresa_id) if user.empresa_id else None,
        "nombre": user.empresa.nombre if user.empresa else "Sin empresa",
        "documento": user.empresa.documento_fiscal if user.empresa else "N/A"
    }

    return Response({
        "usuario": {
            "email": user.email,
            "id": str(user.id),
        },
        "empresa_actual_usuario": empresa_info,
        "empresa_id_en_request": empresa_id_context,
        "conteo_productos_empresa": productos_count,
        "total_productos_en_toda_la_bd": total_productos_bd,
        "middleware_detecto_empresa": bool(request.empresa_id)
    })
