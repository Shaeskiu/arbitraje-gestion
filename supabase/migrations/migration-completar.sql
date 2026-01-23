-- ============================================
-- SCRIPT DE MIGRACIÓN PARA COMPLETAR ESQUEMA
-- Ejecutar después de la versión anterior del esquema
-- ============================================

-- ============================================
-- 1. CORREGIR TABLA OPPORTUNITIES
-- ============================================

-- Eliminar constraint duplicado si existe
ALTER TABLE opportunities 
DROP CONSTRAINT IF EXISTS opportunities_status_check;

-- Corregir la migración de estados (mejorada)
-- Paso 1: Manejar valores NULL
UPDATE opportunities 
SET status = 'detectada'
WHERE status IS NULL;

-- Paso 2: Migrar todos los valores antiguos a los nuevos valores permitidos
-- Actualizar TODAS las filas para asegurar que todos los valores sean válidos
UPDATE opportunities 
SET status = CASE 
    -- Mantener valores ya válidos (no cambian nada)
    WHEN status = 'detectada' THEN 'detectada'
    WHEN status = 'descartada' THEN 'descartada'
    WHEN status = 'convertida' THEN 'convertida'
    -- Convertir valores antiguos en masculino a femenino
    WHEN status = 'detectado' THEN 'detectada'
    WHEN status = 'descartado' THEN 'descartada'
    WHEN status = 'convertido' THEN 'convertida'
    -- Estados antiguos del flujo anterior -> mapear a nuevos
    WHEN status IN ('analizado', 'analizada') THEN 'detectada'
    WHEN status IN ('aprobado', 'aprobada') THEN 'detectada'
    WHEN status IN ('comprado', 'comprada', 'compra') THEN 'convertida'
    WHEN status IN ('vendido', 'vendida', 'venta') THEN 'convertida'
    WHEN status IN ('converted', 'convertido') THEN 'convertida'
    WHEN status IN ('descartar') THEN 'descartada'
    -- Manejar posibles variaciones con espacios o case
    WHEN LOWER(TRIM(status)) = 'detectado' THEN 'detectada'
    WHEN LOWER(TRIM(status)) = 'descartado' THEN 'descartada'
    WHEN LOWER(TRIM(status)) = 'convertido' THEN 'convertida'
    -- Por defecto, cualquier otro valor -> 'detectada'
    ELSE 'detectada'
END;

-- Asegurar que no queden NULLs (por si acaso)
UPDATE opportunities 
SET status = 'detectada'
WHERE status IS NULL;

-- Ahora sí, añadir el constraint de status correctamente
ALTER TABLE opportunities 
ADD CONSTRAINT opportunities_status_check 
CHECK (status IN ('detectada', 'descartada', 'convertida'));

-- ============================================
-- 2. AÑADIR PRODUCT_NAME A TABLA COMPRAS
-- ============================================

-- Añadir columna product_name si no existe
ALTER TABLE compras
ADD COLUMN IF NOT EXISTS product_name TEXT NOT NULL DEFAULT 'Producto sin nombre';

-- Actualizar product_name desde opportunities si existe oportunidad_id
UPDATE compras c
SET product_name = o.product_name
FROM opportunities o
WHERE c.oportunidad_id = o.id
  AND c.product_name = 'Producto sin nombre'
  AND o.product_name IS NOT NULL;

-- Asegurar que no haya valores nulos o por defecto
-- Si hay compras sin producto_name válido, mantener un valor por defecto
UPDATE compras
SET product_name = 'Producto ' || id::text
WHERE product_name = 'Producto sin nombre' OR product_name IS NULL;

-- Hacer que la columna sea NOT NULL (ya tiene DEFAULT, así que no debería dar error)
ALTER TABLE compras
ALTER COLUMN product_name SET NOT NULL;

-- Eliminar el DEFAULT ya que ahora todos tienen valores
ALTER TABLE compras
ALTER COLUMN product_name DROP DEFAULT;

-- Añadir índice para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_compras_product_name ON compras(product_name);

COMMENT ON COLUMN compras.product_name IS 'Nombre del producto (denormalizado para facilitar consultas)';

-- ============================================
-- 3. AÑADIR PRODUCT_NAME A TABLA VENTAS
-- ============================================

-- Añadir columna product_name si no existe
ALTER TABLE ventas
ADD COLUMN IF NOT EXISTS product_name TEXT;

-- Actualizar product_name desde stock -> compras -> opportunities
UPDATE ventas v
SET product_name = COALESCE(
    c.product_name,
    (SELECT o.product_name FROM opportunities o WHERE o.id = c.oportunidad_id),
    'Producto vendido'
)
FROM stock s
JOIN compras c ON s.compra_id = c.id
WHERE v.stock_id = s.id
  AND (v.product_name IS NULL OR v.product_name = '');

-- Para ventas que no tengan product_name, intentar obtenerlo directamente de compras
UPDATE ventas v
SET product_name = c.product_name
FROM stock s
JOIN compras c ON s.compra_id = c.id
WHERE v.stock_id = s.id
  AND v.product_name IS NULL
  AND c.product_name IS NOT NULL;

-- Si aún quedan NULLs, usar un valor por defecto
UPDATE ventas
SET product_name = 'Producto ' || id::text
WHERE product_name IS NULL OR product_name = '';

-- Hacer que la columna sea NOT NULL
ALTER TABLE ventas
ALTER COLUMN product_name SET NOT NULL;

-- Añadir índice para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_ventas_product_name ON ventas(product_name);

COMMENT ON COLUMN ventas.product_name IS 'Nombre del producto (denormalizado para facilitar consultas)';

-- ============================================
-- 4. VERIFICAR FUNCIÓN update_updated_at_column
-- ============================================

-- Asegurar que la función existe (puede que no exista en todas las bases de datos)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. VERIFICAR TRIGGERS Y CONSTRAINTS
-- ============================================

-- Verificar que el trigger de creación de stock esté correcto
-- (Usa precio_unitario en lugar de total_compra / unidades)
DROP TRIGGER IF EXISTS trigger_create_stock_from_compra ON compras;
DROP FUNCTION IF EXISTS create_stock_from_compra();

CREATE OR REPLACE FUNCTION create_stock_from_compra()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO stock (compra_id, unidades_iniciales, unidades_disponibles, coste_unitario_real)
    VALUES (
        NEW.id,
        NEW.unidades,
        NEW.unidades,
        NEW.precio_unitario
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_stock_from_compra
    AFTER INSERT ON compras
    FOR EACH ROW
    EXECUTE FUNCTION create_stock_from_compra();

-- Verificar que el trigger de actualización de stock en ventas esté correcto
DROP TRIGGER IF EXISTS trigger_update_stock_on_venta ON ventas;
DROP FUNCTION IF EXISTS update_stock_on_venta();

CREATE OR REPLACE FUNCTION update_stock_on_venta()
RETURNS TRIGGER AS $$
DECLARE
    disponibles INTEGER;
BEGIN
    -- Verificar unidades disponibles
    SELECT unidades_disponibles INTO disponibles
    FROM stock
    WHERE id = NEW.stock_id;
    
    IF disponibles IS NULL THEN
        RAISE EXCEPTION 'Stock con id % no existe', NEW.stock_id;
    END IF;
    
    IF disponibles < NEW.unidades THEN
        RAISE EXCEPTION 'No hay suficientes unidades disponibles. Disponibles: %, Solicitadas: %', disponibles, NEW.unidades;
    END IF;
    
    -- Descontar unidades
    UPDATE stock
    SET unidades_disponibles = unidades_disponibles - NEW.unidades,
        updated_at = NOW()
    WHERE id = NEW.stock_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stock_on_venta
    AFTER INSERT ON ventas
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_on_venta();

-- ============================================
-- 6. VERIFICAR QUE NO HAYA DATOS INCONSISTENTES
-- ============================================

-- Verificar que todas las oportunidades tengan valores válidos
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_count
    FROM opportunities
    WHERE status NOT IN ('detectada', 'descartada', 'convertida') OR status IS NULL;
    
    IF invalid_count > 0 THEN
        RAISE WARNING 'Hay % oportunidades con estados inválidos. Corrigiéndolas...', invalid_count;
        UPDATE opportunities 
        SET status = 'detectada'
        WHERE status NOT IN ('detectada', 'descartada', 'convertida') OR status IS NULL;
    END IF;
END $$;

-- Verificar que todas las compras tengan product_name
DO $$
DECLARE
    missing_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_count
    FROM compras
    WHERE product_name IS NULL OR product_name = '';
    
    IF missing_count > 0 THEN
        RAISE WARNING 'Hay % compras sin product_name. Corrigiéndolas...', missing_count;
        UPDATE compras
        SET product_name = 'Producto ' || id::text
        WHERE product_name IS NULL OR product_name = '';
    END IF;
END $$;

-- Verificar que todas las ventas tengan product_name
DO $$
DECLARE
    missing_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_count
    FROM ventas
    WHERE product_name IS NULL OR product_name = '';
    
    IF missing_count > 0 THEN
        RAISE WARNING 'Hay % ventas sin product_name. Corrigiéndolas...', missing_count;
        UPDATE ventas v
        SET product_name = COALESCE(
            (SELECT c.product_name FROM stock s JOIN compras c ON s.compra_id = c.id WHERE s.id = v.stock_id),
            'Producto vendido'
        )
        WHERE product_name IS NULL OR product_name = '';
    END IF;
END $$;

-- ============================================
-- FIN DE LA MIGRACIÓN
-- ============================================

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Migración completada exitosamente!';
    RAISE NOTICE '- Tabla opportunities: estados migrados y constraint aplicado';
    RAISE NOTICE '- Tabla compras: columna product_name añadida';
    RAISE NOTICE '- Tabla ventas: columna product_name añadida';
    RAISE NOTICE '- Triggers verificados y corregidos';
    RAISE NOTICE '- Datos inconsistentes corregidos';
END $$;
