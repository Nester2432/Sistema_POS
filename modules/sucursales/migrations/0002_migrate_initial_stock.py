from django.db import migrations, transaction
from decimal import Decimal

def crear_sucursales_y_migrar_stock(apps, schema_editor):
    Empresa = apps.get_model('empresas', 'Empresa')
    Sucursal = apps.get_model('sucursales', 'Sucursal')
    Producto = apps.get_model('inventario', 'Producto')
    StockSucursal = apps.get_model('sucursales', 'StockSucursal')

    with transaction.atomic():
        for empresa in Empresa.objects.all():
            # Crear sucursal principal si no existe
            sucursal_principal, created = Sucursal.objects.get_or_create(
                empresa=empresa,
                codigo='PRINCIPAL',
                defaults={
                    'nombre': 'Sucursal Principal',
                    'es_principal': True,
                    'activo': True
                }
            )

            # Migrar stock de productos a esta sucursal
            productos = Producto.objects.filter(empresa=empresa)
            for producto in productos:
                # Solo crear si tiene stock o si queremos inicializar todos
                StockSucursal.objects.get_or_create(
                    empresa=empresa,
                    sucursal=sucursal_principal,
                    producto=producto,
                    defaults={
                        'stock_actual': producto.stock_actual,
                        'stock_minimo': producto.stock_minimo,
                        'activo': True
                    }
                )

def reverse_migration(apps, schema_editor):
    # En reversa, podríamos querer devolver el stock al producto, 
    # pero como no borramos Producto.stock_actual, no es estrictamente necesario 
    # a menos que hayan cambiado. Por simplicidad, no hacemos nada destructivo.
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('sucursales', '0001_initial'),
        ('inventario', '0001_initial'),
        ('empresas', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(crear_sucursales_y_migrar_stock, reverse_migration),
    ]
