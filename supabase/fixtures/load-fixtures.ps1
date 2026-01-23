# ============================================
# Script PowerShell para cargar fixtures
# ============================================
# Uso: .\supabase\fixtures\load-fixtures.ps1

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "CARGANDO FIXTURES DE DESARROLLO" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$fixtures = @(
    "01_channels.sql",
    "02_channel_costs.sql",
    "03_opportunities.sql",
    "04_opportunity_costs.sql",
    "05_compras.sql",
    "06_ventas.sql"
)

$basePath = "supabase/fixtures"

foreach ($file in $fixtures) {
    $filePath = Join-Path $basePath $file
    if (Test-Path $filePath) {
        Write-Host "Cargando $file..." -ForegroundColor Yellow
        Get-Content $filePath | docker-compose exec -T supabase-db psql -U postgres -d postgres
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $file cargado correctamente" -ForegroundColor Green
        } else {
            Write-Host "❌ Error al cargar $file" -ForegroundColor Red
        }
        Write-Host ""
    } else {
        Write-Host "⚠️  Archivo no encontrado: $filePath" -ForegroundColor Red
    }
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "VERIFICANDO DATOS CARGADOS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$query = @"
SELECT 
    'Canales' as tabla, COUNT(*)::text as total FROM channels
UNION ALL
SELECT 'Oportunidades', COUNT(*)::text FROM opportunities
UNION ALL
SELECT 'Compras', COUNT(*)::text FROM compras
UNION ALL
SELECT 'Stock', COUNT(*)::text FROM stock
UNION ALL
SELECT 'Ventas', COUNT(*)::text FROM ventas;
"@

Write-Host "Resumen de datos:" -ForegroundColor Yellow
echo $query | docker-compose exec -T supabase-db psql -U postgres -d postgres

Write-Host ""
Write-Host "✅ Proceso completado" -ForegroundColor Green
