-- ============================================
-- SCRIPT DE INICIALIZACIÓN DE BASE DE DATOS
-- Este script se ejecuta automáticamente al crear el contenedor de Supabase
-- ============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. ESQUEMA BASE (supabase-schema.sql)
-- ============================================

-- Tabla principal: Oportunidades de Arbitraje
CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name TEXT NOT NULL,
    origin_channel TEXT NOT NULL,
    origin_price DECIMAL(10, 2) NOT NULL CHECK (origin_price >= 0),
    dest_channel TEXT NOT NULL,
    dest_price DECIMAL(10, 2) NOT NULL CHECK (dest_price >= 0),
    real_sale_price DECIMAL(10, 2) CHECK (real_sale_price >= 0),
    status TEXT NOT NULL CHECK (status IN ('detectado', 'analizado', 'aprobado', 'comprado', 'vendido', 'descartado')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de costes asociados a cada oportunidad
CREATE TABLE IF NOT EXISTS opportunity_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('fixed', 'percentage')),
    value DECIMAL(10, 2) NOT NULL CHECK (value >= 0),
    base TEXT CHECK (
        (type = 'percentage' AND base IN ('purchase', 'sale')) OR
        (type = 'fixed' AND base IS NULL)
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_percentage_base CHECK (
        (type = 'percentage' AND base IS NOT NULL) OR
        (type = 'fixed')
    )
);

-- Función para actualizar automáticamente updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en opportunities
DROP TRIGGER IF EXISTS update_opportunities_updated_at ON opportunities;
CREATE TRIGGER update_opportunities_updated_at
    BEFORE UPDATE ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Índices
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_created_at ON opportunities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_updated_at ON opportunities(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunity_costs_opportunity_id ON opportunity_costs(opportunity_id);

-- RLS
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on opportunities"
    ON opportunities
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all operations on opportunity_costs"
    ON opportunity_costs
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- 2. ESQUEMA DE CANALES (supabase-channels-schema.sql)
-- ============================================

-- Tabla principal: Canales
CREATE TABLE IF NOT EXISTS channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de costes asociados a cada canal
CREATE TABLE IF NOT EXISTS channel_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    cost_role TEXT NOT NULL CHECK (cost_role IN ('origin', 'destination')),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('fixed', 'percentage')),
    value DECIMAL(10, 2) NOT NULL CHECK (value >= 0),
    base TEXT CHECK (
        (type = 'percentage' AND base IN ('purchase', 'sale')) OR
        (type = 'fixed' AND base IS NULL)
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_percentage_base CHECK (
        (type = 'percentage' AND base IS NOT NULL) OR
        (type = 'fixed')
    )
);

-- Modificar tabla opportunities para añadir referencias a canales
ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS origin_channel_id UUID REFERENCES channels(id),
ADD COLUMN IF NOT EXISTS dest_channel_id UUID REFERENCES channels(id);

-- Añadir campo opcional source a opportunity_costs
ALTER TABLE opportunity_costs
ADD COLUMN IF NOT EXISTS source TEXT CHECK (source IN ('channel_origin', 'channel_destination', 'manual')) DEFAULT 'manual';

