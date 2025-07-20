import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock, Users, Phone, MessageSquare } from "lucide-react";
import { useIntroCustomers, useTodaysClasses, useRecentLeads } from "@/hooks/useDashboard";

export const UrgentActions = () => {
  const { data: introCustomers } = useIntroCustomers();
  const { data: todaysClasses } = useTodaysClasses();
  const { data: recentLeads } = useRecentLeads();

  // Calculate important items (not urgent)
  const expiringToday = introCustomers?.filter(customer => {
    const endDate = new Date(customer.intro_end_date);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return endDate <= tomorrow;
  }) || [];

  const needsSubstitute = todaysClasses?.filter(cls => cls.needs_substitute) || [];
  
  const uncontactedLeads = recentLeads?.filter(lead => 
    lead.status === 'new' && !lead.last_contact_date
  ) || [];

  const actionItems = [
    ...expiringToday.map(customer => ({
      type: 'expiring',
      title: 'Intro Offer Ending',
      message: `${customer.first_name} ${customer.last_name}'s intro expires tomorrow`,
      action: 'Send follow-up',
      icon: Clock,
      priority: 'high' as const,
      color: 'amber'
    })),
    ...needsSubstitute.map(cls => ({
      type: 'substitute',
      title: 'Coverage Needed',
      message: `${cls.class_time} ${cls.class_name} needs an instructor`,
      action: 'Find substitute',
      icon: Users,
      priority: 'high' as const,
      color: 'orange'
    })),
    ...uncontactedLeads.map(lead => ({
      type: 'contact',
      title: 'New Lead Follow-up',
      message: `${lead.first_name} ${lead.last_name} is waiting for contact`,
      action: 'Reach out',
      icon: Phone,
      priority: 'medium' as const,
      color: 'blue'
    }))
  ];

  if (actionItems.length === 0) {
    return (
      <Card className="border-green-200/50 bg-gradient-to-r from-green-50/50 via-green-50/30 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-green-900">All caught up!</h3>
              <p className="text-green-700 text-sm">No immediate actions needed right now.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
      {actionItems.map((item, index) => (
        <Card key={index} className="border-l-4 border-l-primary/30 hover:border-l-primary/60 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 bg-primary/10 rounded-full mt-0.5">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-foreground text-sm">{item.title}</h4>
                    <Badge 
                      variant={item.priority === 'high' ? 'default' : 'secondary'} 
                      className="text-xs px-2 py-0"
                    >
                      {item.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.message}
                  </p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                className="flex items-center gap-1 bg-primary/5 hover:bg-primary/10 border-primary/20 hover:border-primary/30 text-primary hover:text-primary shrink-0"
              >
                <MessageSquare className="h-3 w-3" />
                {item.action}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};