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
  Target,
  Mail as MailIcon
} from "lucide-react";
import FlyerGenerator from "@/components/FlyerGenerator";
import NewsletterGenerator from "@/components/NewsletterGenerator";
import CampaignManager from "@/components/CampaignManager";
import CustomerSegments from "@/components/CustomerSegments";

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-md transition-shadow border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Active Campaigns</p>
                <p className="text-3xl font-bold text-foreground">{marketingStats.activeCampaigns}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-xl">
                <Send className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Newsletters Sent</p>
                <p className="text-3xl font-bold text-foreground">8</p>
              </div>
              <div className="p-3 bg-accent/20 rounded-xl">
                <FileImage className="w-6 h-6 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Emails Sent</p>
                <p className="text-3xl font-bold text-foreground">{marketingStats.emailsSent.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded-xl">
                <Mail className="w-6 h-6 text-secondary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Engagement Rate</p>
                <p className="text-3xl font-bold text-foreground">{marketingStats.engagement}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-xl">
                <BarChart3 className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 max-w-2xl mx-auto">
          <TabsTrigger value="flyers" className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            Flyers
          </TabsTrigger>
          <TabsTrigger value="newsletters" className="flex items-center gap-2">
            <MailIcon className="w-4 h-4" />
            Newsletter
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Campaigns
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

        <TabsContent value="newsletters" className="space-y-4">
          <NewsletterGenerator />
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <CampaignManager />
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