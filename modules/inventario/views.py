"""
modules/inventario/views.py
────────────────────────────────────────────────────────────────
Views para el módulo de inventario.
Implementa CRUDs y acciones especiales de stock.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction

from core.permissions import IsEmpresaUser, IsSupervisorOrAdmin
from core.responses import success_response, error_response
from .models import Categoria, Marca, Proveedor, Producto, MovimientoStock
from .serializers import (
    CategoriaSerializer, MarcaSerializer, ProveedorSerializer, 
    ProductoSerializer, AjusteStockSerializer, MovimientoStockSerializer
)
from .selectors import get_productos_list, get_productos_stock_bajo
from .services import ajustar_stock_manual
from .filters import ProductoFilter, MovimientoStockFilter

class BaseInventarioViewSet(viewsets.ModelViewSet):
    permission_classes = [IsEmpresaUser]
    
    def perform_create(self, serializer):
        serializer.save(empresa=self.request.empresa)


class CategoriaViewSet(BaseInventarioViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    search_fields = ["nombre"]


class MarcaViewSet(BaseInventarioViewSet):
    queryset = Marca.objects.all()
    serializer_class = MarcaSerializer
    search_fields = ["nombre"]


class ProveedorViewSet(BaseInventarioViewSet):
    queryset = Proveedor.objects.all()
    serializer_class = ProveedorSerializer
    search_fields = ["nombre", "documento"]


class ProductoViewSet(BaseInventarioViewSet):
    serializer_class = ProductoSerializer
    filterset_class = ProductoFilter
    search_fields = ["nombre", "sku", "codigo_barras"]

    def get_queryset(self):
        return get_productos_list(self.request.empresa_id)

    @action(detail=True, methods=['post'], url_path='ajustar-stock')
    def ajustar_stock(self, request, pk=None):
        """POST /api/v1/productos/{id}/ajustar-stock/"""
        producto = self.get_object()
        serializer = AjusteStockSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            movimiento = ajustar_stock_manual(
                producto=producto,
                nuevo_stock=serializer.validated_data['nuevo_stock'],
                usuario=request.user,
                motivo=serializer.validated_data.get('motivo', 'Ajuste manual')
            )
            return success_response(
                data=MovimientoStockSerializer(movimiento).data if movimiento else ProductoSerializer(producto).data,
                message="Stock ajustado correctamente."
            )
        except Exception as e:
            return error_response(message=str(e))

    @action(detail=False, methods=['get'], url_path='stock-bajo')
    def stock_bajo(self, request):
        """GET /api/v1/productos/stock-bajo/"""
        productos = get_productos_stock_bajo(request.empresa_id)
        page = self.paginate_queryset(productos)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(productos, many=True)
        return success_response(data=serializer.data)

    @action(detail=False, methods=['get'], url_path='exportar-excel')
    def exportar_excel(self, request):
        """GET /api/v1/inventario/productos/exportar-excel/"""
        from django.http import HttpResponse
        from .services import exportar_productos_excel
        
        file_data = exportar_productos_excel(request.empresa_id)
        response = HttpResponse(
            file_data,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="productos.xlsx"'
        return response

    @action(detail=False, methods=['post'], url_path='importar-csv')
    def importar_csv(self, request):
        """POST /api/v1/inventario/productos/importar-csv/"""
        from .services import importar_productos_desde_csv
        
        file = request.FILES.get('file')
        if not file:
            return error_response(message="No se proporcionó ningún archivo.")
        
        if not file.name.endswith('.csv'):
            return error_response(message="Solo se admiten archivos .csv por el momento.")

        try:
            resultado = importar_productos_desde_csv(file, request.empresa, request.user)
            return success_response(
                data=resultado,
                message=f"Importación completada: {resultado['creados']} creados."
            )
        except Exception as e:
            return error_response(message=str(e))

    @action(detail=True, methods=['get'], url_path='historial-stock')
    def historial_stock(self, request, pk=None):
        """GET /api/v1/inventario/productos/{id}/historial-stock/"""
        from .selectors import get_historial_stock
        from .serializers import MovimientoStockSerializer
        
        producto = self.get_object()
        movimientos = get_historial_stock(producto.id, request.empresa_id)
        
        page = self.paginate_queryset(movimientos)
        if page is not None:
            serializer = MovimientoStockSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = MovimientoStockSerializer(movimientos, many=True)
        return success_response(data=serializer.data)


class MovimientoStockViewSet(viewsets.ReadOnlyModelViewSet):
    """Solo lectura para historial de movimientos."""
    permission_classes = [IsEmpresaUser]
    serializer_class = MovimientoStockSerializer
    filterset_class = MovimientoStockFilter

    def get_queryset(self):
        return MovimientoStock.objects.for_empresa(self.request.empresa_id).select_related(
            'producto', 'usuario'
        )
