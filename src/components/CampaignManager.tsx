import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Send, 
  Calendar, 
  Users, 
  Plus, 
  Edit,
  Play,
  Pause,
  Trash2,
  Mail,
  Clock,
  Target
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: 'draft' | 'scheduled' | 'active' | 'completed';
  subject: string;
  content: string;
  audienceType: string;
  scheduledDate?: string;
  createdAt: string;
  sentCount?: number;
  openRate?: number;
}

const CampaignManager = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "newsletter",
    subject: "",
    content: "",
    audienceType: "all",
    scheduledDate: "",
    scheduledTime: ""
  });

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    // For now, use mock data. In production, this would fetch from Supabase
    const mockCampaigns: Campaign[] = [
      {
        id: "1",
        name: "Back to School Special",
        type: "promotion",
        status: "active",
        subject: "Get Ready for Fall with 30% Off New Student Packages!",
        content: "Welcome back to routine! Start your yoga journey this fall with our special intro package...",
        audienceType: "prospects",
        scheduledDate: "2024-08-15",
        createdAt: "2024-08-10",
        sentCount: 245,
        openRate: 28.5
      },
      {
        id: "2", 
        name: "Monthly Newsletter - August",
        type: "newsletter",
        status: "completed",
        subject: "Tallow Yoga August Newsletter",
        content: "This month we're excited to share updates about our new classes, teacher spotlights...",
        audienceType: "all",
        scheduledDate: "2024-08-01",
        createdAt: "2024-07-28",
        sentCount: 892,
        openRate: 31.2
      },
      {
        id: "3",
        name: "Re-engagement Campaign",
        type: "reengagement", 
        status: "draft",
        subject: "We Miss You at Tallow Yoga!",
        content: "It's been a while since we've seen you on the mat. We'd love to welcome you back...",
        audienceType: "inactive",
        createdAt: "2024-08-12"
      }
    ];
    
    setCampaigns(mockCampaigns);
  };

  const handleCreateCampaign = async () => {
    try {
      const newCampaign: Campaign = {
        id: crypto.randomUUID(),
        name: formData.name,
        type: formData.type,
        status: formData.scheduledDate ? 'scheduled' : 'draft',
        subject: formData.subject,
        content: formData.content,
        audienceType: formData.audienceType,
        scheduledDate: formData.scheduledDate,
        createdAt: new Date().toISOString()
      };

      setCampaigns(prev => [newCampaign, ...prev]);
      
      // Reset form
      setFormData({
        name: "",
        type: "newsletter",
        subject: "",
        content: "",
        audienceType: "all",
        scheduledDate: "",
        scheduledTime: ""
      });
      
      setShowCreateForm(false);

      toast({
        title: "Campaign created",
        description: `${newCampaign.name} has been created successfully`,
      });

    } catch (error) {
      console.error("Error creating campaign:", error);
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCampaign = (campaignId: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== campaignId));
    toast({
      title: "Campaign deleted",
      description: "Campaign has been removed",
    });
  };

  const getStatusBadge = (status: Campaign['status']) => {
    const config = {
      draft: { variant: 'outline' as const, color: 'text-gray-600' },
      scheduled: { variant: 'secondary' as const, color: 'text-blue-600' },
      active: { variant: 'default' as const, color: 'text-green-600' },
      completed: { variant: 'outline' as const, color: 'text-purple-600' }
    };
    
    const { variant, color } = config[status];
    
    return (
      <Badge variant={variant} className={color}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getAudienceLabel = (audienceType: string) => {
    const labels = {
      all: "All Customers",
      active: "Active Members", 
      inactive: "Inactive/Dead List",
      prospects: "Prospects",
      intro: "Intro Offer Students"
    };
    return labels[audienceType as keyof typeof labels] || audienceType;
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    if (activeTab === "active") return ["active", "scheduled"].includes(campaign.status);
    if (activeTab === "completed") return campaign.status === "completed";
    if (activeTab === "drafts") return campaign.status === "draft";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Campaign Management</h2>
          <p className="text-muted-foreground">Create and manage your marketing campaigns</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Campaign Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Active & Scheduled</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredCampaigns.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Send className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No campaigns found</h3>
                <p className="text-muted-foreground">
                  {activeTab === "active" && "No active or scheduled campaigns"}
                  {activeTab === "drafts" && "No draft campaigns"}
                  {activeTab === "completed" && "No completed campaigns"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredCampaigns.map((campaign) => (
                <Card key={campaign.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{campaign.name}</h3>
                          {getStatusBadge(campaign.status)}
                          <Badge variant="outline">
                            {campaign.type}
                          </Badge>
                        </div>
                        
                        <p className="font-medium text-sm">{campaign.subject}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {campaign.content}
                        </p>
                        
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            {getAudienceLabel(campaign.audienceType)}
                          </div>
                          
                          {campaign.scheduledDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(campaign.scheduledDate).toLocaleDateString()}
                            </div>
                          )}
                          
                          {campaign.sentCount && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              {campaign.sentCount} sent
                            </div>
                          )}
                          
                          {campaign.openRate && (
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {campaign.openRate}% opened
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        
                        {campaign.status === "draft" && (
                          <Button size="sm">
                            <Send className="w-4 h-4 mr-1" />
                            Send
                          </Button>
                        )}
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteCampaign(campaign.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Campaign Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Campaign</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Campaign Name</Label>
                <Input
                  placeholder="e.g., Fall Back to School Special"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Campaign Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newsletter">Newsletter</SelectItem>
                    <SelectItem value="promotion">Promotion</SelectItem>
                    <SelectItem value="reengagement">Re-engagement</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email Subject</Label>
              <Input
                placeholder="Enter email subject line"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Campaign Content</Label>
              <Textarea
                placeholder="Write your email content here..."
                rows={6}
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select value={formData.audienceType} onValueChange={(value) => setFormData(prev => ({ ...prev, audienceType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    <SelectItem value="active">Active Members</SelectItem>
                    <SelectItem value="inactive">Inactive/Dead List</SelectItem>
                    <SelectItem value="prospects">Prospects</SelectItem>
                    <SelectItem value="intro">Intro Offer Students</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Schedule Date (Optional)</Label>
                <Input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleCreateCampaign}>
                Create Campaign
              </Button>
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

export default CampaignManager;