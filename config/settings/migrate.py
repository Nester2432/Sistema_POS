"""
config/settings/migrate.py
────────────────────────────────────────────────────────────────
Settings SOLO para generar archivos de migración sin necesitar
una conexión a PostgreSQL activa. Usa SQLite en memoria.

USO EXCLUSIVO: python manage.py makemigrations
NO usar para correr el servidor.
"""
from .base import *  # noqa

# Sobrescribir SOLO la BD con SQLite en memoria
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

# Permitir testserver para el cliente de pruebas de Django
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "testserver"]

# Desactivar debug toolbar para esta config
INSTALLED_APPS = [app for app in INSTALLED_APPS if app != "debug_toolbar"]
MIDDLEWARE = [m for m in MIDDLEWARE if "debug_toolbar" not in m]
