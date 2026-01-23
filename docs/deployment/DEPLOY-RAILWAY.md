# Guía de Despliegue en Railway

## Configuración Rápida para Railway

### Paso 1: Preparar el Backend

1. **Asegúrate de que Railway pueda detectar el Dockerfile**:
   - Railway detectará automáticamente `Dockerfile.backend` en la raíz
   - O puedes usar `railway.json` para especificar la configuración

2. **Configurar Root Directory** (si es necesario):
   - En Railway Dashboard > Settings > Service Settings
   - Root Directory: `/backend` (si prefieres que Railway construya desde ahí)
   - O deja vacío si usas `Dockerfile.backend` en la raíz

### Paso 2: Variables de Entorno en Railway

Ve a tu servicio en Railway > Variables y configura:

```env
ENVIRONMENT=production
NODE_ENV=production
PORT=3001
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key-de-supabase-cloud
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-de-supabase-cloud
CORS_ORIGINS=https://tu-usuario.github.io,https://staging.tu-dominio.com
```

**Nota importante sobre CORS**: Usa la variable de entorno `CORS_ORIGINS` en lugar de modificar el código. Los orígenes se separan por comas. Esto permite cambiar dominios sin hacer commits.

### Paso 4: Desplegar

1. **Conectar repositorio**:
   - En Railway Dashboard > New Project > Deploy from GitHub repo
   - Selecciona tu repositorio

2. **Railway detectará automáticamente**:
   - El Dockerfile
   - Las variables de entorno (si las configuraste)
   - El puerto (3001)

3. **Verificar despliegue**:
   - Railway te dará una URL como: `https://tu-proyecto.up.railway.app`
   - Prueba: `https://tu-proyecto.up.railway.app/health`

### Paso 5: Configurar Dominio Personalizado (Opcional)

1. En Railway Dashboard > Settings > Domains
2. Añade tu dominio personalizado
3. Configura los registros DNS según las instrucciones

## Troubleshooting Railway

### El build falla

- Verifica que `Dockerfile.backend` esté en la raíz del proyecto
- Revisa los logs de build en Railway Dashboard
- Asegúrate de que `package.json` tenga todas las dependencias

### El servicio no inicia

- Revisa los logs en Railway Dashboard
- Verifica que `PORT` esté configurado (Railway lo inyecta automáticamente)
- Asegúrate de que las variables de entorno estén correctas

### Errores de conexión a Supabase

- Verifica que `SUPABASE_URL` sea `https://` (no `http://`)
- Asegúrate de que las keys sean correctas
- Revisa que Supabase Cloud tenga las tablas creadas
