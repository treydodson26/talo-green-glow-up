import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Mail,
  Phone,
  Search,
  Filter,
  Plus,
  Target,
  UserCheck,
  UserX,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  filterCriteria: any;
  customerCount: number;
  lastUpdated: string;
  color: string;
}

interface SegmentStats {
  totalCustomers: number;
  activeMembers: number;
  inactiveMembers: number;
  prospects: number;
  introOffers: number;
}

const CustomerSegments = () => {
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [stats, setStats] = useState<SegmentStats | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSegments();
    loadStats();
  }, []);

  const loadSegments = async () => {
    // Mock segments for now
    const mockSegments: CustomerSegment[] = [
      {
        id: "1",
        name: "Active Members",
        description: "Customers who attended classes in the last 30 days",
        filterCriteria: { lastSeen: "30days", status: "active" },
        customerCount: 156,
        lastUpdated: "2024-07-19",
        color: "bg-green-100 text-green-800"
      },
      {
        id: "2", 
        name: "Inactive/Dead List",
        description: "Members who haven't been seen in 60+ days",
        filterCriteria: { lastSeen: "60days+", status: "inactive" },
        customerCount: 89,
        lastUpdated: "2024-07-19",
        color: "bg-red-100 text-red-800"
      },
      {
        id: "3",
        name: "Intro Offer Students",
        description: "Currently in their 30-day intro period",
        filterCriteria: { status: "intro_offer" },
        customerCount: 23,
        lastUpdated: "2024-07-19", 
        color: "bg-blue-100 text-blue-800"
      },
      {
        id: "4",
        name: "High Value Members",
        description: "Attended 20+ classes in the last 3 months",
        filterCriteria: { classCount: "20+", period: "3months" },
        customerCount: 42,
        lastUpdated: "2024-07-19",
        color: "bg-purple-100 text-purple-800"
      },
      {
        id: "5",
        name: "Email Marketing Prospects", 
        description: "Opted in for marketing emails but not members yet",
        filterCriteria: { emailOptIn: true, memberStatus: "prospect" },
        customerCount: 78,
        lastUpdated: "2024-07-19",
        color: "bg-orange-100 text-orange-800"
      }
    ];
    
    setSegments(mockSegments);
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      // Get customer counts by stage from the database view
      const { data: customersByStage, error } = await supabase
        .from('customers_by_stage')
        .select('*');

      if (error) throw error;

      // Get total customer count
      const { count: totalCount, error: countError } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      // Get intro offer count
      const { count: introCount, error: introError } = await supabase
        .from('intro_offer_customers')
        .select('*', { count: 'exact', head: true });

      if (introError) throw introError;

      // Calculate stats (simplified for now)
      setStats({
        totalCustomers: totalCount || 0,
        activeMembers: 156, // Mock data - would calculate from database
        inactiveMembers: 89,
        prospects: 78,
        introOffers: introCount || 0
      });

    } catch (error) {
      console.error('Error loading stats:', error);
      // Use mock data as fallback
      setStats({
        totalCustomers: 423,
        activeMembers: 156,
        inactiveMembers: 89,
        prospects: 78,
        introOffers: 23
      });
    }
  };

  const handleCreateSegment = () => {
    setShowCreateForm(true);
  };

  const handleDeleteSegment = (segmentId: string) => {
    setSegments(prev => prev.filter(s => s.id !== segmentId));
    toast({
      title: "Segment deleted",
      description: "Customer segment has been removed",
    });
  };

  const handleCreateCampaignForSegment = (segment: CustomerSegment) => {
    toast({
      title: "Campaign creation",
      description: `Creating campaign for ${segment.name} segment`,
    });
    // Would redirect to campaign creation with pre-filled audience
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        Loading customer segments...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Customers</p>
                  <p className="text-2xl font-semibold">{stats.totalCustomers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <UserCheck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Members</p>
                  <p className="text-2xl font-semibold">{stats.activeMembers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <UserX className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Inactive</p>
                  <p className="text-2xl font-semibold">{stats.inactiveMembers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <Target className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prospects</p>
                  <p className="text-2xl font-semibold">{stats.prospects}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Intro Offers</p>
                  <p className="text-2xl font-semibold">{stats.introOffers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Segments Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Customer Segments</h2>
          <p className="text-muted-foreground">Organize customers for targeted marketing</p>
        </div>
        <Button onClick={handleCreateSegment}>
          <Plus className="w-4 h-4 mr-2" />
          New Segment
        </Button>
      </div>

      {/* Segments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {segments.map((segment) => (
          <Card key={segment.id}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{segment.name}</h3>
                      <Badge className={segment.color}>
                        {segment.customerCount} customers
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{segment.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Updated {new Date(segment.lastUpdated).toLocaleDateString()}</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>Active</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1">
                    <Mail className="w-4 h-4 mr-1" />
                    Create Campaign
                  </Button>
                  <Button size="sm" variant="outline">
                    <Users className="w-4 h-4 mr-1" />
                    View Customers
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Segment Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Segment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Segment Name</Label>
              <Input placeholder="e.g., Recent Workshop Attendees" />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input placeholder="Describe this customer segment" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Last Seen</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Last 7 days</SelectItem>
                    <SelectItem value="30days">Last 30 days</SelectItem>
                    <SelectItem value="60days">Last 60 days</SelectItem>
                    <SelectItem value="90days">Last 90 days</SelectItem>
                    <SelectItem value="never">Never attended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Marketing Preferences</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email-opt-in">Email opt-in</SelectItem>
                    <SelectItem value="text-opt-in">Text opt-in</SelectItem>
                    <SelectItem value="both">Both email & text</SelectItem>
                    <SelectItem value="none">No preferences</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button>Create Segment</Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerSegments;