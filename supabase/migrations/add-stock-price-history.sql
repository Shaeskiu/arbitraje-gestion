-- ============================================
-- MIGRACIÓN: Histórico de Precios de Stock
-- ============================================
-- Tabla para registrar el histórico de precios de cada unidad de stock
-- cuando se pone a la venta y las sucesivas bajadas/subidas de precio

-- ============================================
-- TABLA: stock_price_history
-- ============================================

CREATE TABLE IF NOT EXISTS public.stock_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_id UUID NOT NULL REFERENCES public.stock(id) ON DELETE CASCADE,
    precio NUMERIC(10, 2) NOT NULL CHECK (precio >= 0),
    tipo_evento TEXT NOT NULL CHECK (tipo_evento IN ('publicacion', 'bajada', 'subida', 'ajuste')),
    motivo TEXT,
    usuario_email TEXT,
    fecha_desde TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_hasta TIMESTAMPTZ NULL
);

-- Índices para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_stock_price_history_stock_id ON public.stock_price_history(stock_id);
CREATE INDEX IF NOT EXISTS idx_stock_price_history_stock_id_vigente ON public.stock_price_history(stock_id) WHERE fecha_hasta IS NULL;
CREATE INDEX IF NOT EXISTS idx_stock_price_history_fecha_desde ON public.stock_price_history(fecha_desde DESC);

-- ============================================
-- RLS Y POLÍTICAS
-- ============================================

ALTER TABLE public.stock_price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on stock_price_history"
    ON public.stock_price_history
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE public.stock_price_history IS 'Histórico de precios de cada unidad de stock: registro de publicación inicial y cambios de precio';
COMMENT ON COLUMN public.stock_price_history.stock_id IS 'Referencia a la unidad de stock';
COMMENT ON COLUMN public.stock_price_history.precio IS 'Precio establecido en este momento';
COMMENT ON COLUMN public.stock_price_history.tipo_evento IS 'Tipo de evento: publicacion (primera vez), bajada, subida, ajuste';
COMMENT ON COLUMN public.stock_price_history.motivo IS 'Motivo opcional del cambio de precio';
COMMENT ON COLUMN public.stock_price_history.usuario_email IS 'Email del usuario que realizó el cambio';
COMMENT ON COLUMN public.stock_price_history.fecha_desde IS 'Fecha desde la que este precio está vigente';
COMMENT ON COLUMN public.stock_price_history.fecha_hasta IS 'Fecha hasta la que este precio estuvo vigente (NULL si es el precio actual)';

-- ============================================
-- VERIFICACIÓN
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migración completada:';
    RAISE NOTICE '   - Tabla stock_price_history creada';
    RAISE NOTICE '   - Índices creados para consultas eficientes';
    RAISE NOTICE '   - RLS y políticas configuradas';
END $$;
