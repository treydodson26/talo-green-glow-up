import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Phone, MessageSquare } from "lucide-react";
import { useIntroCustomers, useTodaysClasses, useRecentLeads } from "@/hooks/useDashboard";

export const UrgentActions = () => {
  const { data: introCustomers } = useIntroCustomers();
  const { data: todaysClasses } = useTodaysClasses();
  const { data: recentLeads } = useRecentLeads();

  // Calculate urgent items
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

  const urgentItems = [
    ...expiringToday.map(customer => ({
      type: 'expiring',
      message: `${customer.first_name} ${customer.last_name}'s intro expires tomorrow`,
      action: 'Send conversion message',
      icon: Clock,
      variant: 'destructive' as const
    })),
    ...needsSubstitute.map(cls => ({
      type: 'substitute',
      message: `${cls.class_time} ${cls.class_name} needs substitute`,
      action: 'Find coverage',
      icon: AlertTriangle,
      variant: 'destructive' as const
    })),
    ...uncontactedLeads.map(lead => ({
      type: 'contact',
      message: `${lead.first_name} ${lead.last_name} hasn't been contacted`,
      action: 'Call now',
      icon: Phone,
      variant: 'default' as const
    }))
  ];

  if (urgentItems.length === 0) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <AlertTriangle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Great work! No urgent actions needed right now.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      {urgentItems.map((item, index) => (
        <Alert key={index} className={`border-red-200 bg-red-50 ${item.variant === 'destructive' ? 'border-red-300' : 'border-yellow-300'}`}>
          <item.icon className={`h-4 w-4 ${item.variant === 'destructive' ? 'text-red-600' : 'text-yellow-600'}`} />
          <AlertDescription className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={item.variant === 'destructive' ? 'text-red-800' : 'text-yellow-800'}>
                {item.message}
              </span>
              <Badge variant={item.variant} className="text-xs">
                URGENT
              </Badge>
            </div>
            <Button 
              size="sm" 
              variant={item.variant} 
              className="ml-4 flex items-center gap-1"
            >
              <MessageSquare className="h-3 w-3" />
              {item.action}
            </Button>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};