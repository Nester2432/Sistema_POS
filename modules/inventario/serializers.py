"""
modules/inventario/serializers.py
────────────────────────────────────────────────────────────────
Serializers para el módulo de inventario.
Incluye validación de pertenencia de FKs a la misma empresa.
"""
from rest_framework import serializers
from .models import Categoria, Marca, Proveedor, Producto, MovimientoStock

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ["id", "nombre", "descripcion", "created_at"]
        read_only_fields = ["id", "created_at"]


class MarcaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Marca
        fields = ["id", "nombre"]
        read_only_fields = ["id"]


class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = ["id", "nombre", "documento", "email", "telefono", "direccion"]
        read_only_fields = ["id"]


class ProductoSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.ReadOnlyField(source='categoria.nombre')
    marca_nombre = serializers.ReadOnlyField(source='marca.nombre')
    proveedor_nombre = serializers.ReadOnlyField(source='proveedor.nombre')

    class Meta:
        model = Producto
        fields = [
            "id", "categoria", "categoria_nombre", "marca", "marca_nombre", 
            "proveedor", "proveedor_nombre", "nombre", "descripcion", "sku", 
            "codigo_barras", "precio_costo", "precio_venta", "margen_ganancia", 
            "stock_actual", "stock_minimo", "unidad_medida", "activo", "imagen"
        ]
        read_only_fields = ["id", "stock_actual", "margen_ganancia"]

    def validate(self, data):
        """Validar que las FKs pertenezcan a la misma empresa que el usuario."""
        empresa = self.context['request'].empresa
        
        for field in ['categoria', 'marca', 'proveedor']:
            obj = data.get(field)
            if obj and obj.empresa_id != empresa.id:
                raise serializers.ValidationError({field: f"Este recurso no pertenece a tu empresa."})
        
        return data

    def validate_sku(self, value):
        empresa = self.context['request'].empresa
        instance = self.instance
        qs = Producto.objects.for_empresa(empresa.id).with_deleted().filter(sku=value)
        if instance:
            qs = qs.exclude(id=instance.id)
        if qs.exists():
            raise serializers.ValidationError("Este SKU ya existe en tu empresa.")
        return value

    def validate_codigo_barras(self, value):
        if not value: return value
        empresa = self.context['request'].empresa
        instance = self.instance
        qs = Producto.objects.for_empresa(empresa.id).with_deleted().filter(codigo_barras=value)
        if instance:
            qs = qs.exclude(id=instance.id)
        if qs.exists():
            raise serializers.ValidationError("Este código de barras ya existe en tu empresa.")
        return value


class AjusteStockSerializer(serializers.Serializer):
    nuevo_stock = serializers.DecimalField(max_digits=12, decimal_places=3, min_value=0)
    motivo = serializers.CharField(max_length=255, required=False, allow_blank=True)


class MovimientoStockSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.ReadOnlyField(source='usuario.nombre_completo')
    producto_nombre = serializers.ReadOnlyField(source='producto.nombre')

    class Meta:
        model = MovimientoStock
        fields = [
            "id", "producto", "producto_nombre", "tipo", "cantidad", 
            "stock_anterior", "stock_nuevo", "motivo", "usuario", 
            "usuario_nombre", "fecha"
        ]
        read_only_fields = fields
