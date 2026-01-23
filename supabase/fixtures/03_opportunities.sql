-- ============================================
-- FIXTURES: OPORTUNIDADES
-- ============================================
-- Oportunidades de arbitraje en diferentes estados
-- Algunas estarán convertidas, otras descartadas, otras solo detectadas

INSERT INTO opportunities (
    id, 
    product_name, 
    origin_channel, 
    origin_price, 
    dest_channel, 
    dest_price, 
    real_sale_price,
    status,
    canal_origen_id,
    canal_destino_id,
    precio_estimado_compra,
    precio_estimado_venta,
    margen_estimado,
    offer_link,
    market_price_link,
    notes,
    created_at,
    updated_at
) VALUES
-- Oportunidades DETECTADAS (sin convertir aún)
(
    '01234567-89ab-4cde-f012-345678901234',
    'AirPods Pro 2ª Generación',
    'AliExpress',
    89.99,
    'Wallapop',
    149.99,
    NULL,
    'detectada',
    'c3d4e5f6-a7b8-4901-c234-567890123456', -- AliExpress
    'd4e5f6a7-b8c9-4012-d345-678901234567', -- Wallapop
    89.99,
    149.99,
    60.00,
    'https://aliexpress.com/item/airpods-pro',
    'https://wallapop.com/search?q=airpods+pro',
    'Buena oportunidad, márgen alto. Verificar autenticidad del producto.',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '15 days'
),
(
    '12345678-9abc-4def-0123-456789012345',
    'Nike Air Max 90 Talla 42',
    'Amazon España',
    79.99,
    'Vinted',
    120.00,
    NULL,
    'detectada',
    'a1b2c3d4-e5f6-4789-a012-345678901234', -- Amazon España
    'e5f6a7b8-c9d0-4123-e456-789012345678', -- Vinted
    79.99,
    120.00,
    40.01,
    'https://amazon.es/dp/nike-airmax',
    'https://vinted.es/catalog?search=nike+air+max+90',
    'Zapatillas populares, demanda constante.',
    NOW() - INTERVAL '12 days',
    NOW() - INTERVAL '12 days'
),
(
    '23456789-abcd-4ef0-1234-567890123456',
    'iPhone 13 128GB - Reacondicionado',
    'eBay',
    549.99,
    'Wallapop',
    699.99,
    NULL,
    'detectada',
    'b2c3d4e5-f6a7-4890-b123-456789012345', -- eBay
    'd4e5f6a7-b8c9-4012-d345-678901234567', -- Wallapop
    549.99,
    699.99,
    150.00,
    'https://ebay.es/itm/iphone13',
    'https://wallapop.com/search?q=iphone+13',
    'Producto de alta demanda. Verificar estado del reacondicionado.',
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '8 days'
),
(
    '3456789a-bcde-4f01-2345-678901234567',
    'Samsung Galaxy Watch 6',
    'AliExpress',
    129.99,
    'eBay',
    189.99,
    NULL,
    'detectada',
    'c3d4e5f6-a7b8-4901-c234-567890123456', -- AliExpress
    'b2c3d4e5-f6a7-4890-b123-456789012345', -- eBay
    129.99,
    189.99,
    60.00,
    'https://aliexpress.com/item/galaxy-watch',
    'https://ebay.es/sch/galaxy-watch-6',
    'Smartwatch con buena demanda.',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days'
),
(
    '456789ab-cdef-4012-3456-789012345678',
    'Chaqueta The North Face Nuptse',
    'Vinted',
    95.00,
    'Wallapop',
    150.00,
    NULL,
    'detectada',
    'e5f6a7b8-c9d0-4123-e456-789012345678', -- Vinted
    'd4e5f6a7-b8c9-4012-d345-678901234567', -- Wallapop
    95.00,
    150.00,
    55.00,
    'https://vinted.es/item/north-face',
    'https://wallapop.com/search?q=north+face+nuptse',
    'Chaqueta de invierno, buena oportunidad estacional.',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
),

