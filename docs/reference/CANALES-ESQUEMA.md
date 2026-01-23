# Esquema de Datos para Gestión de Canales

## 📊 Diseño Propuesto

### Tablas Necesarias

#### 1. Tabla `channels` (Canales)
Almacena la información principal de cada canal (Amazon, eBay, AliExpress, etc.)

**Campos:**
- `id` (UUID): Identificador único (PK)
- `name` (TEXT): Nombre del canal (único, no puede repetirse)
- `created_at` (TIMESTAMPTZ): Fecha de creación
- `updated_at` (TIMESTAMPTZ): Fecha de última actualización

**Características:**
- Constraint UNIQUE en `name`
- Trigger para actualizar `updated_at` automáticamente

#### 2. Tabla `channel_costs` (Costes de Canales)
Almacena los costes asociados a cada canal, diferenciando entre costes de origen y destino

**Campos:**
- `id` (UUID): Identificador único (PK)
- `channel_id` (UUID): Referencia al canal (FK con CASCADE DELETE)
- `cost_role` (TEXT): Rol del coste - `'origin'` (cuando el canal se usa para comprar) o `'destination'` (cuando se usa para vender)
- `name` (TEXT): Nombre del coste (ej: "Envío", "Comisión")
- `type` (TEXT): Tipo de coste - `'fixed'` o `'percentage'`
- `value` (DECIMAL): Valor del coste
- `base` (TEXT, nullable): Base para porcentajes - `'purchase'` o `'sale'` (solo si type = 'percentage')
- `created_at` (TIMESTAMPTZ): Fecha de creación

**Validaciones:**
- `cost_role` debe ser 'origin' o 'destination'
- `type` debe ser 'fixed' o 'percentage'
- Si `type = 'percentage'`, `base` debe ser 'purchase' o 'sale'
- Si `type = 'fixed'`, `base` debe ser NULL
- `value` debe ser >= 0

**Índices:**
- Índice en `channel_id` y `cost_role` para consultas rápidas

#### 3. Modificación de `opportunities`
Cambiar los campos de canal de texto libre a referencias a la tabla `channels`

**Cambios propuestos:**
- `origin_channel` (TEXT) → Mantener para compatibilidad temporal (deprecated)
- `origin_channel_id` (UUID) → Nueva columna (FK a channels)
- `dest_channel` (TEXT) → Mantener para compatibilidad temporal (deprecated)
- `dest_channel_id` (UUID) → Nueva columna (FK a channels)

**Estrategia de migración:**
- Añadir nuevas columnas (nullable inicialmente)
- Migrar datos existentes: buscar o crear canales con los nombres existentes
- Una vez migrado, hacer las nuevas columnas NOT NULL
- Eliminar columnas antiguas en versión futura

## 🔄 Flujo de Integración

### Creación de Oportunidad

1. Usuario selecciona canal de origen desde dropdown
2. Sistema carga costes de origen del canal seleccionado
3. Usuario selecciona canal de destino desde dropdown
4. Sistema carga costes de destino del canal seleccionado
5. Costes se copian a `opportunity_costs` (NO son referencias)
6. Usuario puede editar manualmente los costes copiados
7. Al guardar, se guardan los costes finales en `opportunity_costs`

### Panel de Gestión de Canales

**Vista de lista:**
- Tabla con: Nombre, Costes Origen (cantidad), Costes Destino (cantidad), Acciones

**Vista de detalle/edición:**
- Formulario con:
  - Nombre del canal
  - Sección "Costes de Origen" (lista de costes)
  - Sección "Costes de Destino" (lista de costes)
  - Cada coste: nombre, tipo, valor, base (si es porcentaje)

## 📝 Ejemplo de Datos

### Canal "Amazon"
```json
{
  "id": "uuid-amazon",
  "name": "Amazon",
  "channel_costs": [
    {
      "cost_role": "origin",
      "name": "Envío",
      "type": "fixed",
      "value": 5.99
    },
    {
      "cost_role": "destination",
      "name": "Comisión Amazon",
      "type": "percentage",
      "value": 15.0,
      "base": "sale"
    },
    {
      "cost_role": "destination",
      "name": "Fulfillment",
      "type": "fixed",
      "value": 2.50
    }
  ]
}
```

### Oportunidad usando canales
```json
{
  "id": "uuid-opp",
  "product_name": "Auriculares",
  "origin_channel_id": "uuid-amazon",
  "dest_channel_id": "uuid-ebay",
  "origin_price": 25.00,
  "dest_price": 45.00,
  "costs": [
    {
      "name": "Envío (Amazon)",
      "type": "fixed",
      "value": 5.99,
      "source": "channel_origin"
    },
    {
      "name": "Comisión eBay",
      "type": "percentage",
      "value": 12.0,
      "base": "sale",
      "source": "channel_destination"
    },
    {
      "name": "Coste adicional manual",
      "type": "fixed",
      "value": 1.50,
      "source": "manual"
    }
  ]
}
```

## 🎯 Ventajas del Diseño

1. **Normalización**: Canales centralizados, evita duplicación
2. **Reutilización**: Un canal puede usarse en múltiples oportunidades
3. **Flexibilidad**: Los costes se copian, no referencian (permite personalización)
4. **Trazabilidad**: Campo `source` opcional en `opportunity_costs` para saber origen
5. **Compatibilidad**: Migración gradual sin romper datos existentes

## 🔍 Consultas Útiles

### Obtener canal con todos sus costes
```sql
SELECT 
    c.*,
    json_agg(
        json_build_object(
            'id', cc.id,
            'cost_role', cc.cost_role,
            'name', cc.name,
            'type', cc.type,
            'value', cc.value,
            'base', cc.base
        )
    ) FILTER (WHERE cc.id IS NOT NULL) as costs
FROM channels c
LEFT JOIN channel_costs cc ON c.id = cc.channel_id
WHERE c.id = 'uuid-canal'
GROUP BY c.id;
```

### Obtener oportunidades con información de canales
```sql
SELECT 
    o.*,
    c_origin.name as origin_channel_name,
    c_dest.name as dest_channel_name
FROM opportunities o
LEFT JOIN channels c_origin ON o.origin_channel_id = c_origin.id
LEFT JOIN channels c_dest ON o.dest_channel_id = c_dest.id;
```

## ⚠️ Consideraciones de Implementación

1. **Migración de datos existentes**:
   - Crear canales a partir de valores únicos de `origin_channel` y `dest_channel`
   - Asignar `origin_channel_id` y `dest_channel_id` en base a nombres
   - Mantener columnas antiguas temporalmente para compatibilidad

2. **Campo `source` opcional en `opportunity_costs`**:
   - Permite identificar si un coste viene de un canal o fue añadido manualmente
   - Valores posibles: `'channel_origin'`, `'channel_destination'`, `'manual'`
   - Opcional: no es crítico para funcionalidad, solo para UX

3. **Validación en frontend**:
   - Al seleccionar canal, mostrar costes que se añadirán
   - Indicar visualmente qué costes vienen del canal vs manuales
   - Permitir eliminar costes de canal si el usuario no los quiere

4. **Orden de costes**:
   - Mantener orden lógico: primero costes de origen, luego destino, luego manuales
   - Campo `order` opcional en `channel_costs` y `opportunity_costs` para controlar orden
