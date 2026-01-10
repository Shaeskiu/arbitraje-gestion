-- ============================================
-- ESQUEMA DE BASE DE DATOS PARA ARBITRAJE GESTIÓN
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

-- Índices para mejorar el rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_created_at ON opportunities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_updated_at ON opportunities(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunity_costs_opportunity_id ON opportunity_costs(opportunity_id);

-- Función para actualizar automáticamente updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en opportunities
CREATE TRIGGER update_opportunities_updated_at
    BEFORE UPDATE ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================

-- Habilitar RLS (ajustar según necesidades de autenticación)
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_costs ENABLE ROW LEVEL SECURITY;

-- Política: Permitir todas las operaciones (ajustar según autenticación)
-- Para uso interno sin autenticación, puedes usar esta política:
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

-- Si en el futuro quieres autenticación, puedes usar:
-- CREATE POLICY "Users can manage their own opportunities"
--     ON opportunities
--     FOR ALL
--     USING (auth.uid() = user_id)
--     WITH CHECK (auth.uid() = user_id);

-- ============================================
-- VISTAS ÚTILES (Opcional)
-- ============================================

-- Vista para obtener oportunidades con costes agregados
CREATE OR REPLACE VIEW opportunities_with_costs AS
SELECT 
    o.*,
    COALESCE(SUM(
        CASE 
            WHEN oc.type = 'fixed' THEN oc.value
            WHEN oc.type = 'percentage' AND oc.base = 'purchase' THEN (o.origin_price * oc.value / 100)
            WHEN oc.type = 'percentage' AND oc.base = 'sale' THEN (o.dest_price * oc.value / 100)
            ELSE 0
        END
    ), 0) AS total_costs
FROM opportunities o
LEFT JOIN opportunity_costs oc ON o.id = oc.opportunity_id
GROUP BY o.id;

-- ============================================
-- COMENTARIOS EN TABLAS Y COLUMNAS
-- ============================================

COMMENT ON TABLE opportunities IS 'Oportunidades de arbitraje comercial';
COMMENT ON COLUMN opportunities.product_name IS 'Nombre del producto';
COMMENT ON COLUMN opportunities.origin_channel IS 'Canal donde se compra el producto';
COMMENT ON COLUMN opportunities.origin_price IS 'Precio de compra';
COMMENT ON COLUMN opportunities.dest_channel IS 'Canal donde se vende el producto';
COMMENT ON COLUMN opportunities.dest_price IS 'Precio estimado de venta';
COMMENT ON COLUMN opportunities.real_sale_price IS 'Precio real de venta (opcional, para comparar con estimado)';
COMMENT ON COLUMN opportunities.status IS 'Estado de la oportunidad: detectado, analizado, aprobado, comprado, vendido, descartado';

COMMENT ON TABLE opportunity_costs IS 'Costes asociados a cada oportunidad';
COMMENT ON COLUMN opportunity_costs.type IS 'Tipo de coste: fixed (valor fijo) o percentage (porcentaje)';
COMMENT ON COLUMN opportunity_costs.value IS 'Valor del coste (en euros si es fixed, en porcentaje si es percentage)';
COMMENT ON COLUMN opportunity_costs.base IS 'Base para calcular porcentaje: purchase (precio compra) o sale (precio venta). Solo aplica si type = percentage';
