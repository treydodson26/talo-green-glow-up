import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, MessageSquare, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  marketing_text_opt_in: boolean;
  transactional_text_opt_in: boolean;
}

interface CommunicationLog {
  id: number;
  customer_id: number;
  content: string;
  delivery_status: string;
  sent_at: string;
  error_message?: string;
  whatsapp_message_id?: string;
}

export default function WhatsAppMessaging() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [communicationLogs, setCommunicationLogs] = useState<CommunicationLog[]>([]);
  const { toast } = useToast();

  // Test message for Emily
  const testMessage = `Hi Emily! Welcome to Talo Yoga! We're so excited that you decided to join us for an introductory month, and we can't wait to show you around our studio. Congratulations on signing up for your first class!

Here are a few tips and best practices to help you feel prepared for class:

Where to Park: We are located between Cambridge Ave and California Ave. There is street parking along Cambridge Ave, a large public parking lot with 2hr parking behind the studio and a public parking garage in front of the studio.

What to Bring: We have mats, towels, and props. You can bring water bottle to fill up at our water jug.

When to Arrive: Please arrive at least 5 minutes before your class for a soft landing and to meet your instructor.`;

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();
    loadCommunicationLogs();
  }, []);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          id,
          first_name,
          last_name,
          phone_number,
          marketing_text_opt_in,
          transactional_text_opt_in
        `)
        .not('phone_number', 'is', null);

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    }
  };

  const loadCommunicationLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('communications_log')
        .select('*')
        .eq('message_type', 'whatsapp')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setCommunicationLogs(data || []);
    } catch (error) {
      console.error('Error loading communication logs:', error);
    }
  };

  const sendWhatsAppMessage = async () => {
    if (!selectedCustomer || !messageContent.trim()) {
      toast({
        title: "Error",
        description: "Please select a customer and enter a message",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          customer_id: selectedCustomer.id,
          message_content: messageContent,
          message_type: 'whatsapp',
          sequence_day: 0
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success!",
          description: `WhatsApp message sent to ${selectedCustomer.first_name} ${selectedCustomer.last_name}`,
        });
        
        // Clear the form
        setMessageContent("");
        
        // Reload communication logs
        loadCommunicationLogs();
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (error: any) {
      console.error('WhatsApp send error:', error);
      toast({
        title: "Failed to send message",
        description: error.message || 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canReceiveTexts = (customer: Customer) => {
    return customer.marketing_text_opt_in || customer.transactional_text_opt_in;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Send WhatsApp Message
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer-select">Select Customer</Label>
            <Select onValueChange={(value) => {
              const customer = customers.find(c => c.id.toString() === value);
              setSelectedCustomer(customer || null);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a customer..." />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    <div className="flex items-center justify-between w-full">
                      <span>{customer.first_name} {customer.last_name}</span>
                      <div className="flex gap-1 ml-2">
                        {canReceiveTexts(customer) ? (
                          <Badge variant="secondary" className="text-xs">
                            Text OK
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            No Text Permission
                          </Badge>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedCustomer && (
              <div className="p-3 bg-muted rounded-md text-sm">
                <p><strong>Phone:</strong> {selectedCustomer.phone_number}</p>
                <p><strong>Text Permissions:</strong> 
                  <span className={canReceiveTexts(selectedCustomer) ? "text-success ml-1" : "text-destructive ml-1"}>
                    {canReceiveTexts(selectedCustomer) ? "Can receive texts" : "Cannot receive texts"}
                  </span>
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="message-content">Message Content</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMessageContent(testMessage)}
              >
                Use Test Message
              </Button>
            </div>
            <Textarea
              id="message-content"
              placeholder="Enter your WhatsApp message..."
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">
              {messageContent.length} characters
            </p>
          </div>

          <Button 
            onClick={sendWhatsAppMessage}
            disabled={isLoading || !selectedCustomer || !messageContent.trim() || !canReceiveTexts(selectedCustomer || {} as Customer)}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Sending WhatsApp...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Send WhatsApp Message
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent WhatsApp Messages</CardTitle>
        </CardHeader>
        <CardContent>
          {communicationLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No WhatsApp messages sent yet
            </p>
          ) : (
            <div className="space-y-3">
              {communicationLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="mt-1">
                    {getStatusIcon(log.delivery_status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">Customer ID: {log.customer_id}</span>
                      <Badge variant={log.delivery_status === 'sent' ? 'default' : log.delivery_status === 'failed' ? 'destructive' : 'secondary'}>
                        {log.delivery_status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {log.content}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{new Date(log.sent_at).toLocaleString()}</span>
                      {log.whatsapp_message_id && (
                        <span>ID: {log.whatsapp_message_id.slice(-8)}</span>
                      )}
                    </div>
                    {log.error_message && (
                      <p className="text-xs text-destructive mt-1">
                        Error: {log.error_message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}