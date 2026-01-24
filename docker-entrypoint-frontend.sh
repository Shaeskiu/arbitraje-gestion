#!/bin/sh
set -e

# Generar config.js desde variables de entorno
API_URL="${API_BASE_URL:-http://localhost:3001}"
SUPABASE_URL="${SUPABASE_URL:-http://localhost:8000}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0}"

# Intentar escribir config.js, si falla (volumen read-only), crear en /tmp
CONFIG_CONTENT="window.APP_CONFIG = {
    API_BASE_URL: '${API_URL}',
    SUPABASE_URL: '${SUPABASE_URL}',
    SUPABASE_ANON_KEY: '${SUPABASE_ANON_KEY}'
};"

if echo "$CONFIG_CONTENT" > /usr/share/nginx/html/config.js 2>/dev/null; then
    echo "Generated config.js with API_BASE_URL=${API_URL}, SUPABASE_URL=${SUPABASE_URL}"
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
