"""
modules/caja/apps.py
"""
from django.apps import AppConfig


class CajaConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "modules.caja"
    verbose_name = "Caja y Finanzas"
