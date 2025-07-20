import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MoreHorizontal, Calendar, Clock, Check, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MessageModal from "@/components/MessageModal";

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  client_email: string;
  phone_number: string;
  current_day: number;
  days_remaining: number;
  intro_status: string;
  created_at: string;
  last_seen: string;
  tags: string;
}

interface MessageSequence {
  id: number;
  day: number;
  message_type: string;
  subject: string;
  content: string;
  active: boolean;
}

const IntroOffersSections = () => {
  const [customersByDay, setCustomersByDay] = useState<{ [key: number]: Customer[] }>({});
  const [messageSequences, setMessageSequences] = useState<MessageSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedMessageType, setSelectedMessageType] = useState<'email' | 'text'>('email');
  const [selectedTemplate, setSelectedTemplate] = useState<MessageSequence | null>(null);
  const [sentMessages, setSentMessages] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load message sequences
      const { data: sequences, error: sequencesError } = await supabase
        .from('message_sequences')
        .select('*')
        .eq('active', true)
        .order('day');

      if (sequencesError) throw sequencesError;

      // Load intro offer customers
      const { data: customers, error: customersError } = await supabase
        .from('intro_offer_customers')
        .select('*')
        .order('current_day, last_name');

      if (customersError) throw customersError;

      // Group customers by their current day
      const grouped = customers?.reduce((acc, customer) => {
        const day = customer.current_day || 0;
        if (!acc[day]) acc[day] = [];
        acc[day].push(customer);
        return acc;
      }, {} as { [key: number]: Customer[] }) || {};

      setMessageSequences(sequences || []);
      setCustomersByDay(grouped);
    } catch (error) {
      console.error('Error loading intro offers data:', error);
      toast({
        title: "Error",
        description: "Failed to load intro offers data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getMessageTypeIcon = (messageType: string) => {
    return messageType === 'email' ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />;
  };

  const getMessageTypeBadge = (messageType: string) => {
    return (
      <Badge variant={messageType === 'email' ? 'default' : 'secondary'} className="text-xs">
        {messageType === 'email' ? 'Email' : 'Text'}
      </Badge>
    );
  };

  const handleSendMessage = (customer: Customer, messageType: 'email' | 'text', sequence: MessageSequence) => {
    setSelectedCustomer(customer);
    setSelectedMessageType(messageType);
    setSelectedTemplate(sequence);
    setModalOpen(true);
  };

  const onSendMessage = async (messageData: {
    customerId: number;
    messageType: 'email' | 'text';
    subject?: string;
    content: string;
    recipient: string;
  }) => {
    try {
      if (messageData.messageType === 'email') {
        // Send email via Gmail API Edge function
        const { error } = await supabase.functions.invoke('send-gmail-message', {
          body: {
            to: messageData.recipient,
            subject: messageData.subject,
            content: messageData.content,
            customer_id: messageData.customerId
          }
        });

        if (error) throw error;
      } else {
        // Send WhatsApp message (existing function)
        const { error } = await supabase.functions.invoke('send-whatsapp-message', {
          body: {
            phone_number: messageData.recipient,
            message: messageData.content,
            customer_id: messageData.customerId
          }
        });

        if (error) throw error;
      }

      // Log the communication
      const { error: logError } = await supabase
        .from('communications_log')
        .insert({
          customer_id: messageData.customerId,
          message_sequence_id: selectedTemplate?.id || 0,
          message_type: messageData.messageType,
          content: messageData.content,
          subject: messageData.subject,
          recipient_email: messageData.messageType === 'email' ? messageData.recipient : null,
          recipient_phone: messageData.messageType === 'text' ? messageData.recipient : null,
          delivery_status: 'sent',
          sent_at: new Date().toISOString()
        });

      if (logError) throw logError;

      // Add to sent messages for UI indication
      const messageKey = `${messageData.customerId}-${messageData.messageType}`;
      setSentMessages(prev => new Set([...prev, messageKey]));

      toast({
        title: "Message sent successfully",
        description: `${messageData.messageType === 'email' ? 'Email' : 'Text'} sent to ${selectedCustomer?.first_name} ${selectedCustomer?.last_name}`,
      });

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 bg-background">
        <div className="text-center py-8">Loading intro offers...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 bg-gradient-to-br from-background to-background/95">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Intro Offers - Nurture Sequence</h1>
        <p className="text-muted-foreground mt-2">
          Track customers through their 30-day intro journey across 5 touchpoints
        </p>
      </div>

      <div className="space-y-6">
        {messageSequences.map((sequence) => {
          const customers = customersByDay[sequence.day] || [];
          
          return (
            <Card key={sequence.id} className="animate-fade-in border-0 shadow-lg bg-gradient-to-br from-card via-card/95 to-card/90">
              <CardHeader className="pb-4 bg-gradient-to-r from-primary/10 via-primary/8 to-primary/5 rounded-t-lg border-b border-border/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-primary/20 border border-primary/30">
                        {getMessageTypeIcon(sequence.message_type)}
                      </div>
                      <CardTitle className="text-lg text-foreground">
                        Day {sequence.day} - {sequence.message_type === 'email' ? 'Email' : 'Text Message'}
                      </CardTitle>
                    </div>
                    {getMessageTypeBadge(sequence.message_type)}
                  </div>
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 shadow-sm">
                    {customers.length} customer{customers.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                {sequence.subject && (
                  <p className="text-sm text-foreground/90 font-medium mt-2 bg-background/50 rounded px-3 py-1 border border-border/30">
                    Subject: {sequence.subject}
                  </p>
                )}
                
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1 italic">
                  {sequence.content.substring(0, 150)}...
                </p>
              </CardHeader>

              <CardContent className="p-6 bg-gradient-to-b from-background/30 to-background/50">
                {customers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed border-border/30">
                    No customers at this stage
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customers.map((customer) => (
                      <div 
                        key={customer.id}
                        className="flex items-center justify-between p-4 border border-border/60 rounded-lg hover:bg-accent/50 transition-all duration-200 hover:shadow-md bg-background/70 hover:border-primary/30"
                      >
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="font-medium text-foreground">
                              {customer.first_name} {customer.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {customer.client_email}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1 bg-accent/20 px-2 py-1 rounded">
                              <Calendar className="w-4 h-4" />
                              Started: {formatDate(customer.created_at)}
                            </div>
                            <div className="flex items-center gap-1 bg-accent/20 px-2 py-1 rounded">
                              <Clock className="w-4 h-4" />
                              {customer.days_remaining} days left
                            </div>
                          </div>

                          {customer.tags && (
                            <Badge variant="outline" className="text-xs bg-accent/30 text-accent-foreground border-accent/40">
                              {customer.tags}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Text Message Button */}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSendMessage(customer, 'text', sequence)}
                            disabled={!customer.phone_number}
                            className="border-primary/40 hover:bg-primary/10 hover:border-primary/60 shadow-sm"
                          >
                            {sentMessages.has(`${customer.id}-text`) ? (
                              <Check className="w-4 h-4 mr-1 text-green-600" />
                            ) : (
                              <MessageSquare className="w-4 h-4 mr-1" />
                            )}
                            Text
                          </Button>
                          
                          {/* Email Button */}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSendMessage(customer, 'email', sequence)}
                            className="border-primary/40 hover:bg-primary/10 hover:border-primary/60 shadow-sm"
                          >
                            {sentMessages.has(`${customer.id}-email`) ? (
                              <Check className="w-4 h-4 mr-1 text-green-600" />
                            ) : (
                              <Mail className="w-4 h-4 mr-1" />
                            )}
                            Email
                          </Button>
                          
                          <Button variant="ghost" size="sm" className="hover:bg-accent/30">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Message Modal */}
      {selectedCustomer && selectedTemplate && (
        <MessageModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          customer={selectedCustomer}
          messageType={selectedMessageType}
          template={{
            subject: selectedTemplate.subject,
            content: selectedTemplate.content
          }}
          onSend={onSendMessage}
        />
      )}
    </div>
  );
};

export default IntroOffersSections;