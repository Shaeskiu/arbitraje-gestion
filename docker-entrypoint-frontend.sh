#!/bin/sh
set -e

# Generar config.js desde variable de entorno
API_URL="${API_BASE_URL:-http://localhost:3001}"

# Intentar escribir config.js, si falla (volumen read-only), crear en /tmp
CONFIG_CONTENT="window.APP_CONFIG = {
    API_BASE_URL: '${API_URL}'
};"

if echo "$CONFIG_CONTENT" > /usr/share/nginx/html/config.js 2>/dev/null; then
    echo "Generated config.js with API_BASE_URL=${API_URL}"
else
    # Si falla, crear en /tmp y copiar
    echo "$CONFIG_CONTENT" > /tmp/config.js
    # Intentar copiar al directorio de nginx (puede fallar si es read-only)
    cp /tmp/config.js /usr/share/nginx/html/config.js 2>/dev/null || {
        echo "Warning: Could not write config.js to /usr/share/nginx/html (read-only filesystem)"
        echo "Using config.js from /tmp instead"
    }
fi

# Ejecutar el entrypoint por defecto de nginx
exec /docker-entrypoint.sh "$@"
