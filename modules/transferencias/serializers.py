from rest_framework import serializers
from .models import TransferenciaStock, TransferenciaItem, EstadoTransferencia
from modules.sucursales.serializers import SucursalSerializer
from modules.inventario.serializers import ProductoSerializer
from modules.inventario.models import Producto

class TransferenciaItemSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    producto_sku = serializers.CharField(source='producto.sku', read_only=True)

    class Meta:
        model = TransferenciaItem
        fields = ['id', 'producto', 'producto_nombre', 'producto_sku', 'cantidad']

class TransferenciaStockSerializer(serializers.ModelSerializer):
    items = TransferenciaItemSerializer(many=True, required=False)
    sucursal_origen_nombre = serializers.CharField(source='sucursal_origen.nombre', read_only=True)
    sucursal_destino_nombre = serializers.CharField(source='sucursal_destino.nombre', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.nombre_completo', read_only=True)

    class Meta:
        model = TransferenciaStock
        fields = [
            'id', 'numero_transferencia', 'sucursal_origen', 'sucursal_origen_nombre',
            'sucursal_destino', 'sucursal_destino_nombre', 'usuario', 'usuario_nombre',
            'estado', 'observaciones', 'fecha', 'items'
        ]
        read_only_fields = ['id', 'numero_transferencia', 'estado', 'fecha', 'usuario']

    def validate(self, data):
        if 'sucursal_origen' in data and 'sucursal_destino' in data:
            if data['sucursal_origen'] == data['sucursal_destino']:
                raise serializers.ValidationError("La sucursal de origen y destino no pueden ser la misma.")
        return data

class TransferenciaStockCreateSerializer(serializers.Serializer):
    sucursal_origen = serializers.UUIDField(required=False) # Si no viene, usamos la del request
    sucursal_destino = serializers.UUIDField(required=True)
    observaciones = serializers.CharField(required=False, allow_blank=True)
    items = serializers.ListField(
        child=serializers.DictField(), min_length=1
    )

    def validate_items(self, value):
        for item in value:
            if 'producto' not in item or 'cantidad' not in item:
                raise serializers.ValidationError("Cada item debe tener 'producto' y 'cantidad'.")
            if float(item['cantidad']) <= 0:
                raise serializers.ValidationError("La cantidad debe ser mayor a 0.")
        return value
