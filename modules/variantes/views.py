from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import AtributoProducto, ValorAtributoProducto, ProductoVariante
from .serializers import AtributoProductoSerializer, ValorAtributoSerializer, ProductoVarianteSerializer

class AtributoViewSet(viewsets.ModelViewSet):
    serializer_class = AtributoProductoSerializer

    def get_queryset(self):
        return AtributoProducto.objects.filter(empresa=self.request.user.empresa)

    def perform_create(self, serializer):
        serializer.save(empresa=self.request.user.empresa)

class ValorAtributoViewSet(viewsets.ModelViewSet):
    serializer_class = ValorAtributoSerializer

    def get_queryset(self):
        return ValorAtributoProducto.objects.filter(empresa=self.request.user.empresa)

    def perform_create(self, serializer):
        serializer.save(empresa=self.request.user.empresa)

class ProductoVarianteViewSet(viewsets.ModelViewSet):
    serializer_class = ProductoVarianteSerializer

    def get_queryset(self):
        qs = ProductoVariante.objects.filter(empresa=self.request.user.empresa)
        producto_id = self.request.query_params.get('producto_id')
        if producto_id:
            qs = qs.filter(producto_padre_id=producto_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(empresa=self.request.user.empresa)
        # Al crear una variante, marcamos el producto padre como que tiene variantes
        producto = serializer.validated_data['producto_padre']
        if not producto.tiene_variantes:
            producto.tiene_variantes = True
            producto.save(update_fields=['tiene_variantes'])
