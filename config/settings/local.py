"""
config/settings/local.py
────────────────────────────────────────────────────────────────
Overrides para desarrollo local.
Activa debug toolbar y logging detallado.
"""
from .base import *  # noqa: F401, F403

DEBUG = True

# ─── Django Debug Toolbar ─────────────────────────────────────
import sys
IS_RUNNING_TESTS = 'test' in sys.argv

if not IS_RUNNING_TESTS:
    INSTALLED_APPS += ["debug_toolbar"]  # noqa: F405
    MIDDLEWARE += ["debug_toolbar.middleware.DebugToolbarMiddleware"]  # noqa: F405
    INTERNAL_IPS = ["127.0.0.1"]

# ─── Logging detallado para desarrollo ───────────────────────
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "DEBUG",
    },
    "loggers": {
        "django.db.backends": {
            "handlers": ["console"],
            "level": "DEBUG",  # Muestra queries SQL
            "propagate": False,
        },
    },
}

# ─── Email (consola en local) ─────────────────────────────────
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
