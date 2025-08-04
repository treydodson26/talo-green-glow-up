import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Clock } from "lucide-react";
import { useClassHeatMap } from "@/hooks/useDashboard";

const getUtilizationColor = (utilization: number) => {
  if (utilization >= 90) return 'bg-red-500';
  if (utilization >= 75) return 'bg-orange-500';
  if (utilization >= 50) return 'bg-yellow-500';
  if (utilization >= 25) return 'bg-green-500';
  return 'bg-gray-300';
};

const getUtilizationLabel = (utilization: number) => {
  if (utilization >= 90) return 'Very High';
  if (utilization >= 75) return 'High';
  if (utilization >= 50) return 'Medium';
  if (utilization >= 25) return 'Low';
  return 'Very Low';
};

export const ClassHeatMap = () => {
  const { data: heatMapData, isLoading } = useClassHeatMap();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Peak Class Times
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 animate-pulse">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="h-8 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group data by time slots and days
  const timeSlots = Array.from(new Set(heatMapData?.map(d => d.time) || [])).sort();
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getDataForTimeAndDay = (time: string, day: string) => {
    return heatMapData?.find(d => d.time === time && d.day === day);
  };

  const maxUtilization = Math.max(...(heatMapData?.map(d => d.utilization) || [0]));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Weekly Class Heat Map
          <Badge variant="outline">
            Last 7 Days
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Legend */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Class Utilization</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-300 rounded"></div>
            <span className="text-xs">Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-xs">Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span className="text-xs">High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-xs">Full</span>
          </div>
        </div>

        {/* Heat Map Grid */}
        <div className="space-y-2">
          {/* Day headers */}
          <div className="grid grid-cols-8 gap-1">
            <div className="text-xs font-medium text-muted-foreground"></div>
            {days.map(day => (
              <div key={day} className="text-xs font-medium text-center text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Time slots */}
          {timeSlots.map((time, timeIndex) => (
            <div key={time} className="grid grid-cols-8 gap-1">
              <div className="text-xs text-right text-muted-foreground py-1">
                {new Date(`2024-01-01T${time}`).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </div>
              {days.map(day => {
                const data = getDataForTimeAndDay(time, day);
                const utilization = data?.utilization || 0;
                
                return (
                  <div
                    key={`${time}-${day}`}
                    className={`
                      h-8 rounded transition-all duration-300 hover-scale cursor-pointer
                      ${getUtilizationColor(utilization)}
                      ${utilization > 0 ? 'opacity-80 hover:opacity-100' : 'opacity-30'}
                      animate-scale-in
                    `}
                    style={{ animationDelay: `${timeIndex * 0.1}s` }}
                    title={data ? 
                      `${day} ${time}: ${data.bookings}/${data.capacity} (${utilization.toFixed(0)}%)` : 
                      'No class'
                    }
                  >
                    {data && (
                      <div className="h-full flex items-center justify-center">
                        <span className="text-xs font-medium text-white">
                          {data.bookings}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Peak insights */}
        {heatMapData && heatMapData.length > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-2">Peak Insights</p>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground">Busiest Time: </span>
                <span className="font-medium">
                  {heatMapData.reduce((max, item) => 
                    item.utilization > max.utilization ? item : max
                  ).time}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Average Utilization: </span>
                <span className="font-medium">
                  {(heatMapData.reduce((sum, item) => sum + item.utilization, 0) / heatMapData.length).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};