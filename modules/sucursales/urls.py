from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SucursalViewSet, StockSucursalViewSet

router = DefaultRouter()
router.register(r'sucursales', SucursalViewSet, basename='sucursales')
router.register(r'stock', StockSucursalViewSet, basename='stock-sucursales')

urlpatterns = [
    path('', include(router.urls)),
]
