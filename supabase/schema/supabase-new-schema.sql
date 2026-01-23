-- ============================================
-- NUEVO ESQUEMA DE BASE DE DATOS PARA ARBITRAJE GESTIÓN
-- Modelo: Oportunidad → Compra → Stock → Venta
-- ============================================

-- ============================================
-- 1. OPORTUNIDADES (Detección de operaciones rentables)
-- ============================================

-- Actualizar tabla opportunities para el nuevo modelo
ALTER TABLE opportunities 
DROP CONSTRAINT IF EXISTS opportunities_status_check;

-- Añadir nuevas columnas si no existen
ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS canal_origen_id UUID REFERENCES channels(id),
ADD COLUMN IF NOT EXISTS canal_destino_id UUID REFERENCES channels(id),
ADD COLUMN IF NOT EXISTS precio_estimado_compra DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS precio_estimado_venta DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS margen_estimado DECIMAL(10, 2);

-- Migrar datos existentes si existen columnas antiguas
UPDATE opportunities 
SET 
    precio_estimado_compra = origin_price,
    precio_estimado_venta = dest_price,
    margen_estimado = dest_price - origin_price,
    canal_origen_id = origin_channel_id,
    canal_destino_id = dest_channel_id
WHERE precio_estimado_compra IS NULL 
  AND origin_price IS NOT NULL;

-- Actualizar estados existentes para mapear al nuevo modelo (ANTES de añadir el constraint)
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

-- Ahora sí, añadir el constraint de status (después de migrar todos los datos)
ALTER TABLE opportunities 
ADD CONSTRAINT opportunities_status_check 
CHECK (status IN ('detectada', 'descartada', 'convertida'));

-- ============================================
-- 2. COMPRAS (Acto real de compra)
-- ============================================

CREATE TABLE IF NOT EXISTS compras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    oportunidad_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    canal_origen_id UUID NOT NULL REFERENCES channels(id),
    precio_unitario DECIMAL(10, 2) NOT NULL CHECK (precio_unitario >= 0),
    unidades INTEGER NOT NULL CHECK (unidades > 0),
    costes_compra JSONB DEFAULT '[]'::jsonb,
    total_compra DECIMAL(10, 2) NOT NULL CHECK (total_compra >= 0),
    fecha_compra DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compras_oportunidad_id ON compras(oportunidad_id);
CREATE INDEX IF NOT EXISTS idx_compras_canal_origen_id ON compras(canal_origen_id);
CREATE INDEX IF NOT EXISTS idx_compras_fecha_compra ON compras(fecha_compra DESC);

CREATE TRIGGER update_compras_updated_at
    BEFORE UPDATE ON compras
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE compras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on compras"
    ON compras
    FOR ALL
    USING (true)
    WITH CHECK (true);

COMMENT ON TABLE compras IS 'Registro de compras reales que generan stock';
COMMENT ON COLUMN compras.oportunidad_id IS 'Referencia a la oportunidad convertida (nullable, puede ser compra directa)';
COMMENT ON COLUMN compras.canal_origen_id IS 'Canal donde se realizó la compra';
COMMENT ON COLUMN compras.precio_unitario IS 'Precio pagado por unidad';
COMMENT ON COLUMN compras.unidades IS 'Número de unidades compradas';
COMMENT ON COLUMN compras.costes_compra IS 'Array JSON con costes adicionales de compra';
COMMENT ON COLUMN compras.total_compra IS 'Total pagado (precio_unitario * unidades + costes_compra)';
COMMENT ON COLUMN compras.fecha_compra IS 'Fecha real de la compra';

-- ============================================
-- 3. STOCK (Unidades disponibles compradas)
-- ============================================

-- Eliminar tabla stock antigua si existe y crear nueva estructura
DROP TABLE IF EXISTS stock CASCADE;

CREATE TABLE stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    compra_id UUID NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
    unidades_iniciales INTEGER NOT NULL CHECK (unidades_iniciales > 0),
    unidades_disponibles INTEGER NOT NULL CHECK (unidades_disponibles >= 0),
    coste_unitario_real DECIMAL(10, 2) NOT NULL CHECK (coste_unitario_real >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_unidades CHECK (unidades_disponibles <= unidades_iniciales)
);

CREATE INDEX IF NOT EXISTS idx_stock_compra_id ON stock(compra_id);
CREATE INDEX IF NOT EXISTS idx_stock_unidades_disponibles ON stock(unidades_disponibles) WHERE unidades_disponibles > 0;

CREATE TRIGGER update_stock_updated_at
    BEFORE UPDATE ON stock
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on stock"
    ON stock
    FOR ALL
    USING (true)
    WITH CHECK (true);

COMMENT ON TABLE stock IS 'Stock disponible: unidades compradas que aún no se han vendido';
COMMENT ON COLUMN stock.compra_id IS 'Referencia a la compra que generó este stock';
COMMENT ON COLUMN stock.unidades_iniciales IS 'Unidades iniciales recibidas en la compra';
COMMENT ON COLUMN stock.unidades_disponibles IS 'Unidades aún disponibles para venta';
COMMENT ON COLUMN stock.coste_unitario_real IS 'Coste unitario real (total_compra / unidades_iniciales)';

-- Función trigger para crear stock automáticamente al crear una compra
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

-- ============================================
-- 4. VENTAS (Salida real de stock)
-- ============================================

CREATE TABLE IF NOT EXISTS ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_id UUID NOT NULL REFERENCES stock(id) ON DELETE RESTRICT,
    canal_destino_id UUID NOT NULL REFERENCES channels(id),
    precio_unitario DECIMAL(10, 2) NOT NULL CHECK (precio_unitario >= 0),
    unidades INTEGER NOT NULL CHECK (unidades > 0),
    costes_venta JSONB DEFAULT '[]'::jsonb,
    total_venta DECIMAL(10, 2) NOT NULL CHECK (total_venta >= 0),
    fecha_venta DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ventas_stock_id ON ventas(stock_id);
CREATE INDEX IF NOT EXISTS idx_ventas_canal_destino_id ON ventas(canal_destino_id);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha_venta ON ventas(fecha_venta DESC);

CREATE TRIGGER update_ventas_updated_at
    BEFORE UPDATE ON ventas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Función trigger para descontar stock al crear una venta
CREATE OR REPLACE FUNCTION update_stock_on_venta()
RETURNS TRIGGER AS $$
DECLARE
    disponibles INTEGER;
BEGIN
    -- Verificar unidades disponibles
    SELECT unidades_disponibles INTO disponibles
    FROM stock
    WHERE id = NEW.stock_id;
    
    IF disponibles < NEW.unidades THEN
        RAISE EXCEPTION 'No hay suficientes unidades disponibles. Disponibles: %, Solicitadas: %', disponibles, NEW.unidades;
    END IF;
    
    -- Descontar unidades
    UPDATE stock
    SET unidades_disponibles = unidades_disponibles - NEW.unidades
    WHERE id = NEW.stock_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stock_on_venta
    AFTER INSERT ON ventas
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_on_venta();

ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on ventas"
    ON ventas
    FOR ALL
    USING (true)
    WITH CHECK (true);

COMMENT ON TABLE ventas IS 'Registro de ventas reales que descuentan stock';
COMMENT ON COLUMN ventas.stock_id IS 'Referencia al stock vendido';
COMMENT ON COLUMN ventas.canal_destino_id IS 'Canal donde se realizó la venta';
COMMENT ON COLUMN ventas.precio_unitario IS 'Precio de venta por unidad';
COMMENT ON COLUMN ventas.unidades IS 'Número de unidades vendidas';
COMMENT ON COLUMN ventas.costes_venta IS 'Array JSON con costes adicionales de venta';
COMMENT ON COLUMN ventas.total_venta IS 'Total recibido (precio_unitario * unidades - costes_venta)';
COMMENT ON COLUMN ventas.fecha_venta IS 'Fecha real de la venta';
