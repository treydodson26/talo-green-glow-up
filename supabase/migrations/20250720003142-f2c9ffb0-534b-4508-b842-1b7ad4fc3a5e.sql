-- Update existing customers with sample intro trial data
UPDATE customers SET 
  status = 'intro_trial',
  source = 'google',
  customer_segment = 'young_professional',
  first_class_date = CURRENT_DATE - 1,
  intro_start_date = CURRENT_DATE - 1,
  intro_end_date = CURRENT_DATE + 29
WHERE client_email = 'jessica@example.com' OR id = (SELECT id FROM customers LIMIT 1);

-- Add more sample customers with varying intro trial stages
INSERT INTO customers (client_name, first_name, last_name, client_email, phone_number, status, source, customer_segment, first_class_date, intro_start_date, intro_end_date) VALUES
('Marcus Chen', 'Marcus', 'Chen', 'marcus@example.com', '(555) 234-5678', 'intro_trial', 'website', 'general', CURRENT_DATE, CURRENT_DATE, CURRENT_DATE + 30),
('Sarah Johnson', 'Sarah', 'Johnson', 'sarah@example.com', '(555) 345-6789', 'intro_trial', 'referral', 'prenatal', CURRENT_DATE - 5, CURRENT_DATE - 5, CURRENT_DATE + 25),
('Emma Thompson', 'Emma', 'Thompson', 'emma@example.com', '(555) 456-7890', 'intro_trial', 'instagram', 'young_professional', CURRENT_DATE - 28, CURRENT_DATE - 28, CURRENT_DATE + 2),
('Lisa Wang', 'Lisa', 'Wang', 'lisa@example.com', '(555) 567-8901', 'active_member', 'walk_in', 'seniors_60plus', CURRENT_DATE - 45, CURRENT_DATE - 45, CURRENT_DATE - 15)
ON CONFLICT (client_email) DO NOTHING;

-- Update Lisa as a converted member
UPDATE customers SET 
  status = 'active_member',
  conversion_date = CURRENT_DATE - 15,
  total_lifetime_value = 149.99
WHERE client_email = 'lisa@example.com';