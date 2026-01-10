# Verificación de Integración con Supabase

## ✅ Pasos de Verificación

### 1. Verificar que el esquema está creado
1. Ve al dashboard de Supabase
2. Navega a **Table Editor**
3. Deberías ver dos tablas:
   - `opportunities`
   - `opportunity_costs`

### 2. Verificar que las políticas RLS están activas
1. Ve a **Authentication** > **Policies**
2. Verifica que las políticas permiten todas las operaciones (si no hay autenticación)

### 3. Probar la aplicación
1. Abre `index.html` en el navegador
2. Abre la consola del navegador (F12)
3. Intenta crear una nueva oportunidad
4. Verifica en la consola que no hay errores
5. Verifica en Supabase que los datos se guardaron correctamente

### 4. Verificar transformación de datos
Los datos se transforman automáticamente entre:
- **Frontend (camelCase)**: `productName`, `originPrice`, etc.
- **Base de datos (snake_case)**: `product_name`, `origin_price`, etc.

## 🔍 Debugging

### Si hay errores de conexión:
1. Verifica que la URL y API Key son correctas en `js/storage.js`
2. Verifica que el script de Supabase se carga antes que `storage.js`
3. Revisa la consola del navegador para errores específicos

### Si los datos no se guardan:
1. Verifica las políticas RLS en Supabase
2. Verifica que las tablas existen y tienen las columnas correctas
3. Revisa la consola para errores de validación

### Si los costes no se guardan:
1. Verifica que la relación entre tablas está correcta
2. Verifica que `opportunity_costs.opportunity_id` es una FK válida
3. Revisa que los costes se insertan después de crear la oportunidad

## 📊 Estructura de Datos Esperada

### Oportunidad en la BD:
```sql
SELECT * FROM opportunities;
```

### Costes en la BD:
```sql
SELECT * FROM opportunity_costs;
```

### Oportunidad con costes (join):
```sql
SELECT 
    o.*,
    json_agg(oc.*) as costs
FROM opportunities o
LEFT JOIN opportunity_costs oc ON o.id = oc.opportunity_id
GROUP BY o.id;
```

## 🚨 Errores Comunes

### Error: "relation does not exist"
- **Solución**: Ejecuta el script SQL `supabase-schema.sql` en Supabase

### Error: "new row violates row-level security policy"
- **Solución**: Verifica que las políticas RLS permiten las operaciones necesarias

### Error: "invalid input syntax for type uuid"
- **Solución**: Asegúrate de que los IDs son UUIDs válidos (Supabase los genera automáticamente)

### Error: "null value in column violates not-null constraint"
- **Solución**: Verifica que todos los campos requeridos se están enviando

## ✅ Checklist Final

- [ ] Esquema creado en Supabase
- [ ] Políticas RLS configuradas
- [ ] Script de Supabase cargado en HTML
- [ ] Credenciales correctas en `storage.js`
- [ ] Aplicación carga sin errores
- [ ] Puedo crear oportunidades
- [ ] Puedo añadir costes
- [ ] Los datos aparecen en Supabase
- [ ] Puedo editar oportunidades
- [ ] Puedo eliminar oportunidades
