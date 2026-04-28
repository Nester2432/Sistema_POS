"""
config/asgi.py
────────────────────────────────────────────────────────────────
Punto de entrada ASGI. Preparado para WebSockets/Django Channels
en el futuro (ej: notificaciones en tiempo real para el POS).
"""
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.production")
application = get_asgi_application()
