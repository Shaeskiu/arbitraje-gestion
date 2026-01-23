# Fixtures de Desarrollo para Supabase Local

Este directorio contiene datos de ejemplo (fixtures) para poblar la base de datos local durante el desarrollo.

## 📋 Contenido

Los fixtures están organizados en archivos SQL independientes que se ejecutan en orden:

1. **01_channels.sql** - Canales de compra/venta (Amazon, eBay, AliExpress, etc.)
2. **02_channel_costs.sql** - Costes predefinidos por canal
3. **03_opportunities.sql** - Oportunidades de arbitraje en diferentes estados
4. **04_opportunity_costs.sql** - Costes adicionales de oportunidades
5. **05_compras.sql** - Compras reales (genera stock automáticamente)
6. **06_ventas.sql** - Ventas reales (descuenta stock automáticamente)

## 🚀 Uso Rápido

### Cargar todos los fixtures

**Opción 1: Desde el host (recomendado)**
```bash
# Si tienes psql instalado localmente
cd supabase/fixtures
psql -h localhost -p 54322 -U postgres -d postgres -f load.sql
```

**Opción 2: Copiar archivos al contenedor y ejecutar**
```bash
# Copiar fixtures al contenedor
docker cp supabase/fixtures/. arbitraje-supabase-db:/tmp/fixtures/

# Ejecutar desde dentro del contenedor
docker-compose exec supabase-db psql -U postgres -d postgres -f /tmp/fixtures/load.sql
```

**Opción 3: Ejecutar directamente con redirección (Windows PowerShell)**
```powershell
# Ejecutar cada archivo individualmente
Get-Content supabase/fixtures/01_channels.sql | docker-compose exec -T supabase-db psql -U postgres -d postgres
Get-Content supabase/fixtures/02_channel_costs.sql | docker-compose exec -T supabase-db psql -U postgres -d postgres
Get-Content supabase/fixtures/03_opportunities.sql | docker-compose exec -T supabase-db psql -U postgres -d postgres
Get-Content supabase/fixtures/04_opportunity_costs.sql | docker-compose exec -T supabase-db psql -U postgres -d postgres
Get-Content supabase/fixtures/05_compras.sql | docker-compose exec -T supabase-db psql -U postgres -d postgres
Get-Content supabase/fixtures/06_ventas.sql | docker-compose exec -T supabase-db psql -U postgres -d postgres
```

**Opción 4: Script PowerShell (Windows)**
```powershell
# Crear script load-fixtures.ps1
$fixtures = @(
    "01_channels.sql",
    "02_channel_costs.sql",
    "03_opportunities.sql",
    "04_opportunity_costs.sql",
    "05_compras.sql",
    "06_ventas.sql"
)

foreach ($file in $fixtures) {
    Write-Host "Cargando $file..."
    Get-Content "supabase/fixtures/$file" | docker-compose exec -T supabase-db psql -U postgres -d postgres
}
```

### Cargar un fixture individual

```bash
# Desde el host
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/fixtures/01_channels.sql

# O desde Docker (copiando primero)
docker cp supabase/fixtures/01_channels.sql arbitraje-supabase-db:/tmp/
docker-compose exec supabase-db psql -U postgres -d postgres -f /tmp/01_channels.sql
```

## 🔄 Resetear y Recargar

### Opción 1: Resetear base de datos completa

```bash
# Detener contenedores
docker-compose down

# Eliminar volúmenes (⚠️ elimina TODOS los datos)
docker-compose down -v

# Levantar de nuevo (se ejecuta init-db.sql automáticamente)
docker-compose up -d

# Esperar a que la BD esté lista
sleep 10

# Cargar fixtures
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/fixtures/load.sql
```

### Opción 2: Limpiar y recargar (sin resetear esquema)

```sql
-- Conectar a la base de datos
psql -h localhost -p 54322 -U postgres -d postgres

-- Limpiar datos (respetando el esquema)
TRUNCATE TABLE ventas CASCADE;
TRUNCATE TABLE stock CASCADE;
TRUNCATE TABLE compras CASCADE;
TRUNCATE TABLE opportunity_costs CASCADE;
TRUNCATE TABLE opportunities CASCADE;
TRUNCATE TABLE channel_costs CASCADE;
TRUNCATE TABLE channels CASCADE;

-- Salir y cargar fixtures
\q
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/fixtures/load.sql
```

