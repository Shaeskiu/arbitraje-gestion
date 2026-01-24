-- ============================================
-- Script para crear usuarios en Supabase Local
-- ============================================
-- Este script crea un usuario de prueba directamente en la base de datos
-- 
-- Uso:
--   docker-compose exec supabase-db psql -U postgres -d postgres -f /tmp/create-user.sql
--   O copia el contenido y ejecútalo en la consola de PostgreSQL

-- Crear un usuario de prueba
-- Email: test@ejemplo.com
-- Password: password123
-- 
-- NOTA: La contraseña debe estar hasheada. Este script usa una función de GoTrue
-- para crear el hash correctamente.

-- Primero, asegurémonos de que la extensión necesaria esté habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insertar usuario directamente en auth.users
-- El hash de la contraseña 'password123' usando bcrypt
-- Este hash es para la contraseña 'password123' con salt automático
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
    is_super_admin,
    confirmation_token,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'test@ejemplo.com',
    crypt('password123', gen_salt('bf')), -- Hashea la contraseña
    NOW(), -- Email confirmado automáticamente
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"created_via":"sql_script"}',
    false,
    '',
    ''
) ON CONFLICT (email) DO NOTHING;

-- Verificar que el usuario se creó
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'test@ejemplo.com';

-- Mensaje de confirmación
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'test@ejemplo.com') THEN
        RAISE NOTICE '✅ Usuario creado exitosamente: test@ejemplo.com / password123';
    ELSE
        RAISE NOTICE '⚠️  El usuario ya existe o hubo un error';
    END IF;
END $$;
