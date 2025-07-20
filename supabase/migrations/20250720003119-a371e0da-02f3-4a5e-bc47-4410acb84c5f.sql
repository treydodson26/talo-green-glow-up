-- Add necessary columns to existing customers table for intro tracking (without generated columns)
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('prospect', 'intro_trial', 'active_member', 'cancelled', 'lapsed')) DEFAULT 'prospect',
ADD COLUMN IF NOT EXISTS source TEXT CHECK (source IN ('website', 'walk_in', 'referral', 'instagram', 'google', 'qr_code')) DEFAULT 'website',
ADD COLUMN IF NOT EXISTS customer_segment TEXT CHECK (customer_segment IN ('young_professional', 'prenatal', 'seniors_60plus', 'general')) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS first_class_date DATE,
ADD COLUMN IF NOT EXISTS intro_start_date DATE,
ADD COLUMN IF NOT EXISTS intro_end_date DATE,
ADD COLUMN IF NOT EXISTS conversion_date DATE,
ADD COLUMN IF NOT EXISTS last_class_date DATE,
ADD COLUMN IF NOT EXISTS total_lifetime_value DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create classes_schedule table 
CREATE TABLE IF NOT EXISTS public.classes_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_date DATE NOT NULL,
  class_time TIME NOT NULL,
  class_name TEXT NOT NULL,
  instructor_name TEXT NOT NULL,
  max_capacity INTEGER DEFAULT 15,
  current_bookings INTEGER DEFAULT 0,
  waitlist_count INTEGER DEFAULT 0,
  room TEXT,
  needs_substitute BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
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
  assigned_to UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.classes_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to manage classes" ON public.classes_schedule FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to manage leads" ON public.leads FOR ALL USING (auth.role() = 'authenticated');

-- Create dashboard metrics view
CREATE OR REPLACE VIEW public.dashboard_metrics AS
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
   WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_leads_week;

-- Insert sample data for today's classes
INSERT INTO classes_schedule (class_date, class_time, class_name, instructor_name, max_capacity, current_bookings, waitlist_count, room, needs_substitute) 
VALUES
(CURRENT_DATE, '09:00:00', 'Gentle Flow', 'Maria', 15, 12, 0, 'Studio A', false),
(CURRENT_DATE, '12:00:00', 'Power Yoga', 'James', 15, 6, 0, 'Studio A', false),
(CURRENT_DATE, '18:00:00', 'Vinyasa Flow', 'Sarah', 15, 15, 3, 'Studio A', true),
(CURRENT_DATE, '19:30:00', 'Restorative', 'Lisa', 12, 10, 0, 'Studio B', false)
ON CONFLICT DO NOTHING;

-- Insert sample leads
INSERT INTO leads (first_name, last_name, email, phone, source, status, last_contact_date, follow_up_count) VALUES
('Mike', 'Rodriguez', 'mike@example.com', '(555) 678-9012', 'google', 'follow_up_needed', CURRENT_DATE - 2, 1),
('Amanda', 'Davis', 'amanda@example.com', '(555) 789-0123', 'walk_in', 'new', null, 0),
('David', 'Kim', 'david@example.com', '(555) 890-1234', 'referral', 'contacted', CURRENT_DATE - 1, 1)
ON CONFLICT (email) DO NOTHING;