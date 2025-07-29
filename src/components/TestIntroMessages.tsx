import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export const TestIntroMessages = () => {
  const [loading, setLoading] = useState<number | null>(null);

  // Test customer data (using Trey for testing)
  const testCustomer = {
    id: 984,
    first_name: 'Trey',
    last_name: 'Dodson',
    client_email: 'treydodson26@gmail.com',
    phone_number: '4697046880'
  };

  // Message sequences from database
  const messageSequences = [
    {
      id: 6,
      day: 0,
      message_type: 'email',
      subject: 'Welcome to Talo Yoga 🌿',
      content: `Hi {{first_name}},

**Welcome to Talo Yoga!**

We're so excited that you decided to join us for an introductory month, and we can't wait to show you around our studio. Congratulations on signing up for your first class!

Here are a few tips and best practices to help you feel prepared for class:

**Where to Park:**

We are located between Cambridge Ave and California Ave. There is street parking along Cambridge Ave, a large public parking lot with 2hr parking behind the studio and a public parking garage in front of the studio.

• **What to Bring:** We have mats, towels, and props. You can bring water bottle to fill up at our water jug.
• **When to Arrive:** Please arrive at least 5 minutes before your class for a soft landing and to meet your instructor.
• **What to Expect:** When you enter the studio, your teacher will greet you, orient you to our space, and help you get settled in.
• **How to Schedule:** You can access your booking account, schedule sessions, and make class changes anytime [here]({{bookingLink}}). Please note we have a 12-hour cancellation window, so be sure to make any updates at least 12 hours before your scheduled class!

We'll send you more helpful tips during your intro so please keep an eye on your inbox for emails, and please reach out if you need anything at all! 

Thank you so much for choosing Talo Yoga - we can't wait to meet you soon!

Warmly,
Emily & the Talo Yoga team`
    },
    {
      id: 7,
      day: 7,
      message_type: 'text',
      subject: null,
      content: `Hi {{first_name}}! This is Emily from Talo Yoga. I'm checking in to see how your first week with us went. Can I help you get booked in for your next class or answer any questions? When you reply, you'll go straight to my phone- not a robot!`
    },
    {
      id: 8,
      day: 10,
      message_type: 'email',
      subject: 'A Little About Talo Yoga 🌿 — and How to Make the Most of Your Intro',
      content: `Hi {{first_name}},

We're so glad you've stepped into the space with us. We wanted to take a moment to share a bit more about what we're building here at Talo!

Talo means "home" in Finnish — and that's exactly what we hope this space feels like. A place to return to yourself. A place to feel welcomed and supported in your yoga practice. Our approach is intentionally minimalist and deeply personalized. We keep classes small, offer thoughtful guidance for all levels, and aim to create a calm, elevated experience where you feel taken care of from the moment you step inside.

If you ever have a question or want help mapping out your intro schedule, please hit reply! 

In the meantime, here's a few helpful tips:

• Arrive 5-10 mins early for a soft landing into our space and onto your mat.

• Yes, you can bring a friend! All intro students get one guest pass.

• Need to cancel? Just do so through your booking portal 12+ hours before class.

• Looking for something more personalized? We offer private sessions by appointment and specialty classes every Sunday.

Thanks for being here. We're so happy you've found us.

Warmly,
Emily & the Talo Yoga team`
    },
    {
      id: 9,
      day: 14,
      message_type: 'text',
      subject: null,
      content: `Hi {{first_name}}, you're halfway through your intro! Just wanted to check in — how are you feeling? If you've found classes you love or have any questions, I'm here. Want help booking the rest of your trial sessions?`
    },
    {
      id: 10,
      day: 28,
      message_type: 'email',
      subject: 'From Intro to Ritual — Your Path Forward at Talo 🌿',
      content: `Hi {{first_name}},

It's been so lovely having you at the studio this past month. I hope your time has felt grounding, welcoming, and like something you want to return to.

Many of our students continue with the 8x/month membership ($240/month) — it's perfect if you're practicing around 2x/week and includes a monthly guest pass and access to member-only offerings.

But everyone's needs are different, and I'd love to help you land on what feels right for your life and schedule. Just hit reply — I'm happy to walk through the options with you.

See you on the mat soon! 

Warmly,
Emily & the Talo Yoga team`
    }
  ];

  const testWebhook = async (sequence: any) => {
    setLoading(sequence.day);
    try {
      const webhookUrl = "https://treydodson26.app.n8n.cloud/webhook/3cf6de19-b9d9-4add-a085-56884822ea36";
      
      // Replace placeholder with actual name
      const personalizedContent = sequence.content.replace(/\{\{first_name\}\}/g, testCustomer.first_name);
      
      const payload = {
        Day: `Day ${sequence.day}`,
        Recipient: testCustomer.client_email,
        CustomerMessage: personalizedContent,
        CustomerName: `${testCustomer.first_name} ${testCustomer.last_name}`,
        MessageType: sequence.message_type
      };

      console.log(`Testing Day ${sequence.day} webhook:`, payload);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify(payload),
      });

      toast.success(`Day ${sequence.day} ${sequence.message_type} webhook sent successfully!`);
      
    } catch (error) {
      console.error(`Error testing Day ${sequence.day}:`, error);
      toast.error(`Failed to send Day ${sequence.day} webhook`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Test Intro Message Webhooks</CardTitle>
        <p className="text-sm text-muted-foreground">
          Test each day's message to confirm the right content is sent to N8N
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {messageSequences.map((sequence) => (
          <div key={sequence.day} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                sequence.message_type === 'email' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {sequence.message_type === 'email' ? 
                  <Mail className="w-4 h-4" /> : 
                  <MessageSquare className="w-4 h-4" />
                }
              </div>
              <div>
                <div className="font-medium">Day {sequence.day}</div>
                <div className="text-sm text-muted-foreground">
                  {sequence.subject || `${sequence.message_type} message`}
                </div>
              </div>
              <Badge variant="outline" className={
                sequence.message_type === 'email' 
                  ? 'bg-blue-50 text-blue-700 border-blue-200' 
                  : 'bg-orange-50 text-orange-700 border-orange-200'
              }>
                {sequence.message_type}
              </Badge>
            </div>
            <Button 
              onClick={() => testWebhook(sequence)}
              disabled={loading === sequence.day}
              size="sm"
            >
              {loading === sequence.day ? 'Sending...' : 'Test Webhook'}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};