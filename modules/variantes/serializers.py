from rest_framework import serializers
from .models import AtributoProducto, ValorAtributoProducto, ProductoVariante, VarianteValor

class ValorAtributoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ValorAtributoProducto
        fields = ["id", "atributo", "valor"]

class AtributoProductoSerializer(serializers.ModelSerializer):
    valores = ValorAtributoSerializer(many=True, read_only=True)
    
    class Meta:
        model = AtributoProducto
        fields = ["id", "nombre", "activo", "valores"]

class VarianteValorSerializer(serializers.ModelSerializer):
    atributo_nombre = serializers.ReadOnlyField(source="atributo.nombre")
    valor_nombre = serializers.ReadOnlyField(source="valor.valor")

    class Meta:
        model = VarianteValor
        fields = ["id", "atributo", "atributo_nombre", "valor", "valor_nombre"]

class ProductoVarianteSerializer(serializers.ModelSerializer):
    valores_detalle = VarianteValorSerializer(source="variantevalor_set", many=True, read_only=True)
    nombre_completo = serializers.SerializerMethodField()

    class Meta:
        model = ProductoVariante
        fields = [
            "id", "producto_padre", "sku", "codigo_barras", 
            "precio_costo", "precio_venta", "activo", 
            "valores_detalle", "nombre_completo"
        ]

    def get_nombre_completo(self, obj):
        return str(obj)
