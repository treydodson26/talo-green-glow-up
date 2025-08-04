-- Create customer segments table for managing different customer groups
CREATE TABLE public.customer_segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  segment_type TEXT NOT NULL CHECK (segment_type IN ('prospect', 'drop_in', 'intro_offer')),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  manually_assigned BOOLEAN NOT NULL DEFAULT false,
  total_spend DECIMAL(10,2) DEFAULT 0,
  last_visit_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(customer_id, segment_type)
);

-- Create email templates table for managing different email types
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL UNIQUE,
  template_type TEXT NOT NULL CHECK (template_type IN ('prospect_welcome', 'drop_in_followup', 'intro_day_0', 'intro_day_10', 'intro_day_28')),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email queue table for managing automated emails
CREATE TABLE public.email_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  template_id UUID NOT NULL REFERENCES email_templates(id),
  segment_type TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  error_message TEXT,
  email_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email tracking table for deduplication and history
CREATE TABLE public.email_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  template_type TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  email_subject TEXT,
  email_content TEXT,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create segment analytics table for reporting
CREATE TABLE public.segment_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  segment_type TEXT NOT NULL,
  total_customers INTEGER NOT NULL DEFAULT 0,
  emails_sent INTEGER NOT NULL DEFAULT 0,
  emails_opened INTEGER NOT NULL DEFAULT 0,
  emails_clicked INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date, segment_type)
);

-- Enable Row Level Security
ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.segment_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Allow authenticated users to manage customer segments" 
ON public.customer_segments 
FOR ALL 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Allow authenticated users to manage email templates" 
ON public.email_templates 
FOR ALL 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Allow authenticated users to manage email queue" 
ON public.email_queue 
FOR ALL 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Allow authenticated users to view email tracking" 
ON public.email_tracking 
FOR ALL 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Allow authenticated users to view segment analytics" 
ON public.segment_analytics 
FOR ALL 
USING (auth.role() = 'authenticated'::text);

