-- ============================================
-- FIXTURES: COSTES DE OPORTUNIDADES
-- ============================================
-- Costes adicionales específicos de algunas oportunidades
-- Estos son costes manuales añadidos a oportunidades específicas

INSERT INTO opportunity_costs (
    id,
    opportunity_id,
    name,
    type,
    value,
    base,
    source,
    created_at
) VALUES
-- Costes para AirPods Pro (oportunidad detectada)
(
    'c1d2e3f4-a5b6-4234-c567-890123456789',
    '01234567-89ab-4cde-f012-345678901234', -- AirPods Pro
    'Seguro de envío premium',
    'fixed',
    5.99,
    NULL,
    'manual',
    NOW() - INTERVAL '15 days'
),
(
    'c2d3e4f5-a6b7-4235-c678-901234567890',
    '01234567-89ab-4cde-f012-345678901234', -- AirPods Pro
    'Verificación autenticidad',
    'fixed',
    15.00,
    NULL,
    'manual',
    NOW() - INTERVAL '15 days'
),

-- Costes para iPhone 13 (oportunidad detectada)
(
    'c3d4e5f6-a7b8-4236-c789-012345678901',
    '23456789-abcd-4ef0-1234-567890123456', -- iPhone 13
    'Garantía extendida',
    'fixed',
    29.99,
    NULL,
    'manual',
    NOW() - INTERVAL '8 days'
),
(
    'c4d5e6f7-a8b9-4237-c890-123456789012',
    '23456789-abcd-4ef0-1234-567890123456', -- iPhone 13
    'Comisión verificación',
    'percentage',
    2.0,
    'purchase',
    'manual',
    NOW() - INTERVAL '8 days'
),

-- Costes para Samsung Galaxy Watch (oportunidad detectada)
(
    'c5d6e7f8-a9b0-4238-c901-234567890123',
    '3456789a-bcde-4f01-2345-678901234567', -- Samsung Watch
    'Adaptador de carga EU',
    'fixed',
    12.99,
    NULL,
    'manual',
    NOW() - INTERVAL '5 days'
),

-- Costes para Apple Watch (oportunidad convertida)
(
    'c6d7e8f9-a0b1-4239-c012-345678901234',
    '89abcdef-0123-4123-7890-123456789012', -- Apple Watch
    'Caja original de regalo',
    'fixed',
    8.99,
    NULL,
    'manual',
    NOW() - INTERVAL '7 days'
),

-- Costes para iPad Air (oportunidad convertida)
(
    'c7d8e9f0-a1b2-4240-c123-456789012345',
    'abcdef01-2345-4123-9012-345678901234', -- iPad Air
    'Funda protectora premium',
    'fixed',
    24.99,
    NULL,
    'manual',
    NOW() - INTERVAL '15 days'
),
(
    'c8d9e0f1-a2b3-4241-c234-567890123456',
    'abcdef01-2345-4123-9012-345678901234', -- iPad Air
    'Seguro de transporte',
    'percentage',
    1.5,
    'purchase',
    'manual',
    NOW() - INTERVAL '15 days'
)
ON CONFLICT (id) DO NOTHING;

-- Verificar inserción
DO $$
BEGIN
    RAISE NOTICE '✅ Costes de oportunidades insertados: %', (SELECT COUNT(*) FROM opportunity_costs);
END $$;
