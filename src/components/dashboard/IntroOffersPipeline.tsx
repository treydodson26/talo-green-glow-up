import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, MessageSquare, Clock, CheckCircle } from "lucide-react";
import { useIntroCustomers } from "@/hooks/useDashboard";

export const IntroOffersPipeline = () => {
  const { data: introCustomers, isLoading } = useIntroCustomers();

  const getSequenceDay = (firstClassDate: string) => {
    const startDate = new Date(firstClassDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getDaysRemaining = (introEndDate: string) => {
    const endDate = new Date(introEndDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getPhaseInfo = (sequenceDay: number) => {
    if (sequenceDay <= 2) return { phase: "Welcome Phase", color: "bg-blue-100 text-blue-800", description: "New customers need welcome messages" };
    if (sequenceDay <= 7) return { phase: "Engagement Phase", color: "bg-green-100 text-green-800", description: "Building connection and momentum" };
    if (sequenceDay <= 21) return { phase: "Momentum Phase", color: "bg-yellow-100 text-yellow-800", description: "Encouraging continued practice" };
    return { phase: "Conversion Phase", color: "bg-red-100 text-red-800", description: "Converting to membership" };
  };

  const groupedCustomers = introCustomers?.reduce((acc, customer) => {
    const sequenceDay = getSequenceDay(customer.first_class_date);
    const phase = getPhaseInfo(sequenceDay).phase;
    
    if (!acc[phase]) acc[phase] = [];
    acc[phase].push({ ...customer, sequenceDay });
    return acc;
  }, {} as Record<string, any[]>) || {};

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Intro Offers Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Intro Offers Pipeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedCustomers).map(([phase, customers]) => {
          const phaseInfo = getPhaseInfo(customers[0]?.sequenceDay || 0);
          
          return (
            <div key={phase} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={phaseInfo.color}>
                    {phase} ({customers.length})
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {phaseInfo.description}
                  </span>
                </div>
              </div>
              
              <div className="grid gap-2">
                {customers.map((customer) => {
                  const daysRemaining = getDaysRemaining(customer.intro_end_date);
                  const isUrgent = daysRemaining <= 2;
                  
                  return (
                    <div 
                      key={customer.id} 
                      className={`p-3 rounded-lg border ${isUrgent ? 'border-red-200 bg-red-50' : 'border-border bg-card'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {customer.first_name[0]}{customer.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {customer.first_name} {customer.last_name}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                Day {customer.sequenceDay}
                              </Badge>
                              {isUrgent && (
                                <Badge variant="destructive" className="text-xs">
                                  {daysRemaining} days left
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {customer.client_email} • {customer.customer_segment}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="outline" className="h-7 w-7 p-0">
                            <Mail className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 w-7 p-0">
                            <MessageSquare className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        
        {Object.keys(groupedCustomers).length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p>No active intro offers at the moment</p>
            <p className="text-sm">New customers will appear here when they start their trial</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};