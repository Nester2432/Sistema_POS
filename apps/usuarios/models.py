"""
apps/usuarios/models.py
────────────────────────────────────────────────────────────────
Usuario custom del sistema POS SaaS.

Características:
  - Email como campo de login (sin username)
  - FK obligatoria a Empresa (multitenancy)
  - Sistema de roles granular por empresa
  - Hereda de BaseModel (UUID pk, soft delete, timestamps)
  - Manager custom (UsuarioManager) para crear usuarios con email

Roles disponibles:
  ADMIN       → Control total de su empresa
  SUPERVISOR  → Supervisión de ventas y reportes
  VENDEDOR    → Crear ventas, ver productos
  CAJERO      → Solo operar la caja POS
  ALMACENERO  → Solo gestión de stock
"""
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models

from core.models import BaseModel
from .managers import UsuarioManager


class RolChoices(models.TextChoices):
    ADMIN       = "admin",      "Administrador"
    SUPERVISOR  = "supervisor", "Supervisor"
    VENDEDOR    = "vendedor",   "Vendedor"
    CAJERO      = "cajero",     "Cajero"
    ALMACENERO  = "almacenero", "Almacenero"


class Usuario(BaseModel, AbstractBaseUser, PermissionsMixin):
    """
    Usuario del sistema POS. Reemplaza al User de Django.

    Configurado en AUTH_USER_MODEL = 'usuarios.Usuario'.

    Herencia múltiple:
      BaseModel           → UUID pk, timestamps, soft delete
      AbstractBaseUser    → password, last_login, is_active
      PermissionsMixin    → groups, user_permissions, is_superuser
    """

    # ─── Empresa (tenant) ─────────────────────────────────────
    empresa = models.ForeignKey(
        "empresas.Empresa",
        on_delete=models.PROTECT,
        related_name="usuarios",
        verbose_name="Empresa",
        null=True,         # null para superusuarios de plataforma
        blank=True,
    )

    # ─── Datos personales ─────────────────────────────────────
    email = models.EmailField(
        unique=True,
        verbose_name="Email",
        help_text="Se usa como nombre de usuario para login.",
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name="Nombre",
    )
    apellido = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Apellido",
    )
    telefono = models.CharField(
        max_length=20,
        blank=True,
        verbose_name="Teléfono",
    )
    avatar = models.ImageField(
        upload_to="usuarios/avatars/",
        null=True,
        blank=True,
        verbose_name="Avatar",
    )

    # ─── Rol y estado ─────────────────────────────────────────
    rol = models.CharField(
        max_length=20,
        choices=RolChoices.choices,
        default=RolChoices.CAJERO,
        verbose_name="Rol",
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Activo",
    )
    is_staff = models.BooleanField(
        default=False,
        verbose_name="Staff (admin Django)",
    )

    # ─── Configuración de AbstractBaseUser ────────────────────
    USERNAME_FIELD = "email"          # Email como campo de login
    REQUIRED_FIELDS = ["nombre"]      # Campos requeridos en createsuperuser

    # Manager custom que usa email en create_user / create_superuser
    objects = UsuarioManager()

    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"
        ordering = ["nombre", "apellido"]
        indexes = [
            models.Index(fields=["empresa", "rol"]),
            models.Index(fields=["email"]),
        ]

    def __str__(self) -> str:
        return f"{self.nombre_completo} <{self.email}>"

    # ─── Propiedades ──────────────────────────────────────────

    @property
    def nombre_completo(self) -> str:
        return f"{self.nombre} {self.apellido}".strip()

    @property
    def es_admin(self) -> bool:
        return self.rol == RolChoices.ADMIN

    @property
    def es_supervisor_o_admin(self) -> bool:
        return self.rol in (RolChoices.ADMIN, RolChoices.SUPERVISOR)

    def tiene_rol(self, *roles: str) -> bool:
        """Verifica si el usuario tiene alguno de los roles dados."""
        return self.rol in roles
