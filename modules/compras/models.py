"""
modules/compras/models.py
────────────────────────────────────────────────────────────────
Modelos para la gestión de Compras y Proveedores.
"""
from django.db import models
from decimal import Decimal

from core.models import TenantModel


class CompraEstado(models.TextChoices):
    BORRADOR = "BORRADOR", "Borrador"
    CONFIRMADA = "CONFIRMADA", "Confirmada"
    ANULADA = "ANULADA", "Anulada"


class Compra(TenantModel):
    """
    Cabecera de la Compra (Ingreso de Mercadería).
    """
    proveedor = models.ForeignKey("inventario.Proveedor", on_delete=models.PROTECT, related_name="compras")
    usuario = models.ForeignKey("usuarios.Usuario", on_delete=models.PROTECT, related_name="compras")
    caja = models.ForeignKey("caja.Caja", on_delete=models.SET_NULL, null=True, blank=True)
    
    numero_comprobante = models.CharField(max_length=50, verbose_name="Nro. Factura Proveedor")
    tipo_comprobante = models.CharField(max_length=50, default="FACTURA")
    
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    impuestos = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    
    estado = models.CharField(max_length=20, choices=CompraEstado.choices, default=CompraEstado.BORRADOR)
    metodo_pago = models.CharField(max_length=20, default="EFECTIVO") # EFECTIVO, CUENTA_CORRIENTE
    
    observaciones = models.TextField(blank=True)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta(TenantModel.Meta):
        verbose_name = "Compra"
        verbose_name_plural = "Compras"
        ordering = ["-fecha"]

    def __str__(self):
        return f"Compra {self.numero_comprobante} - {self.proveedor.nombre}"


class CompraItem(TenantModel):
    compra = models.ForeignKey(Compra, on_delete=models.CASCADE, related_name="items")
    producto = models.ForeignKey("inventario.Producto", on_delete=models.PROTECT)
    
    cantidad = models.DecimalField(max_digits=12, decimal_places=3)
    precio_unitario = models.DecimalField(max_digits=12, decimal_places=2, help_text="Costo de compra")
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta(TenantModel.Meta):
        verbose_name = "Ítem de Compra"
        verbose_name_plural = "Ítems de Compra"

    def __str__(self):
        return f"{self.producto.nombre} x {self.cantidad}"


class CuentaCorrienteProveedor(TenantModel):
    """
    Control de deudas de la empresa con sus proveedores.
    """
    proveedor = models.OneToOneField("inventario.Proveedor", on_delete=models.CASCADE, related_name="cuenta_corriente")
    saldo_actual = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"), help_text="Saldo que debemos al proveedor")

    class Meta(TenantModel.Meta):
        verbose_name = "Cuenta Corriente Proveedor"
        verbose_name_plural = "Cuentas Corrientes Proveedores"