-- Índices
CREATE INDEX IF NOT EXISTS idx_channels_name ON channels(name);
CREATE INDEX IF NOT EXISTS idx_channel_costs_channel_id ON channel_costs(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_costs_role ON channel_costs(cost_role);
CREATE INDEX IF NOT EXISTS idx_opportunities_origin_channel_id ON opportunities(origin_channel_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_dest_channel_id ON opportunities(dest_channel_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_costs_source ON opportunity_costs(source);

-- Trigger para actualizar updated_at en channels
DROP TRIGGER IF EXISTS update_channels_updated_at ON channels;
CREATE TRIGGER update_channels_updated_at
    BEFORE UPDATE ON channels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on channels"
    ON channels
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all operations on channel_costs"
    ON channel_costs
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- 3. NUEVO ESQUEMA (supabase-new-schema.sql)
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

-- Migrar estados
UPDATE opportunities 
SET status = 'detectada'
WHERE status IS NULL;

UPDATE opportunities 
SET status = CASE 
    WHEN status = 'detectada' THEN 'detectada'
    WHEN status = 'descartada' THEN 'descartada'
    WHEN status = 'convertida' THEN 'convertida'
    WHEN status = 'detectado' THEN 'detectada'
    WHEN status = 'descartado' THEN 'descartada'
    WHEN status = 'convertido' THEN 'convertida'
    WHEN status IN ('analizado', 'analizada') THEN 'detectada'
    WHEN status IN ('aprobado', 'aprobada') THEN 'detectada'
    WHEN status IN ('comprado', 'comprada', 'compra') THEN 'convertida'
    WHEN status IN ('vendido', 'vendida', 'venta') THEN 'convertida'
    WHEN status IN ('converted', 'convertido') THEN 'convertida'
    WHEN status IN ('descartar') THEN 'descartada'
    WHEN LOWER(TRIM(status)) = 'detectado' THEN 'detectada'
    WHEN LOWER(TRIM(status)) = 'descartado' THEN 'descartada'
    WHEN LOWER(TRIM(status)) = 'convertido' THEN 'convertida'
    ELSE 'detectada'
END;

-- Añadir constraint de status
ALTER TABLE opportunities 
ADD CONSTRAINT opportunities_status_check 
CHECK (status IN ('detectada', 'descartada', 'convertida'));

-- Tabla COMPRAS
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

DROP TRIGGER IF EXISTS update_compras_updated_at ON compras;
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

-- Tabla STOCK
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

DROP TRIGGER IF EXISTS update_stock_updated_at ON stock;
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

-- Función trigger para crear stock automáticamente al crear una compra
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

DROP TRIGGER IF EXISTS trigger_create_stock_from_compra ON compras;
CREATE TRIGGER trigger_create_stock_from_compra
    AFTER INSERT ON compras
    FOR EACH ROW
    EXECUTE FUNCTION create_stock_from_compra();

-- Tabla VENTAS
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

DROP TRIGGER IF EXISTS update_ventas_updated_at ON ventas;
CREATE TRIGGER update_ventas_updated_at
    BEFORE UPDATE ON ventas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Función trigger para descontar stock al crear una venta
DROP FUNCTION IF EXISTS update_stock_on_venta();
CREATE OR REPLACE FUNCTION update_stock_on_venta()
RETURNS TRIGGER AS $$
DECLARE
    disponibles INTEGER;
BEGIN
    SELECT unidades_disponibles INTO disponibles
    FROM stock
    WHERE id = NEW.stock_id;
    
    IF disponibles IS NULL THEN
        RAISE EXCEPTION 'Stock con id % no existe', NEW.stock_id;
    END IF;
    
    IF disponibles < NEW.unidades THEN
        RAISE EXCEPTION 'No hay suficientes unidades disponibles. Disponibles: %, Solicitadas: %', disponibles, NEW.unidades;
    END IF;
    
    UPDATE stock
    SET unidades_disponibles = unidades_disponibles - NEW.unidades,
        updated_at = NOW()
    WHERE id = NEW.stock_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_stock_on_venta ON ventas;
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

-- ============================================
-- 4. MIGRACIÓN: AÑADIR ENLACES (migration-add-links.sql)
-- ============================================

ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS offer_link TEXT,
ADD COLUMN IF NOT EXISTS market_price_link TEXT;

-- ============================================
-- 5. MIGRACIÓN: COMPLETAR ESQUEMA (migration-completar.sql)
-- ============================================

-- Añadir product_name a compras
ALTER TABLE compras
ADD COLUMN IF NOT EXISTS product_name TEXT NOT NULL DEFAULT 'Producto sin nombre';

UPDATE compras c
SET product_name = o.product_name
FROM opportunities o
WHERE c.oportunidad_id = o.id
  AND c.product_name = 'Producto sin nombre'
  AND o.product_name IS NOT NULL;

UPDATE compras
SET product_name = 'Producto ' || id::text
WHERE product_name = 'Producto sin nombre' OR product_name IS NULL;

ALTER TABLE compras
ALTER COLUMN product_name SET NOT NULL;

ALTER TABLE compras
ALTER COLUMN product_name DROP DEFAULT;

CREATE INDEX IF NOT EXISTS idx_compras_product_name ON compras(product_name);

-- Añadir product_name a ventas
ALTER TABLE ventas
ADD COLUMN IF NOT EXISTS product_name TEXT;

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

UPDATE ventas v
SET product_name = c.product_name
FROM stock s
JOIN compras c ON s.compra_id = c.id
WHERE v.stock_id = s.id
  AND v.product_name IS NULL
  AND c.product_name IS NOT NULL;

UPDATE ventas
SET product_name = 'Producto ' || id::text
WHERE product_name IS NULL OR product_name = '';

ALTER TABLE ventas
ALTER COLUMN product_name SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ventas_product_name ON ventas(product_name);

-- ============================================
-- CREAR ESQUEMA AUTH PARA GOTRUE
-- ============================================

-- Crear esquema auth si no existe
CREATE SCHEMA IF NOT EXISTS auth;

-- Conceder permisos al esquema auth
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated;

-- ============================================
-- CREAR ROLES PARA SUPABASE
-- ============================================

-- Crear rol anon para PostgREST
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN NOINHERIT;
    END IF;
END
$$;

-- Crear rol authenticated (para futura autenticación)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN NOINHERIT;
    END IF;
END
$$;

-- Conceder permisos
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;

-- ============================================
-- FIN DE INICIALIZACIÓN
-- ============================================

DO $$
BEGIN
    RAISE NOTICE 'Base de datos inicializada correctamente!';
    RAISE NOTICE 'Tablas creadas: opportunities, opportunity_costs, channels, channel_costs, compras, stock, ventas';
    RAISE NOTICE 'Triggers y funciones configuradas';
    RAISE NOTICE 'RLS habilitado para todas las tablas';
END $$;
