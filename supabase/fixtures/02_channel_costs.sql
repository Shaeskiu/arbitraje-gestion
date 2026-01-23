-- ============================================
-- FIXTURES: COSTES DE CANALES
-- ============================================
-- Costes predefinidos asociados a cada canal
-- Estos costes se aplican automáticamente cuando se usa el canal

INSERT INTO channel_costs (id, channel_id, cost_role, name, type, value, base, created_at) VALUES
-- Amazon España - Costes como origen (compra)
('f1a2b3c4-d5e6-4234-f567-890123456789', 'a1b2c3d4-e5f6-4789-a012-345678901234', 'origin', 'Envío estándar', 'fixed', 4.99, NULL, NOW() - INTERVAL '90 days'),
('f2a3b4c5-d6e7-4235-f678-901234567890', 'a1b2c3d4-e5f6-4789-a012-345678901234', 'origin', 'Comisión Amazon', 'percentage', 15.0, 'purchase', NOW() - INTERVAL '90 days'),

-- eBay - Costes como origen y destino
('f3a4b5c6-d7e8-4236-f789-012345678901', 'b2c3d4e5-f6a7-4890-b123-456789012345', 'origin', 'Envío eBay', 'fixed', 3.50, NULL, NOW() - INTERVAL '85 days'),
('f4a5b6c7-d8e9-4237-f890-123456789012', 'b2c3d4e5-f6a7-4890-b123-456789012345', 'destination', 'Comisión venta eBay', 'percentage', 12.5, 'sale', NOW() - INTERVAL '85 days'),

-- AliExpress - Costes como origen
('f5a6b7c8-d9e0-4238-f901-234567890123', 'c3d4e5f6-a7b8-4901-c234-567890123456', 'origin', 'Envío desde China', 'fixed', 2.99, NULL, NOW() - INTERVAL '80 days'),
('f6a7b8c9-d0e1-4239-f012-345678901234', 'c3d4e5f6-a7b8-4901-c234-567890123456', 'origin', 'Aranceles aduana', 'percentage', 5.0, 'purchase', NOW() - INTERVAL '80 days'),

-- Wallapop - Costes como destino (venta)
('f7a8b9c0-d1e2-4240-f123-456789012345', 'd4e5f6a7-b8c9-4012-d345-678901234567', 'destination', 'Comisión Wallapop', 'percentage', 5.0, 'sale', NOW() - INTERVAL '75 days'),

-- Vinted - Costes como destino (venta)
('f8a9b0c1-d2e3-4241-f234-567890123456', 'e5f6a7b8-c9d0-4123-e456-789012345678', 'destination', 'Comisión Vinted', 'percentage', 8.0, 'sale', NOW() - INTERVAL '70 days'),
('f9a0b1c2-d3e4-4242-f345-678901234567', 'e5f6a7b8-c9d0-4123-e456-789012345678', 'destination', 'Protección comprador', 'fixed', 0.70, NULL, NOW() - INTERVAL '70 days')
ON CONFLICT (id) DO NOTHING;

-- Verificar inserción
DO $$
BEGIN
    RAISE NOTICE '✅ Costes de canales insertados: %', (SELECT COUNT(*) FROM channel_costs);
END $$;
