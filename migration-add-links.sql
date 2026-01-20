-- ============================================
-- MIGRACIÓN: Añadir campos de enlaces a oportunidades
-- ============================================

ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS offer_link TEXT,
ADD COLUMN IF NOT EXISTS market_price_link TEXT;

-- Comentarios para documentar las nuevas columnas
COMMENT ON COLUMN opportunities.offer_link IS 'Enlace donde se vio la oferta original';
COMMENT ON COLUMN opportunities.market_price_link IS 'Enlace de precios de mercado para comparar';
