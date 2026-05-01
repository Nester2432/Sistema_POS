"""
modules/sucursales/models.py
────────────────────────────────────────────────────────────────
Modelos para la gestión de múltiples sucursales y stock distribuido.
"""
from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal

from core.models import TenantModel


class Sucursal(TenantModel):
    """
    Representa una sucursal física o almacén de una empresa.
    """
    nombre = models.CharField(max_length=200, verbose_name="Nombre de la sucursal")
    codigo = models.CharField(max_length=50, db_index=True, verbose_name="Código identificador")
    direccion = models.TextField(blank=True, verbose_name="Dirección")
    telefono = models.CharField(max_length=20, blank=True, verbose_name="Teléfono")
    activo = models.BooleanField(default=True, verbose_name="Activo")
    es_principal = models.BooleanField(default=False, verbose_name="Es sucursal principal")

    class Meta(TenantModel.Meta):
        verbose_name = "Sucursal"
        verbose_name_plural = "Sucursales"
        unique_together = ("empresa", "codigo")

    def __str__(self):
        return f"{self.nombre} ({self.codigo})"

    def save(self, *args, **kwargs):
        # Si esta es principal, nos aseguramos que las otras no lo sean
        if self.es_principal:
            Sucursal.objects.for_empresa(self.empresa_id).filter(es_principal=True).exclude(id=self.id).update(es_principal=False)
        super().save(*args, **kwargs)


class StockSucursal(TenantModel):
    """
    Mapeo de inventario por sucursal.
    """
    sucursal = models.ForeignKey(Sucursal, on_delete=models.CASCADE, related_name="inventario")
    producto = models.ForeignKey("inventario.Producto", on_delete=models.CASCADE, related_name="stocks_sucursales")
    variante = models.ForeignKey("variantes.ProductoVariante", on_delete=models.CASCADE, related_name="stocks_sucursales", null=True, blank=True)
    
    stock_actual = models.DecimalField(
        max_digits=12, 
        decimal_places=3, 
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))]
    )
    stock_minimo = models.DecimalField(
        max_digits=12, 
        decimal_places=3, 
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))]
    )
    ubicacion = models.CharField(max_length=100, blank=True, verbose_name="Ubicación interna (estante/pasillo)")
    activo = models.BooleanField(default=True)

    class Meta(TenantModel.Meta):
        verbose_name = "Stock por Sucursal"
        verbose_name_plural = "Stocks por Sucursal"
        unique_together = ("sucursal", "producto", "variante")

    def __str__(self):
        return f"{self.producto.nombre} en {self.sucursal.nombre}: {self.stock_actual}"
