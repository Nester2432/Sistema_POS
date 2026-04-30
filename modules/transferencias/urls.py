from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TransferenciaStockViewSet

router = DefaultRouter()
router.register(r'', TransferenciaStockViewSet, basename='transferencias')

urlpatterns = [
    path('', include(router.urls)),
]
