from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.exceptions import ValidationError

from .models import TransferenciaStock
from .serializers import TransferenciaStockSerializer, TransferenciaStockCreateSerializer
from .services import crear_transferencia, confirmar_transferencia, cancelar_transferencia
from modules.sucursales.models import Sucursal
from modules.inventario.models import Producto

class TransferenciaStockViewSet(viewsets.ModelViewSet):
    serializer_class = TransferenciaStockSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # EmpresaScopedManager ya filtra por empresa. 
        # Ordenamos las más recientes primero.
        return TransferenciaStock.objects.all().order_by('-created_at')

    def create(self, request, *args, **kwargs):
        # Usamos un serializer especial para la creación
        serializer = TransferenciaStockCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Determinar origen: usar la solicitada o la del request activo
        origen_id = data.get('sucursal_origen')
        if origen_id:
            try:
                sucursal_origen = Sucursal.objects.get(id=origen_id, empresa=request.empresa)
            except Sucursal.DoesNotExist:
                return Response({"error": "Sucursal origen inválida."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            sucursal_origen = request.sucursal
            if not sucursal_origen:
                return Response({"error": "No hay contexto de sucursal activa para origen."}, status=status.HTTP_400_BAD_REQUEST)

        # Determinar destino
        try:
            sucursal_destino = Sucursal.objects.get(id=data['sucursal_destino'], empresa=request.empresa)
        except Sucursal.DoesNotExist:
            return Response({"error": "Sucursal destino inválida."}, status=status.HTTP_400_BAD_REQUEST)

        # Preparar items
        items_data = []
        for item in data['items']:
            try:
                producto = Producto.objects.get(id=item['producto'], empresa=request.empresa)
                items_data.append({
                    'producto': producto,
                    'cantidad': item['cantidad']
                })
            except Producto.DoesNotExist:
                return Response({"error": f"Producto con ID {item['producto']} no encontrado."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            transferencia = crear_transferencia(
                usuario=request.user,
                empresa=request.empresa,
                sucursal_origen=sucursal_origen,
                sucursal_destino=sucursal_destino,
                observaciones=data.get('observaciones', ''),
                items_data=items_data
            )
            res_serializer = self.get_serializer(transferencia)
            return Response(res_serializer.data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({"error": e.messages}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def confirmar(self, request, pk=None):
        try:
            transferencia = confirmar_transferencia(transferencia_id=pk, usuario=request.user)
            serializer = self.get_serializer(transferencia)
            return Response(serializer.data)
        except TransferenciaStock.DoesNotExist:
            return Response({"error": "Transferencia no encontrada."}, status=status.HTTP_404_NOT_FOUND)
        except ValidationError as e:
            return Response({"error": e.messages}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        try:
            transferencia = cancelar_transferencia(transferencia_id=pk)
            serializer = self.get_serializer(transferencia)
            return Response(serializer.data)
        except TransferenciaStock.DoesNotExist:
            return Response({"error": "Transferencia no encontrada."}, status=status.HTTP_404_NOT_FOUND)
        except ValidationError as e:
            return Response({"error": e.messages}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
