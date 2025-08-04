import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  UserPlus, 
  Calendar, 
  CheckCircle,
  MessageSquare,
  CreditCard,
  Clock
} from "lucide-react";
import { useActivityFeed } from "@/hooks/useDashboard";

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'checkin':
      return CheckCircle;
    case 'signup':
      return UserPlus;
    case 'booking':
      return Calendar;
    case 'payment':
      return CreditCard;
    case 'message':
      return MessageSquare;
    default:
      return Users;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'checkin':
      return 'text-green-600 bg-green-100 dark:bg-green-900/20';
    case 'signup':
      return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
    case 'booking':
      return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
    case 'payment':
      return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20';
    case 'message':
      return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
    default:
      return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
  }
};

const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

export const ActivityFeed = () => {
  const { data: activities, isLoading } = useActivityFeed();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Live Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 bg-muted rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Live Activity Feed
          <Badge variant="outline" className="animate-pulse">
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-h-96 overflow-y-auto">
        {activities && activities.length > 0 ? (
          activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            const colorClass = getActivityColor(activity.type);
            
            return (
              <div 
                key={activity.id} 
                className="flex items-start gap-3 animate-fade-in hover-scale p-2 rounded-lg hover:bg-muted/50 transition-all duration-200"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`p-2 rounded-full ${colorClass} flex-shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm text-foreground">
                        {activity.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {activity.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(activity.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent activity</p>
            <p className="text-sm">Activity will appear here as it happens</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};