from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import F

from .models import Sucursal, StockSucursal
from .serializers import SucursalSerializer, StockSucursalSerializer
from modules.inventario.services import ajustar_stock_manual
from modules.inventario.models import Producto

class SucursalViewSet(viewsets.ModelViewSet):
    """
    CRUD para gestionar las sucursales de la empresa.
    Asegura aislamiento multi-tenant implícitamente vía EmpresaMiddleware + TenantModel.
    """
    serializer_class = SucursalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # EmpresaScopedManager ya filtra por la empresa del request
        return Sucursal.objects.all()

    def perform_create(self, serializer):
        serializer.save(empresa=self.request.empresa)


class StockSucursalViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Vista de solo lectura (con acciones custom) para consultar el stock por sucursal.
    """
    serializer_class = StockSucursalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = StockSucursal.objects.select_related('producto', 'sucursal')
        
        sucursal_id = self.request.query_params.get('sucursal_id')
        if sucursal_id:
            qs = qs.filter(sucursal_id=sucursal_id)
            
        producto_id = self.request.query_params.get('producto_id')
        if producto_id:
            qs = qs.filter(producto_id=producto_id)
            
        return qs

    @action(detail=False, methods=['get'])
    def bajo_stock(self, request):
        """
        Devuelve el inventario que está en o por debajo del stock mínimo por sucursal.
        """
        qs = self.get_queryset().filter(stock_actual__lte=F('stock_minimo'), activo=True)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def ajustar_stock(self, request):
        """
        Permite ajustar el stock manual en una sucursal específica.
        Body esperado: {
            "sucursal_id": "uuid",
            "producto_id": "uuid",
            "nuevo_stock": 50,
            "motivo": "Inventario físico"
        }
        """
        # Validación de permisos: Solo admin/supervisor deberían ajustar stock
        if request.user.rol not in ['admin', 'supervisor']:
            return Response({"error": "No tienes permisos para ajustar stock."}, status=status.HTTP_403_FORBIDDEN)

        sucursal_id = request.data.get('sucursal_id')
        producto_id = request.data.get('producto_id')
        nuevo_stock = request.data.get('nuevo_stock')
        motivo = request.data.get('motivo', 'Ajuste manual')

        if sucursal_id is None or producto_id is None or nuevo_stock is None:
            return Response({"error": "sucursal_id, producto_id y nuevo_stock son requeridos."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            sucursal = Sucursal.objects.get(id=sucursal_id, empresa=request.empresa)
            producto = Producto.objects.get(id=producto_id, empresa=request.empresa)
            
            movimiento = ajustar_stock_manual(
                producto=producto,
                nuevo_stock=Decimal(str(nuevo_stock)),
                usuario=request.user,
                motivo=motivo,
                sucursal=sucursal
            )
            
            return Response({
                "mensaje": "Stock ajustado correctamente.",
                "movimiento_id": movimiento.id if movimiento else None
            })
            
        except Sucursal.DoesNotExist:
            return Response({"error": "Sucursal no encontrada."}, status=status.HTTP_404_NOT_FOUND)
        except Producto.DoesNotExist:
            return Response({"error": "Producto no encontrado."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
