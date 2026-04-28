"""
modules/caja/urls.py
"""
from rest_framework.routers import DefaultRouter
from .views import CajaViewSet, MovimientoCajaViewSet

router = DefaultRouter()
router.register(r'', CajaViewSet, basename='caja')
router.register(r'movimientos', MovimientoCajaViewSet, basename='movimiento-caja')

urlpatterns = router.urls