-- Create updated_at triggers
CREATE TRIGGER update_customer_segments_updated_at
BEFORE UPDATE ON public.customer_segments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_queue_updated_at
BEFORE UPDATE ON public.email_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default email templates
INSERT INTO public.email_templates (template_name, template_type, subject, content, variables) VALUES 
(
  'Prospect Welcome',
  'prospect_welcome',
  'Welcome to {{studio_name}} - Your yoga journey starts here! 🌱',
  '<div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #e5e5e5; border-radius: 8px; font-family: Arial, sans-serif;">
    <h2 style="color: #4a5568; margin-bottom: 20px;">Hi {{first_name}}! 👋</h2>
    
    <p style="margin-bottom: 16px; line-height: 1.6;">I saw you signed up with us - amazing! Welcome to the {{studio_name}} community. 🌱</p>
    
    <p style="margin-bottom: 16px; line-height: 1.6;">We''re excited to have you begin your yoga journey with us. Here''s a special welcome gift:</p>
    
    <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <h3 style="color: #2d3748; margin-bottom: 10px;">🎁 15% Off Your First Class</h3>
      <p style="font-size: 18px; font-weight: bold; color: #38a169;">Use code: WELCOME15</p>
    </div>
    
    <p style="margin-bottom: 16px; line-height: 1.6;"><strong>Even better:</strong> Check out our 30-Day Intro Offer - unlimited classes for just $99. It''s the perfect way to dive deep into your practice!</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="#" style="background: #38a169; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Book Your First Class</a>
    </div>
    
    <p style="margin-bottom: 16px; line-height: 1.6; color: #718096;">Questions? Just reply to this email - I''d love to help you get started!</p>
    
    <p style="margin-bottom: 0; color: #718096;">Namaste,<br>Emily & The {{studio_name}} Team</p>
  </div>',
  '["first_name", "studio_name"]'::jsonb
),
(
  'Drop-in Follow-up',
  'drop_in_followup', 
  'Thanks for trying {{studio_name}}! Here''s what''s next... ✨',
  '<div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #e5e5e5; border-radius: 8px; font-family: Arial, sans-serif;">
    <h2 style="color: #4a5568; margin-bottom: 20px;">Hi {{first_name}}! ✨</h2>
    
    <p style="margin-bottom: 16px; line-height: 1.6;">Thanks for trying out a class at {{studio_name}}! How did it feel? I hope you enjoyed your time on the mat.</p>
    
    <p style="margin-bottom: 16px; line-height: 1.6;">I wanted to share something that might interest you...</p>
    
    <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #2d3748; margin-bottom: 15px;">💡 Why Our Students Love the 30-Day Intro Offer</h3>
      <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
        <li><strong>Unlimited classes for 30 days</strong> - practice as much as you want!</li>
        <li><strong>Better value</strong> - just $99 vs $25 per drop-in class</li>
        <li><strong>Build a consistent practice</strong> - see real results in just one month</li>
        <li><strong>Try all our class styles</strong> - find what you love most</li>
      </ul>
    </div>
    
    <div style="background: #e6fffa; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; font-style: italic; color: #2d3748;">"I wish I had started with the intro offer! After my first drop-in, I was hooked and ended up spending way more on individual classes." - Sarah M.</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="#" style="background: #38a169; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Start Your 30-Day Journey</a>
    </div>
    
    <p style="margin-bottom: 16px; line-height: 1.6; color: #718096;">Ready to deepen your practice? I''m here to help you every step of the way!</p>
    
    <p style="margin-bottom: 0; color: #718096;">With gratitude,<br>Emily & The {{studio_name}} Team</p>
  </div>',
  '["first_name", "studio_name"]'::jsonb
),
(
  'Intro Day 28 Conversion',
  'intro_day_28',
  'Your {{studio_name}} journey continues... 🌟',
  '<div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #e5e5e5; border-radius: 8px; font-family: Arial, sans-serif;">
    <h2 style="color: #4a5568; margin-bottom: 20px;">Hi {{first_name}}! 🌟</h2>
    
    <p style="margin-bottom: 16px; line-height: 1.6;">Wow! You''re almost at the end of your 30-day intro journey. How has it been? I hope you''ve felt the amazing benefits of consistent practice.</p>
    
    <p style="margin-bottom: 16px; line-height: 1.6;">Your intro offer expires in just 2 days, but your yoga journey doesn''t have to end here!</p>
    
    <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #2d3748; margin-bottom: 15px;">🎯 Continue Your Practice With These Options:</h3>
      <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
        <li><strong>Monthly Unlimited</strong> - $149/month for unlimited classes</li>
        <li><strong>10-Class Package</strong> - $220 (save $30 vs drop-ins)</li>
        <li><strong>5-Class Package</strong> - $120 (perfect for 1-2 classes per week)</li>
        <li><strong>Student/Senior Discount</strong> - 15% off any package</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="#" style="background: #38a169; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Choose Your Membership</a>
    </div>
    
    <p style="margin-bottom: 16px; line-height: 1.6;">Want to chat about which option is right for you? Just reply to this email or give us a call!</p>
    
    <p style="margin-bottom: 0; color: #718096;">Thank you for being part of our community,<br>Emily & The {{studio_name}} Team</p>
  </div>',
  '["first_name", "studio_name"]'::jsonb
);

-- Create function to automatically assign customer segments based on data
CREATE OR REPLACE FUNCTION public.assign_customer_segment(customer_id_param INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  customer_record RECORD;
  total_spent DECIMAL(10,2) := 0;
  has_intro_offer BOOLEAN := false;
  has_classes BOOLEAN := false;
  segment_result TEXT;
BEGIN
  -- Get customer data
  SELECT * INTO customer_record FROM customers WHERE id = customer_id_param;
  
  IF NOT FOUND THEN
    RETURN 'customer_not_found';
  END IF;
  
  -- Calculate total spend (mock calculation - would integrate with payment system)
  total_spent := COALESCE(customer_record.total_lifetime_value, 0);
  
  -- Check if customer has intro offer
  has_intro_offer := customer_record.status = 'intro_trial';
  
  -- Check if customer has any bookings
  SELECT EXISTS(
    SELECT 1 FROM bookings WHERE customer_id = customer_id_param
  ) INTO has_classes;
  
  -- Determine segment with priority: intro_offer > drop_in > prospect
  IF has_intro_offer THEN
    segment_result := 'intro_offer';
  ELSIF has_classes AND total_spent > 0 THEN
    segment_result := 'drop_in';
  ELSE
    segment_result := 'prospect';
  END IF;
  
  -- Insert or update segment assignment
  INSERT INTO customer_segments (customer_id, segment_type, total_spend, last_visit_date)
  VALUES (customer_id_param, segment_result, total_spent, customer_record.last_seen::date)
  ON CONFLICT (customer_id, segment_type) 
  DO UPDATE SET 
    total_spend = EXCLUDED.total_spend,
    last_visit_date = EXCLUDED.last_visit_date,
    updated_at = now();
  
  RETURN segment_result;
END;
$$;