from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from apps.empresas.models import Empresa
from apps.usuarios.models import Usuario, RolChoices
from modules.inventario.models import Producto, Categoria, Proveedor, Marca
from modules.clientes.services import crear_cliente_con_cuenta
from modules.caja.services import abrir_caja, registrar_movimiento_caja
from modules.ventas.services import crear_venta_completa
from modules.compras.services import crear_compra_completa
from modules.caja.models import TipoMovimientoCaja

class Command(BaseCommand):
    help = "Puebla la base de datos con datos de ElectroHogar Demo."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("Iniciando seed de ElectroHogar Demo...")

        # 1. Crear o Limpiar Empresa Demo
        empresa, _ = Empresa.objects.update_or_create(
            documento_fiscal="DEMO-ELECTRO-001",
            defaults={
                "nombre": "ElectroHogar Demo", 
                "email_contacto": "admin@demo.com",
                "activo": True
            }
        )
        
        # Limpiar datos previos de esta empresa específica
        Producto.objects.filter(empresa=empresa).delete()
        Categoria.objects.filter(empresa=empresa).delete()
        Proveedor.objects.filter(empresa=empresa).delete()
        # Nota: En un sistema real usaríamos el soft delete si fuera necesario, 
        # pero para el reset de demo queremos limpieza total.

        # 2. Crear Usuario Admin Demo
        user, created = Usuario.objects.get_or_create(
            email="admin@demo.com",
            defaults={
                "nombre": "Admin Demo",
                "empresa": empresa,
                "rol": RolChoices.ADMIN,
                "is_active": True
            }
        )
        user.set_password("demo123")
        user.save()

        # 3. Categorías y Marcas
        cats = {}
        for cat_name in ["Heladeras", "Lavarropas", "Cocinas", "Microondas", "Televisores", "Pequeños Electrodomésticos"]:
            cats[cat_name], _ = Categoria.objects.get_or_create(empresa=empresa, nombre=cat_name)
        
        prov_electra, _ = Proveedor.objects.get_or_create(empresa=empresa, nombre="Distribuidora Electra S.A.", documento="30-11111111-9")
        prov_tech, _ = Proveedor.objects.get_or_create(empresa=empresa, nombre="Tech Wholesale", documento="30-22222222-9")

        # 4. Productos (15+)
        productos_data = [
            {"n": "Heladera Samsung No Frost 420L", "c": "Heladeras", "sku": "REF-SAM-420", "pc": 450000, "pv": 680000, "s": 10},
            {"n": "Heladera Whirlpool 390L", "c": "Heladeras", "sku": "REF-WHI-390", "pc": 410000, "pv": 590000, "s": 8},
            {"n": "Lavarropas Drean 7kg Next", "c": "Lavarropas", "sku": "WASH-DRE-07", "pc": 280000, "pv": 420000, "s": 15},
            {"n": "Lavarropas LG Inverter 8kg", "c": "Lavarropas", "sku": "WASH-LG-08", "pc": 350000, "pv": 530000, "s": 12},
            {"n": "Smart TV Samsung 50' 4K", "c": "Televisores", "sku": "TV-SAM-50", "pc": 320000, "pv": 490000, "s": 20},
            {"n": "Smart TV LG 43' ThinQ", "c": "Televisores", "sku": "TV-LG-43", "pc": 240000, "pv": 380000, "s": 18},
            {"n": "Smart TV Noblex 32' HD", "c": "Televisores", "sku": "TV-NOB-32", "pc": 110000, "pv": 185000, "s": 25},
            {"n": "Cocina Escorial 4 hornallas", "c": "Cocinas", "sku": "STOVE-ESC-04", "pc": 150000, "pv": 240000, "s": 7},
            {"n": "Cocina Orbis acero inoxidable", "c": "Cocinas", "sku": "STOVE-ORB-AC", "pc": 220000, "pv": 360000, "s": 5},
            {"n": "Microondas BGH 20L Blanco", "c": "Microondas", "sku": "MW-BGH-20", "pc": 65000, "pv": 98000, "s": 30},
            {"n": "Microondas Atma digital 23L", "c": "Microondas", "sku": "MW-ATM-23", "pc": 78000, "pv": 125000, "s": 22},
            {"n": "Pava eléctrica Philips 1.7L", "c": "Pequeños Electrodomésticos", "sku": "KET-PHI-17", "pc": 18000, "pv": 32000, "s": 50},
            {"n": "Licuadora Moulinex Optimix", "c": "Pequeños Electrodomésticos", "sku": "BLEN-MOU-01", "pc": 25000, "pv": 45000, "s": 40},
            {"n": "Tostadora Atma Vintage", "c": "Pequeños Electrodomésticos", "sku": "TOAST-ATM-01", "pc": 15000, "pv": 28000, "s": 35},
            {"n": "Aspiradora Philips 1800W", "c": "Pequeños Electrodomésticos", "sku": "VAC-PHI-18", "pc": 42000, "pv": 75000, "s": 14},
        ]

        prods_inst = []
        for p in productos_data:
            prod = Producto.objects.create(
                empresa=empresa,
                nombre=p["n"],
                sku=p["sku"],
                codigo_barras=f"779{p['sku'].replace('-', '')}01",
                precio_costo=Decimal(str(p["pc"])),
                precio_venta=Decimal(str(p["pv"])),
                stock_actual=Decimal(str(p["s"])),
                stock_minimo=Decimal("2"),
                categoria=cats[p.get("c", "Pequeños Electrodomésticos")],
                proveedor=prov_electra if p["pc"] > 100000 else prov_tech
            )
            prods_inst.append(prod)

        # 5. Clientes
        clientes = [
            {"n": "Consumidor", "a": "Final", "d": "99999999"},
            {"n": "Juan", "a": "Frecuente", "d": "20334455"},
            {"n": "Empresa", "a": "Constructora S.A.", "d": "30-55667788-9"},
            {"n": "Maria", "a": "Deudora", "d": "27889900"},
            {"n": "Carlos", "a": "Nuevo", "d": "20112233"},
        ]
        clients_inst = []
        for c in clientes:
            clients_inst.append(crear_cliente_con_cuenta(empresa, user, nombre=c["n"], apellido=c["a"], documento=c["d"]))

        # 6. Caja
        caja = abrir_caja(user, empresa, Decimal("150000.00"))

        # 7. Ventas Iniciales
        # Venta 1: Efectivo
        crear_venta_completa(user, empresa, [{"producto": prods_inst[4], "cantidad": 1}], "TICKET", "EFECTIVO", cliente=clients_inst[0])
        # Venta 2: Tarjeta
        crear_venta_completa(user, empresa, [{"producto": prods_inst[11], "cantidad": 2}], "TICKET", "TARJETA", cliente=clients_inst[1])
        # Venta 3: Cuenta Corriente (Deuda)
        crear_venta_completa(user, empresa, [{"producto": prods_inst[0], "cantidad": 1}], "FACTURA", "CUENTA_CORRIENTE", cliente=clients_inst[3])

        # 8. Compras Iniciales
        crear_compra_completa(user, empresa, prov_tech, [{"producto": prods_inst[12], "cantidad": 10, "precio_unitario": 22000}], "FACTURA", "0001-0000456", "EFECTIVO")
        crear_compra_completa(user, empresa, prov_electra, [{"producto": prods_inst[2], "cantidad": 5, "precio_unitario": 270000}], "FACTURA", "0002-0000123", "TRANSFERENCIA")

        self.stdout.write(self.style.SUCCESS("✅ ElectroHogar Demo inicializada correctamente."))
