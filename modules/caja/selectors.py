"""
modules/caja/selectors.py
────────────────────────────────────────────────────────────────
Selectores para reportes y resúmenes de caja.
"""
from django.db.models import Sum, Q
from decimal import Decimal
from .models import Caja, MovimientoCaja, TipoMovimientoCaja, MetodoPago

def get_resumen_caja(caja_id, empresa_id):
    """Retorna un resumen de montos por tipo de movimiento y método de pago."""
    caja = Caja.objects.for_empresa(empresa_id).get(id=caja_id)
    movs = MovimientoCaja.objects.filter(caja=caja)

    resumen = {
        "saldo_inicial": caja.saldo_inicial,
        "total_ingresos": movs.filter(tipo=TipoMovimientoCaja.INGRESO).aggregate(s=Sum('monto'))['s'] or Decimal("0.00"),
        "total_egresos": movs.filter(tipo=TipoMovimientoCaja.EGRESO).aggregate(s=Sum('monto'))['s'] or Decimal("0.00"),
        "total_ventas": movs.filter(tipo=TipoMovimientoCaja.VENTA).aggregate(s=Sum('monto'))['s'] or Decimal("0.00"),
        "por_metodo": {
            metodo[0]: movs.filter(metodo_pago=metodo[0]).aggregate(s=Sum('monto'))['s'] or Decimal("0.00")
            for metodo in MetodoPago.choices
        }
    }
    
    # Saldo neto en efectivo (lo que debería haber físicamente)
    efectivo_ingresos = movs.filter(metodo_pago=MetodoPago.EFECTIVO, tipo__in=[TipoMovimientoCaja.INGRESO, TipoMovimientoCaja.VENTA]).aggregate(s=Sum('monto'))['s'] or Decimal("0.00")
    efectivo_egresos = movs.filter(metodo_pago=MetodoPago.EFECTIVO, tipo__in=[TipoMovimientoCaja.EGRESO, TipoMovimientoCaja.DEVOLUCION]).aggregate(s=Sum('monto'))['s'] or Decimal("0.00")
    
    resumen["efectivo_esperado"] = caja.saldo_inicial + efectivo_ingresos - efectivo_egresos
    
    return resumen
