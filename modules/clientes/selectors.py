"""
modules/clientes/selectors.py
────────────────────────────────────────────────────────────────
Consultas para Clientes y Cuenta Corriente.
"""
from django.db.models import QuerySet, Q
from .models import Cliente, MovimientoCuentaCorriente

def buscar_clientes(empresa_id, query: str) -> QuerySet:
    """Busca por nombre, apellido, razón social, documento o teléfono."""
    return Cliente.objects.for_empresa(empresa_id).filter(
        Q(nombre__icontains=query) |
        Q(apellido__icontains=query) |
        Q(razon_social__icontains=query) |
        Q(documento__icontains=query) |
        Q(telefono__icontains=query)
    )

def get_clientes_con_deuda(empresa_id) -> QuerySet:
    """Retorna clientes cuyo saldo en CC > 0."""
    return Cliente.objects.for_empresa(empresa_id).filter(
        cuenta_corriente__saldo_actual__gt=0
    ).select_related('cuenta_corriente')

def get_historial_cc(cliente_id, empresa_id) -> QuerySet:
    """Historial de débitos y créditos de un cliente."""
    return MovimientoCuentaCorriente.objects.for_empresa(empresa_id).filter(
        cuenta__cliente_id=cliente_id
    ).select_related('usuario', 'venta', 'caja').order_by('-fecha')
