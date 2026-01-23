# Arbitraje Gestión

Sistema de gestión para arbitraje comercial que permite identificar oportunidades de compra-venta entre diferentes canales, gestionar compras, stock y ventas con análisis de márgenes y rentabilidad.

## 🏗️ Arquitectura

El proyecto está compuesto por tres componentes principales:

### Frontend
- **Tecnología**: HTML, JavaScript vanilla, Tailwind CSS
- **Despliegue**: GitHub Pages
- **Puerto local**: 3000
- **Configuración**: `frontend/config.js` (generado automáticamente en CI/CD)

### Backend
- **Tecnología**: Node.js + Express
- **Despliegue**: Railway
- **Puerto local**: 3001
- **API REST**: Endpoints para oportunidades, compras, stock, ventas y dashboard

### Base de Datos
- **Tecnología**: PostgreSQL (Supabase)
- **Desarrollo**: Supabase Local (Docker)
- **Producción**: Supabase Cloud
- **API**: PostgREST (automático) + Kong API Gateway

### Flujo de Datos

```
Frontend (GitHub Pages)
    ↓ HTTP
Backend API (Railway)
    ↓ Supabase Client
Supabase (Cloud/Local)
    ↓ PostgREST
PostgreSQL
```

## 🚀 Inicio Rápido

### Desarrollo Local

1. **Prerrequisitos**:
   - Docker y Docker Compose
   - Make (opcional)

2. **Configuración inicial**:
   ```bash
   # Copiar template de variables de entorno
   cp env.example.txt .env
   
   # Editar .env si es necesario (valores por defecto funcionan para desarrollo)
   ```

3. **Levantar servicios**:
   ```bash
   # Con Makefile
   make build
   make up
   
   # O sin Makefile
   docker-compose build
   docker-compose up -d
   ```

4. **Acceder a la aplicación**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Supabase Local API: http://localhost:8000
   - PostgreSQL: localhost:54322

### Producción

El sistema está desplegado en:
- **Frontend**: GitHub Pages (despliegue automático vía GitHub Actions)
- **Backend**: Railway (despliegue automático desde GitHub)
- **Base de Datos**: Supabase Cloud

Ver [docs/deployment/SETUP-PRODUCTION.md](docs/deployment/SETUP-PRODUCTION.md) para detalles completos.

## 📁 Estructura del Proyecto

```
arbitraje-gestion/
├── backend/              # API Node.js/Express
│   ├── index.js         # Servidor principal
│   └── supabaseClient.js # Cliente Supabase
├── frontend/            # Aplicación web estática
│   ├── index.html       # Punto de entrada
│   ├── js/              # Lógica de la aplicación
│   └── assets/          # Recursos estáticos
├── supabase/            # Configuración Supabase Local
│   ├── kong.yml         # Configuración API Gateway
│   ├── setup.sql        # Script de inicialización
│   ├── schema/          # Esquemas SQL individuales
│   └── migrations/      # Migraciones SQL
├── docs/                # Documentación
│   ├── deployment/      # Guías de despliegue
│   ├── development/     # Guías de desarrollo
│   └── reference/      # Documentación de referencia
├── docker-compose.yml   # Orquestación de servicios
├── Dockerfile.backend   # Imagen Docker del backend
├── Dockerfile.frontend  # Imagen Docker del frontend
├── init-db.sql          # Script de inicialización de BD
├── railway.json         # Configuración Railway
└── Makefile             # Comandos útiles
```

## 📚 Documentación

### Despliegue
- [Setup de Producción](docs/deployment/SETUP-PRODUCTION.md) - Checklist paso a paso
- [Despliegue Completo](docs/deployment/DEPLOY.md) - Guía detallada
- [Railway](docs/deployment/DEPLOY-RAILWAY.md) - Configuración específica
- [GitHub Pages](docs/deployment/DEPLOY-GITHUB-PAGES.md) - Frontend deployment

### Desarrollo
- [Docker](docs/development/README-DOCKER.md) - Desarrollo con Docker
- [Supabase Local](docs/development/README-SUPABASE-LOCAL.md) - Base de datos local

### Referencia
- [Producción - Resumen](docs/reference/README-PRODUCTION.md) - Resumen rápido
- [Esquema de Canales](docs/reference/CANALES-ESQUEMA.md) - Documentación de canales
- [Setup Supabase](docs/reference/SUPABASE-SETUP.md) - Configuración Supabase

## 🛠️ Comandos Útiles

### Con Makefile

```bash
make help          # Ver todos los comandos
make build         # Construir imágenes Docker
make up            # Levantar servicios
make down          # Detener servicios
make logs          # Ver logs
make dev           # Modo desarrollo (hot reload)
make db-reset      # Resetear base de datos
```

### Sin Makefile

```bash
docker-compose build          # Construir
docker-compose up -d          # Levantar
docker-compose down           # Detener
docker-compose logs -f        # Ver logs
```

## 🔧 Configuración

### Variables de Entorno

El archivo `env.example.txt` contiene todas las variables necesarias. Las más importantes:

**Desarrollo**:
- `SUPABASE_URL=http://kong:8000` (Supabase Local)
- `CORS_ORIGINS` (opcional, valores por defecto funcionan)

**Producción**:
- `SUPABASE_URL=https://tu-proyecto.supabase.co` (Supabase Cloud)
- `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` (de Supabase Cloud)
- `CORS_ORIGINS=https://tu-usuario.github.io` (dominio del frontend)

Ver `env.example.txt` para la lista completa.

## 🐛 Troubleshooting

### Los servicios no inician
- Verifica que los puertos no estén en uso
- Revisa los logs: `make logs` o `docker-compose logs`

### La base de datos no se inicializa
- Verifica que `init-db.sql` existe
- Revisa logs de la base de datos: `make logs-db`

### Errores de CORS
- Verifica `CORS_ORIGINS` en variables de entorno
- Asegúrate de incluir el dominio correcto del frontend

Ver [docs/development/README-DOCKER.md](docs/development/README-DOCKER.md) para más soluciones.

## 🔐 Seguridad

- ⚠️ **Nunca** subas el archivo `.env` al repositorio
- ⚠️ **Service Role Key** solo en el backend, nunca en el frontend
- ⚠️ Configura **CORS** correctamente para limitar orígenes
- ⚠️ Usa **HTTPS** siempre en producción

## 📝 Notas Importantes

- **Desarrollo**: Usa Supabase Local (Docker) para no afectar datos de producción
- **Producción**: Usa Supabase Cloud para estabilidad y escalabilidad
- **Migraciones**: Los archivos SQL en `supabase/schema/` son referencias, `init-db.sql` es el script ejecutado
- **CI/CD**: GitHub Actions despliega automáticamente el frontend en cada push a `main`

## 🤝 Contribuir

1. Crea una rama para tu feature
2. Realiza tus cambios
3. Verifica que los tests pasen (si existen)
4. Abre un Pull Request

## 📄 Licencia

[Especificar licencia si aplica]

---

**Última actualización**: Reorganización de repositorio - Estructura mejorada para mantenibilidad
