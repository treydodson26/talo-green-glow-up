import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Loader2, CheckCircle, X, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const IntroOfferDemo = () => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [open, setOpen] = useState(false);
  const [messageContent, setMessageContent] = useState("Hi {{first_name}}! 👋 It's been a week since you joined Tallow Yoga. How are you feeling after your first class(es)? We'd love to hear about your experience and answer any questions you might have. Reply anytime! 🙏");
  const { toast } = useToast();

  // Demo data - Trey Dotson (Day 7 testing)
  const demoCustomer = {
    id: 999,
    first_name: "Trey",
    last_name: "Dotson", 
    phone_number: "4697046880",
    status: "intro_trial"
  };

  const handleSendWhatsAppMessage = async () => {
    setSending(true);
    
    try {
      console.log('Sending WhatsApp message to Trey Dotson...');
      
      const personalizedMessage = messageContent.replace(/\{\{first_name\}\}/g, demoCustomer.first_name);
      
      const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          customer_id: demoCustomer.id,
          message_content: personalizedMessage,
          message_type: 'day_7_followup'
        }
      });

      if (error) {
        console.error('Error sending WhatsApp message:', error);
        throw error;
      }

      console.log('WhatsApp message sent successfully:', data);
      setSent(true);
      setOpen(false);
      
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

  const previewMessage = messageContent.replace(/\{\{first_name\}\}/g, demoCustomer.first_name);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Day 7 Email Testing - Intro Offers
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
                Day 7 Testing
              </Badge>
            </div>
            
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  disabled={sending || sent}
                  className="flex items-center gap-2"
                >
                  {sent ? (
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
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader className="flex flex-row items-center justify-between">
                  <DialogTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Send Text Message to {demoCustomer.first_name} {demoCustomer.last_name}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {demoCustomer.first_name} {demoCustomer.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      +{demoCustomer.phone_number}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Message</label>
                    <Textarea
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      className="min-h-[120px] resize-none"
                      placeholder="Enter your message..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Available variables: {"{{first_name}}"}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Preview:</label>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{previewMessage}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSendWhatsAppMessage}
                      disabled={sending}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="h-4 w-4" />
                          Send Text
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {sent && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ WhatsApp message sent successfully using Day 7 follow-up template!
              </p>
            </div>
          )}
          
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Day 7 Testing:</strong> This sends a WhatsApp Business API message to your personal number 
              ({demoCustomer.phone_number}) for testing the Day 7 follow-up workflow.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IntroOfferDemo;