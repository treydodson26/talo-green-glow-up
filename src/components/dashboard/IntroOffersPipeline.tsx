import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, MessageSquare, Clock, CheckCircle, AlertTriangle, TrendingUp, Calendar } from "lucide-react";
import { useIntroCustomers } from "@/hooks/useDashboard";
import React from "react";

export const IntroOffersPipeline = () => {
  const { data: introCustomers, isLoading } = useIntroCustomers();

  // Calculate days since first class
  const getDaysSinceFirstClass = (firstClassDate: string) => {
    if (!firstClassDate) return 0;
    const startDate = new Date(firstClassDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Calculate days since last visit (mock data for now)
  const getDaysSinceLastVisit = (lastSeenDate: string) => {
    if (!lastSeenDate) return 0;
    const lastSeen = new Date(lastSeenDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastSeen.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Emily's business logic for status determination
  const getCustomerStatus = (customer: any) => {
    const daysSinceFirst = getDaysSinceFirstClass(customer.first_class_date);
    const daysSinceLastVisit = getDaysSinceLastVisit(customer.last_seen);
    const totalClasses = 2; // Mock data for now - we'll need to add this field
    const classesPerWeek = totalClasses / Math.max(1, Math.floor(daysSinceFirst / 7));

    // Red Alert: Day 25+ without conversion OR 7+ days since last visit OR only 1-2 classes total
    if (daysSinceFirst >= 25 || daysSinceLastVisit >= 7 || totalClasses <= 2) {
      return {
        status: 'at-risk',
        color: 'destructive',
        bgClass: 'border-destructive/50 bg-destructive/5',
        priority: 1,
        reason: daysSinceFirst >= 25 ? 'Day 25+ - needs conversion talk' :
                daysSinceLastVisit >= 7 ? `${daysSinceLastVisit} days since last visit` :
                'Only attended 1-2 classes'
      };
    }

    // High Priority: Haven't returned in 5+ days (especially after 1-2 classes)
    if (daysSinceLastVisit >= 5) {
      return {
        status: 'needs-attention',
        color: 'secondary',
        bgClass: 'border-accent/30 bg-accent/10',
        priority: 2,
        reason: `${daysSinceLastVisit} days since last visit`
      };
    }

    // Medium: Regular attendance but day 15+ (conversion conversation time)
    if (daysSinceFirst >= 15 && classesPerWeek >= 1.5) {
      return {
        status: 'conversion-ready',
        color: 'default',
        bgClass: 'border-primary/30 bg-primary/10',
        priority: 3,
        reason: 'Ready for conversion conversation'
      };
    }

    // On Track: 2+ classes/week, asking questions, engaging
    return {
      status: 'on-track',
      color: 'default',
      bgClass: 'border-secondary/30 bg-secondary/10',
      priority: 4,
      reason: 'Coming regularly'
    };
  };

  // Emily's action prioritization
  const getPriorityAction = (customer: any, status: any) => {
    const daysSinceFirst = getDaysSinceFirstClass(customer.first_class_date);
    
    if (status.priority === 1) {
      if (daysSinceFirst >= 25) return "Schedule conversion call";
      if (status.reason.includes('days since')) return "Immediate check-in call";
      return "Re-engagement sequence";
    }
    
    if (status.priority === 2) {
      return "Follow-up text/email";
    }
    
    if (status.priority === 3) {
      return "Membership conversation";
    }
    
    return "Continue nurturing";
  };

  // Sort customers by priority and urgency
  const sortedCustomers = introCustomers?.map(customer => {
    const status = getCustomerStatus(customer);
    const daysSinceFirst = getDaysSinceFirstClass(customer.first_class_date);
    return {
      ...customer,
      status,
      daysSinceFirst,
      action: getPriorityAction(customer, status)
    };
  }).sort((a, b) => {
    // Sort by priority (1=highest), then by days since first class
    if (a.status.priority !== b.status.priority) {
      return a.status.priority - b.status.priority;
    }
    return b.daysSinceFirst - a.daysSinceFirst;
  }) || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Intro Pipeline - Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group by priority for display
  const priorityGroups = {
    'Red Alert': sortedCustomers.filter(c => c.status.priority === 1),
    'High Priority': sortedCustomers.filter(c => c.status.priority === 2),
    'Medium Priority': sortedCustomers.filter(c => c.status.priority === 3),
    'On Track': sortedCustomers.filter(c => c.status.priority === 4)
  };

  return (
    <Card className="talo-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Intro Pipeline Dashboard
          </CardTitle>
          <Badge variant="outline">
            {sortedCustomers.length} active intro students
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(priorityGroups).map(([groupName, customers]) => {
          if (customers.length === 0) return null;
          
          const groupIcon = groupName === 'Red Alert' ? AlertTriangle : 
                           groupName === 'High Priority' ? Clock :
                           groupName === 'Medium Priority' ? Calendar : CheckCircle;

          return (
            <div key={groupName} className="space-y-3">
              <div className="flex items-center gap-2">
                {React.createElement(groupIcon, { 
                  className: `h-4 w-4 ${
                    groupName === 'Red Alert' ? 'text-destructive' :
                    groupName === 'High Priority' ? 'text-accent' :
                    groupName === 'Medium Priority' ? 'text-primary' : 'text-secondary'
                  }` 
                })}
                <h3 className="font-medium text-sm">
                  {groupName} ({customers.length})
                </h3>
              </div>
              
              <div className="space-y-2">
                {customers.map((customer) => (
                  <div 
                    key={customer.id} 
                    className={`p-4 rounded-lg border transition-colors ${customer.status.bgClass}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="text-sm font-medium">
                            {customer.first_name?.[0] || 'N'}{customer.last_name?.[0] || 'A'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {customer.first_name} {customer.last_name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              Day {customer.daysSinceFirst}
                            </Badge>
                            <Badge 
                              variant={customer.status.color as any}
                              className="text-xs"
                            >
                              {customer.status.reason}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mb-1">
                            {customer.client_email} • Classes: 2
                          </div>
                          <div className="text-sm font-medium text-primary">
                            Action: {customer.action}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Mail className="h-4 w-4 mr-1" />
                          Email
                        </Button>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Text
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        
        {sortedCustomers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-medium mb-2">All caught up!</h3>
            <p>No active intro offers at the moment.</p>
            <p className="text-sm">New students will appear here when they start their trial.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};