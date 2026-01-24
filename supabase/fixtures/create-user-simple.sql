-- ============================================
-- Script SIMPLE para crear usuarios en Supabase Local
-- ============================================
-- Este script crea usuarios usando la función de GoTrue directamente
-- 
-- Uso desde Docker:
--   docker-compose exec supabase-db psql -U postgres -d postgres -f /tmp/create-user-simple.sql

-- Crear usuario usando la función de GoTrue (más seguro)
-- Esto asegura que el hash de la contraseña sea correcto

-- Usuario 1: test@ejemplo.com / password123
SELECT auth.users_create_user(
    'test@ejemplo.com',
    'password123',
    '{"created_via":"sql_script"}'::jsonb
);

-- Si la función anterior no existe, usar este método alternativo:
-- INSERT con hash manual (menos recomendado pero funciona)
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

-- Verificar
SELECT 
    id, 
    email, 
    email_confirmed_at IS NOT NULL as email_confirmed,
    created_at 
FROM auth.users 
WHERE email = 'test@ejemplo.com';
