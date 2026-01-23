# Dockerización del Proyecto Arbitraje Gestión

Este proyecto está completamente dockerizado para facilitar el desarrollo y despliegue.

## 🚀 Inicio Rápido

### Prerrequisitos

- Docker y Docker Compose instalados
- Make (opcional, pero recomendado)

### Pasos de Instalación

1. **Copiar archivo de configuración de entorno:**
   ```bash
   # En Linux/Mac
   cp env.example.txt .env
   
   # En Windows PowerShell
   Copy-Item env.example.txt .env
   ```

2. **Editar `.env` con tus valores** (opcional para desarrollo local, los valores por defecto funcionan)

3. **Construir y levantar los servicios:**
   ```bash
   make build
   make up
   ```

   O sin Make:
   ```bash
   docker-compose build
   docker-compose up -d
   ```

4. **Acceder a la aplicación:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - PostgREST API: http://localhost:8000
   - PostgreSQL: localhost:5432

## 📋 Comandos Disponibles

### Con Makefile (recomendado)

```bash
make help          # Ver todos los comandos disponibles
make build         # Construir todas las imágenes
make up            # Levantar todos los servicios
make down          # Detener todos los servicios
make restart       # Reiniciar todos los servicios
make logs          # Ver logs de todos los servicios
make logs-backend  # Ver logs solo del backend
make logs-frontend # Ver logs solo del frontend
make logs-db       # Ver logs solo de la base de datos
make dev           # Modo desarrollo (con hot reload)
make prod          # Modo producción
make clean         # Limpiar contenedores, imágenes y volúmenes
make shell-backend # Abrir shell en el contenedor backend
make shell-db      # Abrir shell en el contenedor de base de datos
make db-reset      # Resetear la base de datos (elimina todos los datos)
make status        # Ver estado de los contenedores
```

### Sin Makefile

```bash
# Construir imágenes
docker-compose build

# Levantar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down

# Modo desarrollo
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## 🏗️ Arquitectura

El proyecto consta de 4 servicios principales:

1. **supabase** - Base de datos PostgreSQL con Supabase Local
2. **postgrest** - API REST automática (PostgREST)
3. **backend** - API Node.js/Express
4. **frontend** - Frontend estático servido con Nginx

### Flujo de Datos

```
Frontend (Nginx:3000) 
    ↓
Backend (Node.js:3001)
    ↓
PostgREST (API REST:8000)
    ↓
PostgreSQL (Supabase:5432)
```

## 🔧 Configuración

### Variables de Entorno

El archivo `.env.example` contiene todas las variables necesarias. Las más importantes:

- `ENVIRONMENT`: `development` o `production`
- `SUPABASE_URL`: URL del servicio Supabase (local o cloud)
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key de Supabase
- `SUPABASE_ANON_KEY`: Anon key de Supabase
- `POSTGRES_PASSWORD`: Password para PostgreSQL local
- `API_BASE_URL`: URL del backend para el frontend

### Desarrollo vs Producción

**Desarrollo:**
- Usa Supabase Local (PostgreSQL + PostgREST en Docker)
- Hot reload habilitado
- Volúmenes montados para edición en caliente

**Producción:**
- Puede usar Supabase Cloud o Supabase Local
- Imágenes optimizadas
- Sin hot reload

## 🗄️ Base de Datos

### Inicialización

La base de datos se inicializa automáticamente al crear el contenedor por primera vez. El script `init-db.sql` ejecuta todas las migraciones necesarias.

### Resetear Base de Datos

```bash
make db-reset
```

⚠️ **Advertencia**: Esto eliminará TODOS los datos.

### Acceder a la Base de Datos

```bash
# Con Make
make shell-db

# Sin Make
docker-compose exec supabase psql -U postgres -d postgres
```

## 🐛 Troubleshooting

### Los servicios no inician

1. Verifica que los puertos no estén en uso:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   netstat -ano | findstr :3001
   netstat -ano | findstr :5432
   netstat -ano | findstr :8000
   
   # Linux/Mac
   lsof -i :3000
   lsof -i :3001
   lsof -i :5432
   lsof -i :8000
   ```

2. Revisa los logs:
   ```bash
   make logs
   ```

### La base de datos no se inicializa

1. Verifica que el archivo `init-db.sql` existe
2. Revisa los logs de Supabase:
   ```bash
   make logs-db
   ```
3. Si es necesario, resetea la base de datos:
   ```bash
   make db-reset
   ```

### El frontend no se conecta al backend

1. Verifica que `API_BASE_URL` en `.env` sea correcto
2. En desarrollo local, usa `http://localhost:3001`
3. En Docker, el frontend puede usar `http://backend:3001` para comunicación interna

### CORS errors

El backend ya tiene configuración CORS. Si tienes problemas:

1. Verifica que el frontend esté en un origen permitido
2. Revisa la configuración CORS en `backend/index.js`

## 📝 Notas Adicionales

- Los datos de la base de datos persisten en el volumen `supabase_data`
- Para desarrollo, los cambios en el código se reflejan automáticamente con `make dev`
- El frontend genera `config.js` automáticamente desde variables de entorno al iniciar

## 🔐 Seguridad

- ⚠️ Las credenciales por defecto son solo para desarrollo local
- ⚠️ En producción, cambia TODAS las contraseñas y keys
- ⚠️ No subas el archivo `.env` al repositorio (ya está en `.gitignore`)
