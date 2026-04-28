"""
modules/caja/views.py
────────────────────────────────────────────────────────────────
Views para la gestión de Caja.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from core.permissions import IsEmpresaUser
from core.responses import success_response, error_response
from .models import Caja, MovimientoCaja, CajaEstado
from .serializers import (
    CajaSerializer, MovimientoCajaSerializer, 
    AperturaCajaSerializer, CierreCajaSerializer, RegistroMovimientoSerializer
)
from .services import abrir_caja, cerrar_caja, registrar_movimiento_caja, obtener_caja_abierta_usuario
from .selectors import get_resumen_caja

class CajaViewSet(viewsets.ModelViewSet):
    permission_classes = [IsEmpresaUser]
    serializer_class = CajaSerializer

    def get_queryset(self):
        return Caja.objects.for_empresa(self.request.empresa_id).select_related(
            'usuario_apertura', 'usuario_cierre'
        )

    @action(detail=False, methods=['get'], url_path='mi-caja')
    def mi_caja(self, request):
        """GET /api/v1/caja/mi-caja/ - Retorna la caja abierta del usuario logueado."""
        caja = obtener_caja_abierta_usuario(request.user, request.empresa_id)
        if not caja:
            return error_response(message="No tienes una caja abierta actualmente.", code="NO_OPEN_BOX")
        
        serializer = self.get_serializer(caja)
        return success_response(data=serializer.data)

    @action(detail=False, methods=['post'], url_path='abrir')
    def abrir(self, request):
        """POST /api/v1/caja/abrir/"""
        serializer = AperturaCajaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            caja = abrir_caja(
                usuario=request.user,
                empresa=request.empresa,
                saldo_inicial=serializer.validated_data['saldo_inicial']
            )
            return success_response(data=CajaSerializer(caja).data, message="Caja abierta correctamente.")
        except Exception as e:
            return error_response(message=str(e))

    @action(detail=True, methods=['post'], url_path='cerrar')
    def cerrar(self, request, pk=None):
        """POST /api/v1/caja/{id}/cerrar/"""
        caja = self.get_object()
        serializer = CierreCajaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            caja_cerrada = cerrar_caja(
                caja=caja,
                saldo_declarado=serializer.validated_data['saldo_final_declarado'],
                usuario_cierre=request.user,
                observaciones=serializer.validated_data.get('observaciones', '')
            )
            return success_response(data=CajaSerializer(caja_cerrada).data, message="Caja cerrada exitosamente.")
        except Exception as e:
            return error_response(message=str(e))

    @action(detail=True, methods=['post'], url_path='movimiento')
    def registrar_movimiento(self, request, pk=None):
        """POST /api/v1/caja/{id}/movimiento/"""
        caja = self.get_object()
        serializer = RegistroMovimientoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            mov = registrar_movimiento_caja(
                caja=caja,
                tipo=serializer.validated_data['tipo'],
                monto=serializer.validated_data['monto'],
                concepto=serializer.validated_data['concepto'],
                metodo_pago=serializer.validated_data['metodo_pago'],
                usuario=request.user
            )
            return success_response(data=MovimientoCajaSerializer(mov).data, message="Movimiento registrado.")
        except Exception as e:
            return error_response(message=str(e))

    @action(detail=True, methods=['get'], url_path='resumen')
    def resumen(self, request, pk=None):
        """GET /api/v1/caja/{id}/resumen/"""
        try:
            data = get_resumen_caja(pk, request.empresa_id)
            return success_response(data=data)
        except Exception as e:
            return error_response(message=str(e))


class MovimientoCajaViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsEmpresaUser]
    serializer_class = MovimientoCajaSerializer

    def get_queryset(self):
        return MovimientoCaja.objects.for_empresa(self.request.empresa_id).select_related(
            'usuario', 'caja'
        )
