from django.db import models
from core.models import TenantModel
from modules.inventario.models import Producto
from decimal import Decimal

class AtributoProducto(TenantModel):
    nombre = models.CharField(max_length=100)
    activo = models.BooleanField(default=True)

    class Meta(TenantModel.Meta):
        verbose_name = "Atributo de Producto"
        verbose_name_plural = "Atributos de Productos"
        unique_together = ("empresa", "nombre")

    def __str__(self):
        return self.nombre

class ValorAtributoProducto(TenantModel):
    atributo = models.ForeignKey(AtributoProducto, on_delete=models.CASCADE, related_name="valores")
    valor = models.CharField(max_length=100)

    class Meta(TenantModel.Meta):
        verbose_name = "Valor de Atributo"
        verbose_name_plural = "Valores de Atributos"
        unique_together = ("empresa", "atributo", "valor")

    def __str__(self):
        return f"{self.atributo.nombre}: {self.valor}"

class ProductoVariante(TenantModel):
    producto_padre = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name="variantes")
    sku = models.CharField(max_length=100, db_index=True)
    codigo_barras = models.CharField(max_length=100, db_index=True, blank=True, null=True)
    
    precio_costo = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"), help_text="Si es 0, usa el del padre")
    precio_venta = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"), help_text="Si es 0, usa el del padre")
    
    activo = models.BooleanField(default=True)
    valores = models.ManyToManyField(ValorAtributoProducto, through='VarianteValor')

    class Meta(TenantModel.Meta):
        verbose_name = "Variante de Producto"
        verbose_name_plural = "Variantes de Productos"
        unique_together = [("empresa", "sku"), ("empresa", "codigo_barras")]

    def __str__(self):
        vals = ", ".join([str(v.valor) for v in self.valores.all()])
        return f"{self.producto_padre.nombre} ({vals})"

    @property
    def get_precio_venta(self):
        if self.precio_venta > 0:
            return self.precio_venta
        return self.producto_padre.precio_venta

    @property
    def get_precio_costo(self):
        if self.precio_costo > 0:
            return self.precio_costo
        return self.producto_padre.precio_costo

class VarianteValor(models.Model):
    variante = models.ForeignKey(ProductoVariante, on_delete=models.CASCADE)
    atributo = models.ForeignKey(AtributoProducto, on_delete=models.CASCADE)
    valor = models.ForeignKey(ValorAtributoProducto, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("variante", "atributo")

    def __str__(self):
        return f"{self.atributo.nombre}: {self.valor.valor}"
