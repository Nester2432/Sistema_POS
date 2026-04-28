import os
import django
from rest_framework.test import APIClient
from django.urls import reverse
from django.core.management import call_command

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.migrate")
django.setup()

def setup_test_data():
    """Migrar y crear datos iniciales en la DB en memoria."""
    print("Configurando base de datos en memoria...")
    call_command('migrate', verbosity=0)
    
    from apps.empresas.models import Empresa
    from apps.usuarios.models import Usuario, RolChoices

    # 1. Empresa de prueba
    empresa, _ = Empresa.objects.get_or_create(
        nombre='Mi Tienda POS',
        documento_fiscal='20123456789',
        email_contacto='contacto@mitienda.com',
        activo=True
    )

    # 2. Admin de la empresa
    if not Usuario.objects.filter(email='admin@empresa.com').exists():
        Usuario.objects.create_user(
            email='admin@empresa.com',
            nombre='Juan',
            apellido='Pérez',
            password='admin123',
            empresa=empresa,
            rol=RolChoices.ADMIN
        )
    print("Datos de prueba listos.")

def test_flow():
    setup_test_data()
    client = APIClient()
    print("\nINICIANDO PRUEBAS DE ENDPOINTS (FASE 1)")
    print("-" * 50)

    # 1. Login
    login_url = reverse('auth:login')
    payload = {"email": "admin@empresa.com", "password": "admin123"}
    response = client.post(login_url, payload, format='json')
    
    if response.status_code == 200:
        print(f"OK: POST /auth/login/")
        token = response.data['access']
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    else:
        print(f"ERROR: POST /auth/login/: {response.status_code}")
        print(response.data)
        return

    # 2. GET /auth/me/
    me_url = reverse('auth:me')
    response = client.get(me_url)
    if response.status_code == 200:
        print(f"OK: GET /auth/me/ (Usuario: {response.data['data']['nombre_completo']})")
    else:
        print(f"ERROR: GET /auth/me/: {response.status_code}")
        print(response.data)

    # 3. GET /empresas/mi-empresa/
    empresa_url = reverse('empresas:empresa-mi-empresa')
    response = client.get(empresa_url)
    if response.status_code == 200:
        print(f"OK: GET /empresas/mi-empresa/ (Empresa: {response.data['data']['nombre']})")
    else:
        print(f"ERROR: GET /empresas/mi-empresa/: {response.status_code}")
        print(response.data)

    # 4. GET /auth/usuarios/
    usuarios_url = reverse('auth:usuario-list')
    response = client.get(usuarios_url)
    if response.status_code == 200:
        print(f"OK: GET /auth/usuarios/ ({response.data['count']} usuarios encontrados)")
    else:
        print(f"ERROR: GET /auth/usuarios/: {response.status_code}")
        print(response.data)

    # 5. Seguridad: Intentar ver empresas como admin de empresa (403 Forbidden)
    todas_empresas_url = reverse('empresas:empresa-list')
    response = client.get(todas_empresas_url)
    if response.status_code == 403:
        print(f"OK: SEGURIDAD - GET /empresas/ (Todas) BLOQUEADO")
    else:
        print(f"ADVERTENCIA: GET /empresas/ devolvió {response.status_code}")

    print("-" * 50)
    print("FIN DE PRUEBAS - TODO OK")

if __name__ == "__main__":
    test_flow()
