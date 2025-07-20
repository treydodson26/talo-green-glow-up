import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, Calendar, DollarSign, UserPlus } from "lucide-react";
import { useDashboardMetrics } from "@/hooks/useDashboard";

export const MetricsCards = () => {
  const { data: metrics, isLoading } = useDashboardMetrics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Today's Classes */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Today's Classes</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{metrics?.todays_classes || 0}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={capacityColor}>
              {metrics?.avg_capacity_today?.toFixed(1) || 0}% avg capacity
            </span>
            {(metrics?.waitlisted_classes || 0) > 0 && (
              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 border-amber-200">
                {metrics?.waitlisted_classes} waitlisted
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Intro Offers */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Active Intro Offers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{metrics?.active_intro_offers || 0}</div>
          <div className="flex items-center gap-2 text-xs">
            {(metrics?.ending_this_week || 0) > 0 ? (
              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 border-amber-200">
                {metrics?.ending_this_week} ending this week
              </Badge>
            ) : (
              <span className="text-muted-foreground">All on track</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* This Month's Revenue */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">This Month's Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            ${(metrics?.revenue_this_month || 0).toFixed(0)}
          </div>
          <div className="flex items-center gap-1 text-xs">
            {revenueChange >= 0 ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600" />
            )}
            <span className={revenueChange >= 0 ? "text-green-600" : "text-red-600"}>
              {revenueChange > 0 ? "+" : ""}{revenueChange.toFixed(1)}% vs last month
            </span>
          </div>
        </CardContent>
      </Card>

      {/* New Leads */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">New Leads (7 days)</CardTitle>
          <UserPlus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{metrics?.new_leads_week || 0}</div>
          <div className="text-xs text-muted-foreground">
            Fresh prospects to follow up
          </div>
        </CardContent>
      </Card>
    </div>
  );
};