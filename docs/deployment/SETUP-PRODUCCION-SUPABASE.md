# Configuración de Supabase para Producción

Esta guía explica paso a paso cómo configurar Supabase Cloud para producción.

## 📋 Checklist de Configuración

### 1. Crear/Configurar Proyecto en Supabase Cloud

1. Ve a [supabase.com](https://supabase.com) e inicia sesión
2. Si no tienes un proyecto, crea uno nuevo:
   - Haz clic en **New Project**
   - Completa el formulario (nombre, contraseña de base de datos, región)
   - Espera a que se cree el proyecto (puede tardar 2-3 minutos)

### 2. Obtener las Credenciales de Supabase

1. En tu proyecto de Supabase, ve a **Settings** (⚙️) en el menú lateral
2. Haz clic en **API**
3. Copia los siguientes valores:

   - **Project URL**: `https://xxxxx.supabase.co`
     - Este es tu `SUPABASE_URL`
   
   - **Project API keys**:
     - **anon** `public`: Esta es tu `SUPABASE_ANON_KEY` (para el frontend)
     - **service_role** `secret`: Esta es tu `SUPABASE_SERVICE_ROLE_KEY` (para el backend)

### 3. Configurar Variables de Entorno en Railway (Backend)

1. Ve a tu proyecto en [Railway](https://railway.app)
2. Selecciona el servicio del **backend**
3. Ve a la pestaña **Variables**
4. Añade o actualiza las siguientes variables:

   ```
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   **Importante**: 
   - Usa la **Project URL** completa (con `https://`) para `SUPABASE_URL`
   - Usa la clave **service_role** (NO la anon) para `SUPABASE_SERVICE_ROLE_KEY`
   - Esta clave es secreta y solo debe estar en el backend

5. Guarda los cambios. Railway reiniciará automáticamente el backend.

### 4. Configurar Secrets en GitHub Actions (Frontend)

1. Ve a tu repositorio en GitHub
2. Ve a **Settings** > **Secrets and variables** > **Actions**
3. Añade los siguientes secrets:

   **Secret 1: `SUPABASE_URL`**
   - Name: `SUPABASE_URL`
   - Value: `https://xxxxx.supabase.co` (tu Project URL)

   **Secret 2: `SUPABASE_ANON_KEY`**
   - Name: `SUPABASE_ANON_KEY`
   - Value: La clave **anon** `public` (NO la service_role)

4. Verifica que también tengas configurado:
   - `API_BASE_URL` (debería estar ya configurado)

### 6. Configurar Autenticación en Supabase

#### 5.1. Habilitar Email/Password (si no está habilitado)

1. En Supabase, ve a **Authentication** > **Providers**
2. Asegúrate de que **Email** esté habilitado
3. Configura las opciones según necesites:
   - **Enable email confirmations**: Recomendado activarlo en producción
   - **Secure email change**: Recomendado activarlo

#### 5.2. Configurar URLs Permitidas

1. Ve a **Authentication** > **URL Configuration**
2. Añade las siguientes URLs en **Site URL**:
   - URL de tu frontend en producción (ej: `https://tu-usuario.github.io/arbitraje-gestion`)
   - URL de desarrollo local (opcional): `http://localhost:3000`

3. En **Redirect URLs**, añade:
   - `https://tu-usuario.github.io/arbitraje-gestion/**`
   - `http://localhost:3000/**` (para desarrollo)

#### 5.3. Configurar Email (Opcional pero Recomendado)

Si quieres que los usuarios reciban emails de confirmación:

1. Ve a **Authentication** > **Email Templates**
2. Personaliza los templates si lo deseas
3. Para desarrollo, puedes usar el modo "Auto Confirm" (los emails se confirman automáticamente)

### 7. Aplicar el Esquema de Base de Datos

Si aún no has aplicado el esquema de tu base de datos a Supabase Cloud:

1. Ve a **SQL Editor** en Supabase
2. Ejecuta los scripts SQL en este orden:
   - `init-db.sql` (si es necesario)
   - `supabase/schema/supabase-schema.sql`
   - `supabase/schema/supabase-channels-schema.sql`
   - `supabase/schema/supabase-new-schema.sql`
   - `supabase/migrations/add-stock-estados-localizaciones.sql`
   - Cualquier otra migración pendiente

**Nota**: El esquema `auth` ya existe en Supabase Cloud, no necesitas crearlo.

### 8. Verificar que Todo Funciona

#### 7.1. Verificar Backend

1. Ve a tu backend en Railway
2. Revisa los logs para asegurarte de que no hay errores
3. Prueba el endpoint de health:
   ```bash
   curl https://tu-backend.railway.app/health
   ```

#### 7.2. Verificar Frontend

1. Despliega el frontend (haz push a `main` o ejecuta el workflow manualmente)
2. Abre la aplicación en producción
3. Intenta crear un usuario:
   - Deberías poder registrarte
   - Si tienes confirmación de email habilitada, recibirás un email
   - Si no, el usuario se creará automáticamente

#### 7.3. Verificar Autenticación

1. Intenta hacer login con un usuario creado
2. Verifica que puedas acceder a las vistas protegidas
3. Verifica que el logout funcione correctamente

## 🔒 Seguridad en Producción

### Variables de Entorno

- ✅ **SUPABASE_ANON_KEY**: Puede estar en el frontend (es pública)
- ✅ **SUPABASE_SERVICE_ROLE_KEY**: SOLO en el backend, NUNCA en el frontend
- ✅ **SUPABASE_URL**: Puede estar en ambos (no es secreta)

### Row Level Security (RLS)

Tu base de datos ya tiene RLS habilitado con políticas que permiten todo. En producción, considera:

1. Revisar las políticas de RLS en Supabase
2. Ajustar las políticas según tus necesidades de seguridad
3. Verificar que los usuarios solo puedan acceder a sus propios datos si es necesario

## 🐛 Troubleshooting

### Error: "Invalid API key"

- Verifica que `SUPABASE_ANON_KEY` en GitHub Actions sea la clave **anon** `public`
- Verifica que `SUPABASE_SERVICE_ROLE_KEY` en Railway sea la clave **service_role**

### Error: "Invalid URL"

- Verifica que `SUPABASE_URL` tenga el formato correcto: `https://xxxxx.supabase.co`
- Asegúrate de que no tenga una barra final (`/`)

### La autenticación no funciona en producción

1. Verifica que las URLs estén configuradas correctamente en Supabase
2. Revisa la consola del navegador para ver errores
3. Verifica que los secrets de GitHub Actions estén configurados
4. Asegúrate de que el frontend se haya desplegado después de configurar los secrets

### Los usuarios no pueden registrarse

1. Verifica que el provider de Email esté habilitado en Supabase
2. Revisa la configuración de confirmación de email
3. Verifica los logs de Supabase en **Authentication** > **Logs**

## 📝 Resumen de Configuración

### Backend (Railway)
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Frontend (GitHub Actions Secrets)
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
API_BASE_URL=https://tu-backend.railway.app
```

### Supabase Cloud
- ✅ Proyecto creado
- ✅ Email/Password habilitado
- ✅ URLs configuradas
- ✅ Esquema de base de datos aplicado

## ✅ Checklist Final

- [ ] Proyecto creado en Supabase Cloud
- [ ] Credenciales obtenidas (URL, anon key, service_role key)
- [ ] Variables configuradas en Railway (backend)
- [ ] Secrets configurados en GitHub Actions (frontend)
- [ ] Autenticación configurada en Supabase
- [ ] URLs permitidas configuradas
- [ ] Esquema de base de datos aplicado
- [ ] Backend funcionando correctamente
- [ ] Frontend desplegado y funcionando
- [ ] Autenticación probada en producción

## 🎉 ¡Listo!

Una vez completado este checklist, tu aplicación debería estar funcionando correctamente en producción con autenticación de Supabase.
