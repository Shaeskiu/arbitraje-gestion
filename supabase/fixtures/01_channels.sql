-- ============================================
-- FIXTURES: CANALES
-- ============================================
-- Canales de compra y venta para desarrollo
-- Estos son los canales base que se usarán en oportunidades, compras y ventas

INSERT INTO channels (id, name, created_at, updated_at) VALUES
-- IDs explícitos para mantener relaciones consistentes
('a1b2c3d4-e5f6-4789-a012-345678901234', 'Amazon España', NOW() - INTERVAL '90 days', NOW() - INTERVAL '90 days'),
('b2c3d4e5-f6a7-4890-b123-456789012345', 'eBay', NOW() - INTERVAL '85 days', NOW() - INTERVAL '85 days'),
('c3d4e5f6-a7b8-4901-c234-567890123456', 'AliExpress', NOW() - INTERVAL '80 days', NOW() - INTERVAL '80 days'),
('d4e5f6a7-b8c9-4012-d345-678901234567', 'Wallapop', NOW() - INTERVAL '75 days', NOW() - INTERVAL '75 days'),
('e5f6a7b8-c9d0-4123-e456-789012345678', 'Vinted', NOW() - INTERVAL '70 days', NOW() - INTERVAL '70 days')
ON CONFLICT (id) DO NOTHING;

-- Verificar inserción
DO $$
BEGIN
    RAISE NOTICE '✅ Canales insertados: %', (SELECT COUNT(*) FROM channels);
END $$;
