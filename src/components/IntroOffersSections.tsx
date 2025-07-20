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
      console.log('Sending message data:', messageData);
      
      // Log the communication to database for inbox display
      const communicationData = {
        customer_id: messageData.customerId,
        message_sequence_id: selectedTemplate?.id || (messageData.messageType === 'email' ? 0 : 999),
        message_type: messageData.messageType,
        content: messageData.content,
        subject: messageData.subject || null,
        recipient_email: messageData.messageType === 'email' ? messageData.recipient : null,
        recipient_phone: messageData.messageType === 'text' ? messageData.recipient : null,
        delivery_status: 'sent',
        sent_at: new Date().toISOString()
      };

      console.log('Inserting communication data:', communicationData);

      const { data, error: logError } = await supabase
        .from('communications_log')
        .insert(communicationData)
        .select();

      if (logError) {
        console.error('Database insertion error:', logError);
        throw logError;
      }

      console.log('Successfully inserted communication:', data);

      // Add to sent messages for UI indication
      const messageKey = `${messageData.customerId}-${messageData.messageType}`;
      setSentMessages(prev => new Set([...prev, messageKey]));

      toast({
        title: "Message sent successfully",
        description: `${messageData.messageType === 'email' ? 'Email' : 'Text'} sent to ${selectedCustomer?.first_name} ${selectedCustomer?.last_name}. Check your inbox!`,
      });

      // Close the modal
      setModalOpen(false);
    } catch (error) {
      console.error('Error logging message:', error);
      
      toast({
        title: "Error sending message",
        description: `Failed to send ${messageData.messageType}. Please try again.`,
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

  // Create demo data for each day with proper ID mappings
  const demoCustomers = {
    0: [{ 
      id: 101, 
      first_name: 'Trey', 
      last_name: 'Dotson', 
      client_email: 'trey@example.com', 
      phone_number: '+1234567890', 
      current_day: 0, 
      days_remaining: 30, 
      intro_status: 'active', 
      created_at: '2024-01-01', 
      last_seen: '2024-01-01', 
      tags: 'new' 
    }],
    7: [{ 
      id: 102, 
      first_name: 'Sarah', 
      last_name: 'Johnson', 
      client_email: 'sarah@example.com', 
      phone_number: '+1234567891', 
      current_day: 7, 
      days_remaining: 23, 
      intro_status: 'active', 
      created_at: '2023-12-25', 
      last_seen: '2024-01-01', 
      tags: 'engaged' 
    }],
    10: [{ 
      id: 103, 
      first_name: 'Mike', 
      last_name: 'Chen', 
      client_email: 'mike@example.com', 
      phone_number: '+1234567892', 
      current_day: 10, 
      days_remaining: 20, 
      intro_status: 'active', 
      created_at: '2023-12-22', 
      last_seen: '2024-01-01', 
      tags: 'regular' 
    }],
    14: [{ 
      id: 104, 
      first_name: 'Lisa', 
      last_name: 'Williams', 
      client_email: 'lisa@example.com', 
      phone_number: '+1234567893', 
      current_day: 14, 
      days_remaining: 16, 
      intro_status: 'active', 
      created_at: '2023-12-18', 
      last_seen: '2024-01-01', 
      tags: 'consistent' 
    }],
    28: [{ 
      id: 105, 
      first_name: 'David', 
      last_name: 'Brown', 
      client_email: 'david@example.com', 
      phone_number: '+1234567894', 
      current_day: 28, 
      days_remaining: 2, 
      intro_status: 'active', 
      created_at: '2023-12-04', 
      last_seen: '2024-01-01', 
      tags: 'convert-ready' 
    }]
  };

  return (
    <div className="flex-1 p-6 bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Intro Offers - Nurture Sequence</h1>
        <p className="text-gray-600 mt-2">
          Track customers through their 30-day intro journey across 5 touchpoints
        </p>
      </div>

      <div className="space-y-6">
        {messageSequences.map((sequence) => {
          const customers = demoCustomers[sequence.day] || [];
          
          return (
            <Card key={sequence.id} className="border shadow-sm">
              <CardHeader className="pb-4 bg-green-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-green-100 border border-green-200">
                        {getMessageTypeIcon(sequence.message_type)}
                      </div>
                      <CardTitle className="text-lg text-gray-900">
                        Day {sequence.day} - {sequence.message_type === 'email' ? 'Email' : 'Text Message'}
                      </CardTitle>
                    </div>
                    {getMessageTypeBadge(sequence.message_type)}
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {customers.length} customer{customers.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                {sequence.subject && (
                  <p className="text-sm text-gray-700 font-medium mt-2 bg-white rounded px-3 py-1 border">
                    Subject: {sequence.subject}
                  </p>
                )}
                
                <p className="text-sm text-gray-600 line-clamp-2 mt-1 italic">
                  {sequence.content.substring(0, 150)}...
                </p>
              </CardHeader>

              <CardContent className="p-6">
                {customers.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 bg-gray-100 rounded-lg border-2 border-dashed">
                    No customers at this stage
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customers.map((customer) => (
                      <div 
                        key={customer.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors bg-white"
                      >
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="font-medium text-gray-900">
                              {customer.first_name} {customer.last_name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {customer.client_email}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                              <Calendar className="w-4 h-4" />
                              Started: {formatDate(customer.created_at)}
                            </div>
                            <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                              <Clock className="w-4 h-4" />
                              {customer.days_remaining} days left
                            </div>
                          </div>

                          {customer.tags && (
                            <Badge variant="outline" className="text-xs">
                              {customer.tags}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Only show Text button for text sequences, Email button for email sequences */}
                          {sequence.message_type === 'text' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSendMessage(customer, 'text', sequence)}
                              disabled={!customer.phone_number}
                              className="border-green-300 hover:bg-green-50"
                            >
                              {sentMessages.has(`${customer.id}-text`) ? (
                                <Check className="w-4 h-4 mr-1 text-green-600" />
                              ) : (
                                <MessageSquare className="w-4 h-4 mr-1" />
                              )}
                              Text
                            </Button>
                          )}
                          
                          {sequence.message_type === 'email' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSendMessage(customer, 'email', sequence)}
                              className="border-green-300 hover:bg-green-50"
                            >
                              {sentMessages.has(`${customer.id}-email`) ? (
                                <Check className="w-4 h-4 mr-1 text-green-600" />
                              ) : (
                                <Mail className="w-4 h-4 mr-1" />
                              )}
                              Email
                            </Button>
                          )}
                          
                          <Button variant="ghost" size="sm">
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