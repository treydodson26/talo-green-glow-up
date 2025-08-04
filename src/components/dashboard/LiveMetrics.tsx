import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  DollarSign, 
  UserPlus, 
  Calendar,
  TrendingUp,
  Activity
} from "lucide-react";
import { useLiveMetrics } from "@/hooks/useDashboard";

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

const AnimatedCounter = ({ value, prefix = "", suffix = "", decimals = 0 }: AnimatedCounterProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [prevValue, setPrevValue] = useState(0);

  useEffect(() => {
    if (value !== prevValue) {
      const duration = 1000; // 1 second animation
      const steps = 30;
      const stepValue = (value - prevValue) / steps;
      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        const newValue = prevValue + (stepValue * currentStep);
        
        if (currentStep >= steps) {
          setDisplayValue(value);
          setPrevValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(newValue);
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [value, prevValue]);

  const formatValue = (val: number) => {
    if (decimals === 0) return Math.round(val);
    return val.toFixed(decimals);
  };

  return (
    <span className="animate-fade-in transition-all duration-300">
      {prefix}{formatValue(displayValue)}{suffix}
    </span>
  );
};

export const LiveMetrics = () => {
  const { data: metrics, isLoading } = useLiveMetrics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metricCards = [
    {
      title: "Live Check-ins Today",
      value: metrics?.checkins_today || 0,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
      suffix: "",
      pulse: true,
    },
    {
      title: "Today's Revenue",
      value: metrics?.revenue_today || 0,
      icon: DollarSign,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      prefix: "$",
      decimals: 0,
      pulse: true,
    },
    {
      title: "New Signups",
      value: metrics?.new_signups_today || 0,
      icon: UserPlus,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
      suffix: "",
    },
    {
      title: "Bookings Today",
      value: metrics?.bookings_today || 0,
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
      suffix: "",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Activity className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium text-foreground">Live Studio Metrics</h3>
        <Badge variant="outline" className="animate-pulse">
          Live
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card 
              key={metric.title} 
              className={`hover-scale transition-all duration-300 ${
                metric.pulse ? 'animate-pulse' : ''
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${metric.bgColor} rounded-lg`}>
                    <Icon className={`w-5 h-5 ${metric.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{metric.title}</p>
                    <p className="text-2xl font-semibold animate-fade-in">
                      <AnimatedCounter
                        value={metric.value}
                        prefix={metric.prefix}
                        suffix={metric.suffix}
                        decimals={metric.decimals}
                      />
                    </p>
                  </div>
                </div>
                {metric.pulse && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="w-3 h-3" />
                    <span>Updating live</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};