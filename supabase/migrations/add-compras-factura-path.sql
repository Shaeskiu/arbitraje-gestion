-- Añadir columna para ruta de factura en Storage (bucket facturas)
ALTER TABLE compras ADD COLUMN IF NOT EXISTS factura_path TEXT;
COMMENT ON COLUMN compras.factura_path IS 'Ruta del archivo de factura en Supabase Storage (bucket facturas)';
