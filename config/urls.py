"""
config/urls.py
────────────────────────────────────────────────────────────────
Enrutador principal. Prefija todas las APIs con /api/v1/.
"""
from django.contrib import admin
from django.urls import path, include
from apps.empresas.views_demo import reset_demo
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),

    # ─── Auth / Usuarios ──────────────────────────────────────
    path("api/v1/auth/", include("apps.usuarios.urls", namespace="auth")),
    path("api/v1/demo/reset/", reset_demo, name="reset-demo"),

    # ─── Empresas ─────────────────────────────────────────────
    path("api/v1/empresas/", include("apps.empresas.urls", namespace="empresas")),

    # ─── Inventario ───────────────────────────────────────────
    path("api/v1/inventario/", include("modules.inventario.urls")),

    # ─── Caja ─────────────────────────────────────────────────
    path("api/v1/caja/", include("modules.caja.urls")),

    # ─── Ventas ───────────────────────────────────────────────
    path("api/v1/ventas/", include("modules.ventas.urls")),

    # ─── Clientes ─────────────────────────────────────────────
    path("api/v1/clientes/", include("modules.clientes.urls")),

    # ─── Reportes ─────────────────────────────────────────────
    path("api/v1/reportes/", include("modules.reportes.urls")),

    # ─── Compras ──────────────────────────────────────────────
    path("api/v1/compras/", include("modules.compras.urls")),
]

# ─── Debug Toolbar (solo en local) ────────────────────────────
if settings.DEBUG:
    import debug_toolbar
    urlpatterns = [
        path("__debug__/", include(debug_toolbar.urls)),
    ] + urlpatterns
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
