"""
modules/caja/serializers.py
"""
from rest_framework import serializers
from .models import Caja, MovimientoCaja

class MovimientoCajaSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.ReadOnlyField(source='usuario.nombre_completo')
    
    class Meta:
        model = MovimientoCaja
        fields = [
            "id", "caja", "tipo", "concepto", "monto", 
            "metodo_pago", "usuario", "usuario_nombre", 
            "referencia", "fecha"
        ]
        read_only_fields = ["id", "usuario", "fecha"]


class CajaSerializer(serializers.ModelSerializer):
    usuario_apertura_nombre = serializers.ReadOnlyField(source='usuario_apertura.nombre_completo')
    usuario_cierre_nombre = serializers.ReadOnlyField(source='usuario_cierre.nombre_completo')
    
    class Meta:
        model = Caja
        fields = [
            "id", "usuario_apertura", "usuario_apertura_nombre",
            "usuario_cierre", "usuario_cierre_nombre",
            "fecha_apertura", "fecha_cierre",
            "saldo_inicial", "saldo_final_declarado", 
            "saldo_final_calculado", "diferencia",
            "estado", "observaciones"
        ]
        read_only_fields = ["id", "usuario_apertura", "fecha_apertura", "saldo_final_calculado", "diferencia", "estado"]


class AperturaCajaSerializer(serializers.Serializer):
    saldo_inicial = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0)


class CierreCajaSerializer(serializers.Serializer):
    saldo_final_declarado = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0)
    observaciones = serializers.CharField(max_length=500, required=False, allow_blank=True)


class RegistroMovimientoSerializer(serializers.Serializer):
    tipo = serializers.ChoiceField(choices=[("INGRESO", "Ingreso"), ("EGRESO", "Egreso")])
    monto = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0.01)
    concepto = serializers.CharField(max_length=255)
    metodo_pago = serializers.ChoiceField(choices=[("EFECTIVO", "Efectivo"), ("TARJETA", "Tarjeta"), ("TRANSFERENCIA", "Transferencia"), ("MERCADO_PAGO", "Mercado Pago")])
