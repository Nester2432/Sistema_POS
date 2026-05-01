"""
modules/ventas/models.py
────────────────────────────────────────────────────────────────
Modelos para la gestión de Ventas y Detalles de Venta.
"""
from django.db import models
from decimal import Decimal

from core.models import TenantModel


class TipoComprobante(models.TextChoices):
    TICKET = "TICKET", "Ticket de Venta"
    FACTURA_A = "FACTURA_A", "Factura A"
    FACTURA_B = "FACTURA_B", "Factura B"
    FACTURA_C = "FACTURA_C", "Factura C"


class VentaEstado(models.TextChoices):
    BORRADOR = "BORRADOR", "Borrador"
    CONFIRMADA = "CONFIRMADA", "Confirmada"
    ANULADA = "ANULADA", "Anulada"


class Venta(TenantModel):
    """
    Cabecera de la Venta (Comprobante).
    """
    caja = models.ForeignKey("caja.Caja", on_delete=models.PROTECT, related_name="ventas")
    usuario = models.ForeignKey("usuarios.Usuario", on_delete=models.PROTECT, related_name="ventas")
    
    # Cliente (opcional para tickets anónimos)
    cliente = models.ForeignKey("clientes.Cliente", on_delete=models.PROTECT, related_name="ventas", null=True, blank=True)
    cliente_nombre = models.CharField(max_length=255, default="Consumidor Final")
    cliente_documento = models.CharField(max_length=20, blank=True)
    
    numero_comprobante = models.CharField(max_length=50, db_index=True)
    tipo_comprobante = models.CharField(max_length=20, choices=TipoComprobante.choices, default=TipoComprobante.TICKET)
    
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    descuento_total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    impuestos = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    
    estado = models.CharField(max_length=20, choices=VentaEstado.choices, default=VentaEstado.BORRADOR)
    
    # Campo Legacy: se mantiene por compatibilidad, pero los pagos ahora están en VentaPago
    # Si hay un solo pago, coincide con VentaPago.metodo_pago. Si hay varios, será "MIXTO".
    metodo_pago = models.CharField(max_length=20, default="EFECTIVO", null=True, blank=True)
    
    observaciones = models.TextField(blank=True)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta(TenantModel.Meta):
        verbose_name = "Venta"
        verbose_name_plural = "Ventas"
        unique_together = ("empresa", "numero_comprobante")
        ordering = ["-fecha"]

    def __str__(self):
        return f"{self.numero_comprobante} - {self.total}"


class VentaItem(TenantModel):
    """
    Detalle de cada producto vendido.
    """
    venta = models.ForeignKey(Venta, on_delete=models.CASCADE, related_name="items")
    producto = models.ForeignKey("inventario.Producto", on_delete=models.PROTECT)
    variante = models.ForeignKey("variantes.ProductoVariante", on_delete=models.PROTECT, null=True, blank=True)
    
    cantidad = models.DecimalField(max_digits=12, decimal_places=3)
    precio_unitario = models.DecimalField(max_digits=12, decimal_places=2)
    descuento = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta(TenantModel.Meta):
        verbose_name = "Ítem de Venta"
        verbose_name_plural = "Ítems de Venta"

    def __str__(self):
        return f"{self.producto.nombre} x {self.cantidad}"


class VentaPago(TenantModel):
    """
    Representa un pago parcial o total de una venta.
    """
    venta = models.ForeignKey(Venta, on_delete=models.CASCADE, related_name="pagos")
    metodo_pago = models.CharField(max_length=20, default="EFECTIVO")
    monto = models.DecimalField(max_digits=12, decimal_places=2)
    referencia = models.CharField(max_length=100, blank=True, help_text="Nro de cupón, transf, etc.")
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta(TenantModel.Meta):
        verbose_name = "Pago de Venta"
        verbose_name_plural = "Pagos de Venta"
        ordering = ["fecha"]

    def __str__(self):
        return f"{self.metodo_pago}: {self.monto}"
