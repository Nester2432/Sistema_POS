"""
modules/inventario/models.py
────────────────────────────────────────────────────────────────
Modelos del módulo de Inventario.
Todos heredan de TenantModel para aislamiento multiempresa y soft delete.
"""
from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal

from core.models import TenantModel


class Categoria(TenantModel):
    nombre = models.CharField(max_length=100, verbose_name="Nombre")
    descripcion = models.TextField(blank=True, verbose_name="Descripción")

    class Meta(TenantModel.Meta):
        verbose_name = "Categoría"
        verbose_name_plural = "Categorías"
        unique_together = ("empresa", "nombre")

    def __str__(self):
        return self.nombre


class Marca(TenantModel):
    nombre = models.CharField(max_length=100, verbose_name="Nombre")

    class Meta(TenantModel.Meta):
        verbose_name = "Marca"
        verbose_name_plural = "Marcas"
        unique_together = ("empresa", "nombre")

    def __str__(self):
        return self.nombre


class Proveedor(TenantModel):
    nombre = models.CharField(max_length=200, verbose_name="Razón Social / Nombre")
    documento = models.CharField(max_length=20, blank=True, verbose_name="RUC / NIT / DNI")
    email = models.EmailField(blank=True, verbose_name="Email")
    telefono = models.CharField(max_length=20, blank=True, verbose_name="Teléfono")
    direccion = models.TextField(blank=True, verbose_name="Dirección")

    class Meta(TenantModel.Meta):
        verbose_name = "Proveedor"
        verbose_name_plural = "Proveedores"
        unique_together = ("empresa", "documento")

    def __str__(self):
        return self.nombre


class UnidadMedida(models.TextChoices):
    UNIDAD = "UND", "Unidad"
    KILO = "KG", "Kilogramo"
    LITRO = "LT", "Litro"
    METRO = "MT", "Metro"
    CAJA = "CJ", "Caja"


class Producto(TenantModel):
    categoria = models.ForeignKey(Categoria, on_delete=models.PROTECT, related_name="productos", null=True, blank=True)
    marca = models.ForeignKey(Marca, on_delete=models.PROTECT, related_name="productos", null=True, blank=True)
    proveedor = models.ForeignKey(Proveedor, on_delete=models.PROTECT, related_name="productos", null=True, blank=True)
    
    nombre = models.CharField(max_length=255, db_index=True, verbose_name="Nombre del producto")
    descripcion = models.TextField(blank=True, verbose_name="Descripción")
    sku = models.CharField(max_length=50, db_index=True, blank=True, verbose_name="SKU / Código interno")
    codigo_barras = models.CharField(max_length=100, db_index=True, blank=True, null=True, verbose_name="Código de barras")
    
    precio_costo = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"), validators=[MinValueValidator(Decimal("0.00"))])
    precio_venta = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"), validators=[MinValueValidator(Decimal("0.00"))])
    margen_ganancia = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("0.00"), help_text="Calculado automáticamente %")
    
    stock_actual = models.DecimalField(max_digits=12, decimal_places=3, default=Decimal("0.00"))
    stock_minimo = models.DecimalField(max_digits=12, decimal_places=3, default=Decimal("0.00"))
    
    unidad_medida = models.CharField(max_length=10, choices=UnidadMedida.choices, default=UnidadMedida.UNIDAD)
    activo = models.BooleanField(default=True)
    imagen = models.ImageField(upload_to="productos/", null=True, blank=True)

    class Meta(TenantModel.Meta):
        verbose_name = "Producto"
        verbose_name_plural = "Productos"
        unique_together = [("empresa", "sku"), ("empresa", "codigo_barras")]

    def __str__(self):
        return f"{self.nombre} ({self.sku})"

    def save(self, *args, **kwargs):
        # Cálculo simple de margen si hay precio_costo y precio_venta
        if self.precio_costo > 0:
            utilidad = self.precio_venta - self.precio_costo
            self.margen_ganancia = (utilidad / self.precio_costo) * 100
        super().save(*args, **kwargs)


class TipoMovimiento(models.TextChoices):
    INGRESO = "INGRESO", "Ingreso de Mercadería"
    EGRESO = "EGRESO", "Egreso / Venta"
    AJUSTE = "AJUSTE", "Ajuste de Inventario"
    TRANSFERENCIA = "TRANSFERENCIA", "Transferencia entre almacenes"


class MovimientoStock(TenantModel):
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name="movimientos")
    tipo = models.CharField(max_length=20, choices=TipoMovimiento.choices)
    cantidad = models.DecimalField(max_digits=12, decimal_places=3)
    stock_anterior = models.DecimalField(max_digits=12, decimal_places=3)
    stock_nuevo = models.DecimalField(max_digits=12, decimal_places=3)
    motivo = models.TextField(blank=True)
    usuario = models.ForeignKey("usuarios.Usuario", on_delete=models.PROTECT)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta(TenantModel.Meta):
        verbose_name = "Movimiento de Stock"
        verbose_name_plural = "Movimientos de Stock"
        ordering = ["-fecha"]
