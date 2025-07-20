import { Sun, Calendar } from "lucide-react";
import { MetricsCards } from "./dashboard/MetricsCards";
import { UrgentActions } from "./dashboard/UrgentActions";
import { IntroOffersPipeline } from "./dashboard/IntroOffersPipeline";
import { TodaysClasses } from "./dashboard/TodaysClasses";
import { CommunicationCenter } from "./dashboard/CommunicationCenter";
import { QuickActions } from "./dashboard/QuickActions";

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

  return (
    <div className="flex-1 p-6 bg-background">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Good morning, Emily! ☀️
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening at Tallow Yoga today
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{currentDate}</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {currentTime} • Studio Open
            </div>
          </div>
        </div>
      </div>

      {/* Critical Metrics Cards */}
      <div className="mb-6">
        <MetricsCards />
      </div>

      {/* Urgent Actions Banner */}
      <div className="mb-6">
        <UrgentActions />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Intro Offers Pipeline - Takes up 2 columns */}
        <div className="lg:col-span-2">
          <IntroOffersPipeline />
        </div>

        {/* Today's Classes - Sidebar */}
        <div className="lg:col-span-1">
          <TodaysClasses />
        </div>
      </div>

      {/* Secondary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Communication Center */}
        <div className="lg:col-span-2">
          <CommunicationCenter />
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <QuickActions />
        </div>
      </div>
    </div>
  );
};

export default HomePage;