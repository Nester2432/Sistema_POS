"""
modules/compras/apps.py
"""
from django.apps import AppConfig


class ComprasConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "modules.compras"
    verbose_name = "Compras y Abastecimiento"
