-- Insert Trey Dotson as a real customer for Day 7 testing  
INSERT INTO public.customers (
    id,
    client_name,
    first_name, 
    last_name,
    client_email,
    phone_number,
    status,
    customer_segment,
    intro_start_date,
    intro_end_date,
    created_at,
    updated_at
) VALUES (
    999,
    'Trey Dotson',
    'Trey',
    'Dotson', 
    'trey@example.com',
    '4697046880',
    'intro_trial',
    'general',
    CURRENT_DATE - INTERVAL '7 days',
    CURRENT_DATE + INTERVAL '23 days',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    client_name = EXCLUDED.client_name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    client_email = EXCLUDED.client_email,
    phone_number = EXCLUDED.phone_number,
    status = EXCLUDED.status,
    customer_segment = EXCLUDED.customer_segment,
    intro_start_date = EXCLUDED.intro_start_date,
    intro_end_date = EXCLUDED.intro_end_date,
    updated_at = NOW();