"""
modules/ventas/serializers.py
────────────────────────────────────────────────────────────────
Serializers para el proceso de venta POS.
"""
from rest_framework import serializers
from .models import Venta, VentaItem
from modules.inventario.models import Producto

class VentaItemSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.ReadOnlyField(source='producto.nombre')
    
    class Meta:
        model = VentaItem
        fields = ["id", "producto", "producto_nombre", "cantidad", "precio_unitario", "descuento", "subtotal"]
        read_only_fields = ["id", "precio_unitario", "subtotal"]


class VentaDetailSerializer(serializers.ModelSerializer):
    items = VentaItemSerializer(many=True, read_only=True)
    usuario_nombre = serializers.ReadOnlyField(source='usuario.nombre_completo')

    class Meta:
        model = Venta
        fields = [
            "id", "numero_comprobante", "tipo_comprobante", "fecha", "usuario_nombre",
            "cliente_nombre", "cliente_documento", "subtotal", "descuento_total", 
            "impuestos", "total", "estado", "metodo_pago", "items", "observaciones"
        ]
        read_only_fields = ["id", "numero_comprobante", "estado", "total"]


class CreateVentaItemSerializer(serializers.Serializer):
    producto_id = serializers.UUIDField()
    cantidad = serializers.DecimalField(max_digits=12, decimal_places=3, min_value=0.001)
    descuento = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)


class CreateVentaSerializer(serializers.Serializer):
    """
    Serializer para recibir el payload del POS.
    """
    items = CreateVentaItemSerializer(many=True)
    tipo_comprobante = serializers.ChoiceField(choices=[("TICKET", "Ticket"), ("FACTURA_A", "Factura A"), ("FACTURA_B", "Factura B"), ("FACTURA_C", "Factura C")])
    metodo_pago = serializers.CharField(default="EFECTIVO")
    cliente_id = serializers.UUIDField(required=False, allow_null=True)
    cliente_nombre = serializers.CharField(default="Consumidor Final")
    cliente_documento = serializers.CharField(required=False, allow_blank=True)
    descuento_total = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    observaciones = serializers.CharField(required=False, allow_blank=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Debe incluir al menos un producto.")
        
        # Validar existencia y stock de productos
        empresa_id = self.context['request'].empresa_id
        for item in value:
            try:
                prod = Producto.objects.for_empresa(empresa_id).get(id=item['producto_id'])
                if prod.stock_actual < item['cantidad']:
                    raise serializers.ValidationError(f"Stock insuficiente para {prod.nombre}. Disponible: {prod.stock_actual}")
                item['producto'] = prod # Guardamos instancia para el service
            except Producto.DoesNotExist:
                raise serializers.ValidationError(f"El producto con ID {item['producto_id']} no existe.")
        
        return value

    def validate(self, data):
        empresa_id = self.context['request'].empresa_id
        cliente_id = data.get('cliente_id')
        if cliente_id:
            from modules.clientes.models import Cliente
            try:
                data['cliente'] = Cliente.objects.for_empresa(empresa_id).get(id=cliente_id)
            except Cliente.DoesNotExist:
                raise serializers.ValidationError({"cliente_id": "El cliente no existe o no pertenece a tu empresa."})
        return data
