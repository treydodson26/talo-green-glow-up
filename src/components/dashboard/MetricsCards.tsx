import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, Calendar, DollarSign, UserPlus } from "lucide-react";
import { useDashboardMetrics } from "@/hooks/useDashboard";

export const MetricsCards = () => {
  const { data: metrics, isLoading } = useDashboardMetrics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="talo-card-intimate animate-breathe">
            <CardHeader className="pb-3">
              <div className="h-4 bg-muted/50 rounded-md w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted/50 rounded-md w-3/4 mb-3"></div>
              <div className="h-3 bg-muted/30 rounded-md w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const capacityColor = (metrics?.avg_capacity_today || 0) >= 80 
    ? "text-green-600" 
    : (metrics?.avg_capacity_today || 0) >= 50 
    ? "text-amber-600" 
    : "text-orange-600";

  const revenueChange = metrics?.revenue_this_month && metrics?.revenue_last_month 
    ? ((metrics.revenue_this_month - metrics.revenue_last_month) / metrics.revenue_last_month) * 100 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Today's Classes */}
      <Card className="talo-card-intimate hover:shadow-sage transition-all duration-300 group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Today's Practice</CardTitle>
          <Calendar className="h-5 w-5 text-primary group-hover:text-primary-glow transition-colors" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground mb-2">{metrics?.todays_classes || 0}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="text-primary font-medium">
              {metrics?.avg_capacity_today?.toFixed(1) || 0}% capacity
            </span>
            {(metrics?.waitlisted_classes || 0) > 0 && (
              <Badge className="text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
                {metrics?.waitlisted_classes} waiting
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Intro Offers */}
      <Card className="talo-card-intimate hover:shadow-sage transition-all duration-300 group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">New Journeys</CardTitle>
          <Users className="h-5 w-5 text-primary group-hover:text-primary-glow transition-colors" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground mb-2">{metrics?.active_intro_offers || 0}</div>
          <div className="flex items-center gap-2 text-xs">
            {(metrics?.ending_this_week || 0) > 0 ? (
              <Badge className="text-xs bg-accent/10 text-accent border-accent/20 hover:bg-accent/20 transition-colors">
                {metrics?.ending_this_week} transitioning
              </Badge>
            ) : (
              <span className="text-primary font-medium">All supported</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* This Month's Revenue */}
      <Card className="talo-card-intimate hover:shadow-sage transition-all duration-300 group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Flow</CardTitle>
          <DollarSign className="h-5 w-5 text-primary group-hover:text-primary-glow transition-colors" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground mb-2">
            ${(metrics?.revenue_this_month || 0).toFixed(0)}
          </div>
          <div className="flex items-center gap-1 text-xs">
            {revenueChange >= 0 ? (
              <TrendingUp className="h-4 w-4 text-primary" />
            ) : (
              <TrendingDown className="h-4 w-4 text-accent" />
            )}
            <span className={revenueChange >= 0 ? "text-primary font-medium" : "text-accent font-medium"}>
              {revenueChange > 0 ? "+" : ""}{revenueChange.toFixed(1)}% growth
            </span>
          </div>
        </CardContent>
      </Card>

      {/* New Leads */}
      <Card className="talo-card-intimate hover:shadow-sage transition-all duration-300 group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">New Connections</CardTitle>
          <UserPlus className="h-5 w-5 text-primary group-hover:text-primary-glow transition-colors" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground mb-2">{metrics?.new_leads_week || 0}</div>
          <div className="text-xs text-primary font-medium">
            Seeds to nurture
          </div>
        </CardContent>
      </Card>
    </div>
  );
};