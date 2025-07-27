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

      // Load message sequences - only show specific days (0, 7, 10, 14, 28)
      const { data: sequences, error: sequencesError } = await supabase
        .from('message_sequences')
        .select('*')
        .eq('active', true)
        .in('day', [0, 7, 10, 14, 28])
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
      <Badge 
        variant="outline" 
        className={`text-xs font-semibold ${
          messageType === 'email' 
            ? 'bg-blue-50 text-blue-700 border-blue-200' 
            : 'bg-orange-50 text-orange-700 border-orange-200'
        }`}
      >
        {messageType === 'email' ? 'Email' : 'WhatsApp'}
      </Badge>
    );
  };

  const handleSendMessage = (customer: Customer, messageType: 'email' | 'text', sequence: MessageSequence) => {
    setSelectedCustomer(customer);
    setSelectedMessageType(messageType);
    setSelectedTemplate(sequence);
    setModalOpen(true);
  };

  const sendToWebhook = async (day: number, customer: Customer, messageType: 'email' | 'text') => {
    try {
      const webhookUrl = "https://treydodson26.app.n8n.cloud/webhook/3cf6de19-b9d9-4add-a085-56884822ea36";
      
      const payload = {
        Day: `Day ${day}`,
        Recipient: customer.client_email,
        CustomerMessage: selectedTemplate?.content || `${messageType === 'email' ? 'Email' : 'Text'} for Day ${day}`,
        CustomerName: `${customer.first_name} ${customer.last_name}`,
        MessageType: messageType
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors', // Add this to handle CORS
        body: JSON.stringify(payload),
      });

      // Since we're using no-cors, we can't check response status
      // We'll assume success if no error is thrown
      console.log('Webhook sent successfully to N8N');
      return true;
    } catch (error) {
      console.error('Error sending webhook:', error);
      throw error;
    }
  };

  const onSendMessage = async (messageData: {
    customerId: number;
    messageType: 'email' | 'text';
    subject?: string;
    content: string;
    recipient: string;
  }) => {
    const messageKey = `${messageData.customerId}-${messageData.messageType}`;
    
    try {
      // Show loading state
      setSentMessages(prev => new Set([...prev, `${messageKey}-loading`]));

      // Send to webhook first
      if (selectedCustomer && selectedTemplate) {
        await sendToWebhook(selectedTemplate.day, selectedCustomer, messageData.messageType);
      }

      // Log the communication to database for inbox display
      await supabase
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

      // Remove loading state and add success state
      setSentMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(`${messageKey}-loading`);
        newSet.add(messageKey);
        return newSet;
      });

      toast({
        title: "Message sent successfully",
        description: `${messageData.messageType === 'email' ? 'Email' : 'Text'} sent to ${selectedCustomer?.first_name} ${selectedCustomer?.last_name}`,
      });

      setModalOpen(false);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove loading state
      setSentMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(`${messageKey}-loading`);
        return newSet;
      });
      
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

  // Create demo data for each day - including Trey for demo purposes
  const demoCustomers = {
    0: [
      { id: 1, first_name: 'Trey', last_name: 'Dodson', client_email: 'treydodson26@gmail.com', phone_number: '4697046880', current_day: 0, days_remaining: 30, intro_status: 'active', created_at: '2024-01-21', last_seen: '2024-01-21', tags: 'demo' },
      { id: 10, first_name: 'Sarah', last_name: 'Johnson', client_email: 'sarah@example.com', phone_number: '+1234567891', current_day: 0, days_remaining: 30, intro_status: 'active', created_at: '2024-01-21', last_seen: '2024-01-21', tags: 'new' }
    ],
    7: [
      { id: 2, first_name: 'Trey', last_name: 'Dodson', client_email: 'treydodson26@gmail.com', phone_number: '4697046880', current_day: 7, days_remaining: 23, intro_status: 'active', created_at: '2024-01-14', last_seen: '2024-01-20', tags: 'demo' },
      { id: 11, first_name: 'Mike', last_name: 'Chen', client_email: 'mike@example.com', phone_number: '+1234567892', current_day: 7, days_remaining: 23, intro_status: 'active', created_at: '2024-01-14', last_seen: '2024-01-20', tags: 'engaged' }
    ],
    10: [
      { id: 3, first_name: 'Trey', last_name: 'Dodson', client_email: 'treydodson26@gmail.com', phone_number: '4697046880', current_day: 10, days_remaining: 20, intro_status: 'active', created_at: '2024-01-11', last_seen: '2024-01-20', tags: 'demo' },
      { id: 12, first_name: 'Lisa', last_name: 'Williams', client_email: 'lisa@example.com', phone_number: '+1234567893', current_day: 10, days_remaining: 20, intro_status: 'active', created_at: '2024-01-11', last_seen: '2024-01-20', tags: 'regular' }
    ],
    14: [
      { id: 4, first_name: 'Trey', last_name: 'Dodson', client_email: 'treydodson26@gmail.com', phone_number: '4697046880', current_day: 14, days_remaining: 16, intro_status: 'active', created_at: '2024-01-07', last_seen: '2024-01-19', tags: 'demo' },
      { id: 13, first_name: 'David', last_name: 'Brown', client_email: 'david@example.com', phone_number: '+1234567894', current_day: 14, days_remaining: 16, intro_status: 'active', created_at: '2024-01-07', last_seen: '2024-01-19', tags: 'consistent' }
    ],
    28: [
      { id: 5, first_name: 'Trey', last_name: 'Dodson', client_email: 'treydodson26@gmail.com', phone_number: '4697046880', current_day: 28, days_remaining: 2, intro_status: 'active', created_at: '2023-12-24', last_seen: '2024-01-18', tags: 'demo' },
      { id: 14, first_name: 'Emily', last_name: 'Studio', client_email: 'emily@example.com', phone_number: '+1234567895', current_day: 28, days_remaining: 2, intro_status: 'active', created_at: '2023-12-24', last_seen: '2024-01-18', tags: 'convert-ready' }
    ]
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
            <Card key={sequence.id} className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-200">
              <CardHeader className={`pb-6 border-b-2 ${
                sequence.message_type === 'email' 
                  ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200' 
                  : 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl shadow-sm ${
                        sequence.message_type === 'email' 
                          ? 'bg-blue-100 border-2 border-blue-200' 
                          : 'bg-orange-100 border-2 border-orange-200'
                      }`}>
                        {getMessageTypeIcon(sequence.message_type)}
                      </div>
                      <CardTitle className="text-2xl font-bold text-gray-900">
                        Day {sequence.day}
                      </CardTitle>
                    </div>
                    {getMessageTypeBadge(sequence.message_type)}
                  </div>
                  <Badge 
                    variant="outline" 
                    className="text-sm font-semibold bg-white text-gray-700 border-gray-300 px-3 py-1"
                  >
                    {customers.length} customer{customers.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                {sequence.subject && (
                  <div className="mt-4 p-4 bg-white rounded-lg border-2 border-gray-200 shadow-sm">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Subject:</p>
                    <p className="text-base font-medium text-gray-900">{sequence.subject}</p>
                  </div>
                )}
                
                <div className="mt-3 p-3 bg-white/70 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {sequence.content.substring(0, 180)}...
                  </p>
                </div>
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

                        <div className="flex items-center gap-3">
                          {/* Only show Text button for text sequences, Email button for email sequences */}
                          {sequence.message_type === 'text' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSendMessage(customer, 'text', sequence)}
                              disabled={!customer.phone_number || sentMessages.has(`${customer.id}-text-loading`)}
                              className={`px-4 py-2 font-semibold transition-all duration-200 hover:scale-105 ${
                                sentMessages.has(`${customer.id}-text`) 
                                  ? 'bg-green-100 border-green-400 text-green-700 hover:bg-green-200' 
                                  : 'bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100 hover:border-orange-400'
                              }`}
                            >
                              {sentMessages.has(`${customer.id}-text-loading`) ? (
                                <div className="w-4 h-4 mr-2 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                              ) : sentMessages.has(`${customer.id}-text`) ? (
                                <Check className="w-4 h-4 mr-2 text-green-600" />
                              ) : (
                                <MessageSquare className="w-4 h-4 mr-2" />
                              )}
                              {sentMessages.has(`${customer.id}-text`) ? 'Sent!' : 'Send WhatsApp'}
                            </Button>
                          )}
                          
                          {sequence.message_type === 'email' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSendMessage(customer, 'email', sequence)}
                              disabled={sentMessages.has(`${customer.id}-email-loading`)}
                              className={`px-4 py-2 font-semibold transition-all duration-200 hover:scale-105 ${
                                sentMessages.has(`${customer.id}-email`) 
                                  ? 'bg-green-100 border-green-400 text-green-700 hover:bg-green-200' 
                                  : 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-400'
                              }`}
                            >
                              {sentMessages.has(`${customer.id}-email-loading`) ? (
                                <div className="w-4 h-4 mr-2 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                              ) : sentMessages.has(`${customer.id}-email`) ? (
                                <Check className="w-4 h-4 mr-2 text-green-600" />
                              ) : (
                                <Mail className="w-4 h-4 mr-2" />
                              )}
                              {sentMessages.has(`${customer.id}-email`) ? 'Sent!' : 'Send Email'}
                            </Button>
                          )}
                          
                          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
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