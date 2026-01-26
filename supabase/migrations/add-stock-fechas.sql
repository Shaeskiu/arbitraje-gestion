-- ============================================
-- MIGRACIÓN: Fechas de Recepción y Disponibilidad en Stock
-- ============================================
-- Añade campos de fecha para registrar cuándo se recepciona el stock
-- y cuándo se pone a la venta

-- ============================================
-- AÑADIR CAMPOS DE FECHA A STOCK
-- ============================================

-- Añadir columna de fecha de recepción
ALTER TABLE stock 
ADD COLUMN IF NOT EXISTS fecha_recepcion DATE;

-- Añadir columna de fecha cuando se pone disponible (a la venta)
ALTER TABLE stock 
ADD COLUMN IF NOT EXISTS fecha_disponible DATE;

-- Crear índices para mejorar consultas por fecha
CREATE INDEX IF NOT EXISTS idx_stock_fecha_recepcion ON stock(fecha_recepcion DESC);
CREATE INDEX IF NOT EXISTS idx_stock_fecha_disponible ON stock(fecha_disponible DESC);

-- Comentarios
COMMENT ON COLUMN stock.fecha_recepcion IS 'Fecha en que se recepcionó el stock (cuando cambia de pendiente_recibir a recepcionado)';
COMMENT ON COLUMN stock.fecha_disponible IS 'Fecha en que el stock se puso disponible para venta (cuando cambia de recepcionado a disponible)';

-- ============================================
-- VERIFICACIÓN
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migración completada:';
    RAISE NOTICE '   - Campo fecha_recepcion añadido a stock';
    RAISE NOTICE '   - Campo fecha_disponible añadido a stock';
    RAISE NOTICE '   - Índices creados para consultas por fecha';
END $$;
