"""
modules/caja/models.py
────────────────────────────────────────────────────────────────
Modelos para la gestión de Caja y Movimientos de Dinero.
"""
from django.db import models
from django.utils import timezone
from decimal import Decimal

from core.models import TenantModel


class CajaEstado(models.TextChoices):
    ABIERTA = "ABIERTA", "Abierta"
    CERRADA = "CERRADA", "Cerrada"


class MetodoPago(models.TextChoices):
    EFECTIVO = "EFECTIVO", "Efectivo"
    TARJETA = "TARJETA", "Tarjeta (Débito/Crédito)"
    TRANSFERENCIA = "TRANSFERENCIA", "Transferencia Bancaria"
    MERCADO_PAGO = "MERCADO_PAGO", "Mercado Pago"
    OTRO = "OTRO", "Otro"


class TipoMovimientoCaja(models.TextChoices):
    INGRESO = "INGRESO", "Ingreso Manual"
    EGRESO = "EGRESO", "Egreso / Gasto"
    VENTA = "VENTA", "Venta de Productos"
    DEVOLUCION = "DEVOLUCION", "Devolución"
    AJUSTE = "AJUSTE", "Ajuste de Saldo"


class Caja(TenantModel):
    """
    Representa una sesión de caja (Turno).
    Solo puede haber una caja ABIERTA por usuario en una empresa.
    """
    usuario_apertura = models.ForeignKey("usuarios.Usuario", on_delete=models.PROTECT, related_name="cajas_abiertas")
    usuario_cierre = models.ForeignKey("usuarios.Usuario", on_delete=models.PROTECT, related_name="cajas_cerradas", null=True, blank=True)
    
    fecha_apertura = models.DateTimeField(default=timezone.now)
    fecha_cierre = models.DateTimeField(null=True, blank=True)
    
    saldo_inicial = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    saldo_final_declarado = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"), help_text="Monto contado por el cajero")
    saldo_final_calculado = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"), help_text="Monto según sistema")
    diferencia = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"), help_text="Diferencia entre sistema y declarado")
    
    estado = models.CharField(max_length=10, choices=CajaEstado.choices, default=CajaEstado.ABIERTA)
    observaciones = models.TextField(blank=True)

    class Meta(TenantModel.Meta):
        verbose_name = "Caja"
        verbose_name_plural = "Cajas"
        ordering = ["-fecha_apertura"]

    def __str__(self):
        return f"Caja {self.id} - {self.usuario_apertura.nombre} ({self.estado})"


class MovimientoCaja(TenantModel):
    caja = models.ForeignKey(Caja, on_delete=models.CASCADE, related_name="movimientos")
    tipo = models.CharField(max_length=20, choices=TipoMovimientoCaja.choices)
    concepto = models.CharField(max_length=255)
    monto = models.DecimalField(max_digits=12, decimal_places=2)
    metodo_pago = models.CharField(max_length=20, choices=MetodoPago.choices, default=MetodoPago.EFECTIVO)
    usuario = models.ForeignKey("usuarios.Usuario", on_delete=models.PROTECT)
    referencia = models.CharField(max_length=100, blank=True, help_text="ID de venta u otro documento")
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta(TenantModel.Meta):
        verbose_name = "Movimiento de Caja"
        verbose_name_plural = "Movimientos de Caja"
        ordering = ["-fecha"]

    def __str__(self):
        return f"{self.tipo} - {self.monto} ({self.metodo_pago})"
