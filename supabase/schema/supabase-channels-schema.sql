-- ============================================
-- ESQUEMA DE CANALES PARA ARBITRAJE GESTIÓN
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
-- Mantener columnas antiguas para compatibilidad temporal
ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS origin_channel_id UUID REFERENCES channels(id),
ADD COLUMN IF NOT EXISTS dest_channel_id UUID REFERENCES channels(id);

-- Añadir campo opcional source a opportunity_costs para identificar origen del coste
ALTER TABLE opportunity_costs
ADD COLUMN IF NOT EXISTS source TEXT CHECK (source IN ('channel_origin', 'channel_destination', 'manual')) DEFAULT 'manual';

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_channels_name ON channels(name);
CREATE INDEX IF NOT EXISTS idx_channel_costs_channel_id ON channel_costs(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_costs_role ON channel_costs(cost_role);
CREATE INDEX IF NOT EXISTS idx_opportunities_origin_channel_id ON opportunities(origin_channel_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_dest_channel_id ON opportunities(dest_channel_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_costs_source ON opportunity_costs(source);

-- Trigger para actualizar updated_at en channels
CREATE TRIGGER update_channels_updated_at
    BEFORE UPDATE ON channels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================

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
-- FUNCIÓN DE MIGRACIÓN (Opcional)
-- ============================================

-- Función para migrar canales existentes desde opportunities
CREATE OR REPLACE FUNCTION migrate_existing_channels()
RETURNS void AS $$
DECLARE
    channel_name TEXT;
    channel_id_val UUID;
BEGIN
    -- Migrar canales de origen
    FOR channel_name IN 
        SELECT DISTINCT origin_channel 
        FROM opportunities 
        WHERE origin_channel IS NOT NULL 
        AND origin_channel != ''
    LOOP
        -- Buscar si ya existe el canal
        SELECT id INTO channel_id_val FROM channels WHERE name = channel_name;
        
        -- Si no existe, crearlo
        IF channel_id_val IS NULL THEN
            INSERT INTO channels (name) VALUES (channel_name) RETURNING id INTO channel_id_val;
        END IF;
        
        -- Actualizar opportunities con el nuevo ID
        UPDATE opportunities 
        SET origin_channel_id = channel_id_val 
        WHERE origin_channel = channel_name;
    END LOOP;
    
    -- Migrar canales de destino
    FOR channel_name IN 
        SELECT DISTINCT dest_channel 
        FROM opportunities 
        WHERE dest_channel IS NOT NULL 
        AND dest_channel != ''
    LOOP
        -- Buscar si ya existe el canal
        SELECT id INTO channel_id_val FROM channels WHERE name = channel_name;
        
        -- Si no existe, crearlo
        IF channel_id_val IS NULL THEN
            INSERT INTO channels (name) VALUES (channel_name) RETURNING id INTO channel_id_val;
        END IF;
        
        -- Actualizar opportunities con el nuevo ID
        UPDATE opportunities 
        SET dest_channel_id = channel_id_val 
        WHERE dest_channel = channel_name;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar migración (descomentar cuando quieras migrar datos existentes)
-- SELECT migrate_existing_channels();

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista para obtener canales con sus costes organizados
CREATE OR REPLACE VIEW channels_with_costs AS
SELECT 
    c.*,
    COALESCE(
        json_agg(
            json_build_object(
                'id', cc.id,
                'cost_role', cc.cost_role,
                'name', cc.name,
                'type', cc.type,
                'value', cc.value,
                'base', cc.base
            )
        ) FILTER (WHERE cc.id IS NOT NULL),
        '[]'::json
    ) as costs
FROM channels c
LEFT JOIN channel_costs cc ON c.id = cc.channel_id
GROUP BY c.id;

-- Vista para obtener oportunidades con información completa de canales
CREATE OR REPLACE VIEW opportunities_with_channels AS
SELECT 
    o.*,
    c_origin.name as origin_channel_name,
    c_dest.name as dest_channel_name
FROM opportunities o
LEFT JOIN channels c_origin ON o.origin_channel_id = c_origin.id
LEFT JOIN channels c_dest ON o.dest_channel_id = c_dest.id;

-- ============================================
-- COMENTARIOS EN TABLAS Y COLUMNAS
-- ============================================

COMMENT ON TABLE channels IS 'Canales de compra y venta configurados en el sistema';
COMMENT ON COLUMN channels.name IS 'Nombre único del canal (ej: Amazon, eBay, AliExpress)';

COMMENT ON TABLE channel_costs IS 'Costes predefinidos asociados a cada canal';
COMMENT ON COLUMN channel_costs.cost_role IS 'Rol del coste: origin (cuando el canal se usa para comprar) o destination (cuando se usa para vender)';
COMMENT ON COLUMN channel_costs.name IS 'Nombre del coste (ej: Envío, Comisión)';
COMMENT ON COLUMN channel_costs.type IS 'Tipo de coste: fixed (valor fijo) o percentage (porcentaje)';
COMMENT ON COLUMN channel_costs.value IS 'Valor del coste (en euros si es fixed, en porcentaje si es percentage)';
COMMENT ON COLUMN channel_costs.base IS 'Base para calcular porcentaje: purchase (precio compra) o sale (precio venta). Solo aplica si type = percentage';

COMMENT ON COLUMN opportunities.origin_channel_id IS 'Referencia al canal de origen (reemplaza origin_channel)';
COMMENT ON COLUMN opportunities.dest_channel_id IS 'Referencia al canal de destino (reemplaza dest_channel)';

COMMENT ON COLUMN opportunity_costs.source IS 'Origen del coste: channel_origin (copiado del canal origen), channel_destination (copiado del canal destino), o manual (añadido manualmente)';
