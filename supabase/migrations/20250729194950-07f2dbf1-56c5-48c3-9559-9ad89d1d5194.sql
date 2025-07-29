UPDATE message_sequences 
SET content = 'Hi {{first_name}},

**Welcome to Talo Yoga!**

We''re so excited that you decided to join us for an introductory month, and we can''t wait to show you around our studio. Congratulations on signing up for your first class!

Here are a few tips and best practices to help you feel prepared for class:

**Where to Park:**

We are located between Cambridge Ave and California Ave. There is street parking along Cambridge Ave, a large public parking lot with 2hr parking behind the studio and a public parking garage in front of the studio.

• **What to Bring:** We have mats, towels, and props. You can bring water bottle to fill up at our water jug.
• **When to Arrive:** Please arrive at least 5 minutes before your class for a soft landing and to meet your instructor.
• **What to Expect:** When you enter the studio, your teacher will greet you, orient you to our space, and help you get settled in.
• **How to Schedule:** You can access your booking account, schedule sessions, and make class changes anytime [here]({{bookingLink}}). Please note we have a 12-hour cancellation window, so be sure to make any updates at least 12 hours before your scheduled class!

We''ll send you more helpful tips during your intro so please keep an eye on your inbox for emails, and please reach out if you need anything at all! 

Thank you so much for choosing Talo Yoga - we can''t wait to meet you soon!

Warmly,
Emily & the Talo Yoga team'
WHERE day = 0 AND message_type = 'email' AND active = true;