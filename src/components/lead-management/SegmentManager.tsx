import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  UserPlus, 
  Target, 
  Edit,
  Trash2,
  Mail,
  Search,
  Filter
} from "lucide-react";
import { useCustomerSegments, useAssignSegment, useProcessCustomers } from "@/hooks/useLeadManagement";

const getSegmentColor = (segmentType: string) => {
  switch (segmentType) {
    case 'prospect':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
    case 'drop_in':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
    case 'intro_offer':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
  }
};

const getSegmentIcon = (segmentType: string) => {
  switch (segmentType) {
    case 'prospect':
      return Target;
    case 'drop_in':
      return UserPlus;
    case 'intro_offer':
      return Users;
    default:
      return Users;
  }
};

const formatSegmentName = (segmentType: string) => {
  switch (segmentType) {
    case 'prospect':
      return 'Prospect';
    case 'drop_in':
      return 'Drop-in Customer';
    case 'intro_offer':
      return 'Intro Offer Student';
    default:
      return segmentType;
  }
};

export const SegmentManager = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSegment, setSelectedSegment] = useState<string>("all");
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [newSegmentType, setNewSegmentType] = useState<'prospect' | 'drop_in' | 'intro_offer'>('prospect');
  const [newTotalSpend, setNewTotalSpend] = useState<string>("0");
  const [newNotes, setNewNotes] = useState("");

  const { data: segments, isLoading } = useCustomerSegments();
  const { mutate: assignSegment, isPending: isAssigning } = useAssignSegment();
  const { mutate: processCustomers, isPending: isProcessing } = useProcessCustomers();

  const filteredSegments = segments?.filter(segment => {
    const matchesSearch = 
      segment.customers?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      segment.customers?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      segment.customers?.client_email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSegment = selectedSegment === "all" || segment.segment_type === selectedSegment;
    
    return matchesSearch && matchesSegment;
  });

  const handleEditCustomer = (segment: any) => {
    setEditingCustomer(segment);
    setNewSegmentType(segment.segment_type);
    setNewTotalSpend(segment.total_spend?.toString() || "0");
    setNewNotes(segment.notes || "");
  };

  const handleSaveChanges = () => {
    if (!editingCustomer) return;

    assignSegment({
      customerId: editingCustomer.customer_id,
      segmentType: newSegmentType,
      totalSpend: parseFloat(newTotalSpend) || 0,
      notes: newNotes,
    });

    setEditingCustomer(null);
    resetForm();
  };

  const resetForm = () => {
    setNewSegmentType('prospect');
    setNewTotalSpend("0");
    setNewNotes("");
  };

  const handleBulkProcess = () => {
    const customerIds = segments?.map(s => s.customer_id) || [];
    processCustomers(customerIds);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Customer Segments</h3>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleBulkProcess}
            disabled={isProcessing}
            variant="outline"
          >
            {isProcessing ? "Processing..." : "Auto-Assign All"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedSegment} onValueChange={setSelectedSegment}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by segment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Segments</SelectItem>
            <SelectItem value="prospect">Prospects</SelectItem>
            <SelectItem value="drop_in">Drop-in Customers</SelectItem>
            <SelectItem value="intro_offer">Intro Offer Students</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Customer List */}
      <div className="space-y-3">
        {filteredSegments?.map((segment) => {
          const Icon = getSegmentIcon(segment.segment_type);
          return (
            <Card key={segment.id} className="hover-scale">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-full">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {segment.customers?.first_name} {segment.customers?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {segment.customers?.client_email}
                      </p>
                      {segment.notes && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Note: {segment.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <Badge className={getSegmentColor(segment.segment_type)}>
                        {formatSegmentName(segment.segment_type)}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Spend: ${segment.total_spend?.toFixed(2) || '0.00'}
                      </p>
                      {segment.manually_assigned && (
                        <p className="text-xs text-blue-600">Manual</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditCustomer(segment)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Customer Segment</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Customer</Label>
                              <p className="text-sm text-muted-foreground">
                                {segment.customers?.first_name} {segment.customers?.last_name} - {segment.customers?.client_email}
                              </p>
                            </div>
                            
                            <div>
                              <Label htmlFor="segment-type">Segment Type</Label>
                              <Select value={newSegmentType} onValueChange={(value: any) => setNewSegmentType(value)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="prospect">Prospect</SelectItem>
                                  <SelectItem value="drop_in">Drop-in Customer</SelectItem>
                                  <SelectItem value="intro_offer">Intro Offer Student</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label htmlFor="total-spend">Total Spend</Label>
                              <Input
                                id="total-spend"
                                type="number"
                                step="0.01"
                                value={newTotalSpend}
                                onChange={(e) => setNewTotalSpend(e.target.value)}
                                placeholder="0.00"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="notes">Notes</Label>
                              <Textarea
                                id="notes"
                                value={newNotes}
                                onChange={(e) => setNewNotes(e.target.value)}
                                placeholder="Add any notes about this customer..."
                                rows={3}
                              />
                            </div>
                            
                            <div className="flex items-center gap-2 pt-4">
                              <Button 
                                onClick={handleSaveChanges}
                                disabled={isAssigning}
                                className="flex-1"
                              >
                                {isAssigning ? "Saving..." : "Save Changes"}
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={() => setEditingCustomer(null)}
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button variant="ghost" size="sm">
                        <Mail className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredSegments?.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No customers found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? "No customers match your search criteria." : "No customers have been segmented yet."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};