-- Create function to send webhook notifications
CREATE OR REPLACE FUNCTION public.send_n8n_webhook()
RETURNS TRIGGER AS $$
DECLARE
  webhook_payload jsonb;
BEGIN
  -- Determine the event type and data
  IF TG_OP = 'DELETE' THEN
    webhook_payload := jsonb_build_object(
      'eventType', 'DELETE',
      'tableName', TG_TABLE_NAME,
      'data', row_to_json(OLD)
    );
  ELSE
    webhook_payload := jsonb_build_object(
      'eventType', TG_OP,
      'tableName', TG_TABLE_NAME,
      'data', row_to_json(NEW)
    );
  END IF;

  -- Call the edge function asynchronously
  PERFORM net.http_post(
    url := 'https://mvndgpmetndvjsmvhqqh.supabase.co/functions/v1/send-n8n-webhook',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12bmRncG1ldG5kdmpzbXZocXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NDk3NTUsImV4cCI6MjA2MTUyNTc1NX0.07clcHdUPZv-GWGGGVvLsk0PaSSYorbk2Md3_Qv4rw4"}'::jsonb,
    body := webhook_payload::jsonb
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for the customers table
CREATE TRIGGER customers_webhook_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.send_n8n_webhook();

-- Create triggers for the communications_log table  
CREATE TRIGGER communications_log_webhook_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.communications_log
  FOR EACH ROW EXECUTE FUNCTION public.send_n8n_webhook();

-- Create triggers for the csv_imports table
CREATE TRIGGER csv_imports_webhook_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.csv_imports
  FOR EACH ROW EXECUTE FUNCTION public.send_n8n_webhook();

-- Enable the pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;