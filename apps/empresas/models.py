"""
apps/empresas/models.py
────────────────────────────────────────────────────────────────
Modelo Empresa: el tenant raíz del sistema SaaS.
Cada empresa es un tenant completamente aislado a nivel de BD.
"""
from django.db import models
from django.utils.text import slugify

from core.models import BaseModel


class TipoDocumentoChoices(models.TextChoices):
    """Tipos de documento fiscal según país."""
    RUC  = "ruc",  "RUC (Perú)"
    NIT  = "nit",  "NIT (Colombia)"
    CUIT = "cuit", "CUIT (Argentina)"
    RFC  = "rfc",  "RFC (México)"
    RUT  = "rut",  "RUT (Chile)"
    CI   = "ci",   "Cédula / CI"


class PlanChoices(models.TextChoices):
    BASICO      = "basico",      "Básico"
    PROFESIONAL = "profesional", "Profesional"
    ENTERPRISE  = "enterprise",  "Enterprise"


class Empresa(BaseModel):
    """
    Tenant principal del sistema POS SaaS.

    Campos:
        nombre              Nombre comercial
        slug                URL-friendly, único, auto-generado
        tipo_documento      Tipo de identificación fiscal (RUC, NIT, CUIT...)
        documento_fiscal    Número del documento fiscal (único por tipo)
        email_contacto      Email principal de la empresa
        telefono            Teléfono de contacto
        direccion           Dirección física
        logo                Logo de la empresa
        plan                Plan de suscripción SaaS
        activo              Si puede operar (desactivar = suspender tenant)
        config              JSON con configuración específica del tenant
    """

    nombre = models.CharField(
        max_length=200,
        verbose_name="Nombre de la empresa",
    )
    slug = models.SlugField(
        max_length=220,
        unique=True,
        blank=True,
        verbose_name="Slug",
    )
    tipo_documento = models.CharField(
        max_length=10,
        choices=TipoDocumentoChoices.choices,
        default=TipoDocumentoChoices.RUC,
        verbose_name="Tipo de documento fiscal",
    )
    documento_fiscal = models.CharField(
        max_length=20,
        unique=True,
        verbose_name="Documento fiscal",
        help_text="RUC, NIT, CUIT, RFC o RUT según el país.",
    )
    email_contacto = models.EmailField(
        verbose_name="Email de contacto",
    )
    telefono = models.CharField(
        max_length=20,
        blank=True,
        verbose_name="Teléfono",
    )
    direccion = models.TextField(
        blank=True,
        verbose_name="Dirección",
    )
    logo = models.ImageField(
        upload_to="empresas/logos/",
        null=True,
        blank=True,
        verbose_name="Logo",
    )
    plan = models.CharField(
        max_length=20,
        choices=PlanChoices.choices,
        default=PlanChoices.BASICO,
        verbose_name="Plan",
    )
    activo = models.BooleanField(
        default=True,
        verbose_name="Activo",
        help_text="Desactivar suspende el acceso de toda la empresa.",
    )
    # Configuración JSON por tenant: moneda, impuestos, series de comprobantes, etc.
    config = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Configuración",
    )

    class Meta:
        verbose_name = "Empresa"
        verbose_name_plural = "Empresas"
        ordering = ["nombre"]
        constraints = [
            models.UniqueConstraint(
                fields=["tipo_documento", "documento_fiscal"],
                name="unique_tipo_documento_fiscal",
            )
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.nombre)
            slug = base_slug
            counter = 1
            while Empresa.objects.with_deleted().filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.nombre} ({self.documento_fiscal})"

    # ─── Propiedades de configuración del tenant ──────────────

    @property
    def moneda(self) -> str:
        return self.config.get("moneda", "PEN")

    @property
    def igv(self) -> float:
        """Porcentaje de IGV/IVA/IVA configurado para este tenant."""
        return self.config.get("igv", 0.18)

    @property
    def es_enterprise(self) -> bool:
        return self.plan == PlanChoices.ENTERPRISE
