import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, AlertTriangle, UserPlus } from "lucide-react";
import { useTodaysClasses } from "@/hooks/useDashboard";

export const TodaysClasses = () => {
  const { data: classes, isLoading } = useTodaysClasses();

  const formatTime = (timeString: string) => {
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getCapacityColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 100) return "text-red-600";
    if (percentage >= 80) return "text-yellow-600";
    return "text-green-600";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today's Classes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
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
          <Calendar className="h-5 w-5" />
          Today's Classes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {classes?.map((classItem) => (
          <div 
            key={classItem.id} 
            className={`p-3 rounded-lg border ${classItem.needs_substitute ? 'border-red-200 bg-red-50' : 'border-border bg-card'}`}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {formatTime(classItem.class_time)} - {classItem.class_name}
                  </span>
                  {classItem.needs_substitute && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      NEEDS SUB
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>with {classItem.instructor_name}</span>
                  <span>•</span>
                  <span>{classItem.room}</span>
                </div>
              </div>
              
              <div className="text-right space-y-1">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className={`font-medium ${getCapacityColor(classItem.current_bookings, classItem.max_capacity)}`}>
                    {classItem.current_bookings}/{classItem.max_capacity}
                  </span>
                </div>
                {classItem.waitlist_count > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <UserPlus className="h-3 w-3 mr-1" />
                    Waitlist: {classItem.waitlist_count}
                  </Badge>
                )}
              </div>
            </div>
            
            {classItem.needs_substitute && (
              <div className="mt-2 pt-2 border-t border-red-200">
                <Button size="sm" variant="destructive" className="text-xs">
                  Find Substitute
                </Button>
              </div>
            )}
          </div>
        ))}
        
        {(!classes || classes.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2" />
            <p>No classes scheduled for today</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};