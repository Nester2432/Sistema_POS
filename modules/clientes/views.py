"""
modules/clientes/views.py
────────────────────────────────────────────────────────────────
Views para Clientes y Gestión de Créditos.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from core.permissions import IsEmpresaUser
from core.responses import success_response, error_response
from .models import Cliente, MovimientoCuentaCorriente
from .serializers import (
    ClienteSerializer, MovimientoCCSerializer, PagoCCSerializer, CuentaCorrienteSerializer
)
from .services import crear_cliente_con_cuenta, registrar_pago_cc
from .selectors import buscar_clientes, get_clientes_con_deuda, get_historial_cc

class ClienteViewSet(viewsets.ModelViewSet):
    permission_classes = [IsEmpresaUser]
    serializer_class = ClienteSerializer

    def get_queryset(self):
        return Cliente.objects.for_empresa(self.request.empresa_id).select_related('cuenta_corriente')

    def perform_create(self, serializer):
        # Usamos el service para asegurar que se cree la CC
        crear_cliente_con_cuenta(
            empresa=self.request.empresa,
            usuario=self.request.user,
            **serializer.validated_data
        )

    @action(detail=False, methods=['get'], url_path='buscar')
    def buscar(self, request):
        query = request.query_params.get('q', '')
        clientes = buscar_clientes(request.empresa_id, query)
        serializer = self.get_serializer(clientes, many=True)
        return success_response(data=serializer.data)

    @action(detail=True, methods=['get'], url_path='historial-cc')
    def historial_cc(self, request, pk=None):
        movs = get_historial_cc(pk, request.empresa_id)
        page = self.paginate_queryset(movs)
        if page is not None:
            serializer = MovimientoCCSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = MovimientoCCSerializer(movs, many=True)
        return success_response(data=serializer.data)

    @action(detail=True, methods=['post'], url_path='registrar-pago')
    def registrar_pago(self, request, pk=None):
        """POST /api/v1/clientes/{id}/registrar-pago/"""
        cliente = self.get_object()
        serializer = PagoCCSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            mov = registrar_pago_cc(
                cliente=cliente,
                monto=serializer.validated_data['monto'],
                usuario=request.user,
                metodo_pago=serializer.validated_data['metodo_pago'],
                concepto=serializer.validated_data.get('concepto', 'Pago de CC')
            )
            return success_response(data=MovimientoCCSerializer(mov).data, message="Pago registrado correctamente.")
        except Exception as e:
            return error_response(message=str(e))

    @action(detail=False, methods=['get'], url_path='deudores')
    def deudores(self, request):
        """GET /api/v1/clientes/deudores/"""
        clientes = get_clientes_con_deuda(request.empresa_id)
        serializer = self.get_serializer(clientes, many=True)
        return success_response(data=serializer.data)
