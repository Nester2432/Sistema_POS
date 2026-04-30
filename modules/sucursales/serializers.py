from rest_framework import serializers
from .models import Sucursal, StockSucursal
from modules.inventario.serializers import ProductoSerializer

class SucursalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sucursal
        fields = [
            'id', 'nombre', 'codigo', 'direccion', 
            'telefono', 'activo', 'es_principal', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_codigo(self, value):
        request = self.context.get('request')
        empresa = request.empresa
        
        qs = Sucursal.objects.for_empresa(empresa.id).filter(codigo=value)
        if self.instance:
            qs = qs.exclude(id=self.instance.id)
            
        if qs.exists():
            raise serializers.ValidationError("Ya existe una sucursal con este código en tu empresa.")
        return value

class StockSucursalSerializer(serializers.ModelSerializer):
    # Opcional: incluir datos básicos del producto
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    producto_sku = serializers.CharField(source='producto.sku', read_only=True)
    sucursal_nombre = serializers.CharField(source='sucursal.nombre', read_only=True)

    class Meta:
        model = StockSucursal
        fields = [
            'id', 'sucursal', 'sucursal_nombre', 'producto', 'producto_nombre', 'producto_sku',
            'stock_actual', 'stock_minimo', 'ubicacion', 'activo', 'updated_at'
        ]
        read_only_fields = ['id', 'updated_at', 'sucursal_nombre', 'producto_nombre', 'producto_sku']
