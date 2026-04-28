"""
modules/reportes/urls.py
"""
from rest_framework.routers import DefaultRouter
from .views import ReporteViewSet, VentaReporteViewSet

router = DefaultRouter()
router.register(r'', ReporteViewSet, basename='reporte')
# Registramos este router para colgarlo en /api/v1/ventas/ si quisiéramos, 
# pero por ahora lo dejamos en /api/v1/reportes/ventas-pdf/ o similar
router.register(r'ventas-pdf', VentaReporteViewSet, basename='venta-pdf')

urlpatterns = router.urls
