import { Sun, Calendar, Sparkles } from "lucide-react";
import { MetricsCards } from "./dashboard/MetricsCards";
import { UrgentActions } from "./dashboard/UrgentActions";
import { IntroOffersPipeline } from "./dashboard/IntroOffersPipeline";
import { TodaysClasses } from "./dashboard/TodaysClasses";
import { CommunicationCenter } from "./dashboard/CommunicationCenter";
import { QuickActions } from "./dashboard/QuickActions";
import { LiveMetrics } from "./dashboard/LiveMetrics";
import { ActivityFeed } from "./dashboard/ActivityFeed";
import { ClassHeatMap } from "./dashboard/ClassHeatMap";
import { PersonalizedWelcome } from "./dashboard/PersonalizedWelcome";
import { TestWhatsApp } from "@/components/TestWhatsApp";
import { TestIntroMessages } from "@/components/TestIntroMessages";
import { Card, CardContent } from "@/components/ui/card";

const HomePage = () => {
  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="flex-1 p-8 bg-gradient-to-br from-background via-background to-accent/20 min-h-screen">
      {/* Personalized Welcome Experience */}
      <div className="mb-12">
        <PersonalizedWelcome />
      </div>

      {/* Live Metrics Section */}
      <div className="mb-8 animate-fade-in">
        <LiveMetrics />
      </div>

      {/* Key Metrics Overview */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 bg-primary rounded-full"></div>
          <h2 className="text-xl font-medium text-foreground">Studio Overview</h2>
        </div>
        <MetricsCards />
      </div>

      {/* Important Updates with Pulse Effect */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-6 bg-primary/60 rounded-full pulse"></div>
          <h2 className="text-xl font-medium text-foreground">Today's Focus</h2>
        </div>
        <div className="pulse">
          <UrgentActions />
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="space-y-8">
        {/* Live Activity & Heat Map Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Live Activity Feed */}
          <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <ActivityFeed />
          </div>

          {/* Class Heat Map */}
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <ClassHeatMap />
          </div>
        </div>

        {/* Primary Content Row */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          {/* Intro Offers Pipeline */}
          <div className="xl:col-span-3 space-y-2 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-6 bg-primary/60 rounded-full"></div>
              <h2 className="text-xl font-medium text-foreground">Intro Offers Pipeline</h2>
            </div>
            <IntroOffersPipeline />
          </div>

          {/* Today's Classes */}
          <div className="xl:col-span-2 space-y-2 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-6 bg-primary/60 rounded-full"></div>
              <h2 className="text-xl font-medium text-foreground">Today's Schedule</h2>
            </div>
            <TodaysClasses />
          </div>
        </div>

        {/* Secondary Content Row */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          {/* Communication Center */}
          <div className="xl:col-span-3 space-y-2 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-6 bg-primary/60 rounded-full"></div>
              <h2 className="text-xl font-medium text-foreground">Recent Communications</h2>
            </div>
            <CommunicationCenter />
          </div>

          {/* Quick Actions */}
          <div className="xl:col-span-2 space-y-2 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-6 bg-primary/60 rounded-full"></div>
              <h2 className="text-xl font-medium text-foreground">Quick Actions</h2>
            </div>
            <QuickActions />
            <div className="mt-4 space-y-4">
              <TestWhatsApp />
              <TestIntroMessages />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;