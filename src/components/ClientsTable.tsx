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
import { Search, Filter, MoreHorizontal, Plus, ChevronDown, Phone, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

  return (
    <div className="flex-1 p-6 bg-background">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Clients</h1>
          <p className="text-muted-foreground">
            Client information may be delayed by up to one hour when using segments
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
              <DropdownMenuItem>Export</DropdownMenuItem>
              <DropdownMenuItem>Import</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            className="bg-primary hover:bg-primary/90 gap-2"
            onClick={() => console.log("Add new client clicked")}
          >
            <Plus className="h-4 w-4" />
            Add new
          </Button>
        </div>
      </div>

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
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Intro Offer Summary - Only show when viewing Intro Offer filter */}
      {activeFilter === "Intro Offer" && totalIntroOfferCount > 0 && !loading && (
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

      {/* Table */}
      {!loading && (
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
                          <Button variant="ghost" size="icon" title="Call customer">
                            <Phone className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" title="Email customer">
                          <Mail className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Delete</DropdownMenuItem>
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
    </div>
  );
};

export default ClientsTable;