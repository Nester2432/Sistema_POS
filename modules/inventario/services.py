"""
modules/inventario/services.py
────────────────────────────────────────────────────────────────
Lógica de negocio para transacciones de inventario.
Asegura atomicidad y validaciones de stock.
"""
from django.db import transaction
from django.core.exceptions import ValidationError
from decimal import Decimal

from .models import Producto, MovimientoStock, TipoMovimiento
from modules.sucursales.models import Sucursal, StockSucursal

@transaction.atomic
def registrar_movimiento_stock(
    producto: Producto,
    tipo: str,
    cantidad: Decimal,
    usuario,
    motivo: str = "",
    sucursal: Sucursal = None
) -> MovimientoStock:
    """
    Registra un movimiento de stock y actualiza el stock actual del producto.
    No permite stock negativo.
    """
    if cantidad <= 0:
        raise ValidationError("La cantidad del movimiento debe ser mayor a cero.")

    # Fallback: Si no se pasa sucursal, se asume la principal
    if not sucursal:
        sucursal = Sucursal.objects.for_empresa(producto.empresa_id).filter(es_principal=True).first()
        if not sucursal:
            raise ValidationError("No se especificó sucursal y la empresa no tiene una sucursal principal.")

    stock_sucursal, _ = StockSucursal.objects.get_or_create(
        empresa=producto.empresa,
        sucursal=sucursal,
        producto=producto,
        defaults={'stock_actual': Decimal('0.00'), 'stock_minimo': Decimal('0.00')}
    )

    stock_anterior_sucursal = stock_sucursal.stock_actual
    
    # Calcular nuevo stock según tipo
    if tipo in [TipoMovimiento.INGRESO, TipoMovimiento.INGRESO_TRANSFERENCIA]:
        stock_nuevo_sucursal = stock_anterior_sucursal + cantidad
    elif tipo in [TipoMovimiento.EGRESO, TipoMovimiento.AJUSTE, TipoMovimiento.EGRESO_TRANSFERENCIA]:
        stock_nuevo_sucursal = stock_anterior_sucursal - cantidad
    else:
        raise ValidationError(f"Tipo de movimiento '{tipo}' no reconocido.")

    if stock_nuevo_sucursal < 0:
        raise ValidationError(f"No hay stock suficiente para el producto {producto.nombre} en {sucursal.nombre}. Stock actual: {stock_anterior_sucursal}")

    # 1. Crear el registro de historial
    movimiento = MovimientoStock.objects.create(
        empresa=producto.empresa,
        sucursal=sucursal,
        producto=producto,
        tipo=tipo,
        cantidad=cantidad,
        stock_anterior=stock_anterior_sucursal,
        stock_nuevo=stock_nuevo_sucursal,
        motivo=motivo,
        usuario=usuario
    )

    # 2. Actualizar stock en la sucursal
    stock_sucursal.stock_actual = stock_nuevo_sucursal
    stock_sucursal.save(update_fields=['stock_actual', 'updated_at'])

    # 3. Compatibilidad hacia atrás: Actualizar producto.stock_actual global
    # Calculamos la diferencia y se la sumamos al global
    diferencia = stock_nuevo_sucursal - stock_anterior_sucursal
    producto.stock_actual = producto.stock_actual + diferencia
    producto.save(update_fields=['stock_actual', 'updated_at'])

    return movimiento

@transaction.atomic
def ajustar_stock_manual(
    producto: Producto,
    nuevo_stock: Decimal,
    usuario,
    motivo: str = "Ajuste manual de inventario",
    sucursal: Sucursal = None
) -> MovimientoStock:
    """
    Ajusta el stock de un producto a un valor específico.
    Calcula automáticamente si es un INGRESO o un EGRESO/AJUSTE.
    """
    if nuevo_stock < 0:
        raise ValidationError("El stock no puede ser negativo.")

    if not sucursal:
        sucursal = Sucursal.objects.for_empresa(producto.empresa_id).filter(es_principal=True).first()

    stock_sucursal = StockSucursal.objects.filter(sucursal=sucursal, producto=producto).first()
    stock_actual_suc = stock_sucursal.stock_actual if stock_sucursal else Decimal('0.00')

    diferencial = nuevo_stock - stock_actual_suc
    
    if diferencial == 0:
        return None # No hay cambios

    tipo = TipoMovimiento.INGRESO if diferencial > 0 else TipoMovimiento.AJUSTE
    cantidad_absoluta = abs(diferencial)

    return registrar_movimiento_stock(
        producto=producto,
        tipo=tipo,
        cantidad=cantidad_absoluta,
        usuario=usuario,
        motivo=motivo,
        sucursal=sucursal
    )

# ─── Importación / Exportación ───────────────────────────────

def exportar_productos_excel(empresa_id) -> bytes:
    """ Genera un archivo Excel con la lista de productos del tenant. """
    import openpyxl
    from io import BytesIO
    from .selectors import get_productos_list

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Productos"

    # Cabeceras
    headers = [
        "Nombre", "SKU", "Código Barras", "Categoría", "Marca", 
        "Precio Costo", "Precio Venta", "Stock Actual", "Stock Mínimo"
    ]
    ws.append(headers)

    # Datos
    productos = get_productos_list(empresa_id)
    for p in productos:
        ws.append([
            p.nombre, p.sku, p.codigo_barras, 
            p.categoria.nombre if p.categoria else "", 
            p.marca.nombre if p.marca else "",
            p.precio_costo, p.precio_venta, p.stock_actual, p.stock_minimo
        ])

    output = BytesIO()
    wb.save(output)
    return output.getvalue()

@transaction.atomic
def importar_productos_desde_csv(file, empresa, usuario) -> dict:
    """ 
    Importa productos desde un archivo CSV. 
    Acepta cabeceras: nombre, sku, codigo_barras, precio_costo, precio_venta, stock_actual, stock_minimo
    Registra movimiento inicial si stock_actual > 0.
    """
    import csv
    import io
    from .models import Producto, TipoMovimiento

    decoded_file = file.read().decode('utf-8')
    io_string = io.StringIO(decoded_file)
    reader = csv.DictReader(io_string)
    
    count_created = 0
    errors = []

    for row in reader:
        try:
            sku = row.get('sku', '').strip()
            # Validar duplicados en la misma empresa
            if sku and Producto.objects.for_empresa(empresa.id).with_deleted().filter(sku=sku).exists():
                errors.append(f"El SKU '{sku}' ya existe en tu empresa.")
                continue

            stock_inicial = Decimal(row.get('stock_actual', '0') or '0')

            producto = Producto.objects.create(
                empresa=empresa,
                nombre=row.get('nombre'),
                sku=sku,
                codigo_barras=row.get('codigo_barras', ''),
                precio_costo=Decimal(row.get('precio_costo', '0') or '0'),
                precio_venta=Decimal(row.get('precio_venta', '0') or '0'),
                stock_actual=0, # Se actualiza vía movimiento si hay stock inicial
                stock_minimo=Decimal(row.get('stock_minimo', '0') or '0'),
            )

            if stock_inicial > 0:
                registrar_movimiento_stock(
                    producto=producto,
                    tipo=TipoMovimiento.INGRESO,
                    cantidad=stock_inicial,
                    usuario=usuario,
                    motivo="Carga inicial por importación"
                )
            
            count_created += 1
        except Exception as e:
            errors.append(f"Error en fila {row.get('nombre', 'S/N')}: {str(e)}")

    return {"creados": count_created, "errores": errors}
