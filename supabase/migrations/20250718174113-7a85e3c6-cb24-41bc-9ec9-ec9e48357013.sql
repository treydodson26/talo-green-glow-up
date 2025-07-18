-- Enable real-time updates for customers table
ALTER TABLE public.customers REPLICA IDENTITY FULL;

-- Add the customers table to the realtime publication
ALTER publication supabase_realtime ADD TABLE public.customers;