## 📊 Datos Incluidos

### Canales (5)
- Amazon España
- eBay
- AliExpress
- Wallapop
- Vinted

### Oportunidades (12)
- **5 detectadas**: Sin convertir aún (AirPods, Nike, iPhone, Samsung Watch, North Face)
- **3 descartadas**: Rechazadas por bajo margen (MacBook, PS5, Sony Headphones)
- **4 convertidas**: Ya compradas (Apple Watch, Nike Dunk, iPad Air, Patagonia)

### Compras (4)
- Apple Watch Series 9 (2 unidades)
- Nike Dunk Low Panda (3 unidades)
- iPad Air 5 (1 unidad)
- Chaqueta Patagonia (2 unidades)

### Stock (4)
- Generado automáticamente por trigger al crear compras
- Algunos con stock parcial (vendido parcialmente)

### Ventas (6)
- Varias ventas de diferentes productos
- Algunas completas, otras parciales
- Diferentes canales destino

## 🔍 Verificar Datos

```sql
-- Ver resumen de datos
SELECT 
    'Canales' as tabla, COUNT(*) as total FROM channels
UNION ALL
SELECT 'Oportunidades', COUNT(*) FROM opportunities
UNION ALL
SELECT 'Compras', COUNT(*) FROM compras
UNION ALL
SELECT 'Stock', COUNT(*) FROM stock
UNION ALL
SELECT 'Ventas', COUNT(*) FROM ventas;

-- Ver oportunidades por estado
SELECT status, COUNT(*) 
FROM opportunities 
GROUP BY status;

-- Ver stock disponible
SELECT 
    s.id,
    c.product_name,
    s.unidades_disponibles,
    s.unidades_iniciales,
    s.coste_unitario_real
FROM stock s
JOIN compras c ON s.compra_id = c.id
WHERE s.unidades_disponibles > 0;
```

## ⚠️ Notas Importantes

1. **Triggers Automáticos**:
   - Al insertar una `compra`, se crea automáticamente el `stock` correspondiente
   - Al insertar una `venta`, se descuentan automáticamente las unidades del `stock`

2. **UUIDs Explícitos**:
   - Los fixtures usan UUIDs explícitos para mantener relaciones consistentes
   - Esto permite re-ejecutar los fixtures sin duplicar datos (gracias a `ON CONFLICT DO NOTHING`)

3. **Datos Realistas**:
   - Productos reales (electrónica, ropa, accesorios)
   - Precios coherentes con el mercado
   - Márgenes razonables
   - Fechas variadas (últimos días/meses)

4. **Re-ejecución Segura**:
   - Todos los fixtures usan `ON CONFLICT DO NOTHING`
   - Puedes ejecutar `load.sql` múltiples veces sin problemas
   - Los datos no se duplicarán

## 🛠️ Desarrollo

### Añadir nuevos fixtures

1. Crea un nuevo archivo `07_nueva_tabla.sql` si es necesario
2. Añade la referencia en `load.sql`
3. Usa UUIDs explícitos para mantener relaciones
4. Incluye `ON CONFLICT DO NOTHING` para permitir re-ejecución

### Modificar fixtures existentes

1. Edita el archivo SQL correspondiente
2. Si cambias UUIDs, actualiza todas las referencias relacionadas
3. Prueba la carga completa con `load.sql`

## 📝 Troubleshooting

### Error: "relation does not exist"
- Asegúrate de que el esquema esté inicializado (`init-db.sql` ejecutado)
- Verifica que los contenedores estén corriendo: `docker-compose ps`

### Error: "foreign key constraint"
- Verifica que los fixtures se ejecuten en orden
- Revisa que los UUIDs referenciados existan en las tablas padre

### Los triggers no funcionan
- Verifica que los triggers estén creados: `\d+ compras` y `\d+ ventas`
- Revisa los logs de PostgreSQL: `docker-compose logs supabase-db`

## 🔗 Relaciones de Datos

```
channels
  ├── channel_costs
  ├── opportunities (canal_origen_id, canal_destino_id)
  ├── compras (canal_origen_id)
  └── ventas (canal_destino_id)

opportunities
  ├── opportunity_costs
  └── compras (oportunidad_id)

compras
  └── stock (generado automáticamente por trigger)

stock
  └── ventas (descuenta unidades automáticamente por trigger)
```

---

**Última actualización**: Fixtures generados para desarrollo local
