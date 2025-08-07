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
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: Campaign[] = (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        status: c.status,
        subject: c.subject ?? '',
        content: c.content ?? '',
        audienceType: c.audience_type ?? 'all',
        scheduledDate: c.scheduled_for ?? undefined,
        createdAt: c.created_at,
        sentCount: c.sent_count ?? 0,
        openRate: c.open_rate ?? 0,
      }));

      setCampaigns(mapped);
    } catch (err) {
      console.error('Error loading campaigns:', err);
      toast({
        title: 'Failed to load campaigns',
        description: 'Please make sure you are logged in and RLS allows access.',
        variant: 'destructive',
      });
    }
  };

  const handleCreateCampaign = async () => {
    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        status: formData.scheduledDate ? 'scheduled' : 'draft',
        subject: formData.subject,
        content: formData.content,
        audience_type: formData.audienceType,
        scheduled_for: formData.scheduledDate ? new Date(formData.scheduledDate).toISOString() : null,
      } as const;

      if (editingCampaign) {
        const { data, error } = await supabase
          .from('campaigns')
          .update(payload)
          .eq('id', editingCampaign.id)
          .select('*')
          .maybeSingle();
        if (error) throw error;
        toast({ title: 'Campaign updated', description: `${payload.name} has been updated.` });
      } else {
        const { data, error } = await supabase
          .from('campaigns')
          .insert(payload)
          .select('*')
          .maybeSingle();
        if (error) throw error;
        toast({ title: 'Campaign created', description: `${payload.name} has been created.` });
      }

      // Refresh list
      await loadCampaigns();

      // Reset form
      setFormData({
        name: '',
        type: 'newsletter',
        subject: '',
        content: '',
        audienceType: 'all',
        scheduledDate: '',
        scheduledTime: ''
      });
      setEditingCampaign(null);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to save campaign',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId);
      if (error) throw error;
      setCampaigns(prev => prev.filter(c => c.id !== campaignId));
      toast({ title: 'Campaign deleted', description: 'Campaign has been removed' });
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({ title: 'Error', description: 'Failed to delete campaign', variant: 'destructive' });
    }
  };

  const handleSendCampaign = async (campaign: Campaign) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-campaign-email', {
        body: { campaign_id: campaign.id },
      });
      if (error) throw error;
      if (!data?.success) {
        throw new Error(data?.error || 'Send failed');
      }
      toast({
        title: 'Campaign sent',
        description: `Sent to ${data.sent} recipients${data.failed ? `, ${data.failed} failed` : ''}.`,
      });
      await loadCampaigns();
    } catch (error: any) {
      console.error('Error sending campaign:', error);
      toast({
        title: 'Failed to send campaign',
        description: error?.message || 'Unknown error',
        variant: 'destructive',
      });
    }
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
                        <Button variant="outline" size="sm" onClick={() => {
                          setEditingCampaign(campaign);
                          setFormData({
                            name: campaign.name,
                            type: campaign.type,
                            subject: campaign.subject,
                            content: campaign.content,
                            audienceType: campaign.audienceType,
                            scheduledDate: campaign.scheduledDate ? campaign.scheduledDate.split('T')[0] : '',
                            scheduledTime: ''
                          });
                          setShowCreateForm(true);
                        }}>
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        
                        {campaign.status === "draft" && (
                          <Button size="sm" onClick={() => handleSendCampaign(campaign)}>
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
            <CardTitle>{editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}</CardTitle>
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
                {editingCampaign ? 'Save Changes' : 'Create Campaign'}
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