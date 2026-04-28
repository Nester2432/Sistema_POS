"""
tests/audit_tests.py
────────────────────────────────────────────────────────────────
Tests de Hardening: Seguridad multiempresa y Roles.
"""
from django.test import TestCase
from rest_framework.test import APIClient
from apps.empresas.models import Empresa
from apps.usuarios.models import Usuario, RolChoices
from modules.inventario.models import Producto

class AuditTestCase(TestCase):
    def setUp(self):
        # Empresa A
        self.empresa_a = Empresa.objects.create(nombre="Empresa A", documento_fiscal="A1")
        self.admin_a = Usuario.objects.create_user(email="admin@a.com", nombre="Admin A", password="123", empresa=self.empresa_a, rol=RolChoices.ADMIN)
        self.cajero_a = Usuario.objects.create_user(email="cajero@a.com", nombre="Cajero A", password="123", empresa=self.empresa_a, rol=RolChoices.CAJERO)
        
        # Empresa B
        self.empresa_b = Empresa.objects.create(nombre="Empresa B", documento_fiscal="B1")
        self.admin_b = Usuario.objects.create_user(email="admin@b.com", nombre="Admin B", password="123", empresa=self.empresa_b, rol=RolChoices.ADMIN)
        
        # Producto en Empresa B
        self.prod_b = Producto.objects.create(empresa=self.empresa_b, nombre="Secreto B", sku="B001", stock_actual=10)

    def test_aislamiento_entre_empresas(self):
        """Validar que Admin A no pueda ver productos de Empresa B."""
        from rest_framework_simplejwt.tokens import RefreshToken
        token = str(RefreshToken.for_user(self.admin_a).access_token)
        
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Intentar ver el producto de la otra empresa
        response = client.get(f'/api/v1/inventario/productos/{self.prod_b.id}/')
        self.assertEqual(response.status_code, 404) # No debe existir para él

    def test_permisos_rol_cajero_dashboard(self):
        """Validar que un Cajero NO pueda acceder al dashboard."""
        from rest_framework_simplejwt.tokens import RefreshToken
        token = str(RefreshToken.for_user(self.cajero_a).access_token)
        
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Intentar ver dashboard (Restringido a Supervisor/Admin)
        response = client.get('/api/v1/reportes/dashboard/')
        self.assertEqual(response.status_code, 403)
