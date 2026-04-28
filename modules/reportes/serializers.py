"""
modules/reportes/serializers.py
"""
from rest_framework import serializers

class DashboardSerializer(serializers.Serializer):
    ventas_hoy = serializers.DecimalField(max_digits=12, decimal_places=2)
    cantidad_ventas_hoy = serializers.IntegerField()
    ventas_semana = serializers.DecimalField(max_digits=12, decimal_places=2)
    ventas_mes = serializers.DecimalField(max_digits=12, decimal_places=2)
    caja_abierta = serializers.BooleanField()
    productos_bajo_stock = serializers.IntegerField()
    clientes_deuda_total = serializers.DecimalField(max_digits=12, decimal_places=2)
    clientes_deuda_cant = serializers.IntegerField()
    metodos_pago_hoy = serializers.ListField()
    top_productos_semana = serializers.ListField()
