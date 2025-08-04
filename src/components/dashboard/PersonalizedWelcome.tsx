import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Sun, 
  Cloud, 
  CloudRain, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Users,
  Calendar,
  DollarSign,
  Zap,
  RefreshCw,
  Trophy,
  PartyPopper
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface WelcomeStats {
  todayCheckins: number;
  yesterdayCheckins: number;
  todayRevenue: number;
  yesterdayRevenue: number;
  todayBookings: number;
  yesterdayBookings: number;
  totalMembers: number;
}

interface WeatherData {
  temperature: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
}

interface Milestone {
  type: 'members' | 'revenue' | 'bookings';
  threshold: number;
  current: number;
  message: string;
}

const motivationalQuotes = [
  {
    quote: "Every sunrise is a new opportunity to transform lives through movement.",
    author: "Studio Wisdom"
  },
  {
    quote: "Your studio is not just a space, it's a sanctuary for growth and healing.",
    author: "Wellness Philosophy"
  },
  {
    quote: "The energy you bring to your studio creates ripples of positivity in every student's journey.",
    author: "Mindful Teaching"
  },
  {
    quote: "Success is measured not just in numbers, but in the smiles and strength you help create.",
    author: "Yoga Business"
  },
  {
    quote: "A strong community is built one breath, one pose, one connection at a time.",
    author: "Studio Leadership"
  },
  {
    quote: "Your passion for wellness becomes the foundation for others' transformation.",
    author: "Fitness Inspiration"
  }
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 6) return { greeting: "Early bird", emoji: "🌅", message: "Ready to seize the dawn?" };
  if (hour < 12) return { greeting: "Good morning", emoji: "☀️", message: "Let's make today amazing!" };
  if (hour < 17) return { greeting: "Good afternoon", emoji: "🌞", message: "The day is full of possibilities!" };
  if (hour < 21) return { greeting: "Good evening", emoji: "🌆", message: "Time to wind down and reflect!" };
  return { greeting: "Good night", emoji: "🌙", message: "Rest well, tomorrow awaits!" };
};

const getTodaysQuote = () => {
  const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return motivationalQuotes[dayOfYear % motivationalQuotes.length];
};

const getWeatherIcon = (description: string) => {
  if (description.includes('rain')) return CloudRain;
  if (description.includes('cloud')) return Cloud;
  return Sun;
};

const formatStatChange = (today: number, yesterday: number) => {
  if (yesterday === 0) return { change: 0, isPositive: true };
  const change = ((today - yesterday) / yesterday) * 100;
  return { change: Math.abs(change), isPositive: change >= 0 };
};

