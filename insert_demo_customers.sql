-- Insert demo customers for the intro offers demo
-- These customers match the ones shown in the IntroOffersSections component

INSERT INTO public.customers (
  id, 
  first_name, 
  last_name, 
  client_email, 
  phone_number
) VALUES 
  (101, 'Trey', 'Dotson', 'trey@example.com', '+1234567890'),
  (102, 'Sarah', 'Johnson', 'sarah@example.com', '+1234567891'),
  (103, 'Mike', 'Chen', 'mike@example.com', '+1234567892'),
  (104, 'Lisa', 'Williams', 'lisa@example.com', '+1234567893'),
  (105, 'David', 'Brown', 'david@example.com', '+1234567894')
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  client_email = EXCLUDED.client_email,
  phone_number = EXCLUDED.phone_number;
