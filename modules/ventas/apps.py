"""
modules/ventas/apps.py
"""
from django.apps import AppConfig


class VentasConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "modules.ventas"
    verbose_name = "Ventas y POS"
