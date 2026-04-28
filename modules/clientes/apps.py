"""
modules/clientes/apps.py
"""
from django.apps import AppConfig


class ClientesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "modules.clientes"
    verbose_name = "CRM y Clientes"
