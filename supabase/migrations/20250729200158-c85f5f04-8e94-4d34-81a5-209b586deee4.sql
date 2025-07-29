-- Remove "Best Regards Talo Yoga" signature from all message sequences
UPDATE message_sequences 
SET content = TRIM(REGEXP_REPLACE(content, '\n*\s*Best Regards,?\s*\n*\s*Talo Yoga\s*$', '', 'i'))
WHERE active = true;