-- Update Day 10 email content to match the exact specification
UPDATE message_sequences 
SET content = 'Hi {{first_name}},

We''re so glad you''ve stepped into the space with us. We wanted to take a moment to share a bit more about what we''re building here at Talo!

Talo means "home" in Finnish — and that''s exactly what we hope this space feels like. A place to return to yourself. A place to feel welcomed and supported in your yoga practice. Our approach is intentionally minimalist and deeply personalized. We keep classes small, offer thoughtful guidance for all levels, and aim to create a calm, elevated experience where you feel taken care of from the moment you step inside.

If you ever have a question or want help mapping out your intro schedule, please hit reply! 

In the meantime, here''s a few helpful tips:

• Arrive 5-10 mins early for a soft landing into our space and onto your mat.

• Yes, you can bring a friend! All intro students get one guest pass.

• Need to cancel? Just do so through your booking portal 12+ hours before class.

• Looking for something more personalized? We offer private sessions by appointment and specialty classes every Sunday.

Thanks for being here. We''re so happy you''ve found us.

Warmly,
Emily
Founder, Talo Yoga'
WHERE day = 10;