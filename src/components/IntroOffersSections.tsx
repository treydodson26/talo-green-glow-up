import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MoreHorizontal, Calendar, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
            <Card key={sequence.id} className="animate-fade-in">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getMessageTypeIcon(sequence.message_type)}
                      <CardTitle className="text-lg">
                        Day {sequence.day} - {sequence.message_type === 'email' ? 'Email' : 'Text Message'}
                      </CardTitle>
                    </div>
                    {getMessageTypeBadge(sequence.message_type)}
                  </div>
                  <Badge variant="outline">
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
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="font-medium">
                              {customer.first_name} {customer.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {customer.client_email}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Started: {formatDate(customer.created_at)}
                            </div>
                            <div className="flex items-center gap-1">
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
                          <Button variant="outline" size="sm">
                            <Phone className="w-4 h-4 mr-1" />
                            Text
                          </Button>
                          <Button variant="outline" size="sm">
                            <Mail className="w-4 h-4 mr-1" />
                            Email
                          </Button>
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
    </div>
  );
};

export default IntroOffersSections;