"""
core/models.py
────────────────────────────────────────────────────────────────
Modelos abstractos base del sistema. TODOS los modelos deben
heredar de BaseModel o TenantModel.

BaseModel:
  - UUID primary key (no predecible, seguro para APIs públicas)
  - Timestamps automáticos
  - Soft delete con soft_delete() y restore()
  - Manager: SoftDeleteManager

TenantModel (hereda BaseModel):
  - FK obligatoria a Empresa (multitenancy row-level)
  - Manager: EmpresaScopedManager (filtra por empresa automáticamente)
  - Todos los modelos de negocio DEBEN heredar de TenantModel
"""
import uuid
from django.db import models
from django.utils import timezone

from core.managers import SoftDeleteManager, EmpresaScopedManager


class BaseModel(models.Model):
    """
    Modelo abstracto base para todos los modelos del sistema.

    Campos:
        id          UUID primary key (autogenerado, no editable)
        created_at  Timestamp de creación (automático, inmutable)
        updated_at  Timestamp de última modificación (automático)
        is_deleted  Flag de soft delete
        deleted_at  Cuándo fue eliminado (null si activo)
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        verbose_name="ID",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Creado el",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Modificado el",
    )
    is_deleted = models.BooleanField(
        default=False,
        verbose_name="Eliminado",
        db_index=True,
    )
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Eliminado el",
    )

    # Manager por defecto (excluye soft-deleted automáticamente)
    objects = SoftDeleteManager()

    class Meta:
        abstract = True
        ordering = ["-created_at"]

    def soft_delete(self, commit: bool = True) -> None:
        """
        Marca el registro como eliminado sin borrarlo de la BD.
        Siempre usar en lugar de .delete() para preservar la auditoría.
        """
        self.is_deleted = True
        self.deleted_at = timezone.now()
        if commit:
            self.save(update_fields=["is_deleted", "deleted_at", "updated_at"])

    def restore(self, commit: bool = True) -> None:
        """Restaura un registro eliminado con soft delete."""
        self.is_deleted = False
        self.deleted_at = None
        if commit:
            self.save(update_fields=["is_deleted", "deleted_at", "updated_at"])

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__} id={self.id}>"


class TenantModel(BaseModel):
    """
    Modelo abstracto para TODOS los modelos de negocio del POS.

    Agrega sobre BaseModel:
        empresa     FK obligatoria a Empresa (multitenancy)
        objects     EmpresaScopedManager (auto-filtra por empresa del request)

    Todos los módulos (Producto, Venta, Cliente, Caja, etc.)
    DEBEN heredar de TenantModel.

    Ejemplo:
        class Producto(TenantModel):
            nombre = models.CharField(max_length=200)
            # empresa, soft_delete, timestamps → vienen automáticamente
    """

    empresa = models.ForeignKey(
        "empresas.Empresa",
        on_delete=models.PROTECT,
        related_name="%(app_label)s_%(class)s_set",
        verbose_name="Empresa",
        db_index=True,
    )

    # Manager multiempresa (filtra por empresa del thread-local)
    objects = EmpresaScopedManager()

    class Meta(BaseModel.Meta):
        abstract = True
