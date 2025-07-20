-- Create customers table for studio management
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arketa_id TEXT UNIQUE, -- Sync key from Arketa
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  status TEXT CHECK (status IN ('prospect', 'intro_trial', 'active_member', 'cancelled', 'lapsed')) DEFAULT 'prospect',
  source TEXT CHECK (source IN ('website', 'walk_in', 'referral', 'instagram', 'google', 'qr_code')) DEFAULT 'website',
  customer_segment TEXT CHECK (customer_segment IN ('young_professional', 'prenatal', 'seniors_60plus', 'general')) DEFAULT 'general',
  
  -- Critical for dashboard metrics
  first_class_date DATE, -- Triggers intro sequence
  intro_start_date DATE,
  intro_end_date DATE,
  conversion_date DATE, -- When they became paying member
  last_class_date DATE,
  total_lifetime_value DECIMAL(10,2) DEFAULT 0,
  notes TEXT, -- For personalization
  
  -- Computed columns for dashboard
  trial_days_remaining INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN intro_end_date IS NULL THEN NULL
      ELSE GREATEST(0, intro_end_date - CURRENT_DATE)
    END
  ) STORED,
  intro_sequence_day INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN first_class_date IS NULL THEN NULL
      ELSE CURRENT_DATE - first_class_date
    END
  ) STORED,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create classes_schedule table for today's class information
CREATE TABLE public.classes_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_date DATE NOT NULL,
  class_time TIME NOT NULL,
  class_name TEXT NOT NULL, -- 'Vinyasa Flow', 'Power Yoga', etc.
  instructor_name TEXT NOT NULL,
  max_capacity INTEGER DEFAULT 15,
  current_bookings INTEGER DEFAULT 0,
  waitlist_count INTEGER DEFAULT 0,
  room TEXT,
  needs_substitute BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create intro_sequences table for message templates
CREATE TABLE public.intro_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_day INTEGER NOT NULL, -- 0, 3, 7, 14, 21, 28
  message_type TEXT CHECK (message_type IN ('email', 'whatsapp')) NOT NULL,
  customer_segment TEXT CHECK (customer_segment IN ('all', 'young_professional', 'prenatal', 'seniors_60plus')) DEFAULT 'all',
  subject TEXT, -- For emails
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create leads table for prospects
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  source TEXT CHECK (source IN ('website', 'walk_in', 'referral', 'instagram', 'google', 'qr_code')) DEFAULT 'website',
  status TEXT CHECK (status IN ('new', 'contacted', 'follow_up_needed', 'trial_scheduled', 'converted', 'lost')) DEFAULT 'new',
  last_contact_date DATE,
  follow_up_count INTEGER DEFAULT 0,
  notes TEXT,
  assigned_to UUID, -- Staff member
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intro_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (Emily and staff)
CREATE POLICY "Allow authenticated users to manage customers" ON public.customers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to manage classes" ON public.classes_schedule FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to view sequences" ON public.intro_sequences FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to manage leads" ON public.leads FOR ALL USING (auth.role() = 'authenticated');

