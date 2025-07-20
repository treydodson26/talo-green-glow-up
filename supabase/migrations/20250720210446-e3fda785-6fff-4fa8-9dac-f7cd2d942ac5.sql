-- Insert a default message sequence with ID 0 for manual messages
INSERT INTO public.message_sequences (id, day, message_type, subject, content, active)
VALUES (0, 0, 'manual', 'Manual Message', 'Manual message sent directly from the app', true)
ON CONFLICT (id) DO NOTHING;