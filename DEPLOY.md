# Guía de Despliegue en Producción

Esta guía explica cómo desplegar la aplicación dockerizada en producción, manteniendo tu setup actual (GitHub Pages + Railway) o usando alternativas.

## 📋 Opciones de Despliegue

### Opción 1: Setup Actual (Recomendado) ✅
**Frontend**: GitHub Pages  
**Backend**: Railway  
**Base de Datos**: Supabase Cloud

### Opción 2: Todo en Railway
**Frontend + Backend**: Railway (con Docker Compose)

### Opción 3: Todo en Render/Fly.io
**Frontend + Backend**: Render o Fly.io

---

## 🚀 Opción 1: Setup Actual (GitHub Pages + Railway + Supabase Cloud)

Esta es la opción más simple y económica. Mantienes tu infraestructura actual pero actualizas las variables de entorno.

### Paso 1: Configurar Supabase Cloud

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto (o usa uno existente)
2. Obtén las credenciales:
   - **URL del proyecto**: `https://tu-proyecto.supabase.co`
   - **Anon Key**: En Settings > API > anon public key
   - **Service Role Key**: En Settings > API > service_role secret key

3. **Ejecuta las migraciones SQL**:
   - Ve a SQL Editor en Supabase
   - Ejecuta el contenido de `init-db.sql` completo
   - Verifica que las tablas se hayan creado

### Paso 2: Configurar Railway (Backend)

1. **En Railway Dashboard**:
   - Ve a tu proyecto del backend
   - Ve a la pestaña **Variables**

2. **Configura las variables de entorno**:
   ```env
   ENVIRONMENT=production
   PORT=3001
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_ANON_KEY=tu-anon-key-de-supabase
   SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-de-supabase
   NODE_ENV=production
   ```

3. **Configurar el despliegue**:
   - Railway detectará automáticamente el `Dockerfile.backend`
   - O puedes configurar el **Root Directory** como `backend/`
   - El **Build Command** será automático
   - El **Start Command**: `node index.js`

4. **Configurar CORS mediante variable de entorno**:
   - Añade la variable `CORS_ORIGINS` en Railway:
   ```env
   CORS_ORIGINS=https://tu-usuario.github.io,https://staging.tu-dominio.com
   ```
   - Los orígenes se separan por comas
   - No necesitas modificar código, solo la variable de entorno
   - Para desarrollo local, se usan valores por defecto automáticamente

### Paso 3: Configurar GitHub Pages (Frontend)

1. **Crear script de build para producción**:
   
   Crea `build-frontend.sh`:
   ```bash
   #!/bin/bash
   # Script para generar config.js con la URL de producción
   
   API_URL="${API_BASE_URL:-https://tu-backend.railway.app}"
   
   cat > frontend/config.js << EOF
   window.APP_CONFIG = {
       API_BASE_URL: '${API_URL}'
   };
   EOF
   
   echo "✅ config.js generado con API_BASE_URL=${API_URL}"
   ```

2. **Configurar GitHub Actions** (opcional pero recomendado):
   
   Crea `.github/workflows/deploy.yml`:
   ```yaml
   name: Deploy to GitHub Pages
   
   on:
     push:
       branches:
         - main
     workflow_dispatch:
   
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         
         - name: Setup Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '20'
         
         - name: Generate config.js
           run: |
             API_URL="${{ secrets.API_BASE_URL }}"
             cat > frontend/config.js << EOF
             window.APP_CONFIG = {
                 API_BASE_URL: '${API_URL}'
             };
             EOF
         
         - name: Deploy to GitHub Pages
           uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./frontend
   ```

3. **Configurar Secrets en GitHub**:
   - Ve a Settings > Secrets and variables > Actions
   - Añade `API_BASE_URL` con la URL de tu backend en Railway

4. **Configurar GitHub Pages**:
   - Ve a Settings > Pages
   - Source: `Deploy from a branch`
   - Branch: `gh-pages` (o la rama que uses)
   - Folder: `/ (root)` o `/frontend` según tu estructura

### Paso 4: Verificar el Despliegue

1. **Backend**:
   ```bash
   curl https://tu-backend.railway.app/health
   # Debe devolver: {"status":"ok"}
   ```

2. **Frontend**:
   - Abre `https://tu-usuario.github.io/arbitraje-gestion`
   - Abre la consola del navegador (F12)
   - Verifica que no haya errores de conexión

---

## 🚂 Opción 2: Todo en Railway

