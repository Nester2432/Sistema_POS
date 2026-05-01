from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AtributoViewSet, ValorAtributoViewSet, ProductoVarianteViewSet

router = DefaultRouter()
router.register(r'atributos', AtributoViewSet, basename='atributo')
router.register(r'valores', ValorAtributoViewSet, basename='valor-atributo')
router.register(r'variantes', ProductoVarianteViewSet, basename='producto-variante')

urlpatterns = [
    path('', include(router.urls)),
]
