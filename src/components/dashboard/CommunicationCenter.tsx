import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Mail, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useRecentCommunications, useRecentLeads } from "@/hooks/useDashboard";

export const CommunicationCenter = () => {
  const { data: communications, isLoading: commLoading } = useRecentCommunications();
  const { data: leads, isLoading: leadsLoading } = useRecentLeads();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'pending':
        return <Clock className="h-3 w-3 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-500" />;
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (commLoading || leadsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Communication Center</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const urgentLeads = leads?.filter(lead => 
    lead.status === 'follow_up_needed' || 
    (lead.status === 'new' && !lead.last_contact_date)
  ) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Communication Center
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Urgent Follow-ups */}
        {urgentLeads.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Urgent Follow-ups</h4>
              <Badge variant="destructive" className="text-xs">
                {urgentLeads.length} pending
              </Badge>
            </div>
            {urgentLeads.slice(0, 3).map((lead) => (
              <div key={lead.id} className="p-2 rounded border border-red-200 bg-red-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">
                      {lead.first_name} {lead.last_name}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {lead.status === 'new' ? 'Never contacted' : `${lead.follow_up_count} follow-ups`}
                    </Badge>
                  </div>
                  <Button size="sm" variant="destructive" className="h-6 text-xs">
                    Contact Now
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Communications */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Recent Messages</h4>
          {communications && communications.length > 0 ? (
            communications.slice(0, 5).map((comm: any) => (
              <div key={comm.id} className="p-2 rounded border bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {comm.message_type === 'email' ? (
                      <Mail className="h-4 w-4 text-blue-500" />
                    ) : (
                      <MessageSquare className="h-4 w-4 text-green-500" />
                    )}
                    <span className="text-sm">
                      {comm.direction === 'outbound' ? 'To' : 'From'} {comm.customers?.first_name} {comm.customers?.last_name}
                    </span>
                    {getStatusIcon(comm.status)}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {comm.sent_at ? formatTime(comm.sent_at) : 'Pending'}
                  </span>
                </div>
                {comm.subject && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {comm.subject}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">No recent communications</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="pt-2 border-t space-y-2">
          <h4 className="font-medium text-sm">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="justify-start">
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              <MessageSquare className="h-4 w-4 mr-2" />
              Send WhatsApp
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};