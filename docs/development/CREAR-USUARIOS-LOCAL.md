# Crear Usuarios en Supabase Local

En desarrollo local, la forma más simple de crear usuarios es directamente en la base de datos.

## Método 1: Usando SQL directamente (Recomendado)

### Opción A: Desde la línea de comandos

```bash
# Conectarse a la base de datos
docker-compose exec supabase-db psql -U postgres -d postgres

# Luego ejecutar este SQL:
```

```sql
-- Crear usuario: test@ejemplo.com / password123
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin
) 
SELECT 
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'test@ejemplo.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"created_via":"sql_script"}'::jsonb,
    false
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'test@ejemplo.com'
);
```

### Opción B: Usando el script SQL

```bash
# Copiar el script a la base de datos
docker cp supabase/fixtures/create-user-simple.sql arbitraje-supabase-db:/tmp/

# Ejecutar el script
docker-compose exec supabase-db psql -U postgres -d postgres -f /tmp/create-user-simple.sql
```

## Método 2: Desde el frontend (si CORS está configurado)

Si CORS está funcionando correctamente, puedes crear usuarios desde la consola del navegador:

```javascript
// En la consola del navegador (F12):
const client = window.supabaseClient || window.getSupabaseClient();
const { data, error } = await client.auth.signUp({
  email: 'test@ejemplo.com',
  password: 'password123'
});

if (error) {
  console.error('Error:', error);
} else {
  console.log('Usuario creado:', data);
}
```

## Verificar usuarios existentes

```sql
-- Ver todos los usuarios
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
ORDER BY created_at DESC;
```

## Eliminar un usuario

```sql
-- Eliminar usuario por email
DELETE FROM auth.users WHERE email = 'test@ejemplo.com';
```

## Notas importantes

1. **En producción**: Los usuarios se crearán normalmente usando el sistema de registro o el endpoint del backend (que funciona perfectamente con Supabase Cloud).

2. **En local**: Es más simple crear usuarios directamente en la base de datos para desarrollo.

3. **Contraseñas**: Las contraseñas se hashean automáticamente usando `crypt()` con bcrypt.

4. **Email confirmado**: El script marca el email como confirmado automáticamente (`email_confirmed_at = NOW()`), así que puedes hacer login inmediatamente.

## Usuarios de prueba recomendados

Puedes crear varios usuarios de prueba:

```sql
-- Usuario 1: Admin
INSERT INTO auth.users (...) VALUES (..., 'admin@test.com', crypt('admin123', gen_salt('bf')), ...);

-- Usuario 2: Usuario normal
INSERT INTO auth.users (...) VALUES (..., 'user@test.com', crypt('user123', gen_salt('bf')), ...);
```
