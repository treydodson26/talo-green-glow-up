-- Create bookings table to track reservations and attendance
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  class_id UUID NOT NULL,
  booking_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  booking_status TEXT NOT NULL DEFAULT 'confirmed' CHECK (booking_status IN ('confirmed', 'cancelled', 'no_show', 'attended')),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  waitlist_position INTEGER,
  is_waitlisted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  FOREIGN KEY (class_id) REFERENCES public.classes_schedule(id)
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to manage bookings" 
ON public.bookings 
FOR ALL 
USING (auth.role() = 'authenticated'::text);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_bookings_customer_id ON public.bookings(customer_id);
CREATE INDEX idx_bookings_class_id ON public.bookings(class_id);
CREATE INDEX idx_bookings_status ON public.bookings(booking_status);
CREATE INDEX idx_bookings_date ON public.bookings(booking_date);

-- Create view for customer engagement analytics
CREATE OR REPLACE VIEW public.customer_engagement_stats AS
SELECT 
  c.id,
  c.first_name,
  c.last_name,
  c.client_email,
  c.status,
  c.first_class_date,
  c.last_class_date,
  c.conversion_date,
  
  -- Booking statistics
  COUNT(b.id) as total_bookings,
  COUNT(CASE WHEN b.booking_status = 'attended' THEN 1 END) as classes_attended,
  COUNT(CASE WHEN b.booking_status = 'no_show' THEN 1 END) as no_shows,
  COUNT(CASE WHEN b.booking_status = 'cancelled' THEN 1 END) as cancellations,
  
  -- Engagement flags
  CASE 
    WHEN COUNT(b.id) = 0 THEN 'never_booked'
    WHEN COUNT(CASE WHEN b.booking_status = 'attended' THEN 1 END) = 0 THEN 'booked_never_attended'
    WHEN COUNT(CASE WHEN b.booking_status = 'no_show' THEN 1 END) > COUNT(CASE WHEN b.booking_status = 'attended' THEN 1 END) THEN 'frequent_no_show'
    ELSE 'engaged'
  END as engagement_level,
  
  -- Attendance rate
  CASE 
    WHEN COUNT(b.id) > 0 THEN 
      ROUND((COUNT(CASE WHEN b.booking_status = 'attended' THEN 1 END)::numeric / COUNT(b.id)::numeric) * 100, 2)
    ELSE 0
  END as attendance_rate,
  
  -- Latest booking info
  MAX(b.booking_date) as last_booking_date,
  MAX(CASE WHEN b.booking_status = 'attended' THEN b.booking_date END) as last_attended_date

FROM public.customers c
LEFT JOIN public.bookings b ON c.id = b.customer_id
GROUP BY c.id, c.first_name, c.last_name, c.client_email, c.status, 
         c.first_class_date, c.last_class_date, c.conversion_date;

-- Update dashboard metrics view to include booking data
CREATE OR REPLACE VIEW public.dashboard_metrics AS
SELECT 
  -- Existing metrics
  (SELECT COUNT(*) FROM classes_schedule WHERE class_date = CURRENT_DATE) as todays_classes,
  (SELECT COALESCE(AVG(current_bookings::numeric / max_capacity::numeric * 100), 0) FROM classes_schedule WHERE class_date = CURRENT_DATE) as avg_capacity_today,
  (SELECT COUNT(*) FROM classes_schedule WHERE class_date = CURRENT_DATE AND current_bookings >= max_capacity) as waitlisted_classes,
  (SELECT COUNT(*) FROM customers WHERE status = 'intro_trial' AND intro_end_date >= CURRENT_DATE) as active_intro_offers,
  (SELECT COUNT(*) FROM customers WHERE status = 'intro_trial' AND intro_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days') as ending_this_week,
  (SELECT COALESCE(SUM(total_lifetime_value), 0) FROM customers WHERE EXTRACT(MONTH FROM conversion_date) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM conversion_date) = EXTRACT(YEAR FROM CURRENT_DATE)) as revenue_this_month,
  (SELECT COALESCE(SUM(total_lifetime_value), 0) FROM customers WHERE EXTRACT(MONTH FROM conversion_date) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month') AND EXTRACT(YEAR FROM conversion_date) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')) as revenue_last_month,
  (SELECT COUNT(*) FROM leads WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_leads_week,
  
  -- New booking metrics
  (SELECT COUNT(*) FROM bookings WHERE booking_date >= CURRENT_DATE - INTERVAL '7 days') as bookings_this_week,
  (SELECT COUNT(*) FROM bookings WHERE booking_status = 'no_show' AND booking_date >= CURRENT_DATE - INTERVAL '30 days') as no_shows_this_month,
  (SELECT COUNT(DISTINCT id) FROM customer_engagement_stats WHERE engagement_level = 'never_booked' AND status = 'intro_trial') as intro_customers_never_booked,
  (SELECT COUNT(DISTINCT id) FROM customer_engagement_stats WHERE engagement_level = 'booked_never_attended' AND status = 'intro_trial') as intro_customers_never_attended;