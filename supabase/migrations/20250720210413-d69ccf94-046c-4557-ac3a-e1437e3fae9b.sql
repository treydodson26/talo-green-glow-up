-- Enable realtime for communications_log table
ALTER TABLE public.communications_log REPLICA IDENTITY FULL;

-- Add communications_log to realtime publication  
ALTER PUBLICATION supabase_realtime ADD TABLE public.communications_log;