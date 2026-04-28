# modules/

Este directorio contiene los módulos de negocio del POS SaaS.
Cada módulo es una app Django autocontenida que hereda de `TenantModel`.

## Módulos planificados

| Módulo          | Descripción                                      |
|-----------------|--------------------------------------------------|
| `inventario/`   | Productos, categorías, stock, proveedores        |
| `ventas/`       | Ventas, detalles, turnos de caja                 |
| `clientes/`     | CRM básico, historial de compras                 |
| `reportes/`     | Dashboard, reportes de ventas, inventario        |
| `compras/`      | Órdenes de compra, recepciones de mercadería     |
| `facturacion/`  | Comprobantes electrónicos (SUNAT, AFIP, etc.)    |

## Cómo crear un módulo nuevo

```bash
# Desde la raíz del proyecto
python manage.py startapp nombre_modulo modules/nombre_modulo
```

Luego el modelo debe heredar de `TenantModel`:

```python
from core.models import TenantModel

class Producto(TenantModel):
    nombre = models.CharField(max_length=200)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    # ...empresa y soft-delete vienen de TenantModel
```

Registrar en `config/settings/base.py`:

```python
LOCAL_APPS = [
    ...
    "modules.nombre_modulo",
]
```
