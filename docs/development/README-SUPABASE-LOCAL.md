# Configuración de Supabase Local

Este proyecto usa el **stack completo de Supabase Local** para desarrollo, lo que garantiza compatibilidad total con `@supabase/supabase-js` y todos los servicios de Supabase.

## 🏗️ Arquitectura

El stack incluye:

- **Kong** (puerto 8000): API Gateway que expone todos los servicios de Supabase
- **PostgreSQL** (puerto 54322): Base de datos con usuarios y roles de Supabase
- **PostgREST**: API REST automática (expuesta a través de Kong)
- **GoTrue**: Servicio de autenticación (expuesto a través de Kong)
- **Realtime**: WebSockets para actualizaciones en tiempo real
- **Storage**: Almacenamiento de archivos

## 🔧 Configuración

### Variables de Entorno

El archivo `env.example.txt` contiene las variables necesarias. Las más importantes:

```env
# URL de Supabase Local (Kong API Gateway)
SUPABASE_URL=http://kong:8000

# Keys de Supabase Local (valores por defecto para desarrollo)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Password para PostgreSQL
POSTGRES_PASSWORD=your-super-secret-and-long-postgres-password

# JWT Secret (debe tener al menos 32 caracteres)
JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long
```

### Estructura de URLs

- **Desde el backend (dentro de Docker)**: `http://kong:8000`
- **Desde el frontend (navegador)**: `http://localhost:8000`
- **PostgreSQL directo**: `localhost:54322`

### Endpoints de Supabase

Una vez levantado el stack, puedes acceder a:

- **REST API**: `http://localhost:8000/rest/v1/`
- **Auth API**: `http://localhost:8000/auth/v1/`
- **Realtime**: `ws://localhost:8000/realtime/v1/`
- **Storage**: `http://localhost:8000/storage/v1/`

## 🚀 Uso

### Iniciar el stack completo

```bash
make up
# o
docker compose up -d
```

### Ver logs

```bash
make logs-db      # Logs de PostgreSQL
make logs-kong    # Logs de Kong (API Gateway)
make logs-postgrest # Logs de PostgREST
```

### Acceder a la base de datos

```bash
make shell-db
# o
docker compose exec supabase-db psql -U supabase_admin -d postgres
```

## 🔍 Verificación

Para verificar que todo funciona correctamente:

1. **Verificar Kong**:
   ```bash
   curl http://localhost:8000/rest/v1/
   ```

2. **Verificar PostgREST**:
   ```bash
   curl -H "apikey: YOUR_ANON_KEY" http://localhost:8000/rest/v1/channels
   ```

3. **Verificar desde el backend**:
   El backend debería poder conectarse sin errores. Revisa los logs:
   ```bash
   make logs-backend
   ```

## ⚠️ Notas Importantes

1. **Puerto de PostgreSQL**: Usa el puerto **54322** (no 5432) para evitar conflictos con instalaciones locales de PostgreSQL.

2. **Usuarios de Supabase**: La imagen de Supabase PostgreSQL tiene usuarios preconfigurados:
   - `supabase_admin`: Usuario administrador
   - `authenticator`: Usuario para PostgREST
   - Roles: `anon`, `authenticated`, `service_role`

3. **Inicialización**: El script `init-db.sql` se ejecuta automáticamente al crear el contenedor por primera vez.

4. **Persistencia**: Los datos se guardan en el volumen `supabase_db_data` y persisten entre reinicios.

## 🐛 Troubleshooting

### Error: "connection refused" desde el backend

- Verifica que `SUPABASE_URL=http://kong:8000` en el `.env`
- Verifica que Kong esté corriendo: `docker compose ps kong`
- Revisa los logs: `make logs-kong`

### Error: "role does not exist"

- Asegúrate de que el script `supabase/setup.sql` se haya ejecutado
- Verifica los logs de la base de datos: `make logs-db`

### Error 500 en las peticiones

- Verifica que las keys (`SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) sean correctas
- Verifica que `JWT_SECRET` sea el mismo en todos los servicios
- Revisa los logs de PostgREST: `make logs-postgrest`
