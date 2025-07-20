import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const IntroOfferDemo = () => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  // Demo data - Trey Dotson
  const demoCustomer = {
    id: 999, // Demo ID
    first_name: "Trey",
    last_name: "Dotson", 
    phone_number: "4697046880",
    status: "intro_trial"
  };

  const handleSendWhatsAppMessage = async () => {
    setSending(true);
    
    try {
      console.log('Sending WhatsApp message to Trey Dotson...');
      
      const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          customer_id: demoCustomer.id,
          message_content: `Hi ${demoCustomer.first_name}! Welcome to your Intro Offer trial. We're excited to have you join us!`,
          message_type: 'intro_offer_greeting'
        }
      });

      if (error) {
        console.error('Error sending WhatsApp message:', error);
        throw error;
      }

      console.log('WhatsApp message sent successfully:', data);
      setSent(true);
      
      toast({
        title: "Message Sent!",
        description: `WhatsApp message sent to ${demoCustomer.first_name} ${demoCustomer.last_name}`,
      });

    } catch (error: any) {
      console.error('Failed to send WhatsApp message:', error);
      
      toast({
        title: "Failed to send message",
        description: error.message || "There was an error sending the WhatsApp message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Intro Offer Demo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <div>
                <h3 className="font-semibold">
                  {demoCustomer.first_name} {demoCustomer.last_name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Phone: {demoCustomer.phone_number}
                </p>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {demoCustomer.status.replace('_', ' ')}
              </Badge>
            </div>
            
            <Button
              onClick={handleSendWhatsAppMessage}
              disabled={sending || sent}
              className="flex items-center gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : sent ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Message Sent
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </div>
          
          {sent && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ WhatsApp message sent successfully using the approved "intro_offer_greeting" template!
              </p>
            </div>
          )}
          
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Demo Info:</strong> This will send a WhatsApp Business API message using the pre-approved 
              "intro_offer_greeting" template with parameters: {demoCustomer.first_name} and "Intro Offer".
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IntroOfferDemo;