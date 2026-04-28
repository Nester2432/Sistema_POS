from django.core.management.base import BaseCommand
from django.db import transaction
from decimal import Decimal
from django.utils import timezone
from apps.empresas.models import Empresa
from apps.usuarios.models import Usuario, RolChoices
from modules.inventario.models import Producto, Categoria, Proveedor
from modules.clientes.services import crear_cliente_con_cuenta
from modules.caja.services import abrir_caja
from modules.ventas.services import crear_venta_completa

class Command(BaseCommand):
    help = "Puebla la base de datos con datos de prueba para la demo comercial."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("Iniciando seed de datos demo...")

        # 1. Crear Empresa y Usuario Admin
        empresa, _ = Empresa.objects.get_or_create(
            documento_fiscal="DEMO-SaaS-001",
            defaults={"nombre": "Demo Corp - Sistema POS", "email_contacto": "demo@sistemapos.com"}
        )
        
        user, created = Usuario.objects.get_or_create(
            email="demo@pos.com",
            defaults={
                "nombre": "Usuario Demo",
                "empresa": empresa,
                "rol": RolChoices.ADMIN,
                "is_active": True
            }
        )
        if created:
            user.set_password("demo123")
            user.save()

        # 2. Inventario
        cat_bebidas, _ = Categoria.objects.get_or_create(empresa=empresa, nombre="Bebidas")
        cat_comida, _ = Categoria.objects.get_or_create(empresa=empresa, nombre="Comida Rápida")
        prov, _ = Proveedor.objects.get_or_create(empresa=empresa, nombre="Distribuidora Central", documento="20123")

        prods_data = [
            {"nombre": "Coca Cola 500ml", "sku": "BEB-01", "pc": 1.5, "pv": 2.5, "stock": 50, "cat": cat_bebidas},
            {"nombre": "Hamburgesa Simple", "sku": "COM-01", "pc": 4.0, "pv": 8.0, "stock": 20, "cat": cat_comida},
            {"nombre": "Agua Mineral 1L", "sku": "BEB-02", "pc": 1.0, "pv": 1.8, "stock": 100, "cat": cat_bebidas},
            {"nombre": "Papas Fritas", "sku": "COM-02", "pc": 2.0, "pv": 4.5, "stock": 30, "cat": cat_comida},
        ]

        for p in prods_data:
            Producto.objects.get_or_create(
                empresa=empresa, sku=p["sku"],
                defaults={
                    "nombre": p["nombre"], "precio_costo": p["pc"], "precio_venta": p["pv"],
                    "stock_actual": p["stock"], "categoria": p["cat"], "proveedor": prov
                }
            )

        # 3. Clientes
        c1 = crear_cliente_con_cuenta(empresa, user, nombre="Juan", apellido="Demo", documento="99001")
        c2 = crear_cliente_con_cuenta(empresa, user, nombre="Maria", apellido="Compradora", documento="99002")

        # 4. Operación: Abrir Caja
        caja = abrir_caja(user, empresa, Decimal("5000.00"))

        # 5. Ventas de Prueba
        prods = Producto.objects.filter(empresa=empresa)
        items = [{"producto": prods[0], "cantidad": 2}, {"producto": prods[1], "cantidad": 1}]
        
        crear_venta_completa(user, empresa, items, "TICKET", "EFECTIVO", cliente=c1)

        self.stdout.write(self.style.SUCCESS("✅ Demo seed completado con éxito."))
        self.stdout.write("Email: demo@pos.com | Password: demo123")
