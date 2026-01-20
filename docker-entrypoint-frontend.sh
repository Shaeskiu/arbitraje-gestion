#!/bin/sh
set -e

# Generar config.js desde variable de entorno
API_URL="${API_BASE_URL:-http://localhost:3001}"

cat > /usr/share/nginx/html/config.js << EOF
window.APP_CONFIG = {
    API_BASE_URL: '${API_URL}'
};
EOF

echo "Generated config.js with API_BASE_URL=${API_URL}"

# Ejecutar el entrypoint por defecto de nginx
exec /docker-entrypoint.sh "$@"
