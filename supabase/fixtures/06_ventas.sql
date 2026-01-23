-- ============================================
-- FIXTURES: VENTAS
-- ============================================
-- Ventas reales que descuentan stock
-- NOTA: Al insertar una venta, el trigger automáticamente descuenta las unidades del stock
-- IMPORTANTE: Las ventas deben referenciar stock_id existente (generado por las compras)

INSERT INTO ventas (
    id,
    stock_id,
    canal_destino_id,
    precio_unitario,
    unidades,
    product_name,
    costes_venta,
    total_venta,
    fecha_venta,
    created_at,
    updated_at
) VALUES
-- Venta 1: Apple Watch (1 de 2 unidades vendidas)
(
    'a1b2c3d4-e5f6-4789-a012-345678901234',
    (SELECT id FROM stock WHERE compra_id = 'c1a2b3c4-d5e6-4789-c012-345678901234' LIMIT 1),
    'd4e5f6a7-b8c9-4012-d345-678901234567', -- Wallapop
    399.99,
    1,
    'Apple Watch Series 9 45mm',
    '[
        {"name": "Comisión Wallapop", "type": "percentage", "value": 5.0, "base": "sale"}
    ]'::jsonb,
    379.99, -- 399.99 - (399.99 * 0.05)
    CURRENT_DATE - INTERVAL '3 days',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
),

-- Venta 2: Apple Watch (1 unidad restante vendida)
(
    'a2b3c4d5-e6f7-4790-a123-456789012345',
    (SELECT id FROM stock WHERE compra_id = 'c1a2b3c4-d5e6-4789-c012-345678901234' LIMIT 1),
    'd4e5f6a7-b8c9-4012-d345-678901234567', -- Wallapop
    389.99,
    1,
    'Apple Watch Series 9 45mm',
    '[
        {"name": "Comisión Wallapop", "type": "percentage", "value": 5.0, "base": "sale"}
    ]'::jsonb,
    370.49, -- 389.99 - (389.99 * 0.05)
    CURRENT_DATE - INTERVAL '1 day',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
),

-- Venta 3: Nike Dunk (2 de 3 unidades vendidas)
(
    'a3b4c5d6-e7f8-4791-a234-567890123456',
    (SELECT id FROM stock WHERE compra_id = 'c2a3b4c5-d6e7-4790-c123-456789012345' LIMIT 1),
    'e5f6a7b8-c9d0-4123-e456-789012345678', -- Vinted
    140.00,
    2,
    'Nike Dunk Low Panda Talla 41',
    '[
        {"name": "Comisión Vinted", "type": "percentage", "value": 8.0, "base": "sale"},
        {"name": "Protección comprador", "type": "fixed", "value": 0.70}
    ]'::jsonb,
    257.30, -- (140.00 * 2) - (140.00 * 2 * 0.08) - 0.70
    CURRENT_DATE - INTERVAL '5 days',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days'
),

-- Venta 4: iPad Air (completo - 1 unidad)
(
    'a4b5c6d7-e8f9-4792-a345-678901234567',
    (SELECT id FROM stock WHERE compra_id = 'c3a4b5c6-d7e8-4791-c234-567890123456' LIMIT 1),
    'd4e5f6a7-b8c9-4012-d345-678901234567', -- Wallapop
    579.99,
    1,
    'iPad Air 5ª Gen 64GB',
    '[
        {"name": "Comisión Wallapop", "type": "percentage", "value": 5.0, "base": "sale"}
    ]'::jsonb,
    550.99, -- 579.99 - (579.99 * 0.05)
    CURRENT_DATE - INTERVAL '10 days',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days'
),

-- Venta 5: Patagonia (1 de 2 unidades vendidas)
(
    'a5b6c7d8-e9f0-4793-a456-789012345678',
    (SELECT id FROM stock WHERE compra_id = 'c4a5b6c7-d8e9-4792-c345-678901234567' LIMIT 1),
    'b2c3d4e5-f6a7-4890-b123-456789012345', -- eBay
    180.00,
    1,
    'Chaqueta Patagonia Retro-X',
    '[
        {"name": "Comisión venta eBay", "type": "percentage", "value": 12.5, "base": "sale"}
    ]'::jsonb,
    157.50, -- 180.00 - (180.00 * 0.125)
    CURRENT_DATE - INTERVAL '12 days',
    NOW() - INTERVAL '12 days',
    NOW() - INTERVAL '12 days'
),

-- Venta 6: Patagonia (1 unidad restante)
(
    'a6b7c8d9-e0f1-4794-a567-890123456789',
    (SELECT id FROM stock WHERE compra_id = 'c4a5b6c7-d8e9-4792-c345-678901234567' LIMIT 1),
    'b2c3d4e5-f6a7-4890-b123-456789012345', -- eBay
    175.00,
    1,
    'Chaqueta Patagonia Retro-X',
    '[
        {"name": "Comisión venta eBay", "type": "percentage", "value": 12.5, "base": "sale"}
    ]'::jsonb,
    153.13, -- 175.00 - (175.00 * 0.125)
    CURRENT_DATE - INTERVAL '8 days',
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '8 days'
)
ON CONFLICT (id) DO NOTHING;

-- Verificar inserción y stock descontado
DO $$
DECLARE
    ventas_count INTEGER;
    stock_con_unidades INTEGER;
    stock_agotado INTEGER;
BEGIN
    SELECT COUNT(*) INTO ventas_count FROM ventas;
    SELECT COUNT(*) INTO stock_con_unidades FROM stock WHERE unidades_disponibles > 0;
    SELECT COUNT(*) INTO stock_agotado FROM stock WHERE unidades_disponibles = 0;
    
    RAISE NOTICE '✅ Ventas insertadas: %', ventas_count;
    RAISE NOTICE '✅ Stock con unidades disponibles: %', stock_con_unidades;
    RAISE NOTICE '✅ Stock agotado: %', stock_agotado;
END $$;
