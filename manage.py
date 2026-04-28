#!/usr/bin/env python
"""
manage.py
────────────────────────────────────────────────────────────────
Entry point de Django. Lee DJANGO_SETTINGS_MODULE del entorno.
En desarrollo debe estar seteado a config.settings.local en el .env
"""
import os
import sys


def main():
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "No se puede importar Django. Asegúrate de que esté instalado "
            "y disponible en el entorno virtual activo."
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
