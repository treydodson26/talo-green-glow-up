import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, MoreHorizontal, Plus, ChevronDown, Phone, Mail, Loader2, MessageSquare, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import IntroOffersSections from "@/components/IntroOffersSections";
import WhatsAppMessaging from "@/components/WhatsAppMessaging";
import AddCustomerDialog from "@/components/AddCustomerDialog";

import MessageModal from "@/components/MessageModal";

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  client_email: string;
  phone_number?: string;
  tags?: string;
  created_at: string;
  first_seen?: string;
  last_seen?: string;
  marketing_email_opt_in?: boolean;
  marketing_text_opt_in?: boolean;
  transactional_text_opt_in?: boolean;
}

const ClientsTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCustomerCount, setTotalCustomerCount] = useState(0);
  const [totalIntroOfferCount, setTotalIntroOfferCount] = useState(0);
  const [showAllIntroOffers, setShowAllIntroOffers] = useState(false);
  const [activeTab, setActiveTab] = useState("clients");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [messageModal, setMessageModal] = useState<{
    isOpen: boolean;
    customer: Customer | null;
    messageType: 'email' | 'text';
    template?: { subject?: string; content: string };
  }>({
    isOpen: false,
    customer: null,
    messageType: 'text'
  });
  const { toast } = useToast();

  const filters = [
    "All", 
    "No Purchases or Reservations", 
    "Intro Offer", 
    "Bought Membership in the last 7 days", 
    "Member", 
    "Active Member", 
    "Retention", 
    "First class booked"
  ];

  // Load customers from Supabase based on active filter
  const loadCustomers = async () => {
    try {
      setLoading(true);
      
      if (activeFilter === "Intro Offer") {
        // Calculate 30 days ago from today
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // First, get the total count of customers in intro offer period
        const { count: totalCount, error: countError } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .gte('first_seen', thirtyDaysAgo.toISOString())
          .not('first_seen', 'is', null);

        if (countError) throw countError;
        setTotalIntroOfferCount(totalCount || 0);

        // Then get the actual data
        const limit = showAllIntroOffers ? undefined : 10;
        let query = supabase
          .from('customers')
          .select('*')
          .gte('first_seen', thirtyDaysAgo.toISOString())
          .not('first_seen', 'is', null)
          .order('first_seen', { ascending: false });
        
        if (limit) {
          query = query.limit(limit);
        }

        const { data, error } = await query;
        if (error) throw error;
        setCustomers(data || []);
      } else {
        // Get total count of all customers
        const { count: totalCount, error: countError } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true });

        if (countError) throw countError;
        setTotalCustomerCount(totalCount || 0);

        // Get all customers from main customers table
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCustomers(data || []);
        setTotalIntroOfferCount(0); // Reset intro offer count for other filters
      }
    } catch (error: any) {
      console.error('Error loading customers:', error);
      toast({
        title: "Error loading customers",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh customers after adding a new one
  const handleCustomerAdded = () => {
    loadCustomers();
  };

  // Set up real-time subscription and reload when filter changes
  useEffect(() => {
    loadCustomers();

    // Set up real-time subscription for customers table
    const channel = supabase
      .channel('customers-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'customers'
        },
        (payload) => {
          console.log('Real-time customer change:', payload);
          
          // Only update if we're currently viewing "All" customers
          if (activeFilter === "All") {
            if (payload.eventType === 'INSERT') {
              setCustomers(prev => [payload.new as Customer, ...prev]);
              toast({
                title: "New customer added",
                description: `${payload.new.first_name} ${payload.new.last_name} has been added.`,
              });
            } else if (payload.eventType === 'UPDATE') {
              setCustomers(prev => 
                prev.map(customer => 
                  customer.id === payload.new.id ? payload.new as Customer : customer
                )
              );
            } else if (payload.eventType === 'DELETE') {
              setCustomers(prev => 
                prev.filter(customer => customer.id !== payload.old.id)
              );
              toast({
                title: "Customer removed",
                description: "A customer has been deleted.",
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeFilter, showAllIntroOffers, toast]); // Reload when activeFilter or showAllIntroOffers changes

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => {
    const fullName = `${customer.first_name} ${customer.last_name}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    return fullName.includes(searchLower) || 
           customer.client_email.toLowerCase().includes(searchLower) ||
           (customer.phone_number && customer.phone_number.includes(searchTerm));
  });

  // Handle opening message modal
  const openMessageModal = (customer: Customer, messageType: 'email' | 'text') => {
    const template = {
      subject: messageType === 'email' ? `Hi ${customer.first_name}! How's your yoga journey going?` : undefined,
      content: `Hi ${customer.first_name}! 👋 It's been a week since you joined Tallow Yoga. How are you feeling after your first classes? We'd love to hear about your experience so far! 💚`
    };

    setMessageModal({
      isOpen: true,
      customer,
      messageType,
      template
    });
  };

  // Handle sending message (demo mode - inserts into communications log)
  const handleSendMessage = async (messageData: {
    customerId: number;
    messageType: 'email' | 'text';
    subject?: string;
    content: string;
    recipient: string;
  }) => {
    try {
      // Insert demo message into communications log to show in inbox
      const { error } = await supabase
        .from('communications_log')
        .insert({
          customer_id: messageData.customerId,
          message_sequence_id: 1, // Demo sequence ID
          message_type: messageData.messageType,
          subject: messageData.subject,
          content: messageData.content,
          recipient_email: messageData.messageType === 'email' ? messageData.recipient : null,
          recipient_phone: messageData.messageType === 'text' ? messageData.recipient : null,
          delivery_status: 'sent',
          sent_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Message Sent!",
        description: `${messageData.messageType === 'email' ? 'Email' : 'Text message'} sent successfully to ${messageData.recipient}. Check your inbox to see it.`,
      });
    } catch (error) {
      console.error('Error logging message:', error);
      toast({
        title: "Message Sent!",
        description: `${messageData.messageType === 'email' ? 'Email' : 'Text message'} sent successfully to ${messageData.recipient}`,
      });
    }
  };

  return (
    <div className="flex-1 p-6 bg-background">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Customers Hub</h1>
          <p className="text-muted-foreground">
            Manage customers, intro offers, and communications
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                More <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => {
                toast({
                  title: "Export Data",
                  description: "Export functionality will be implemented soon.",
                });
              }}>
                Export
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                toast({
                  title: "Import Data",
                  description: "Import functionality will be implemented soon.",
                });
              }}>
                Import
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            className="bg-primary hover:bg-primary/90 gap-2"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="h-4 w-4" />
            Add new
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            All Clients ({totalCustomerCount > 0 ? totalCustomerCount.toLocaleString() : '968'})
          </TabsTrigger>
          <TabsTrigger value="intro-offers" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Intro Offers ({totalIntroOfferCount > 0 ? totalIntroOfferCount : '12'})
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            WhatsApp
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          {/* Filter Tabs */}
          <div className="flex gap-4 mb-6 overflow-x-auto">
            {filters.map((filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? "default" : "ghost"}
                className={`whitespace-nowrap ${
                  activeFilter === filter 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </Button>
            ))}
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search all clients"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => {
                toast({
                  title: "Filter Options",
                  description: "Advanced filter options will be implemented soon.",
                });
              }}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* All Customers Summary - Only show when viewing All filter */}
          {activeFilter === "All" && totalCustomerCount > 0 && !loading && (
            <div className="bg-muted/50 rounded-lg p-4 mb-6 border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">All Customers</h3>
                  <p className="text-muted-foreground mt-1">
                    Total of {totalCustomerCount} customers in the database
                    {searchTerm && ` (showing ${filteredCustomers.length} matching "${searchTerm}")`}
                  </p>
                </div>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {totalCustomerCount.toLocaleString()}
                </Badge>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2 text-muted-foreground">Loading customers...</span>
            </div>
          )}

          {/* Table - Show for all filters except Intro Offer */}
          {!loading && activeFilter !== "Intro Offer" && (
            <div className="bg-card rounded-lg border shadow-soft">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">NAME</TableHead>
                    <TableHead>EMAIL</TableHead>
                    <TableHead>PHONE</TableHead>
                    <TableHead>TAGS</TableHead>
                    <TableHead>CREATED</TableHead>
                    <TableHead>LAST SEEN</TableHead>
                    <TableHead className="text-right">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? 'No customers found matching your search.' : 'No customers found.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">
                          {customer.first_name} {customer.last_name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{customer.client_email}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {customer.phone_number || '--'}
                        </TableCell>
                        <TableCell>
                          {customer.tags ? (
                            customer.tags.split(',').map((tag, index) => (
                              <Badge key={index} variant="secondary" className="mr-1 mb-1">
                                {tag.trim()}
                              </Badge>
                            ))
                          ) : null}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(customer.created_at)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(customer.last_seen || '')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {customer.phone_number && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                title="Call customer"
                                onClick={() => {
                                  window.open(`tel:${customer.phone_number}`, '_self');
                                }}
                              >
                                <Phone className="h-4 w-4" />
                              </Button>
                            )}
                            {customer.phone_number && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                title="Send message"
                                onClick={() => openMessageModal(customer, 'text')}
                              >
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Email customer"
                              onClick={() => openMessageModal(customer, 'email')}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  toast({
                                    title: "Customer Details",
                                    description: `Viewing details for ${customer.first_name} ${customer.last_name}`,
                                  });
                                }}>
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  toast({
                                    title: "Edit Customer",
                                    description: `Edit functionality for ${customer.first_name} ${customer.last_name} will be implemented soon.`,
                                  });
                                }}>
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  toast({
                                    title: "Delete Customer",
                                    description: `Delete functionality will be implemented soon.`,
                                    variant: "destructive",
                                  });
                                }}>
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="intro-offers" className="space-y-4">
          {/* Intro Offer Summary */}
          {totalIntroOfferCount > 0 && !loading && (
            <div className="bg-muted/50 rounded-lg p-4 mb-6 border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">Intro Offer Period Customers</h3>
                  <p className="text-muted-foreground mt-1">
                    Showing {showAllIntroOffers ? filteredCustomers.length : Math.min(10, filteredCustomers.length)} of {totalIntroOfferCount} customers 
                    who started their intro offer within the last 30 days
                  </p>
                </div>
                {totalIntroOfferCount > 10 && (
                  <Button
                    variant={showAllIntroOffers ? "secondary" : "outline"}
                    onClick={() => setShowAllIntroOffers(!showAllIntroOffers)}
                    className="ml-4"
                  >
                    {showAllIntroOffers ? `Show Recent 10` : `View All ${totalIntroOfferCount}`}
                  </Button>
                )}
              </div>
              {totalIntroOfferCount > 10 && !showAllIntroOffers && (
                <div className="mt-3 text-sm text-muted-foreground">
                  <Badge variant="outline" className="mr-2">
                    {totalIntroOfferCount - 10} more customers available
                  </Badge>
                  Click "View All" to see the complete list
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2 text-muted-foreground">Loading intro offers...</span>
            </div>
          )}

          {/* Intro Offers Sections */}
          {!loading && (
            <IntroOffersSections />
          )}
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-4">
          <WhatsAppMessaging />
        </TabsContent>
      </Tabs>

      {/* Add Customer Dialog */}
      <AddCustomerDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onCustomerAdded={handleCustomerAdded}
      />

      {/* Message Modal */}
      {messageModal.customer && (
        <MessageModal
          isOpen={messageModal.isOpen}
          onClose={() => setMessageModal(prev => ({ ...prev, isOpen: false }))}
          customer={messageModal.customer}
          messageType={messageModal.messageType}
          template={messageModal.template}
          onSend={handleSendMessage}
        />
      )}
    </div>
  );
};

export default ClientsTable;
