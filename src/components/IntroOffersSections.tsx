import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MoreHorizontal, Calendar, Clock, Check } from "lucide-react";
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

      // Add Trey Dotson to Day 7 for demo purposes
      if (!grouped[7]) grouped[7] = [];
      const treyCustomer: Customer = {
        id: 999,
        first_name: 'Trey',
        last_name: 'Dotson',
        client_email: 'trey@example.com',
        phone_number: '+1234567890',
        current_day: 7,
        days_remaining: 23,
        intro_status: 'active',
        created_at: '2024-07-18T00:00:00Z',
        last_seen: '2024-07-20T19:00:00Z',
        tags: 'Class Pass'
      };
      
      // Add Trey at the beginning of Day 7
      grouped[7].unshift(treyCustomer);

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
    <div className="flex-1 p-6 bg-background">
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
            <Card key={sequence.id} className="animate-fade-in border-2 shadow-lg bg-gradient-to-r from-card via-card to-muted/20">
              <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-secondary/5 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-primary/10">
                        {getMessageTypeIcon(sequence.message_type)}
                      </div>
                      <CardTitle className="text-lg font-semibold">
                        Day {sequence.day} - {sequence.message_type === 'email' ? 'Email' : 'Text Message'}
                      </CardTitle>
                    </div>
                    {getMessageTypeBadge(sequence.message_type)}
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary font-semibold">
                    {customers.length} customer{customers.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                {sequence.subject && (
                  <p className="text-sm text-muted-foreground font-medium">
                    Subject: {sequence.subject}
                  </p>
                )}
                
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {sequence.content.substring(0, 150)}...
                </p>
              </CardHeader>

              <CardContent>
                {customers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No customers at this stage
                  </div>
                ) : (
                  <div className="space-y-3">
                     {customers.map((customer) => (
                       <div 
                         key={customer.id}
                         className="flex items-center justify-between p-4 border-2 rounded-lg bg-gradient-to-r from-background to-muted/30 hover:from-primary/5 hover:to-secondary/5 transition-all duration-200 shadow-sm hover:shadow-md"
                       >
                        <div className="flex items-center gap-4">
                           <div>
                             <div className="font-semibold text-foreground">
                               {customer.first_name} {customer.last_name}
                             </div>
                             <div className="text-sm text-muted-foreground font-medium">
                               {customer.client_email}
                             </div>
                             {customer.first_name === 'Trey' && (
                               <div className="text-xs text-primary font-medium mt-1">
                                 Started July 18th • Class Pass
                               </div>
                             )}
                           </div>
                          
                           <div className="flex items-center gap-4 text-sm text-muted-foreground">
                             <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-full">
                               <Calendar className="w-4 h-4 text-primary" />
                               Started: {formatDate(customer.created_at)}
                             </div>
                             <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-full">
                               <Clock className="w-4 h-4 text-primary" />
                               {customer.days_remaining} days left
                             </div>
                           </div>

                           {customer.tags && (
                             <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                               {customer.tags}
                             </Badge>
                           )}
                        </div>

                         <div className="flex items-center gap-2">
                           {/* Text Message Button */}
                           <Button 
                             variant="outline" 
                             size="sm"
                             className="hover:bg-primary/10 hover:border-primary/30 transition-colors"
                             onClick={() => handleSendMessage(customer, 'text', sequence)}
                             disabled={!customer.phone_number}
                           >
                             {sentMessages.has(`${customer.id}-text`) ? (
                               <Check className="w-4 h-4 mr-1 text-green-600" />
                             ) : (
                               <Phone className="w-4 h-4 mr-1" />
                             )}
                             Text
                           </Button>
                           
                           {/* Email Button */}
                           <Button 
                             variant="outline" 
                             size="sm"
                             className="hover:bg-primary/10 hover:border-primary/30 transition-colors"
                             onClick={() => handleSendMessage(customer, 'email', sequence)}
                           >
                             {sentMessages.has(`${customer.id}-email`) ? (
                               <Check className="w-4 h-4 mr-1 text-green-600" />
                             ) : (
                               <Mail className="w-4 h-4 mr-1" />
                             )}
                             Email
                           </Button>
                           
                           <Button variant="ghost" size="sm" className="hover:bg-muted">
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