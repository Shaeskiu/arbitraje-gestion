-- ============================================
-- SCRIPT MAESTRO PARA CARGAR TODOS LOS FIXTURES
-- ============================================
-- Este script ejecuta todos los fixtures en el orden correcto
-- respetando las dependencias entre tablas
--
-- Uso:
--   Desde el host:
--     cd supabase/fixtures
--     psql -h localhost -p 54322 -U postgres -d postgres -f load.sql
--   
--   Desde Docker:
--     docker-compose exec supabase-db psql -U postgres -d postgres -c "\cd /docker-entrypoint-initdb.d/fixtures" -f load.sql
--   
--   O copiando los archivos al contenedor:
--     docker cp supabase/fixtures/. arbitraje-supabase-db:/tmp/fixtures/
--     docker-compose exec supabase-db psql -U postgres -d postgres -f /tmp/fixtures/load.sql

\echo '============================================'
\echo 'CARGANDO FIXTURES DE DESARROLLO'
\echo '============================================'
\echo ''

-- Desactivar temporalmente los triggers para evitar problemas durante la carga
-- (Los triggers se reactivarán automáticamente al final)
SET session_replication_role = 'replica';

\echo '1. Cargando canales...'
\i 01_channels.sql

\echo ''
\echo '2. Cargando costes de canales...'
\i 02_channel_costs.sql

\echo ''
\echo '3. Cargando oportunidades...'
\i 03_opportunities.sql

\echo ''
\echo '4. Cargando costes de oportunidades...'
\i 04_opportunity_costs.sql

\echo ''
\echo '5. Cargando compras (genera stock automáticamente)...'
\i 05_compras.sql

\echo ''
\echo '6. Cargando ventas (descuenta stock automáticamente)...'
\i 06_ventas.sql

-- Reactivar triggers
SET session_replication_role = 'origin';

\echo ''
\echo '============================================'
\echo 'FIXTURES CARGADOS CORRECTAMENTE'
\echo '============================================'
\echo ''
\echo 'Resumen:'
\echo '  - Canales: ' || (SELECT COUNT(*)::text FROM channels);
\echo '  - Costes de canales: ' || (SELECT COUNT(*)::text FROM channel_costs);
\echo '  - Oportunidades: ' || (SELECT COUNT(*)::text FROM opportunities);
\echo '  - Costes de oportunidades: ' || (SELECT COUNT(*)::text FROM opportunity_costs);
\echo '  - Compras: ' || (SELECT COUNT(*)::text FROM compras);
\echo '  - Stock: ' || (SELECT COUNT(*)::text FROM stock);
\echo '  - Ventas: ' || (SELECT COUNT(*)::text FROM ventas);
\echo ''
