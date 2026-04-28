"""
apps/empresas/urls.py
────────────────────────────────────────────────────────────────
Router para EmpresaViewSet.
Las URLs se registran en config/urls.py con include().
"""
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"", views.EmpresaViewSet, basename="empresa")

app_name = "empresas"
urlpatterns = router.urls
