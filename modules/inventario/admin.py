"""
modules/inventario/admin.py
"""
from django.contrib import admin
from .models import Categoria, Marca, Proveedor, Producto, MovimientoStock

@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ["nombre", "empresa", "created_at"]
    list_filter = ["empresa"]

@admin.register(Marca)
class MarcaAdmin(admin.ModelAdmin):
    list_display = ["nombre", "empresa"]
    list_filter = ["empresa"]

@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = ["nombre", "documento", "empresa"]
    list_filter = ["empresa"]

@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ["nombre", "sku", "stock_actual", "precio_venta", "empresa", "activo"]
    list_filter = ["empresa", "activo", "categoria", "marca"]
    search_fields = ["nombre", "sku", "codigo_barras"]

@admin.register(MovimientoStock)
class MovimientoStockAdmin(admin.ModelAdmin):
    list_display = ["producto", "tipo", "cantidad", "stock_nuevo", "usuario", "fecha"]
    list_filter = ["tipo", "fecha", "empresa"]
    readonly_fields = ["stock_anterior", "stock_nuevo", "fecha"]
