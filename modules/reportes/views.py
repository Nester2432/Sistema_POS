"""
modules/reportes/views.py
────────────────────────────────────────────────────────────────
Views para consultas de Dashboard y Reportes.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse

from core.permissions import IsEmpresaUser, IsSupervisorOrAdmin
from core.responses import success_response, error_response
from .selectors import get_dashboard_stats, get_reporte_ventas, get_reporte_inventario
from .exports import generar_ticket_pdf, generar_cierre_caja_pdf

class ReporteViewSet(viewsets.ViewSet):
    def get_permissions(self):
        if self.action == 'dashboard':
            return [IsSupervisorOrAdmin()]
        return [IsEmpresaUser()]

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """GET /api/v1/reportes/dashboard/"""
        data = get_dashboard_stats(request.empresa_id)
        return success_response(data=data)

    @action(detail=False, methods=['get'])
    def ventas(self, request):
        """GET /api/v1/reportes/ventas/?fecha_inicio=...&fecha_fin=..."""
        fecha_ini = request.query_params.get('fecha_inicio')
        fecha_fin = request.query_params.get('fecha_fin')
        data = get_reporte_ventas(request.empresa_id, fecha_ini, fecha_fin)
        # Serializar manualmente o con serializer de ventas
        return success_response(data={
            "stats": data['stats'],
            "desglose_pago": data['desglose_pago']
        })

    @action(detail=False, methods=['get'])
    def inventario(self, request):
        """GET /api/v1/reportes/inventario/"""
        data = get_reporte_inventario(request.empresa_id)
        return success_response(data=data)

    @action(detail=False, methods=['get'], url_path='caja/(?P<caja_id>[^/.]+)/pdf')
    def caja_pdf(self, request, caja_id=None):
        """GET /api/v1/reportes/caja/{id}/pdf/"""
        from modules.caja.models import Caja
        from modules.caja.selectors import get_resumen_caja
        
        try:
            caja = Caja.objects.for_empresa(request.empresa_id).get(id=caja_id)
            resumen = get_resumen_caja(caja_id, request.empresa_id)
            pdf_data = generar_cierre_caja_pdf(caja, resumen)
            
            response = HttpResponse(pdf_data, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="cierre_caja_{caja_id}.pdf"'
            return response
        except Caja.DoesNotExist:
            return error_response(message="Caja no encontrada.", http_status=404)

class VentaReporteViewSet(viewsets.ViewSet):
    """ViewSet adicional para colgar el PDF de la venta."""
    permission_classes = [IsEmpresaUser]

    @action(detail=True, methods=['get'], url_path='ticket-pdf')
    def ticket_pdf(self, request, pk=None):
        """GET /api/v1/ventas/{id}/ticket-pdf/"""
        from modules.ventas.models import Venta
        try:
            venta = Venta.objects.for_empresa(request.empresa_id).get(id=pk)
            pdf_data = generar_ticket_pdf(venta)
            
            response = HttpResponse(pdf_data, content_type='application/pdf')
            response['Content-Disposition'] = f'inline; filename="ticket_{venta.numero_comprobante}.pdf"'
            return response
        except Venta.DoesNotExist:
            return error_response(message="Venta no encontrada.", http_status=404)
