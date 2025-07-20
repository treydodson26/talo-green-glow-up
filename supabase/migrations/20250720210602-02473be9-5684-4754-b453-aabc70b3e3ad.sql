-- Insert default message sequences for manual messages using negative day values
INSERT INTO public.message_sequences (id, day, message_type, subject, content, active)
VALUES 
  (0, -1, 'email', 'Manual Email', 'Manual email sent directly from the app', true),
  (999, -2, 'text', 'Manual Text', 'Manual text sent directly from the app', true)
ON CONFLICT (id) DO UPDATE SET
  day = EXCLUDED.day,
  message_type = EXCLUDED.message_type,
  subject = EXCLUDED.subject,
  content = EXCLUDED.content,
  active = EXCLUDED.active;