"""
modules/ventas/views.py
────────────────────────────────────────────────────────────────
Views para el POS y gestión de Ventas.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from core.permissions import IsEmpresaUser, IsSupervisorOrAdmin
from core.responses import success_response, error_response
from .models import Venta
from .serializers import VentaDetailSerializer, CreateVentaSerializer
from .services import crear_venta_completa, anular_venta
from .selectors import get_ventas_diarias, get_productos_mas_vendidos

class VentaViewSet(viewsets.ModelViewSet):
    permission_classes = [IsEmpresaUser]
    serializer_class = VentaDetailSerializer
    http_method_names = ['get', 'post', 'patch', 'delete']

    def get_queryset(self):
        return Venta.objects.for_empresa(self.request.empresa_id).select_related(
            'usuario', 'caja'
        ).prefetch_related('items__producto')

    def create(self, request, *args, **kwargs):
        """POST /api/v1/ventas/ - Proceso de venta POS."""
        serializer = CreateVentaSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        try:
            venta = crear_venta_completa(
                usuario=request.user,
                empresa=request.empresa,
                items_data=serializer.validated_data['items'],
                tipo_comprobante=serializer.validated_data['tipo_comprobante'],
                metodo_pago=serializer.validated_data['metodo_pago'],
                cliente_nombre=serializer.validated_data.get('cliente_nombre', 'Consumidor Final'),
                cliente_documento=serializer.validated_data.get('cliente_documento', ''),
                descuento_total=serializer.validated_data.get('descuento_total', 0),
                observaciones=serializer.validated_data.get('observaciones', '')
            )
            return success_response(
                data=VentaDetailSerializer(venta).data, 
                message="Venta realizada con éxito.",
                http_status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return error_response(message=str(e))

    @action(detail=True, methods=['post'], url_path='anular')
    def anular(self, request, pk=None):
        """POST /api/v1/ventas/{id}/anular/"""
        # Solo admin o supervisores suelen anular ventas
        if request.user.rol not in ["admin", "supervisor"]:
            return error_response(message="No tienes permisos para anular ventas.", http_status=403)
            
        venta = self.get_object()
        try:
            venta_anulada = anular_venta(venta, request.user)
            return success_response(data=VentaDetailSerializer(venta_anulada).data, message="Venta anulada correctamente.")
        except Exception as e:
            return error_response(message=str(e))

    @action(detail=True, methods=['get'], url_path='ticket-pdf')
    def ticket_pdf(self, request, pk=None):
        """GET /api/v1/ventas/{id}/ticket-pdf/"""
        from modules.reportes.exports import generar_ticket_pdf
        from django.http import HttpResponse
        
        venta = self.get_object()
        pdf_data = generar_ticket_pdf(venta)
        
        response = HttpResponse(pdf_data, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="ticket_{venta.numero_comprobante}.pdf"'
        return response

    @action(detail=False, methods=['get'], url_path='reporte-diario')
    def reporte_diario(self, request):
        """GET /api/v1/ventas/reporte-diario/"""
        data = get_ventas_diarias(request.empresa_id)
        return success_response(data=data)

    @action(detail=False, methods=['get'], url_path='reporte-productos-top')
    def reporte_productos_top(self, request):
        """GET /api/v1/ventas/reporte-productos-top/"""
        data = get_productos_mas_vendidos(request.empresa_id)
        return success_response(data=list(data))
