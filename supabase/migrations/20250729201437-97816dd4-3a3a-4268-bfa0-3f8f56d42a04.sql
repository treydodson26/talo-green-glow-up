-- Update Day 28 message to remove "Founder, Talo Yoga" from sign-off
UPDATE message_sequences 
SET content = 'Hi {{first_name}},

It''s been so lovely having you at the studio this past month. I hope your time has felt grounding, welcoming, and like something you want to return to.

Many of our students continue with the **8x/month membership ($240/month)** — it''s perfect if you''re practicing around 2x/week and includes a monthly guest pass and access to member-only offerings.

But everyone''s needs are different, and I''d love to help you land on what feels right for your life and schedule. Just hit reply — I''m happy to walk through the options with you.

See you on the mat soon! 

Warmly,  
Emily'
WHERE day = 28 AND message_type = 'email' AND active = true;