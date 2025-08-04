import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Mail, 
  Target, 
  UserPlus,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Download,
  Upload,
  Settings
} from "lucide-react";
import { useCustomerSegments, useSegmentAnalytics, useEmailQueue } from "@/hooks/useLeadManagement";
import { SegmentManager } from "./SegmentManager";
import { EmailTemplateEditor } from "./EmailTemplateEditor";
import CSVImportDialog from "../CSVImportDialog";

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
      return 'Prospects';
    case 'drop_in':
      return 'Drop-in Customers';
    case 'intro_offer':
      return 'Intro Offer Students';
    default:
      return segmentType;
  }
};

export const LeadManagementHub = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showCSVImport, setShowCSVImport] = useState(false);
  
  const { data: segments, isLoading: segmentsLoading } = useCustomerSegments();
  const { data: analytics, isLoading: analyticsLoading } = useSegmentAnalytics();
  const { data: emailQueue, isLoading: queueLoading } = useEmailQueue();

  const segmentCounts = analytics?.reduce((acc, item) => {
    acc[item.segment_type] = item.total_customers;
    return acc;
  }, {} as Record<string, number>) || {};

  const totalCustomers = Object.values(segmentCounts).reduce((sum, count) => sum + count, 0);
  const totalEmailsSent = analytics?.reduce((sum, item) => sum + item.emails_sent, 0) || 0;
  const pendingEmails = emailQueue?.filter(email => email.status === 'pending').length || 0;

  if (segmentsLoading || analyticsLoading) {
    return (
      <div className="p-8">
        <div className="space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-16 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lead Management Hub</h1>
          <p className="text-muted-foreground mt-2">
            Manage customer segments and automated email workflows
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowCSVImport(true)}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover-scale">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{totalCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Emails Sent (30d)</p>
                <p className="text-2xl font-bold">{totalEmailsSent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Emails</p>
                <p className="text-2xl font-bold">{pendingEmails}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">
                  {totalCustomers > 0 ? ((segmentCounts.intro_offer || 0) / totalCustomers * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segment Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {analytics?.map((segment) => {
          const Icon = getSegmentIcon(segment.segment_type);
          return (
            <Card key={segment.segment_type} className="hover-scale">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <Icon className="w-5 h-5" />
                  {formatSegmentName(segment.segment_type)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Customers</span>
                    <Badge className={getSegmentColor(segment.segment_type)}>
                      {segment.total_customers}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Emails Sent</span>
                    <span className="text-sm font-medium">{segment.emails_sent}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Open Rate</span>
                    <span className="text-sm font-medium">
                      {segment.emails_sent > 0 
                        ? ((segment.emails_opened / segment.emails_sent) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Tabs */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="segments">Manage Segments</TabsTrigger>
              <TabsTrigger value="templates">Email Templates</TabsTrigger>
              <TabsTrigger value="queue">Email Queue</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Customer Distribution</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Recent Segment Assignments
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {segments?.slice(0, 5).map((segment) => (
                        <div key={segment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium">
                              {segment.customers?.first_name} {segment.customers?.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {segment.customers?.client_email}
                            </p>
                          </div>
                          <Badge className={getSegmentColor(segment.segment_type)}>
                            {formatSegmentName(segment.segment_type)}
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Email Queue Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Email Queue Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {queueLoading ? (
                        <div className="text-center py-4">Loading...</div>
                      ) : emailQueue?.slice(0, 5).map((email) => (
                        <div key={email.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium">{email.email_templates?.template_name}</p>
                            <p className="text-sm text-muted-foreground">
                              To: {email.customers?.first_name} {email.customers?.last_name}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {email.status === 'pending' && (
                              <Badge variant="outline" className="text-orange-600">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                            {email.status === 'sent' && (
                              <Badge variant="outline" className="text-green-600">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Sent
                              </Badge>
                            )}
                            {email.status === 'failed' && (
                              <Badge variant="outline" className="text-red-600">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Failed
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="segments" className="mt-6">
              <SegmentManager />
            </TabsContent>

            <TabsContent value="templates" className="mt-6">
              <EmailTemplateEditor />
            </TabsContent>

            <TabsContent value="queue" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Email Queue</h3>
                <div className="space-y-3">
                  {emailQueue?.map((email) => (
                    <Card key={email.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{email.email_templates?.subject}</p>
                            <p className="text-sm text-muted-foreground">
                              To: {email.customers?.client_email} • 
                              Scheduled: {new Date(email.scheduled_for).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getSegmentColor(email.segment_type)}>
                              {formatSegmentName(email.segment_type)}
                            </Badge>
                            {email.status === 'pending' && (
                              <Badge variant="outline" className="text-orange-600">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                            {email.status === 'sent' && (
                              <Badge variant="outline" className="text-green-600">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Sent
                              </Badge>
                            )}
                            {email.status === 'failed' && (
                              <Badge variant="outline" className="text-red-600">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Failed
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* CSV Import Dialog */}
      <CSVImportDialog 
        isOpen={showCSVImport} 
        onClose={() => setShowCSVImport(false)}
        onImportComplete={() => {
          setShowCSVImport(false);
          // Refresh data after import
        }}
      />
    </div>
  );
};