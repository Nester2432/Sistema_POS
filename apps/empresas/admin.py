"""
apps/empresas/admin.py
────────────────────────────────────────────────────────────────
Registro de Empresa en el admin de Django.
"""
from django.contrib import admin
from .models import Empresa


@admin.register(Empresa)
class EmpresaAdmin(admin.ModelAdmin):
    list_display = ["nombre", "tipo_documento", "documento_fiscal", "plan", "activo", "created_at"]
    list_filter = ["plan", "activo", "tipo_documento"]
    search_fields = ["nombre", "documento_fiscal", "email_contacto"]
    readonly_fields = ["id", "slug", "created_at", "updated_at"]
    fieldsets = (
        ("Información principal", {
            "fields": ("id", "nombre", "slug", "logo")
        }),
        ("Documento fiscal", {
            "fields": ("tipo_documento", "documento_fiscal")
        }),
        ("Contacto", {
            "fields": ("email_contacto", "telefono", "direccion")
        }),
        ("SaaS", {
            "fields": ("plan", "activo", "config")
        }),
        ("Auditoría", {
            "fields": ("created_at", "updated_at", "is_deleted", "deleted_at"),
            "classes": ("collapse",),
        }),
    )
