-- ============================================
-- ESQUEMA DE STOCK PARA ARBITRAJE GESTIÓN
-- ============================================

-- Tabla de Stock (inventario comprado)
CREATE TABLE IF NOT EXISTS stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    purchase_channel TEXT NOT NULL,
    purchase_channel_id UUID REFERENCES channels(id),
    real_purchase_price DECIMAL(10, 2) NOT NULL CHECK (real_purchase_price >= 0),
    units_purchased INTEGER NOT NULL CHECK (units_purchased > 0),
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    stock_status TEXT NOT NULL CHECK (stock_status IN ('in_stock', 'sold', 'returned')) DEFAULT 'in_stock',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Actualizar tabla opportunities para añadir status 'converted'
ALTER TABLE opportunities 
DROP CONSTRAINT IF EXISTS opportunities_status_check;

ALTER TABLE opportunities 
ADD CONSTRAINT opportunities_status_check 
CHECK (status IN ('detectado', 'analizado', 'aprobado', 'comprado', 'vendido', 'descartado', 'converted'));

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_stock_opportunity_id ON stock(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_stock_stock_status ON stock(stock_status);
CREATE INDEX IF NOT EXISTS idx_stock_purchase_date ON stock(purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_purchase_channel_id ON stock(purchase_channel_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status_converted ON opportunities(status) WHERE status = 'converted';

-- Trigger para actualizar updated_at en stock
CREATE TRIGGER update_stock_updated_at
    BEFORE UPDATE ON stock
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS para stock
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on stock"
    ON stock
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Comentarios
COMMENT ON TABLE stock IS 'Stock de productos comprados a partir de oportunidades';
COMMENT ON COLUMN stock.opportunity_id IS 'Referencia a la oportunidad original convertida';
COMMENT ON COLUMN stock.product_name IS 'Nombre del producto';
COMMENT ON COLUMN stock.purchase_channel IS 'Canal donde se compró el producto';
COMMENT ON COLUMN stock.purchase_channel_id IS 'Referencia al canal (opcional)';
COMMENT ON COLUMN stock.real_purchase_price IS 'Precio real pagado por unidad';
COMMENT ON COLUMN stock.units_purchased IS 'Número de unidades compradas';
COMMENT ON COLUMN stock.purchase_date IS 'Fecha de compra';
COMMENT ON COLUMN stock.stock_status IS 'Estado del stock: in_stock, sold, returned';
