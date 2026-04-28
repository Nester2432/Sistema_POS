# Sistema POS SaaS - Backend

Backend robusto, multiempresa y escalable diseñado para puntos de venta (POS) bajo el modelo SaaS.

## 🚀 Tecnologías
- **Django 4.2 LTS** & **Django REST Framework**
- **PostgreSQL** (con aislamiento multi-tenant)
- **JWT** (SimpleJWT) con claims personalizados
- **ReportLab** (Generación de Tickets y Cierres en PDF)
- **OpenPyXL** (Importación/Exportación de Inventario)

## 🏗️ Arquitectura
- **core/**: Lógica de infraestructura, middleware multiempresa, permisos y respuestas normalizadas.
- **apps/**: Entidades base (Empresas, Usuarios).
- **modules/**: Lógica de negocio (Inventario, Caja, Ventas, CRM, Reportes).

## 🔒 Seguridad Multi-tenant
Cada modelo hereda de `TenantModel`. El aislamiento se garantiza a través de:
1. **Middleware**: Detecta `empresa_id` desde el token JWT.
2. **Managers**: Filtran automáticamente todos los QuerySets por `empresa_id`.
3. **Serializers**: Validan que los recursos relacionados pertenezcan a la misma empresa.

## 🔑 Roles
- `admin`: Acceso total.
- `supervisor`: Acceso a reportes y anulaciones.
- `cajero`: Apertura de caja y ventas.
- `vendedor`: Solo ventas.

## 🛠️ Instalación y Desarrollo
1. `python -m venv venv`
2. `venv\Scripts\activate`
3. `pip install -r requirements.txt`
4. `python manage.py migrate`
5. `python manage.py test`

## 📡 APIs Principales
- **Auth**: `/api/v1/auth/login/`
- **Inventario**: `/api/v1/inventario/productos/`
- **Caja**: `/api/v1/caja/abrir/`
- **POS**: `/api/v1/ventas/`
- **CRM**: `/api/v1/clientes/`
- **Reportes**: `/api/v1/reportes/dashboard/`
