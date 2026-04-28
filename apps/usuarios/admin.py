"""
apps/usuarios/admin.py
────────────────────────────────────────────────────────────────
Registro del Usuario custom en el admin de Django.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import Usuario


@admin.register(Usuario)
class UsuarioAdmin(BaseUserAdmin):
    list_display = ["email", "nombre_completo", "empresa", "rol", "is_active", "created_at"]
    list_filter = ["rol", "is_active", "empresa__plan"]
    search_fields = ["email", "nombre", "apellido"]
    ordering = ["email"]
    readonly_fields = ["id", "created_at", "updated_at", "last_login"]

    # Sobrescribir fieldsets para usar email en vez de username
    fieldsets = (
        ("Credenciales", {
            "fields": ("id", "email", "password")
        }),
        ("Información personal", {
            "fields": ("nombre", "apellido", "telefono", "avatar")
        }),
        ("Empresa y rol", {
            "fields": ("empresa", "rol")
        }),
        ("Permisos", {
            "fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions"),
            "classes": ("collapse",),
        }),
        ("Auditoría", {
            "fields": ("last_login", "created_at", "updated_at", "is_deleted", "deleted_at"),
            "classes": ("collapse",),
        }),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "nombre", "apellido", "empresa", "rol", "password1", "password2"),
        }),
    )

    # Reemplazar username_field para el admin
    filter_horizontal = ["groups", "user_permissions"]
