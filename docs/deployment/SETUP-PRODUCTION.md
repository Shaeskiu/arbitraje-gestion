# Checklist de Configuración para Producción

Sigue estos pasos en orden para desplegar tu aplicación en producción.

## ✅ Paso 1: Supabase Cloud

- [ ] Crear proyecto en [supabase.com](https://supabase.com)
- [ ] Ejecutar `init-db.sql` completo en SQL Editor
- [ ] Verificar que las tablas se hayan creado (Table Editor)
- [ ] Obtener credenciales:
  - [ ] URL del proyecto (Settings > API > Project URL)
  - [ ] Anon Key (Settings > API > anon public)
  - [ ] Service Role Key (Settings > API > service_role secret)

## ✅ Paso 2: Railway (Backend)

- [ ] Conectar repositorio de GitHub a Railway
- [ ] Railway detectará `Dockerfile.backend` automáticamente
- [ ] Configurar variables de entorno en Railway:
  ```env
  ENVIRONMENT=production
  NODE_ENV=production
  PORT=3001
  SUPABASE_URL=https://tu-proyecto.supabase.co
  SUPABASE_ANON_KEY=tu-anon-key-real
  SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-real
  CORS_ORIGINS=https://tu-usuario.github.io
  ```
  **Nota**: `CORS_ORIGINS` permite cambiar dominios sin modificar código. Separa múltiples orígenes con comas.
- [ ] Obtener URL del backend de Railway (ej: `https://tu-proyecto.up.railway.app`)
- [ ] Probar: `curl https://tu-proyecto.up.railway.app/health`

## ✅ Paso 3: Configurar CORS (Ya está hecho ✅)

- [x] El código ya lee `CORS_ORIGINS` desde variables de entorno
- [x] Solo necesitas añadir `CORS_ORIGINS` en Railway (ver Paso 2)
- [x] No necesitas modificar código para cambiar dominios

## ✅ Paso 4: GitHub Pages (Frontend)

- [ ] **Opcional**: Configurar Secret en GitHub (recomendado para flexibilidad):
  - Settings > Secrets and variables > Actions
  - New repository secret: `API_BASE_URL`
  - Value: `https://tu-backend.railway.app`
  - **Nota**: Si no lo configuras, el workflow usará el valor por defecto
- [ ] Habilitar GitHub Pages:
  - Settings > Pages
  - Source: `GitHub Actions`
- [ ] Hacer push a `main` (el workflow `.github/workflows/deploy.yml` se ejecutará automáticamente)
- [ ] Verificar despliegue en Actions tab

## ✅ Paso 5: Verificación Final

- [ ] Backend responde: `curl https://tu-backend.railway.app/health`
- [ ] Frontend carga: `https://tu-usuario.github.io/arbitraje-gestion`
- [ ] No hay errores en consola del navegador (F12)
- [ ] Las peticiones funcionan (crear oportunidad, etc.)
- [ ] Los datos se guardan en Supabase Cloud

## 🔧 Comandos Útiles

```bash
# Ver logs de Railway
railway logs

# Ver estado del despliegue en GitHub
# Ve a Actions tab en GitHub

# Probar endpoints del backend
curl https://tu-backend.railway.app/health
curl https://tu-backend.railway.app/channels
```

## 📝 Notas Importantes

1. **No uses Supabase Local en producción**: Solo para desarrollo
2. **Service Role Key**: Solo en el backend, nunca en el frontend
3. **CORS**: Asegúrate de añadir todos los dominios que uses
4. **Variables de entorno**: Nunca las subas al repositorio
5. **Backups**: Supabase Cloud tiene backups automáticos