export const PersonalizedWelcome = () => {
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMilestone, setCelebrationMilestone] = useState<Milestone | null>(null);
  const [weatherApiKey, setWeatherApiKey] = useState("");
  const [showWeatherInput, setShowWeatherInput] = useState(false);

  const { greeting, emoji, message } = getGreeting();
  const todaysQuote = getTodaysQuote();

  // Fetch comparison stats
  const { data: stats } = useQuery({
    queryKey: ["welcome-stats"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      // Today's stats
      const { count: todayCheckins } = await supabase
        .from("bookings")
        .select("*", { count: 'exact', head: true })
        .not("checked_in_at", "is", null)
        .gte("checked_in_at", `${today}T00:00:00`);

      const { count: todayBookings } = await supabase
        .from("bookings")
        .select("*", { count: 'exact', head: true })
        .gte("booking_date", `${today}T00:00:00`);

      // Yesterday's stats
      const { count: yesterdayCheckins } = await supabase
        .from("bookings")
        .select("*", { count: 'exact', head: true })
        .not("checked_in_at", "is", null)
        .gte("checked_in_at", `${yesterday}T00:00:00`)
        .lt("checked_in_at", `${today}T00:00:00`);

      const { count: yesterdayBookings } = await supabase
        .from("bookings")
        .select("*", { count: 'exact', head: true })
        .gte("booking_date", `${yesterday}T00:00:00`)
        .lt("booking_date", `${today}T00:00:00`);

      // Total members
      const { count: totalMembers } = await supabase
        .from("customers")
        .select("*", { count: 'exact', head: true });

      const welcomeStats: WelcomeStats = {
        todayCheckins: todayCheckins || 0,
        yesterdayCheckins: yesterdayCheckins || 0,
        todayRevenue: Math.random() * 1000 + 500, // Mock data
        yesterdayRevenue: Math.random() * 1000 + 400, // Mock data
        todayBookings: todayBookings || 0,
        yesterdayBookings: yesterdayBookings || 0,
        totalMembers: totalMembers || 0,
      };

      // Check for milestones
      checkMilestones(welcomeStats);

      return welcomeStats;
    },
    refetchInterval: 5 * 60 * 1000,
  });

  // Fetch weather data
  const { data: weather } = useQuery({
    queryKey: ["weather-data", weatherApiKey],
    queryFn: async () => {
      if (!weatherApiKey) return null;
      
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=San Francisco&appid=${weatherApiKey}&units=metric`
        );
        
        if (!response.ok) throw new Error('Weather API error');
        
        const data = await response.json();
        return {
          temperature: Math.round(data.main.temp),
          description: data.weather[0].description,
          icon: data.weather[0].icon,
          humidity: data.main.humidity,
          windSpeed: data.wind.speed,
        } as WeatherData;
      } catch (error) {
        console.error('Weather fetch error:', error);
        return null;
      }
    },
    enabled: !!weatherApiKey,
    refetchInterval: 30 * 60 * 1000, // 30 minutes
  });

  const checkMilestones = (currentStats: WelcomeStats) => {
    const milestones: Milestone[] = [
      {
        type: 'members',
        threshold: 100,
        current: currentStats.totalMembers,
        message: "🎉 Congratulations! You've reached 100 members!"
      },
      {
        type: 'members',
        threshold: 250,
        current: currentStats.totalMembers,
        message: "🚀 Amazing! 250 members strong!"
      },
      {
        type: 'revenue',
        threshold: 1000,
        current: currentStats.todayRevenue,
        message: "💰 Today's revenue hit $1,000!"
      }
    ];

    const achievedMilestone = milestones.find(m => 
      m.current >= m.threshold && 
      !localStorage.getItem(`milestone-${m.type}-${m.threshold}`)
    );

    if (achievedMilestone) {
      setCelebrationMilestone(achievedMilestone);
      setShowCelebration(true);
      localStorage.setItem(`milestone-${achievedMilestone.type}-${achievedMilestone.threshold}`, 'true');
    }
  };

  const generateDailyBriefing = () => {
    if (!stats) return "Loading insights...";
    
    const insights = [
      `With ${stats.todayCheckins} check-ins today, your community is staying active!`,
      `Today's bookings (${stats.todayBookings}) show ${stats.todayBookings > stats.yesterdayBookings ? 'growing' : 'steady'} engagement.`,
      `Your studio family has grown to ${stats.totalMembers} members - each one a testament to your impact.`,
      weather ? `Perfect ${weather.temperature}°C weather for outdoor practices!` : "Great day to focus on indoor mindfulness practices.",
      "Remember: every class you teach plants seeds of transformation in your students' lives."
    ];

    return insights.join(' ');
  };

  const WeatherIcon = weather ? getWeatherIcon(weather.description) : Sun;

  return (
    <div className="space-y-6">
      {/* Celebration Modal */}
      {showCelebration && celebrationMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
          <Card className="w-96 animate-scale-in">
            <CardContent className="p-8 text-center">
              <div className="animate-bounce mb-4">
                <PartyPopper className="w-16 h-16 mx-auto text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Milestone Achieved!</h3>
              <p className="text-lg mb-6">{celebrationMilestone.message}</p>
              <Button onClick={() => setShowCelebration(false)}>
                <Trophy className="w-4 h-4 mr-2" />
                Celebrate Later
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Welcome Section */}
      <Card className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-0 shadow-lg">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Greeting & Quote */}
            <div className="lg:col-span-2 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{emoji}</span>
                  <div>
                    <h1 className="text-3xl font-light text-foreground">
                      {greeting}, Emily
                    </h1>
                    <p className="text-muted-foreground">{message}</p>
                  </div>
                </div>
              </div>

              {/* Daily Quote */}
              <div className="bg-background/50 rounded-lg p-4 border">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="italic text-foreground mb-2">"{todaysQuote.quote}"</p>
                    <p className="text-sm text-muted-foreground">— {todaysQuote.author}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Weather Widget */}
            <div className="space-y-4">
              {!weatherApiKey ? (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Cloud className="w-4 h-4" />
                      Weather
                    </h3>
                    {!showWeatherInput ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowWeatherInput(true)}
                      >
                        Add Weather
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="password"
                          placeholder="OpenWeather API key"
                          className="w-full p-2 border rounded text-sm"
                          value={weatherApiKey}
                          onChange={(e) => setWeatherApiKey(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Get your free API key from openweathermap.org
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : weather ? (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <WeatherIcon className="w-4 h-4 text-primary" />
                      Today's Weather
                    </h3>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold">{weather.temperature}°C</div>
                      <p className="text-sm text-muted-foreground capitalize">{weather.description}</p>
                      <div className="text-xs text-muted-foreground">
                        Humidity: {weather.humidity}% • Wind: {weather.windSpeed} m/s
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Perfect for outdoor classes
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center text-muted-foreground">
                      <Cloud className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Weather unavailable</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Comparison */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Check-ins Comparison */}
          <Card className="hover-scale">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Check-ins</p>
                  <p className="text-2xl font-bold">{stats.todayCheckins}</p>
                </div>
                <div className="text-right">
                  <Users className="w-6 h-6 text-primary mb-1" />
                  {(() => {
                    const { change, isPositive } = formatStatChange(stats.todayCheckins, stats.yesterdayCheckins);
                    return (
                      <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {change.toFixed(0)}%
                      </div>
                    );
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Comparison */}
          <Card className="hover-scale">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Revenue</p>
                  <p className="text-2xl font-bold">${stats.todayRevenue.toFixed(0)}</p>
                </div>
                <div className="text-right">
                  <DollarSign className="w-6 h-6 text-primary mb-1" />
                  {(() => {
                    const { change, isPositive } = formatStatChange(stats.todayRevenue, stats.yesterdayRevenue);
                    return (
                      <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {change.toFixed(0)}%
                      </div>
                    );
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bookings Comparison */}
          <Card className="hover-scale">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Bookings</p>
                  <p className="text-2xl font-bold">{stats.todayBookings}</p>
                </div>
                <div className="text-right">
                  <Calendar className="w-6 h-6 text-primary mb-1" />
                  {(() => {
                    const { change, isPositive } = formatStatChange(stats.todayBookings, stats.yesterdayBookings);
                    return (
                      <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {change.toFixed(0)}%
                      </div>
                    );
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Daily Briefing */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                Daily Briefing
                <Badge variant="outline" className="text-xs">
                  AI Insights
                </Badge>
              </h3>
              <p className="text-muted-foreground">
                {generateDailyBriefing()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};