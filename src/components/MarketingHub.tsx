import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Image, 
  Mail, 
  Calendar, 
  Users, 
  BarChart3, 
  FileImage,
  Send,
  Clock,
  Target
} from "lucide-react";
import FlyerGenerator from "@/components/FlyerGenerator";
import CampaignManager from "@/components/CampaignManager";
import CustomerSegments from "@/components/CustomerSegments";
import WhatsAppMessaging from "@/components/WhatsAppMessaging";

const MarketingHub = () => {
  const [activeTab, setActiveTab] = useState("flyers");

  // Mock data for overview cards
  const marketingStats = {
    activeCampaigns: 3,
    totalFlyers: 12,
    emailsSent: 847,
    engagement: "23%"
  };

  return (
    <div className="flex-1 p-6 bg-background">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Marketing Hub</h1>
        <p className="text-muted-foreground mt-2">
          Create flyers, manage campaigns, and engage your customers
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Send className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Campaigns</p>
                <p className="text-2xl font-semibold">{marketingStats.activeCampaigns}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <FileImage className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Flyers Created</p>
                <p className="text-2xl font-semibold">{marketingStats.totalFlyers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Mail className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Emails Sent</p>
                <p className="text-2xl font-semibold">{marketingStats.emailsSent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <BarChart3 className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Engagement Rate</p>
                <p className="text-2xl font-semibold">{marketingStats.engagement}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="flyers" className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            Flyer Generator
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="segments" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Audience
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flyers" className="space-y-4">
          <FlyerGenerator />
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <CampaignManager />
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-4">
          <WhatsAppMessaging />
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <CustomerSegments />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Marketing Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground">Analytics Dashboard</h3>
                <p className="text-muted-foreground">
                  Campaign performance metrics and insights coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketingHub;