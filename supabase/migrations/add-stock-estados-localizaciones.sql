-- ============================================
-- MIGRACIÓN: Estados de Stock y Localizaciones
-- ============================================
-- Añade estados al stock (pendiente_recibir, recepcionado, disponible)
-- y sistema de localizaciones

-- ============================================
-- 1. CREAR TABLA DE LOCALIZACIONES
-- ============================================

CREATE TABLE IF NOT EXISTS localizaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para localizaciones
CREATE INDEX IF NOT EXISTS idx_localizaciones_name ON localizaciones(name);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_localizaciones_updated_at
    BEFORE UPDATE ON localizaciones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS para localizaciones
ALTER TABLE localizaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on localizaciones"
    ON localizaciones
    FOR ALL
    USING (true)
    WITH CHECK (true);

COMMENT ON TABLE localizaciones IS 'Localizaciones físicas donde se almacena el stock';
COMMENT ON COLUMN localizaciones.name IS 'Nombre de la localización (ej: Almacén A, Estantería 1)';
COMMENT ON COLUMN localizaciones.description IS 'Descripción opcional de la localización';

-- ============================================
-- 2. MODIFICAR TABLA STOCK
-- ============================================

-- Añadir columna de estado
ALTER TABLE stock 
ADD COLUMN IF NOT EXISTS estado TEXT NOT NULL DEFAULT 'pendiente_recibir';

-- Añadir constraint para estados válidos
ALTER TABLE stock 
DROP CONSTRAINT IF EXISTS stock_estado_check;

ALTER TABLE stock 
ADD CONSTRAINT stock_estado_check 
CHECK (estado IN ('pendiente_recibir', 'recepcionado', 'disponible'));

-- Añadir columna de localización
ALTER TABLE stock 
ADD COLUMN IF NOT EXISTS localizacion_id UUID REFERENCES localizaciones(id) ON DELETE SET NULL;

-- Actualizar stock existente a 'disponible' para compatibilidad
UPDATE stock 
SET estado = 'disponible' 
WHERE estado IS NULL OR estado = '';

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_stock_estado ON stock(estado);
CREATE INDEX IF NOT EXISTS idx_stock_localizacion_id ON stock(localizacion_id);

-- Comentarios
COMMENT ON COLUMN stock.estado IS 'Estado del stock: pendiente_recibir, recepcionado, disponible';
COMMENT ON COLUMN stock.localizacion_id IS 'Referencia a la localización física del stock';

-- ============================================
-- 3. ACTUALIZAR TRIGGER DE CREACIÓN DE STOCK
-- ============================================

-- Primero eliminar el trigger (que depende de la función)
DROP TRIGGER IF EXISTS trigger_create_stock_from_compra ON compras;

-- Luego eliminar la función antigua si existe
DROP FUNCTION IF EXISTS create_stock_from_compra();

-- Crear función actualizada con estado por defecto
CREATE OR REPLACE FUNCTION create_stock_from_compra()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO stock (compra_id, unidades_iniciales, unidades_disponibles, coste_unitario_real, estado)
    VALUES (
        NEW.id,
        NEW.unidades,
        NEW.unidades,
        NEW.precio_unitario,
        'pendiente_recibir'  -- Estado inicial
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear el trigger
CREATE TRIGGER trigger_create_stock_from_compra
    AFTER INSERT ON compras
    FOR EACH ROW
    EXECUTE FUNCTION create_stock_from_compra();

-- ============================================
-- VERIFICACIÓN
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migración completada:';
    RAISE NOTICE '   - Tabla localizaciones creada';
    RAISE NOTICE '   - Columnas estado y localizacion_id añadidas a stock';
    RAISE NOTICE '   - Stock existente actualizado a estado disponible';
    RAISE NOTICE '   - Trigger de creación de stock actualizado';
END $$;
