# Guía de Despliegue del Frontend en GitHub Pages

## Opción 1: Usando GitHub Actions (Recomendado) ✅

Ya está configurado el workflow `.github/workflows/deploy.yml`. Este workflow:
- ✅ Genera automáticamente `config.js` con la URL del backend
- ✅ Usa el secret `API_BASE_URL` si está configurado
- ✅ Tiene un fallback a `https://arbitraje-gestion-production.up.railway.app` si no hay secret

### Paso 1: Configurar Secret en GitHub (Opcional pero Recomendado)

**Nota**: El workflow funcionará sin el secret (usará el fallback), pero es mejor configurarlo para flexibilidad.

1. Ve a tu repositorio en GitHub
2. Settings > Secrets and variables > Actions
3. New repository secret:
   - **Name**: `API_BASE_URL`
   - **Value**: `https://tu-backend.railway.app` (tu URL real de Railway)
4. Si no configuras el secret, se usará el valor por defecto del workflow

### Paso 2: Habilitar GitHub Pages

1. Ve a Settings > Pages
2. Source: `GitHub Actions`
3. Guarda los cambios

### Paso 3: Hacer Push

Cada vez que hagas push a `main` con cambios en `frontend/`, se desplegará automáticamente.

---

## Opción 2: Manual (Sin GitHub Actions)

### Paso 1: Generar config.js manualmente

1. Edita `frontend/config.js`:
   ```javascript
   window.APP_CONFIG = {
       API_BASE_URL: 'https://tu-backend.railway.app'
   };
   ```

2. **Commit y push**:
   ```bash
   git add frontend/config.js
   git commit -m "Update API URL for production"
   git push
   ```

### Paso 2: Configurar GitHub Pages

1. Ve a Settings > Pages
2. Source: `Deploy from a branch`
3. Branch: `main` (o `gh-pages` si prefieres)
4. Folder: `/frontend`
5. Save

### Paso 3: Verificar

- Tu sitio estará disponible en: `https://tu-usuario.github.io/arbitraje-gestion`
- O en: `https://tu-usuario.github.io` si pusiste `/frontend` como raíz

---

## Configuración de CORS en el Backend

✅ **Ya configurado**: El backend lee `CORS_ORIGINS` desde variables de entorno. Solo añade la variable en Railway (ver guía de Railway).

---

## Troubleshooting

### El frontend no carga

- Verifica que `config.js` exista en `frontend/`
- Revisa la consola del navegador (F12) para errores
- Verifica que GitHub Pages esté habilitado

### Errores de CORS

- Añade tu dominio de GitHub Pages a `allowedOrigins` en el backend
- Verifica que la URL del backend sea correcta en `config.js`

### El frontend no se actualiza

- GitHub Pages puede tardar unos minutos en actualizar
- Fuerza un nuevo despliegue desde Actions > Deploy Frontend > Run workflow
