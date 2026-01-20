# Makefile para arbitraje-gestión
# Comandos útiles para gestionar el proyecto Dockerizado

.PHONY: help build up down restart logs clean dev prod shell-backend shell-frontend shell-db db-reset

# Variables
COMPOSE_FILE = docker-compose.yml
COMPOSE_DEV_FILE = docker-compose.dev.yml
COMPOSE_CMD = docker-compose -f $(COMPOSE_FILE)
COMPOSE_DEV_CMD = docker-compose -f $(COMPOSE_FILE) -f $(COMPOSE_DEV_FILE)

# Ayuda por defecto
help:
	@echo "Comandos disponibles:"
	@echo "  make build          - Construir todas las imágenes Docker"
	@echo "  make up             - Levantar todos los servicios"
	@echo "  make down           - Detener todos los servicios"
	@echo "  make restart        - Reiniciar todos los servicios"
	@echo "  make logs           - Ver logs de todos los servicios"
	@echo "  make logs-backend   - Ver logs solo del backend"
	@echo "  make logs-frontend  - Ver logs solo del frontend"
	@echo "  make logs-db        - Ver logs solo de la base de datos"
	@echo "  make dev            - Modo desarrollo (con hot reload)"
	@echo "  make prod           - Modo producción"
	@echo "  make clean          - Limpiar contenedores, imágenes y volúmenes"
	@echo "  make shell-backend  - Abrir shell en el contenedor backend"
	@echo "  make shell-frontend - Abrir shell en el contenedor frontend"
	@echo "  make shell-db       - Abrir shell en el contenedor de base de datos"
	@echo "  make db-reset       - Resetear la base de datos (elimina todos los datos)"
	@echo "  make status         - Ver estado de los contenedores"

# Construir imágenes
build:
	@echo "Construyendo imágenes Docker..."
	$(COMPOSE_CMD) build

# Levantar servicios
up:
	@echo "Levantando servicios..."
	$(COMPOSE_CMD) up -d
	@echo "Esperando a que los servicios estén listos..."
	@sleep 5
	@echo "Servicios levantados. Accede a:"
	@echo "  - Frontend: http://localhost:3000"
	@echo "  - Backend API: http://localhost:3001"
	@echo "  - Supabase API (Kong): http://localhost:8000"
	@echo "  - PostgreSQL: localhost:54322"
	@echo ""
	@echo "Nota: El backend se conecta a Supabase a través de Kong (puerto 8000)"

# Detener servicios
down:
	@echo "Deteniendo servicios..."
	$(COMPOSE_CMD) down

# Reiniciar servicios
restart:
	@echo "Reiniciando servicios..."
	$(COMPOSE_CMD) restart

# Ver logs
logs:
	$(COMPOSE_CMD) logs -f

logs-backend:
	$(COMPOSE_CMD) logs -f backend

logs-frontend:
	$(COMPOSE_CMD) logs -f frontend

logs-db:
	$(COMPOSE_CMD) logs -f supabase-db

logs-kong:
	$(COMPOSE_CMD) logs -f kong

logs-postgrest:
	$(COMPOSE_CMD) logs -f postgrest

# Modo desarrollo (con hot reload)
dev:
	@echo "Iniciando en modo desarrollo..."
	$(COMPOSE_DEV_CMD) up --build

# Modo producción
prod:
	@echo "Iniciando en modo producción..."
	$(COMPOSE_CMD) up -d --build
	@echo "Servicios en producción levantados."

# Limpiar todo (contenedores, imágenes, volúmenes)
clean:
	@echo "Limpiando contenedores, imágenes y volúmenes..."
	$(COMPOSE_CMD) down -v --rmi all
	@echo "Limpieza completada."

# Shells
shell-backend:
	$(COMPOSE_CMD) exec backend sh

shell-frontend:
	$(COMPOSE_CMD) exec frontend sh

shell-db:
	$(COMPOSE_CMD) exec supabase-db psql -U supabase_admin -d postgres

# Resetear base de datos
db-reset:
	@echo "⚠️  ADVERTENCIA: Esto eliminará TODOS los datos de la base de datos."
	@read -p "¿Estás seguro? (yes/no): " confirm && [ "$$confirm" = "yes" ] || exit 1
	$(COMPOSE_CMD) down -v
	$(COMPOSE_CMD) up -d supabase-db kong postgrest auth
	@echo "Esperando a que los servicios estén listos..."
	@sleep 10
	@echo "Base de datos reseteada."

# Ver estado
status:
	$(COMPOSE_CMD) ps

# Instalar dependencias del backend (útil para desarrollo)
install-backend:
	@echo "Instalando dependencias del backend..."
	cd backend && npm install

# Verificar que .env existe
check-env:
	@if [ ! -f .env ]; then \
		echo "⚠️  Archivo .env no encontrado. Copiando desde env.example.txt..."; \
		cp env.example.txt .env; \
		echo "✅ Archivo .env creado. Por favor, edítalo con tus valores."; \
	else \
		echo "✅ Archivo .env encontrado."; \
	fi

# Setup inicial completo
setup: check-env build
	@echo "✅ Setup completado. Ejecuta 'make up' para levantar los servicios."
