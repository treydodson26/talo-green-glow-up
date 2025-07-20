-- Add Trey Dodson as a customer with intro offer
INSERT INTO public.customers (
  client_name,
  first_name,
  last_name,
  client_email,
  phone_number,
  status,
  source,
  intro_start_date,
  intro_end_date,
  marketing_text_opt_in,
  transactional_text_opt_in,
  created_at
) VALUES (
  'Trey Dodson',
  'Trey',
  'Dodson',
  'trey.dodson@example.com',
  '4697046880',
  'intro_trial',
  'website',
  CURRENT_DATE - INTERVAL '5 days',
  CURRENT_DATE + INTERVAL '25 days',
  true,
  true,
  now()
);