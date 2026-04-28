"""
apps/usuarios/managers.py
────────────────────────────────────────────────────────────────
Manager custom para el modelo Usuario.

Necesario porque:
  - Usamos email como USERNAME_FIELD (no username)
  - create_superuser debe manejar empresa=None para superadmins SaaS
  - Hereda de BaseManager para el soft delete
"""
from django.contrib.auth.models import BaseUserManager


class UsuarioManager(BaseUserManager):
    """
    Manager custom para Usuario.
    Reemplaza al UserManager por defecto de Django.
    """

    def create_user(self, email: str, nombre: str, password: str = None, **extra_fields):
        """
        Crea y guarda un usuario normal.

        Args:
            email:      Email (campo de login)
            nombre:     Nombre del usuario
            password:   Contraseña en texto plano (se hashea automáticamente)
            **extra_fields: Campos adicionales (empresa, rol, etc.)
        """
        if not email:
            raise ValueError("El email es obligatorio.")
        if not nombre:
            raise ValueError("El nombre es obligatorio.")

        email = self.normalize_email(email)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)

        user = self.model(email=email, nombre=nombre, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email: str, nombre: str, password: str, **extra_fields):
        """
        Crea un superusuario de plataforma (no pertenece a ninguna empresa).
        Usado con manage.py createsuperuser.
        """
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if not extra_fields.get("is_staff"):
            raise ValueError("El superusuario debe tener is_staff=True.")
        if not extra_fields.get("is_superuser"):
            raise ValueError("El superusuario debe tener is_superuser=True.")

        # Los superusuarios de plataforma no tienen empresa
        extra_fields.setdefault("empresa", None)

        return self.create_user(email, nombre, password, **extra_fields)

    def get_by_natural_key(self, email: str):
        """Lookup por email (requerido por AbstractBaseUser)."""
        return self.get(email=self.model.normalize_username(email))
