from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from apps.empresas.models import Empresa
from apps.usuarios.models import Usuario, RolChoices
from modules.inventario.models import Producto, Categoria, Proveedor, Marca, MovimientoStock
from modules.ventas.models import Venta
from modules.compras.models import Compra
from modules.caja.models import Caja, MovimientoCaja
from modules.clientes.models import Cliente, CuentaCorriente, MovimientoCuentaCorriente
from modules.clientes.services import crear_cliente_con_cuenta
from modules.caja.services import abrir_caja
from modules.ventas.services import crear_venta_completa
from modules.compras.services import crear_compra_completa
from modules.inventario.services import registrar_movimiento_stock
from modules.inventario.models import TipoMovimiento
from modules.sucursales.models import Sucursal

class Command(BaseCommand):
    help = "Puebla la base de datos con datos de ElectroHogar Demo."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("Iniciando seed de ElectroHogar Demo...")

        # 1. Asegurar Superusuario Maestro (Plataforma SaaS)
        if not Usuario.objects.filter(email="master@sistema.com").exists():
            Usuario.objects.create_superuser(
                email="master@sistema.com",
                password="master123",
                nombre="Master Admin"
            )
            self.stdout.write("✅ Superusuario maestro creado.")

        # 2. Obtener o Crear Empresa Demo
        empresa, _ = Empresa.objects.update_or_create(
            documento_fiscal="DEMO-ELECTRO-001",
            defaults={
                "nombre": "ElectroHogar Demo", 
                "email_contacto": "admin@demo.com",
                "activo": True
            }
        )
        
        # 3. LIMPIEZA PROFUNDA
        self.stdout.write("Limpiando transacciones y movimientos...")
        Venta.objects.filter(empresa=empresa).delete()
        Compra.objects.filter(empresa=empresa).delete()
        MovimientoStock.objects.filter(empresa=empresa).delete()
        MovimientoCuentaCorriente.objects.filter(empresa=empresa).delete()
        MovimientoCaja.objects.filter(empresa=empresa).delete()
        Caja.objects.filter(empresa=empresa).delete()
        
        self.stdout.write("Limpiando maestros (productos, clientes, proveedores)...")
        Producto.objects.filter(empresa=empresa).delete()
        Categoria.objects.filter(empresa=empresa).delete()
        Marca.objects.filter(empresa=empresa).delete()
        Proveedor.objects.filter(empresa=empresa).delete()
        CuentaCorriente.objects.filter(empresa=empresa).delete()
        Cliente.objects.filter(empresa=empresa).delete()

        # 4. Crear o Actualizar Usuario Admin Demo
        user, _ = Usuario.objects.update_or_create(
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

        # 5. Maestros
        cats = {}
        for cat_name in ["Heladeras", "Lavarropas", "Cocinas", "Microondas", "Televisores", "Pequeños Electrodomésticos"]:
            cats[cat_name], _ = Categoria.objects.get_or_create(empresa=empresa, nombre=cat_name)
        
        prov_electra, _ = Proveedor.objects.get_or_create(empresa=empresa, nombre="Distribuidora Electra S.A.", documento="30-11111111-9")
        prov_tech, _ = Proveedor.objects.get_or_create(empresa=empresa, nombre="Tech Wholesale", documento="30-22222222-9")

        # 6. Productos
        productos_data = [
            {"n": "Heladera Samsung No Frost 420L", "c": "Heladeras", "sku": "REF-SAM-420", "pc": 45000, "pv": 68000, "s": 10},
            {"n": "Heladera Whirlpool 390L", "c": "Heladeras", "sku": "REF-WHI-390", "pc": 41000, "pv": 59000, "s": 8},
            {"n": "Lavarropas Drean 7kg Next", "c": "Lavarropas", "sku": "WASH-DRE-07", "pc": 28000, "pv": 42000, "s": 15},
            {"n": "Lavarropas LG Inverter 8kg", "c": "Lavarropas", "sku": "WASH-LG-08", "pc": 35000, "pv": 53000, "s": 12},
            {"n": "Smart TV Samsung 50' 4K", "c": "Televisores", "sku": "TV-SAM-50", "pc": 32000, "pv": 49000, "s": 20},
            {"n": "Smart TV LG 43' ThinQ", "c": "Televisores", "sku": "TV-LG-43", "pc": 24000, "pv": 38000, "s": 18},
            {"n": "Smart TV Noblex 32' HD", "c": "Televisores", "sku": "TV-NOB-32", "pc": 11000, "pv": 18500, "s": 25},
            {"n": "Cocina Escorial 4 hornallas", "c": "Cocinas", "sku": "STOVE-ESC-04", "pc": 15000, "pv": 24000, "s": 7},
            {"n": "Cocina Orbis acero inoxidable", "c": "Cocinas", "sku": "STOVE-ORB-AC", "pc": 22000, "pv": 36000, "s": 5},
            {"n": "Microondas BGH 20L Blanco", "c": "Microondas", "sku": "MW-BGH-20", "pc": 6500, "pv": 9800, "s": 30},
            {"n": "Microondas Atma digital 23L", "c": "Microondas", "sku": "MW-ATM-23", "pc": 7800, "pv": 12500, "s": 22},
            {"n": "Pava eléctrica Philips 1.7L", "c": "Pequeños Electrodomésticos", "sku": "KET-PHI-17", "pc": 1800, "pv": 3200, "s": 50},
            {"n": "Licuadora Moulinex Optimix", "c": "Pequeños Electrodomésticos", "sku": "BLEN-MOU-01", "pc": 2500, "pv": 4500, "s": 40},
            {"n": "Tostadora Atma Vintage", "c": "Pequeños Electrodomésticos", "sku": "TOAST-ATM-01", "pc": 1500, "pv": 2800, "s": 35},
            {"n": "Aspiradora Philips 1800W", "c": "Pequeños Electrodomésticos", "sku": "VAC-PHI-18", "pc": 4200, "pv": 7500, "s": 14},
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
                categoria=cats[p["c"]],
                proveedor=prov_electra if p["pc"] > 10000 else prov_tech
            )
            prods_inst.append(prod)

        self.stdout.write(f"Creados {len(prods_inst)} productos para {empresa.nombre}")

        # 6b. Registrar stock inicial en StockSucursal (sucursal principal)
        sucursal_principal = Sucursal.objects.filter(empresa=empresa, es_principal=True).first()
        if not sucursal_principal:
            sucursal_principal = Sucursal.objects.create(
                empresa=empresa,
                nombre="Casa Central",
                codigo="CENTRAL",
                es_principal=True,
                activo=True
            )
        
        for i, prod in enumerate(prods_inst):
            stock_inicial = Decimal(str(productos_data[i]["s"]))
            if stock_inicial > 0:
                registrar_movimiento_stock(
                    producto=prod,
                    tipo=TipoMovimiento.INGRESO,
                    cantidad=stock_inicial,
                    usuario=user,
                    motivo="Stock inicial demo",
                    sucursal=sucursal_principal
                )
        
        self.stdout.write(f"✅ Stock inicial cargado en '{sucursal_principal.nombre}'")

        # 7. Clientes
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

        # 8. Caja
        caja = abrir_caja(user, empresa, Decimal("150000.00"))

        # 9. Ventas e Ingresos
        crear_venta_completa(user, empresa, [{"producto": prods_inst[4], "cantidad": 1}], "TICKET", "EFECTIVO", cliente=clients_inst[0])
        crear_venta_completa(user, empresa, [{"producto": prods_inst[11], "cantidad": 2}], "TICKET", "TARJETA", cliente=clients_inst[1])
        crear_venta_completa(user, empresa, [{"producto": prods_inst[0], "cantidad": 1}], "FACTURA", "CUENTA_CORRIENTE", cliente=clients_inst[3])

        # 10. Compras
        crear_compra_completa(user, empresa, prov_tech, [{"producto": prods_inst[12], "cantidad": 10, "precio_unitario": 2200}], "FACTURA", "0001-0000456", "EFECTIVO")
        crear_compra_completa(user, empresa, prov_electra, [{"producto": prods_inst[2], "cantidad": 5, "precio_unitario": 27000}], "FACTURA", "0002-0000123", "TRANSFERENCIA")

        self.stdout.write(self.style.SUCCESS("✅ ElectroHogar Demo inicializada correctamente."))
