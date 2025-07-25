import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const TestWhatsApp = () => {
  const [loading, setLoading] = useState(false);

  const testWhatsAppMessage = async () => {
    setLoading(true);
    try {
      console.log('Testing WhatsApp message to Trey...');
      
      const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          customer_id: 984, // Trey's customer ID
          message_content: 'Test message from Talo Yoga CRM system',
          message_type: 'test',
          sequence_day: 0
        }
      });

      if (error) {
        console.error('WhatsApp function error:', error);
        toast.error(`WhatsApp Error: ${error.message}`);
        return;
      }

      console.log('WhatsApp response:', data);
      
      if (data.success) {
        toast.success(`WhatsApp message sent successfully! Message ID: ${data.whatsapp_message_id}`);
      } else {
        toast.error(`WhatsApp failed: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Error testing WhatsApp:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Test WhatsApp Function</CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={testWhatsAppMessage}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Sending...' : 'Send Test Message to Trey'}
        </Button>
      </CardContent>
    </Card>
  );
};