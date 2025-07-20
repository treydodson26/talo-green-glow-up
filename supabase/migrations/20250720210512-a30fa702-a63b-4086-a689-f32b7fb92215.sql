-- Insert default message sequences with ID 0 for manual messages
INSERT INTO public.message_sequences (id, day, message_type, subject, content, active)
VALUES 
  (0, 0, 'email', 'Manual Email', 'Manual email sent directly from the app', true)
ON CONFLICT (id) DO UPDATE SET
  day = EXCLUDED.day,
  message_type = EXCLUDED.message_type,
  subject = EXCLUDED.subject,
  content = EXCLUDED.content,
  active = EXCLUDED.active;