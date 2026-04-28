"""
modules/inventario/urls.py
"""
from rest_framework.routers import DefaultRouter
from .views import (
    CategoriaViewSet, MarcaViewSet, ProveedorViewSet, 
    ProductoViewSet, MovimientoStockViewSet
)

router = DefaultRouter()
router.register(r'categorias', CategoriaViewSet, basename='categoria')
router.register(r'marcas', MarcaViewSet, basename='marca')
router.register(r'proveedores', ProveedorViewSet, basename='proveedor')
router.register(r'productos', ProductoViewSet, basename='producto')
router.register(r'movimientos', MovimientoStockViewSet, basename='movimiento-stock')

urlpatterns = router.urls
