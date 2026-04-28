"""
apps/usuarios/urls.py
────────────────────────────────────────────────────────────────
Router para UsuarioViewSet + rutas manuales de auth.
"""
from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

# ─── Router para UsuarioViewSet ───────────────────────────────
router = DefaultRouter()
router.register(r"usuarios", views.UsuarioViewSet, basename="usuario")

app_name = "auth"

urlpatterns = [
    # ─── Auth (rutas manuales) ────────────────────────────────
    path("login/",            views.LoginView.as_view(),          name="login"),
    path("refresh/",          views.RefreshView.as_view(),        name="refresh"),
    path("logout/",           views.LogoutView.as_view(),         name="logout"),
    path("me/",               views.MeView.as_view(),             name="me"),
    path("cambiar-password/", views.CambiarPasswordView.as_view(), name="cambiar-password"),

    # ─── UsuarioViewSet (CRUD + cambiar-rol) ──────────────────
    *router.urls,
]
