import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Phone, Search, Clock, User, MessageSquare, Filter, ArrowUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CommunicationItem {
  id: number;
  customer_id: number;
  message_type: 'email' | 'text';
  content: string;
  subject?: string;
  recipient_email?: string;
  recipient_phone?: string;
  delivery_status: string;
  sent_at: string;
  delivered_at?: string;
  read_at?: string;
  error_message?: string;
  // Customer details (from join)
  customer_name?: string;
  customer_email?: string;
}

const InboxPage = () => {
  const [communications, setCommunications] = useState<CommunicationItem[]>([]);
  const [filteredCommunications, setFilteredCommunications] = useState<CommunicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { toast } = useToast();

  useEffect(() => {
    loadCommunications();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('communications_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'communications_log'
        },
        (payload) => {
          console.log('New communication received:', payload);
          // Immediately reload data when new communication is added
          loadCommunications();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'communications_log'
        },
        (payload) => {
          console.log('Communication updated:', payload);
          loadCommunications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterCommunications();
  }, [communications, searchTerm, activeTab, sortOrder]);

  const loadCommunications = async () => {
    try {
      setLoading(true);
      
      // First try to join with customers table, but handle case where customer doesn't exist
      const { data, error } = await supabase
        .from('communications_log')
        .select(`
          *,
          customers (
            first_name,
            last_name,
            client_email
          )
        `)
        .order('sent_at', { ascending: false });

      if (error) throw error;

      console.log('Raw communications data:', data);

      // Transform the data to flatten customer info, with fallbacks
      const transformedData = data?.map((item: any) => {
        // Handle case where customer relationship doesn't exist
        const customerData = item.customers || {};
        const customerName = customerData.first_name && customerData.last_name 
          ? `${customerData.first_name} ${customerData.last_name}`
          : `Customer ${item.customer_id}`;
        
        return {
          ...item,
          message_type: item.message_type as 'email' | 'text',
          customer_name: customerName,
          customer_email: customerData.client_email || item.recipient_email || 'Unknown'
        };
      }) || [];

      console.log('Transformed communications data:', transformedData);
      setCommunications(transformedData as CommunicationItem[]);
    } catch (error) {
      console.error('Error loading communications:', error);
      toast({
        title: "Error",
        description: "Failed to load communications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterCommunications = () => {
    let filtered = [...communications];

    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(comm => comm.message_type === activeTab);
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(comm => 
        comm.customer_name?.toLowerCase().includes(searchLower) ||
        comm.content.toLowerCase().includes(searchLower) ||
        comm.subject?.toLowerCase().includes(searchLower) ||
        comm.customer_email?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.sent_at).getTime();
      const dateB = new Date(b.sent_at).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    setFilteredCommunications(filtered);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 168) { // Within a week
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'sent': { variant: 'default' as const, color: 'text-blue-600' },
      'delivered': { variant: 'secondary' as const, color: 'text-green-600' },
      'read': { variant: 'outline' as const, color: 'text-purple-600' },
      'failed': { variant: 'destructive' as const, color: 'text-red-600' },
      'pending': { variant: 'outline' as const, color: 'text-yellow-600' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.sent;
    
    return (
      <Badge variant={config.variant} className="text-white">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getMessageTypeIcon = (messageType: string) => {
    return messageType === 'email' ? 
      <Mail className="w-4 h-4 text-blue-600" /> : 
      <Phone className="w-4 h-4 text-green-600" />;
  };

  const getTotalCounts = () => {
    const total = communications.length;
    const emails = communications.filter(c => c.message_type === 'email').length;
    const texts = communications.filter(c => c.message_type === 'text').length;
    return { total, emails, texts };
  };

  const counts = getTotalCounts();

  if (loading) {
    return (
      <div className="flex-1 p-6 bg-background">
        <div className="text-center py-8">Loading communications...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 bg-background">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Communications Inbox</h1>
        <p className="text-muted-foreground mt-2">
          Centralized view of all customer communications
        </p>
      </div>

      {/* Search and Controls */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search communications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
        >
          <ArrowUpDown className="w-4 h-4 mr-2" />
          {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            <MessageSquare className="w-4 h-4 mr-2" />
            All ({counts.total})
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="w-4 h-4 mr-2" />
            Emails ({counts.emails})
          </TabsTrigger>
          <TabsTrigger value="text">
            <Phone className="w-4 h-4 mr-2" />
            Texts ({counts.texts})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredCommunications.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No communications found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search terms' : 'Start sending messages to see them here'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCommunications.map((comm) => (
                <Card key={comm.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex-shrink-0 mt-1">
                          {getMessageTypeIcon(comm.message_type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">
                              {comm.customer_name}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {comm.message_type === 'email' ? 'Email' : 'Text'}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {comm.message_type === 'email' ? comm.customer_email : comm.recipient_phone}
                          </p>
                          
                          {comm.subject && (
                            <p className="font-medium text-sm text-foreground mb-1">
                              {comm.subject}
                            </p>
                          )}
                          
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {comm.content}
                          </p>
                          
                          {comm.error_message && (
                            <p className="text-sm text-destructive mt-1">
                              Error: {comm.error_message}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 ml-4">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDate(comm.sent_at)}
                        </div>
                        {getStatusBadge(comm.delivery_status)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InboxPage;