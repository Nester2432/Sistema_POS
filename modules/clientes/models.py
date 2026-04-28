"""
modules/clientes/models.py
────────────────────────────────────────────────────────────────
Modelos para la gestión de Clientes y su Cuenta Corriente.
"""
from django.db import models
from decimal import Decimal

from core.models import TenantModel


class Cliente(TenantModel):
    """
    Datos del Cliente (B2B o B2C).
    """
    nombre = models.CharField(max_length=150, verbose_name="Nombre")
    apellido = models.CharField(max_length=150, blank=True, verbose_name="Apellido")
    razon_social = models.CharField(max_length=255, blank=True, verbose_name="Razón Social")
    
    tipo_documento = models.CharField(max_length=10, default="DNI")
    documento = models.CharField(max_length=20, db_index=True, verbose_name="Nro. Documento")
    
    email = models.EmailField(blank=True)
    telefono = models.CharField(max_length=20, blank=True)
    direccion = models.TextField(blank=True)
    localidad = models.CharField(max_length=100, blank=True)
    provincia = models.CharField(max_length=100, blank=True)
    
    activo = models.BooleanField(default=True)
    observaciones = models.TextField(blank=True)

    class Meta(TenantModel.Meta):
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"
        unique_together = ("empresa", "documento")
        ordering = ["nombre", "apellido"]

    def __str__(self):
        return f"{self.nombre_completo} ({self.documento})"

    @property
    def nombre_completo(self) -> str:
        if self.razon_social:
            return self.razon_social
        return f"{self.nombre} {self.apellido}".strip()


class CuentaCorriente(TenantModel):
    """
    Estado financiero del cliente con la empresa.
    """
    cliente = models.OneToOneField(Cliente, on_delete=models.CASCADE, related_name="cuenta_corriente")
    saldo_actual = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"), help_text="Positivo: deuda del cliente. Negativo: saldo a favor.")
    limite_credito = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    activa = models.BooleanField(default=True)

    class Meta(TenantModel.Meta):
        verbose_name = "Cuenta Corriente"
        verbose_name_plural = "Cuentas Corrientes"

    def __str__(self):
        return f"CC {self.cliente.nombre_completo} - Saldo: {self.saldo_actual}"


class TipoMovimientoCC(models.TextChoices):
    DEBITO = "DEBITO", "Débito (Deuda / Venta)"
    CREDITO = "CREDITO", "Crédito (Pago / Abono)"
    AJUSTE = "AJUSTE", "Ajuste manual"


class MovimientoCuentaCorriente(TenantModel):
    cuenta = models.ForeignKey(CuentaCorriente, on_delete=models.CASCADE, related_name="movimientos")
    tipo = models.CharField(max_length=10, choices=TipoMovimientoCC.choices)
    concepto = models.CharField(max_length=255)
    monto = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Referencias opcionales
    venta = models.ForeignKey("ventas.Venta", on_delete=models.SET_NULL, null=True, blank=True)
    caja = models.ForeignKey("caja.Caja", on_delete=models.SET_NULL, null=True, blank=True)
    
    usuario = models.ForeignKey("usuarios.Usuario", on_delete=models.PROTECT)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta(TenantModel.Meta):
        verbose_name = "Movimiento de Cuenta Corriente"
        verbose_name_plural = "Movimientos de Cuenta Corriente"
        ordering = ["-fecha"]

    def __str__(self):
        return f"{self.tipo} - {self.monto} ({self.concepto})"