-- Oportunidades DESCARTADAS (rechazadas)
(
    '56789abc-def0-4123-4567-890123456789',
    'MacBook Air M1 256GB',
    'AliExpress',
    799.99,
    'eBay',
    899.99,
    NULL,
    'descartada',
    'c3d4e5f6-a7b8-4901-c234-567890123456', -- AliExpress
    'b2c3d4e5-f6a7-4890-b123-456789012345', -- eBay
    799.99,
    899.99,
    100.00,
    'https://aliexpress.com/item/macbook',
    'https://ebay.es/sch/macbook-air-m1',
    'Márgen muy bajo considerando riesgos y costes. Descartada.',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '18 days'
),
(
    '6789abcd-ef01-4123-5678-901234567890',
    'PlayStation 5',
    'Amazon España',
    449.99,
    'Wallapop',
    479.99,
    NULL,
    'descartada',
    'a1b2c3d4-e5f6-4789-a012-345678901234', -- Amazon España
    'd4e5f6a7-b8c9-4012-d345-678901234567', -- Wallapop
    449.99,
    479.99,
    30.00,
    'https://amazon.es/dp/ps5',
    'https://wallapop.com/search?q=playstation+5',
    'Márgen insuficiente. Descartada por bajo ROI.',
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '23 days'
),
(
    '789abcde-f012-4123-6789-012345678901',
    'Auriculares Sony WH-1000XM5',
    'eBay',
    249.99,
    'Vinted',
    259.99,
    NULL,
    'descartada',
    'b2c3d4e5-f6a7-4890-b123-456789012345', -- eBay
    'e5f6a7b8-c9d0-4123-e456-789012345678', -- Vinted
    249.99,
    259.99,
    10.00,
    'https://ebay.es/itm/sony-wh1000xm5',
    'https://vinted.es/catalog?search=sony+wh1000xm5',
    'Márgen demasiado bajo. No rentable.',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '28 days'
),

-- Oportunidades CONVERTIDAS (ya compradas)
(
    '89abcdef-0123-4123-7890-123456789012',
    'Apple Watch Series 9 45mm',
    'AliExpress',
    299.99,
    'Wallapop',
    399.99,
    NULL,
    'convertida',
    'c3d4e5f6-a7b8-4901-c234-567890123456', -- AliExpress
    'd4e5f6a7-b8c9-4012-d345-678901234567', -- Wallapop
    299.99,
    399.99,
    100.00,
    'https://aliexpress.com/item/apple-watch-9',
    'https://wallapop.com/search?q=apple+watch+series+9',
    'Convertida a compra. Producto de alta demanda.',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '7 days'
),
(
    '9abcdef0-1234-4123-8901-234567890123',
    'Nike Dunk Low Panda Talla 41',
    'Amazon España',
    89.99,
    'Vinted',
    140.00,
    NULL,
    'convertida',
    'a1b2c3d4-e5f6-4789-a012-345678901234', -- Amazon España
    'e5f6a7b8-c9d0-4123-e456-789012345678', -- Vinted
    89.99,
    140.00,
    50.01,
    'https://amazon.es/dp/nike-dunk-panda',
    'https://vinted.es/catalog?search=nike+dunk+panda',
    'Zapatillas muy demandadas. Convertida.',
    NOW() - INTERVAL '14 days',
    NOW() - INTERVAL '11 days'
),
(
    'abcdef01-2345-4123-9012-345678901234',
    'iPad Air 5ª Gen 64GB',
    'eBay',
    449.99,
    'Wallapop',
    579.99,
    NULL,
    'convertida',
    'b2c3d4e5-f6a7-4890-b123-456789012345', -- eBay
    'd4e5f6a7-b8c9-4012-d345-678901234567', -- Wallapop
    449.99,
    579.99,
    130.00,
    'https://ebay.es/itm/ipad-air-5',
    'https://wallapop.com/search?q=ipad+air+5',
    'Tablet en buen estado. Convertida.',
    NOW() - INTERVAL '18 days',
    NOW() - INTERVAL '15 days'
),
(
    'bcdef012-3456-4123-a012-345678901234',
    'Chaqueta Patagonia Retro-X',
    'Vinted',
    120.00,
    'eBay',
    180.00,
    NULL,
    'convertida',
    'e5f6a7b8-c9d0-4123-e456-789012345678', -- Vinted
    'b2c3d4e5-f6a7-4890-b123-456789012345', -- eBay
    120.00,
    180.00,
    60.00,
    'https://vinted.es/item/patagonia-retro',
    'https://ebay.es/sch/patagonia-retro-x',
    'Chaqueta de marca premium. Convertida.',
    NOW() - INTERVAL '22 days',
    NOW() - INTERVAL '19 days'
)
ON CONFLICT (id) DO NOTHING;

-- Verificar inserción
DO $$
BEGIN
    RAISE NOTICE '✅ Oportunidades insertadas: %', (SELECT COUNT(*) FROM opportunities);
    RAISE NOTICE '   - Detectadas: %', (SELECT COUNT(*) FROM opportunities WHERE status = 'detectada');
    RAISE NOTICE '   - Descartadas: %', (SELECT COUNT(*) FROM opportunities WHERE status = 'descartada');
    RAISE NOTICE '   - Convertidas: %', (SELECT COUNT(*) FROM opportunities WHERE status = 'convertida');
END $$;
