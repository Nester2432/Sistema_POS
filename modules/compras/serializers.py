"""
modules/compras/serializers.py
"""
from rest_framework import serializers
from .models import Compra, CompraItem, CuentaCorrienteProveedor
from modules.inventario.models import Producto, Proveedor

class CompraItemSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.ReadOnlyField(source='producto.nombre')
    class Meta:
        model = CompraItem
        fields = ["id", "producto", "producto_nombre", "cantidad", "precio_unitario", "subtotal"]

class CompraDetailSerializer(serializers.ModelSerializer):
    items = CompraItemSerializer(many=True, read_only=True)
    proveedor_nombre = serializers.ReadOnlyField(source='proveedor.nombre')
    
    class Meta:
        model = Compra
        fields = [
            "id", "proveedor", "proveedor_nombre", "numero_comprobante", 
            "fecha", "total", "estado", "metodo_pago", "items", "observaciones"
        ]

class CreateCompraItemSerializer(serializers.Serializer):
    producto_id = serializers.UUIDField()
    cantidad = serializers.DecimalField(max_digits=12, decimal_places=3, min_value=0.001)
    precio_unitario = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0)

class CreateCompraSerializer(serializers.Serializer):
    proveedor_id = serializers.UUIDField()
    items = CreateCompraItemSerializer(many=True)
    numero_comprobante = serializers.CharField(max_length=50)
    metodo_pago = serializers.ChoiceField(choices=[("EFECTIVO", "Efectivo"), ("CUENTA_CORRIENTE", "Cuenta Corriente")])
    impuestos = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    observaciones = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        empresa_id = self.context['request'].empresa_id
        # Validar Proveedor
        try:
            data['proveedor'] = Proveedor.objects.for_empresa(empresa_id).get(id=data['proveedor_id'])
        except Proveedor.DoesNotExist:
            raise serializers.ValidationError({"proveedor_id": "El proveedor no existe."})
            
        # Validar Productos
        for item in data['items']:
            try:
                item['producto'] = Producto.objects.for_empresa(empresa_id).get(id=item['producto_id'])
            except Producto.DoesNotExist:
                raise serializers.ValidationError({"items": f"El producto {item['producto_id']} no existe."})
        
        return data

class DeudaProveedorSerializer(serializers.ModelSerializer):
    proveedor_nombre = serializers.ReadOnlyField(source='proveedor.nombre')
    class Meta:
        model = CuentaCorrienteProveedor
        fields = ["id", "proveedor_nombre", "saldo_actual"]
