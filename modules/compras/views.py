"""
modules/compras/views.py
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from core.permissions import IsEmpresaUser, IsSupervisorOrAdmin
from core.responses import success_response, error_response
from .models import Compra
from .serializers import CompraDetailSerializer, CreateCompraSerializer, DeudaProveedorSerializer
from .services import crear_compra_completa, anular_compra
from .selectors import get_reporte_compras, get_deudas_proveedores

class CompraViewSet(viewsets.ModelViewSet):
    permission_classes = [IsEmpresaUser]
    serializer_class = CompraDetailSerializer

    def get_queryset(self):
        return Compra.objects.for_empresa(self.request.empresa_id).select_related('proveedor', 'usuario')

    def create(self, request, *args, **kwargs):
        serializer = CreateCompraSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        try:
            compra = crear_compra_completa(
                usuario=request.user,
                empresa=request.empresa,
                proveedor=serializer.validated_data['proveedor'],
                items_data=serializer.validated_data['items'],
                numero_comprobante=serializer.validated_data['numero_comprobante'],
                metodo_pago=serializer.validated_data['metodo_pago'],
                impuestos=serializer.validated_data.get('impuestos', 0),
                observaciones=serializer.validated_data.get('observaciones', '')
            )
            return success_response(data=CompraDetailSerializer(compra).data, message="Compra registrada exitosamente.")
        except Exception as e:
            return error_response(message=str(e))

    @action(detail=True, methods=['post'], url_path='anular')
    def anular(self, request, pk=None):
        if request.user.rol not in ['admin', 'supervisor']:
            return error_response(message="No tienes permisos para anular compras.", http_status=403)
        
        compra = self.get_object()
        try:
            compra_anulada = anular_compra(compra, request.user)
            return success_response(data=CompraDetailSerializer(compra_anulada).data, message="Compra anulada correctamente.")
        except Exception as e:
            return error_response(message=str(e))

    @action(detail=False, methods=['get'], url_path='reporte')
    def reporte(self, request):
        fecha_ini = request.query_params.get('fecha_inicio')
        fecha_fin = request.query_params.get('fecha_fin')
        data = get_reporte_compras(request.empresa_id, fecha_ini, fecha_fin)
        return success_response(data=data)

    @action(detail=False, methods=['get'], url_path='deudas-proveedores')
    def deudas_proveedores(self, request):
        deudas = get_deudas_proveedores(request.empresa_id)
        serializer = DeudaProveedorSerializer(deudas, many=True)
        return success_response(data=serializer.data)
