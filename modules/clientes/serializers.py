"""
modules/clientes/serializers.py
"""
from rest_framework import serializers
from .models import Cliente, CuentaCorriente, MovimientoCuentaCorriente

class CuentaCorrienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CuentaCorriente
        fields = ["id", "saldo_actual", "limite_credito", "activa"]
        read_only_fields = ["id", "saldo_actual"]


class ClienteSerializer(serializers.ModelSerializer):
    cuenta_corriente = CuentaCorrienteSerializer(read_only=True)
    
    class Meta:
        model = Cliente
        fields = [
            "id", "nombre", "apellido", "razon_social", "tipo_documento", 
            "documento", "email", "telefono", "direccion", "localidad", 
            "provincia", "activo", "observaciones", "cuenta_corriente"
        ]
        read_only_fields = ["id"]


class MovimientoCCSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.ReadOnlyField(source='usuario.nombre_completo')
    venta_numero = serializers.ReadOnlyField(source='venta.numero_comprobante')
    
    class Meta:
        model = MovimientoCuentaCorriente
        fields = ["id", "tipo", "concepto", "monto", "venta", "venta_numero", "caja", "usuario_nombre", "fecha"]
        read_only_fields = fields


class PagoCCSerializer(serializers.Serializer):
    monto = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0.01)
    metodo_pago = serializers.CharField(default="EFECTIVO")
    concepto = serializers.CharField(max_length=255, default="Pago de cuenta corriente")
