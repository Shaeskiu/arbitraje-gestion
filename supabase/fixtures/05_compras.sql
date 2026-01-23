-- ============================================
-- FIXTURES: COMPRAS
-- ============================================
-- Compras reales convertidas desde oportunidades
-- NOTA: Al insertar una compra, el trigger automáticamente crea el stock correspondiente

INSERT INTO compras (
    id,
    oportunidad_id,
    canal_origen_id,
    product_name,
    precio_unitario,
    unidades,
    costes_compra,
    total_compra,
    fecha_compra,
    created_at,
    updated_at
) VALUES
-- Compra 1: Apple Watch Series 9 (desde oportunidad convertida)
(
    'c1a2b3c4-d5e6-4789-c012-345678901234',
    '89abcdef-0123-4123-7890-123456789012', -- Apple Watch oportunidad
    'c3d4e5f6-a7b8-4901-c234-567890123456', -- AliExpress
    'Apple Watch Series 9 45mm',
    299.99,
    2,
    '[
        {"name": "Envío desde China", "type": "fixed", "value": 2.99},
        {"name": "Aranceles aduana", "type": "percentage", "value": 5.0, "base": "purchase"},
        {"name": "Caja original de regalo", "type": "fixed", "value": 8.99}
    ]'::jsonb,
    629.97, -- (299.99 * 2) + 2.99 + (299.99 * 2 * 0.05) + 8.99
    CURRENT_DATE - INTERVAL '7 days',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days'
),

-- Compra 2: Nike Dunk Low Panda (desde oportunidad convertida)
(
    'c2a3b4c5-d6e7-4790-c123-456789012345',
    '9abcdef0-1234-4123-8901-234567890123', -- Nike Dunk oportunidad
    'a1b2c3d4-e5f6-4789-a012-345678901234', -- Amazon España
    'Nike Dunk Low Panda Talla 41',
    89.99,
    3,
    '[
        {"name": "Envío estándar", "type": "fixed", "value": 4.99},
        {"name": "Comisión Amazon", "type": "percentage", "value": 15.0, "base": "purchase"}
    ]'::jsonb,
    325.46, -- (89.99 * 3) + 4.99 + (89.99 * 3 * 0.15)
    CURRENT_DATE - INTERVAL '11 days',
    NOW() - INTERVAL '11 days',
    NOW() - INTERVAL '11 days'
),

-- Compra 3: iPad Air 5 (desde oportunidad convertida)
(
    'c3a4b5c6-d7e8-4791-c234-567890123456',
    'abcdef01-2345-4123-9012-345678901234', -- iPad Air oportunidad
    'b2c3d4e5-f6a7-4890-b123-456789012345', -- eBay
    'iPad Air 5ª Gen 64GB',
    449.99,
    1,
    '[
        {"name": "Envío eBay", "type": "fixed", "value": 3.50},
        {"name": "Fundas protectora premium", "type": "fixed", "value": 24.99},
        {"name": "Seguro de transporte", "type": "percentage", "value": 1.5, "base": "purchase"}
    ]'::jsonb,
    480.48, -- 449.99 + 3.50 + 24.99 + (449.99 * 0.015)
    CURRENT_DATE - INTERVAL '15 days',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '15 days'
),

-- Compra 4: Chaqueta Patagonia (desde oportunidad convertida)
(
    'c4a5b6c7-d8e9-4792-c345-678901234567',
    'bcdef012-3456-4123-a012-345678901234', -- Patagonia oportunidad
    'e5f6a7b8-c9d0-4123-e456-789012345678', -- Vinted
    'Chaqueta Patagonia Retro-X',
    120.00,
    2,
    '[
        {"name": "Comisión Vinted", "type": "percentage", "value": 8.0, "base": "purchase"},
        {"name": "Protección comprador", "type": "fixed", "value": 0.70}
    ]'::jsonb,
    260.30, -- (120.00 * 2) + (120.00 * 2 * 0.08) + 0.70
    CURRENT_DATE - INTERVAL '19 days',
    NOW() - INTERVAL '19 days',
    NOW() - INTERVAL '19 days'
)
ON CONFLICT (id) DO NOTHING;

-- Verificar inserción y stock generado automáticamente
DO $$
DECLARE
    compras_count INTEGER;
    stock_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO compras_count FROM compras;
    SELECT COUNT(*) INTO stock_count FROM stock;
    RAISE NOTICE '✅ Compras insertadas: %', compras_count;
    RAISE NOTICE '✅ Stock generado automáticamente: %', stock_count;
    IF stock_count < compras_count THEN
        RAISE WARNING '⚠️  El trigger de stock podría no haber funcionado correctamente';
    END IF;
END $$;
