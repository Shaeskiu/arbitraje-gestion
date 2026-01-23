# Configuración de Supabase para Arbitraje Gestión

## 📋 Resumen del Esquema

El esquema de base de datos está diseñado para almacenar oportunidades de arbitraje comercial con sus costes asociados. Consta de **2 tablas principales**:

### 1. Tabla `opportunities` (Oportunidades)
Almacena la información principal de cada oportunidad de arbitraje.

**Campos:**
- `id` (UUID): Identificador único generado automáticamente
- `product_name` (TEXT): Nombre del producto
- `origin_channel` (TEXT): Canal donde se compra (ej: "Amazon", "AliExpress")
- `origin_price` (DECIMAL): Precio de compra en euros
- `dest_channel` (TEXT): Canal donde se vende (ej: "eBay", "Marketplace")
- `dest_price` (DECIMAL): Precio estimado de venta en euros
- `real_sale_price` (DECIMAL, nullable): Precio real de venta (opcional, para comparar con estimado)
- `status` (TEXT): Estado de la oportunidad (enum: detectado, analizado, aprobado, comprado, vendido, descartado)
- `notes` (TEXT, nullable): Notas adicionales
- `created_at` (TIMESTAMPTZ): Fecha de creación (automática)
- `updated_at` (TIMESTAMPTZ): Fecha de última actualización (automática)

**Características:**
- ✅ Validación de precios no negativos
- ✅ Validación de estados permitidos
- ✅ Actualización automática de `updated_at` mediante trigger
- ✅ Índices en `status`, `created_at` y `updated_at` para consultas rápidas

### 2. Tabla `opportunity_costs` (Costes)
Almacena los costes desglosados asociados a cada oportunidad (relación 1:N).

**Campos:**
- `id` (UUID): Identificador único
- `opportunity_id` (UUID): Referencia a la oportunidad (FK con CASCADE DELETE)
- `name` (TEXT): Nombre del coste (ej: "Envío", "Comisión marketplace")
- `type` (TEXT): Tipo de coste - `fixed` (valor fijo) o `percentage` (porcentaje)
- `value` (DECIMAL): Valor del coste
  - Si `type = 'fixed'`: valor en euros
  - Si `type = 'percentage'`: porcentaje (ej: 15.5 para 15.5%)
- `base` (TEXT, nullable): Base para calcular porcentaje
  - `'purchase'`: se aplica sobre el precio de compra
  - `'sale'`: se aplica sobre el precio de venta
  - Solo aplica si `type = 'percentage'`
- `created_at` (TIMESTAMPTZ): Fecha de creación

**Validaciones:**
- ✅ Si `type = 'percentage'`, `base` debe ser 'purchase' o 'sale'
- ✅ Si `type = 'fixed'`, `base` debe ser NULL
- ✅ Eliminación en cascada: si se elimina una oportunidad, se eliminan sus costes

## 🚀 Instalación

### Paso 1: Crear proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Anota tu **URL del proyecto** y tu **API Key (anon/public)**

### Paso 2: Ejecutar el SQL
1. En el dashboard de Supabase, ve a **SQL Editor**
2. Copia y pega el contenido de `supabase-schema.sql`
3. Ejecuta el script completo
4. Verifica que las tablas se hayan creado correctamente

### Paso 3: Configurar Row Level Security (RLS)
El esquema incluye políticas RLS básicas que permiten todas las operaciones. Si necesitas autenticación:

**Opción A: Sin autenticación (uso interno)**
- Las políticas actuales permiten todas las operaciones
- Asegúrate de proteger tu API Key

**Opción B: Con autenticación (futuro)**
- Descomenta y ajusta las políticas con `auth.uid()`
- Añade columna `user_id` a la tabla `opportunities`

## 📊 Estructura de Datos

### Ejemplo de Oportunidad
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "product_name": "Auriculares Bluetooth",
  "origin_channel": "AliExpress",
  "origin_price": 25.50,
  "dest_channel": "eBay",
  "dest_price": 45.00,
  "real_sale_price": 42.00,
  "status": "vendido",
  "notes": "Vendido en 2 días",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-17T14:20:00Z"
}
```

### Ejemplo de Costes asociados
```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "opportunity_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Envío",
    "type": "fixed",
    "value": 5.00,
    "base": null
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440002",
    "opportunity_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Comisión eBay",
    "type": "percentage",
    "value": 10.0,
    "base": "sale"
  }
]
```

## 🔍 Consultas Útiles

### Obtener todas las oportunidades con sus costes
```sql
SELECT 
    o.*,
    json_agg(
        json_build_object(
            'id', oc.id,
            'name', oc.name,
            'type', oc.type,
            'value', oc.value,
            'base', oc.base
        )
    ) FILTER (WHERE oc.id IS NOT NULL) as costs
FROM opportunities o
LEFT JOIN opportunity_costs oc ON o.id = oc.opportunity_id
GROUP BY o.id
ORDER BY o.created_at DESC;
```

### Oportunidades por estado
```sql
SELECT status, COUNT(*) as count
FROM opportunities
GROUP BY status;
```

### Oportunidades con margen real calculado
```sql
SELECT 
    o.*,
    o.dest_price - o.origin_price as estimated_gross_margin,
    o.real_sale_price - o.origin_price as real_gross_margin,
    o.real_sale_price - o.dest_price as price_difference
FROM opportunities o
WHERE o.real_sale_price IS NOT NULL;
```

## 🔐 Seguridad

### API Keys
- **Anon/Public Key**: Úsala en el frontend (JavaScript)
- **Service Role Key**: NUNCA la expongas en el frontend, solo en backend

### RLS Policies
Las políticas actuales permiten todas las operaciones. Para producción:
1. Considera añadir autenticación
2. Ajusta las políticas RLS según tus necesidades
3. Usa Service Role Key solo en operaciones del servidor

## 📝 Notas de Migración

### Migrar datos desde localStorage
1. Exporta datos de localStorage
2. Transforma el formato:
   - `id` (string) → `id` (UUID)
   - `costs` (array) → insertar en `opportunity_costs`
   - `additionalCosts` (legacy) → crear coste fijo en `opportunity_costs`
3. Inserta en Supabase usando el cliente JavaScript

### Compatibilidad
- El esquema mantiene compatibilidad con la estructura actual de la aplicación
- Los costes se almacenan en tabla separada (mejor normalización)
- `real_sale_price` es opcional (nullable)

## 🎯 Próximos Pasos

1. ✅ Ejecutar el SQL en Supabase
2. ✅ Configurar variables de entorno (URL y API Key)
3. ✅ Actualizar `js/storage.js` para usar Supabase Client
4. ✅ Probar CRUD completo
5. ✅ Migrar datos existentes (si los hay)
