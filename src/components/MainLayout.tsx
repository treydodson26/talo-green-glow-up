import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import TopBar from "@/components/TopBar";
import ClientsTable from "@/components/ClientsTable";
import HomePage from "@/components/HomePage";
import InboxPage from "@/components/InboxPage";
import InstructorHub from "@/components/InstructorHub";
import OperationsHub from "@/components/OperationsHub";
import MarketingHub from "@/components/MarketingHub";

const MainLayout = () => {
  const [activeRoute, setActiveRoute] = useState("customers");

  const renderContent = () => {
    switch (activeRoute) {
      case "home":
        return <HomePage />;
      case "instructor-hub":
        return <InstructorHub />;
      case "operations-hub":
        return <OperationsHub />;
      case "marketing-hub":
        return <MarketingHub />;
      case "inbox":
        return <InboxPage />;
      case "customers":
        return <ClientsTable />;
      case "segments":
        return (
          <div className="flex-1 p-6 bg-background">
            <h1 className="text-2xl font-semibold">Segments</h1>
            <p className="text-muted-foreground mt-2">Segments feature coming soon...</p>
          </div>
        );
      case "comments":
        return (
          <div className="flex-1 p-6 bg-background">
            <h1 className="text-2xl font-semibold">Comments</h1>
            <p className="text-muted-foreground mt-2">Comments feature coming soon...</p>
          </div>
        );
      default:
        return <ClientsTable />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar activeRoute={activeRoute} onRouteChange={setActiveRoute} />
        <div className="flex-1 flex flex-col">
          <TopBar />
          {renderContent()}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;