"""
core/managers.py
────────────────────────────────────────────────────────────────
Managers personalizados para todos los modelos del sistema.

Jerarquía:
  BaseQuerySet          → métodos activos/deleted/with_deleted
  SoftDeleteManager     → manager por defecto, excluye soft-deleted
  EmpresaScopedManager  → multiempresa, filtra por empresa del request

Thread-local:
  Usado SOLO como apoyo interno para que los managers accedan a la
  empresa cuando no tienen acceso al request (ej: signals, tasks).
  La fuente primaria es request.user.empresa_id (verificado en permisos).

Uso en modelos:
    class MiModelo(TenantModel):
        # EmpresaScopedManager ya viene de TenantModel
        pass

    class MiModeloSimple(BaseModel):
        objects = SoftDeleteManager()
"""
import threading
import logging

from django.db import models

logger = logging.getLogger(__name__)

# ─── Thread-local (apoyo interno) ────────────────────────────
# Seteado por EmpresaMiddleware. Usar SOLO cuando no se tenga
# acceso al request (ej: managers, signals, celery tasks).
_thread_local = threading.local()


def set_current_empresa(empresa_id) -> None:
    """Llamado por EmpresaMiddleware al inicio de cada request."""
    _thread_local.empresa_id = empresa_id


def get_current_empresa_id():
    """Retorna el empresa_id del request actual (thread-safe)."""
    return getattr(_thread_local, "empresa_id", None)


# ─── QuerySets ────────────────────────────────────────────────

class BaseQuerySet(models.QuerySet):
    """
    QuerySet base con helpers de soft delete.
    Todos los querysets del sistema heredan de aquí.
    """

    def active(self):
        """Registros NO eliminados (comportamiento por defecto)."""
        return self.filter(is_deleted=False)

    def only_deleted(self):
        """Registros SOLO eliminados (útil para auditoría y papelera)."""
        return self.filter(is_deleted=True)

    def with_deleted(self):
        """TODOS los registros: activos + eliminados."""
        return self.all()


class EmpresaScopedQuerySet(BaseQuerySet):
    """
    QuerySet que filtra por empresa.
    Fail-safe: si no hay empresa en contexto → retorna none().
    """

    def for_empresa(self, empresa_id=None):
        """
        Filtra por empresa_id.
        Si no se pasa explícito, usa el thread-local (del middleware).
        """
        eid = empresa_id or get_current_empresa_id()
        if eid is None:
            logger.warning(
                "EmpresaScopedQuerySet.for_empresa() sin empresa_id en contexto. "
                "Retornando none() por seguridad."
            )
            return self.none()
        return self.filter(empresa_id=eid)

    def active_for_empresa(self, empresa_id=None):
        """Atajo: registros activos de la empresa actual."""
        return self.for_empresa(empresa_id).active()


# ─── Managers ─────────────────────────────────────────────────

class SoftDeleteManager(models.Manager):
    """
    Manager base con soft delete.
    Por defecto excluye registros eliminados.

    Úsalo en modelos SIN empresa (ej: el modelo Empresa mismo).
    """

    def get_queryset(self) -> BaseQuerySet:
        return BaseQuerySet(self.model, using=self._db).active()

    def with_deleted(self) -> BaseQuerySet:
        """Accede a TODOS los registros (incluyendo soft-deleted)."""
        return BaseQuerySet(self.model, using=self._db)

    def only_deleted(self) -> BaseQuerySet:
        """Accede SOLO a registros eliminados."""
        return BaseQuerySet(self.model, using=self._db).only_deleted()


class EmpresaScopedManager(models.Manager):
    """
    Manager multiempresa con soft delete.
    
    Filtra automáticamente por:
      1. is_deleted=False (soft delete)
      2. empresa_id del thread-local (seteado por EmpresaMiddleware)
    
    La seguridad a nivel de request.user es responsabilidad de los
    permisos DRF (IsEmpresaUser, IsEmpresaAdmin). Este manager
    es la segunda línea de defensa.
    
    Úsalo en todos los modelos que hereden de TenantModel.
    """

    def get_queryset(self) -> EmpresaScopedQuerySet:
        return EmpresaScopedQuerySet(self.model, using=self._db).active()

    def for_empresa(self, empresa_id=None) -> EmpresaScopedQuerySet:
        """Filtra por empresa específica."""
        return self.get_queryset().for_empresa(empresa_id)

    def with_deleted(self) -> EmpresaScopedQuerySet:
        """Todos los registros de TODAS las empresas (incluyendo deleted)."""
        return EmpresaScopedQuerySet(self.model, using=self._db)

    def only_deleted(self) -> EmpresaScopedQuerySet:
        """Solo registros eliminados de la empresa actual."""
        return EmpresaScopedQuerySet(self.model, using=self._db).only_deleted()

    def all_for_empresa(self, empresa_id=None) -> EmpresaScopedQuerySet:
        """Todos los registros de la empresa (activos + deleted)."""
        return self.with_deleted().for_empresa(empresa_id)
