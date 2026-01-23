# Despliegue en Producción - Resumen Rápido

## Setup Recomendado

- **Frontend**: GitHub Pages (gratis)
- **Backend**: Railway (plan gratuito disponible)
- **Base de Datos**: Supabase Cloud (plan gratuito disponible)

## Pasos Rápidos

### 1. Supabase Cloud

1. Crea proyecto en [supabase.com](https://supabase.com)
2. Ejecuta `init-db.sql` en SQL Editor
3. Obtén: URL, Anon Key, Service Role Key

### 2. Railway (Backend)

1. Conecta repositorio de GitHub
2. Railway detectará `Dockerfile.backend` automáticamente
3. Configura variables de entorno:
   ```env
   ENVIRONMENT=production
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_ANON_KEY=tu-anon-key
   SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
   CORS_ORIGINS=https://tu-usuario.github.io
   ```

### 3. GitHub Pages (Frontend)

1. **Opcional**: Configura secret `API_BASE_URL` en GitHub (Settings > Secrets)
   - Si no lo configuras, se usará el valor por defecto del workflow
2. El workflow `.github/workflows/deploy.yml` se ejecutará automáticamente al hacer push
3. Habilita GitHub Pages (Settings > Pages > Source: `GitHub Actions`)

### 4. CORS

✅ **Ya configurado**: El código lee `CORS_ORIGINS` desde variables de entorno. Solo añade la variable en Railway (ver Paso 2). No necesitas modificar código.

## Documentación Completa

- **Guía completa**: Ver [DEPLOY.md](DEPLOY.md)
- **Railway específico**: Ver [DEPLOY-RAILWAY.md](DEPLOY-RAILWAY.md)
- **GitHub Pages específico**: Ver [DEPLOY-GITHUB-PAGES.md](DEPLOY-GITHUB-PAGES.md)

## Verificación

```bash
# Backend
curl https://tu-backend.railway.app/health

# Frontend
# Abre https://tu-usuario.github.io/arbitraje-gestion
```
