from django.db import models
from django.core.exceptions import ValidationError
from django.db.models import F, Q
from decimal import Decimal

from core.models import TenantModel
from modules.sucursales.models import Sucursal
from apps.usuarios.models import Usuario
from modules.inventario.models import Producto

class EstadoTransferencia(models.TextChoices):
    BORRADOR = "BORRADOR", "Borrador"
    CONFIRMADA = "CONFIRMADA", "Confirmada"
    CANCELADA = "CANCELADA", "Cancelada"

class TransferenciaStock(TenantModel):
    numero_transferencia = models.CharField(max_length=50, blank=True, null=True, help_text="Autogenerado: TR-000001")
    sucursal_origen = models.ForeignKey(Sucursal, on_delete=models.PROTECT, related_name="transferencias_salida")
    sucursal_destino = models.ForeignKey(Sucursal, on_delete=models.PROTECT, related_name="transferencias_entrada")
    usuario = models.ForeignKey(Usuario, on_delete=models.PROTECT)
    estado = models.CharField(max_length=15, choices=EstadoTransferencia.choices, default=EstadoTransferencia.BORRADOR)
    observaciones = models.TextField(blank=True)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta(TenantModel.Meta):
        verbose_name = "Transferencia de Stock"
        verbose_name_plural = "Transferencias de Stock"
        constraints = [
            models.CheckConstraint(
                check=~Q(sucursal_origen=F('sucursal_destino')),
                name='transferencia_distinta_sucursal'
            ),
            models.UniqueConstraint(
                fields=['empresa', 'numero_transferencia'],
                name='unique_numero_transferencia_empresa'
            )
        ]

    def __str__(self):
        return f"{self.numero_transferencia or 'TR-DRAFT'} ({self.sucursal_origen.nombre} -> {self.sucursal_destino.nombre})"

    def clean(self):
        # Evitar origen == destino
        if self.sucursal_origen == self.sucursal_destino:
            raise ValidationError("La sucursal de origen no puede ser la misma que la de destino.")

        # Cross-tenant validation
        if self.sucursal_origen.empresa_id != self.empresa_id:
            raise ValidationError("La sucursal de origen no pertenece a la misma empresa.")
            
        if self.sucursal_destino.empresa_id != self.empresa_id:
            raise ValidationError("La sucursal de destino no pertenece a la misma empresa.")

    def save(self, *args, **kwargs):
        self.clean()
        if not self.numero_transferencia and self.estado == EstadoTransferencia.CONFIRMADA:
            # Generar numero_transferencia correlativo al confirmar, o desde antes si es necesario
            ultima = TransferenciaStock.objects.filter(empresa=self.empresa).exclude(numero_transferencia__isnull=True).order_by('-created_at').first()
            if ultima and ultima.numero_transferencia:
                try:
                    num = int(ultima.numero_transferencia.split('-')[1]) + 1
                except:
                    num = 1
            else:
                num = 1
            self.numero_transferencia = f"TR-{str(num).zfill(6)}"
        super().save(*args, **kwargs)

class TransferenciaItem(TenantModel):
    transferencia = models.ForeignKey(TransferenciaStock, on_delete=models.CASCADE, related_name="items")
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    variante = models.ForeignKey("variantes.ProductoVariante", on_delete=models.PROTECT, null=True, blank=True)
    cantidad = models.DecimalField(max_digits=12, decimal_places=3)

    class Meta(TenantModel.Meta):
        verbose_name = "Item de Transferencia"
        verbose_name_plural = "Items de Transferencia"
        unique_together = ('transferencia', 'producto', 'variante')

    def __str__(self):
        return f"{self.cantidad}x {self.producto.nombre}"

    def clean(self):
        if self.cantidad <= 0:
            raise ValidationError("La cantidad a transferir debe ser mayor a 0.")
        if self.producto.empresa_id != self.empresa_id:
            raise ValidationError("El producto no pertenece a la empresa de la transferencia.")
