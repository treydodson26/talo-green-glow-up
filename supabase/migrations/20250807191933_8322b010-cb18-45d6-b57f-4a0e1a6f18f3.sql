-- Create campaigns table for Marketing Hub
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  subject text,
  content text,
  audience_type text NOT NULL DEFAULT 'all',
  scheduled_for timestamptz,
  sent_count integer NOT NULL DEFAULT 0,
  open_rate numeric(5,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS and policies
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to manage campaigns"
ON public.campaigns
AS PERMISSIVE
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Trigger to auto-update updated_at
CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON public.campaigns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful indexes
CREATE INDEX idx_campaigns_status ON public.campaigns (status);
CREATE INDEX idx_campaigns_scheduled_for ON public.campaigns (scheduled_for);
CREATE INDEX idx_campaigns_created_at ON public.campaigns (created_at DESC);
