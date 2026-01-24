# Guía de Configuración de Secrets en GitHub Actions

Esta guía explica cómo configurar los secrets necesarios en GitHub Actions para el despliegue del frontend con autenticación de Supabase.

## ¿Qué son los Secrets?

Los secrets en GitHub son variables de entorno encriptadas que se pueden usar en tus workflows de GitHub Actions. Son ideales para almacenar información sensible como claves de API, URLs de servicios, etc.

## Secrets Necesarios para la Aplicación

Para que la aplicación funcione correctamente con autenticación, necesitas configurar los siguientes secrets:

1. **`API_BASE_URL`** - URL del backend (ya debería estar configurado)
2. **`SUPABASE_URL`** - URL de tu proyecto Supabase
3. **`SUPABASE_ANON_KEY`** - Clave anónima pública de Supabase

## Paso 1: Acceder a la Configuración de Secrets

1. Ve a tu repositorio en GitHub
2. Haz clic en **Settings** (Configuración) en la barra superior del repositorio
3. En el menú lateral izquierdo, ve a **Secrets and variables** > **Actions**
4. Verás una lista de secrets existentes (si hay alguno)

## Paso 2: Añadir el Secret `SUPABASE_URL`

### Para Supabase Cloud (Producción):

1. Haz clic en **New repository secret** (Nuevo secret del repositorio)
2. En **Name**, escribe: `SUPABASE_URL`
3. En **Secret**, pega la URL de tu proyecto Supabase:
   - Ve a tu proyecto en [supabase.com](https://supabase.com)
   - Ve a **Settings** > **API**
   - Copia la **Project URL** (ejemplo: `https://xxxxx.supabase.co`)
4. Haz clic en **Add secret**

### Para Supabase Local (Desarrollo/Testing):

Si estás usando Supabase Local para testing, usa:
- **Name**: `SUPABASE_URL`
- **Secret**: `http://localhost:8000`

**Nota**: Para producción, siempre usa la URL de Supabase Cloud.

## Paso 3: Añadir el Secret `SUPABASE_ANON_KEY`

### Para Supabase Cloud (Producción):

1. Haz clic en **New repository secret** nuevamente
2. En **Name**, escribe: `SUPABASE_ANON_KEY`
3. En **Secret**, pega la clave anónima:
   - En el mismo lugar (Settings > API de tu proyecto Supabase)
   - Busca la sección **Project API keys**
   - Copia la clave **anon** `public` (no la `service_role`)
4. Haz clic en **Add secret**

### Para Supabase Local (Desarrollo/Testing):

Si estás usando Supabase Local, usa el valor por defecto:
- **Name**: `SUPABASE_ANON_KEY`
- **Secret**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0`

**Nota**: Este es el valor por defecto de Supabase Local y solo debe usarse para desarrollo/testing.

## Paso 4: Verificar los Secrets Configurados

Después de añadir los secrets, deberías ver una lista similar a esta:

- `API_BASE_URL` (si ya estaba configurado)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

**Importante**: Una vez creados, los secrets no se pueden ver de nuevo. Solo puedes actualizarlos o eliminarlos.

## Paso 5: Verificar que el Workflow Funciona

1. Ve a la pestaña **Actions** en tu repositorio
2. Si hay un workflow en ejecución, espera a que termine
3. Si no hay ninguno, puedes:
   - Hacer un push a `main` con cambios en `frontend/`
   - O ir a **Actions** > **Deploy Frontend to GitHub Pages** > **Run workflow**

4. Revisa los logs del workflow:
   - Deberías ver mensajes como:
     - `✅ config.js generado con API_BASE_URL=..., SUPABASE_URL=...`
   - Si ves advertencias sobre valores por defecto, significa que los secrets no están configurados

## Valores por Defecto

Si no configuras los secrets, el workflow usará valores por defecto para desarrollo local:
- `SUPABASE_URL`: `http://localhost:8000`
- `SUPABASE_ANON_KEY`: Valor por defecto de Supabase Local

Estos valores funcionarán para testing, pero **NO** para producción. Para producción, siempre configura los secrets con los valores de Supabase Cloud.

## Actualizar un Secret Existente

Si necesitas actualizar un secret:

1. Ve a **Settings** > **Secrets and variables** > **Actions**
2. Encuentra el secret que quieres actualizar
3. Haz clic en el icono de lápiz (✏️) a la derecha
4. Actualiza el valor
5. Haz clic en **Update secret**

## Eliminar un Secret

Si necesitas eliminar un secret:

1. Ve a **Settings** > **Secrets and variables** > **Actions**
2. Encuentra el secret que quieres eliminar
3. Haz clic en el icono de papelera (🗑️) a la derecha
4. Confirma la eliminación

## Troubleshooting

### El workflow falla con "config.js generado" pero la app no funciona

- Verifica que los secrets estén configurados correctamente
- Revisa los logs del workflow para ver qué valores se están usando
- Asegúrate de que la URL de Supabase sea accesible desde GitHub Pages

### Veo advertencias sobre valores por defecto

Esto significa que los secrets no están configurados. Aunque el workflow funcionará con valores por defecto, deberías configurar los secrets para producción.

### No puedo encontrar la clave anónima en Supabase

1. Ve a tu proyecto en [supabase.com](https://supabase.com)
2. Settings (⚙️) en el menú lateral
3. **API** en la lista de opciones
4. Busca **Project API keys**
5. La clave `anon` `public` es la que necesitas (NO la `service_role`)

### La autenticación no funciona en producción

- Verifica que `SUPABASE_URL` apunte a tu proyecto de Supabase Cloud (no a localhost)
- Verifica que `SUPABASE_ANON_KEY` sea la clave correcta de tu proyecto de Supabase Cloud
- Asegúrate de que los usuarios estén creados en Supabase Cloud (no en Local)

## Seguridad

- **`SUPABASE_ANON_KEY`** es pública y puede estar en el frontend de forma segura
- **`SUPABASE_SERVICE_ROLE_KEY`** NUNCA debe estar en el frontend ni en secrets de GitHub Actions para el frontend
- Los secrets en GitHub están encriptados y solo son accesibles durante la ejecución del workflow

## Referencias

- [Documentación de GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Documentación de Supabase Auth](https://supabase.com/docs/guides/auth)
- [Obtener claves de API de Supabase](https://supabase.com/docs/guides/api#api-keys)