Railway soporta Docker Compose, así que puedes desplegar todo junto.

### Paso 1: Crear docker-compose.prod.yml

```yaml
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    environment:
      NODE_ENV: production
      PORT: ${PORT}
      SUPABASE_URL: ${SUPABASE_URL}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    environment:
      API_BASE_URL: ${API_BASE_URL}
    restart: unless-stopped
```

### Paso 2: Configurar Railway

1. **Crear nuevo proyecto en Railway**
2. **Conectar tu repositorio de GitHub**
3. **Configurar servicio**:
   - Railway detectará `docker-compose.prod.yml`
   - O puedes usar `docker-compose.yml` y Railway lo adaptará

4. **Variables de entorno**:
   ```env
   ENVIRONMENT=production
   PORT=3001
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_ANON_KEY=tu-anon-key
   SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
   API_BASE_URL=https://tu-backend.railway.app
   ```

5. **Configurar dominios**:
   - Railway asignará URLs automáticamente
   - Puedes configurar dominios personalizados si lo deseas

---

## 🎨 Opción 3: Render

Render también soporta Docker Compose.

### Paso 1: Crear render.yaml

```yaml
services:
  - type: web
    name: arbitraje-backend
    dockerfilePath: ./Dockerfile.backend
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
      - key: SUPABASE_ANON_KEY
        sync: false

  - type: web
    name: arbitraje-frontend
    dockerfilePath: ./Dockerfile.frontend
    envVars:
      - key: API_BASE_URL
        sync: false
```

### Paso 2: Desplegar en Render

1. Conecta tu repositorio de GitHub
2. Render detectará `render.yaml` automáticamente
3. Configura las variables de entorno en el dashboard

---

## 🔧 Configuración de Variables de Entorno por Entorno

### Desarrollo Local (.env)
```env
ENVIRONMENT=development
SUPABASE_URL=http://kong:8000
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
API_BASE_URL=http://localhost:3001
```

### Producción (Railway/Render)
```env
ENVIRONMENT=production
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key-real
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-real
API_BASE_URL=https://tu-backend.railway.app
```

---

## 📝 Checklist de Despliegue

### Antes de Desplegar

- [ ] Variables de entorno configuradas en Railway/Render
- [ ] Supabase Cloud configurado con las migraciones SQL ejecutadas
- [ ] CORS configurado en `backend/index.js` con el dominio de producción
- [ ] `config.js` del frontend apunta a la URL correcta del backend
- [ ] Secrets de GitHub configurados (si usas GitHub Actions)

### Después de Desplegar

- [ ] Backend responde en `/health`
- [ ] Frontend carga correctamente
- [ ] No hay errores en la consola del navegador
- [ ] Las peticiones al backend funcionan
- [ ] La base de datos está accesible desde Supabase Cloud

---

## 🐛 Troubleshooting

### El backend no se conecta a Supabase Cloud

1. Verifica que `SUPABASE_URL` sea correcta (debe empezar con `https://`)
2. Verifica que las keys sean correctas (anon key y service role key)
3. Revisa los logs de Railway: `railway logs`

### El frontend no se conecta al backend

1. Verifica que `API_BASE_URL` en GitHub Pages apunte a la URL correcta de Railway
2. Verifica CORS en `backend/index.js`
3. Abre la consola del navegador y revisa los errores

### Errores 500 en producción

1. Revisa los logs del backend en Railway
2. Verifica que las variables de entorno estén configuradas correctamente
3. Asegúrate de que Supabase Cloud tenga las tablas creadas (ejecuta `init-db.sql`)

---

## 💡 Recomendaciones

1. **Usa Supabase Cloud para producción**: Es más estable y escalable que Supabase Local
2. **Mantén el setup actual**: GitHub Pages + Railway es una combinación excelente y económica
3. **Configura CI/CD**: Usa GitHub Actions para automatizar el despliegue
4. **Monitorea los logs**: Railway y Render tienen dashboards de logs muy útiles
5. **Backups**: Supabase Cloud tiene backups automáticos, pero considera hacer backups manuales periódicos

---

## 🔐 Seguridad en Producción

- ✅ **Nunca** subas `.env` al repositorio
- ✅ Usa **Service Role Key** solo en el backend (nunca en el frontend)
- ✅ Configura **CORS** correctamente para limitar orígenes permitidos
- ✅ Usa **HTTPS** siempre en producción
- ✅ Rota las keys periódicamente
- ✅ Monitorea los logs para detectar accesos no autorizados