-- Create dashboard metrics view
CREATE VIEW public.dashboard_metrics AS
SELECT 
  -- Today's classes
  (SELECT COUNT(*) FROM classes_schedule WHERE class_date = CURRENT_DATE) as todays_classes,
  (SELECT ROUND(AVG(current_bookings::DECIMAL / max_capacity * 100), 1) 
   FROM classes_schedule WHERE class_date = CURRENT_DATE) as avg_capacity_today,
  (SELECT COUNT(*) FROM classes_schedule WHERE class_date = CURRENT_DATE AND waitlist_count > 0) as waitlisted_classes,
  
  -- Intro offers active
  (SELECT COUNT(*) FROM customers 
   WHERE status = 'intro_trial' AND intro_end_date >= CURRENT_DATE) as active_intro_offers,
  (SELECT COUNT(*) FROM customers 
   WHERE status = 'intro_trial' AND intro_end_date <= CURRENT_DATE + INTERVAL '7 days') as ending_this_week,
  
  -- Revenue this month
  (SELECT COALESCE(SUM(total_lifetime_value), 0) FROM customers 
   WHERE conversion_date >= DATE_TRUNC('month', CURRENT_DATE)) as revenue_this_month,
  (SELECT COALESCE(SUM(total_lifetime_value), 0) FROM customers 
   WHERE conversion_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
   AND conversion_date < DATE_TRUNC('month', CURRENT_DATE)) as revenue_last_month,
  
  -- New leads last 7 days
  (SELECT COUNT(*) FROM leads 
   WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_leads_week,
   
  -- Conversion rate this month
  (SELECT 
    CASE 
      WHEN intro_trials = 0 THEN 0 
      ELSE ROUND((conversions::DECIMAL / intro_trials * 100), 1) 
    END
   FROM (
     SELECT 
       COUNT(*) FILTER (WHERE intro_start_date >= DATE_TRUNC('month', CURRENT_DATE)) as intro_trials,
       COUNT(*) FILTER (WHERE conversion_date >= DATE_TRUNC('month', CURRENT_DATE)) as conversions
     FROM customers
   ) stats
  ) as conversion_rate_month;

-- Create intro offers by sequence day view
CREATE VIEW public.intro_offers_by_day AS
SELECT 
  intro_sequence_day,
  COUNT(*) as customer_count,
  JSON_AGG(
    JSON_BUILD_OBJECT(
      'id', id,
      'name', first_name || ' ' || last_name,
      'email', email,
      'phone', phone,
      'days_remaining', trial_days_remaining,
      'last_message_sent', (
        SELECT sent_at FROM communications_log 
        WHERE customer_id = customers.id 
        ORDER BY sent_at DESC LIMIT 1
      )
    )
  ) as customers
FROM customers 
WHERE status = 'intro_trial' 
  AND intro_end_date >= CURRENT_DATE
  AND intro_sequence_day IS NOT NULL
GROUP BY intro_sequence_day
ORDER BY intro_sequence_day;

-- Create recent communications view
CREATE VIEW public.recent_communications AS
SELECT 
  cl.id,
  cl.customer_id,
  c.first_name || ' ' || c.last_name as customer_name,
  cl.message_type,
  cl.direction,
  cl.subject,
  SUBSTRING(cl.content, 1, 100) || '...' as content_preview,
  cl.status,
  cl.sent_at,
  cl.read_at,
  cl.replied_at
FROM communications_log cl
JOIN customers c ON cl.customer_id = c.id
ORDER BY cl.created_at DESC
LIMIT 50;

-- Add update trigger for customers
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add update trigger for leads
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample intro sequence templates
INSERT INTO intro_sequences (sequence_day, message_type, customer_segment, subject, content) VALUES
(0, 'email', 'all', 'Welcome to Tallow Yoga!', 'Hi {{first_name}}, welcome to our yoga community! We''re so excited to have you start your wellness journey with us.'),
(3, 'whatsapp', 'all', null, 'Hi {{first_name}}! How was your first class? We''d love to hear your thoughts and answer any questions you might have. 🧘‍♀️'),
(7, 'email', 'all', 'How''s your yoga journey going?', 'Hi {{first_name}}, you''re one week into your trial! How are you feeling? Remember, consistency is key to seeing the amazing benefits of yoga.'),
(14, 'whatsapp', 'all', null, 'Hi {{first_name}}! You''re halfway through your intro month. Have you noticed any changes in how you feel? We''re here to support your practice! 💪'),
(21, 'email', 'all', 'Special member pricing inside', 'Hi {{first_name}}, your intro month is almost complete! You''ve been doing amazing. Here''s your exclusive member pricing to continue your journey...'),
(28, 'whatsapp', 'all', null, 'Hi {{first_name}}! Your intro expires in 2 days. Ready to become a member and keep this amazing momentum going? Let''s chat about your options! 🌟');

-- Insert sample data for testing
INSERT INTO customers (first_name, last_name, email, phone, status, source, customer_segment, first_class_date, intro_start_date, intro_end_date, total_lifetime_value) VALUES
('Jessica', 'Martinez', 'jessica@example.com', '(555) 123-4567', 'intro_trial', 'google', 'young_professional', CURRENT_DATE - 1, CURRENT_DATE - 1, CURRENT_DATE + 29, 0),
('Marcus', 'Chen', 'marcus@example.com', '(555) 234-5678', 'intro_trial', 'website', 'general', CURRENT_DATE, CURRENT_DATE, CURRENT_DATE + 30, 0),
('Sarah', 'Johnson', 'sarah@example.com', '(555) 345-6789', 'intro_trial', 'referral', 'prenatal', CURRENT_DATE - 5, CURRENT_DATE - 5, CURRENT_DATE + 25, 0),
('Emma', 'Thompson', 'emma@example.com', '(555) 456-7890', 'intro_trial', 'instagram', 'young_professional', CURRENT_DATE - 28, CURRENT_DATE - 28, CURRENT_DATE + 2, 0),
('Lisa', 'Wang', 'lisa@example.com', '(555) 567-8901', 'active_member', 'walk_in', 'seniors_60plus', CURRENT_DATE - 45, CURRENT_DATE - 45, CURRENT_DATE - 15, 149.99);

INSERT INTO classes_schedule (class_date, class_time, class_name, instructor_name, max_capacity, current_bookings, waitlist_count, room) VALUES
(CURRENT_DATE, '09:00:00', 'Gentle Flow', 'Maria', 15, 12, 0, 'Studio A'),
(CURRENT_DATE, '12:00:00', 'Power Yoga', 'James', 15, 6, 0, 'Studio A'),
(CURRENT_DATE, '18:00:00', 'Vinyasa Flow', 'Sarah', 15, 15, 3, 'Studio A'),
(CURRENT_DATE, '19:30:00', 'Restorative', 'Lisa', 12, 10, 0, 'Studio B');

INSERT INTO leads (first_name, last_name, email, phone, source, status, last_contact_date, follow_up_count) VALUES
('Mike', 'Rodriguez', 'mike@example.com', '(555) 678-9012', 'google', 'follow_up_needed', CURRENT_DATE - 2, 1),
('Amanda', 'Davis', 'amanda@example.com', '(555) 789-0123', 'walk_in', 'new', null, 0),
('David', 'Kim', 'david@example.com', '(555) 890-1234', 'referral', 'contacted', CURRENT_DATE - 1, 1);