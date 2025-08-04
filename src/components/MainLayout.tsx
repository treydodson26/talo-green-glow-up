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
import { ClassSchedulePage } from "@/components/schedule/ClassSchedulePage";
import { MyBookingsPage } from "@/components/schedule/MyBookingsPage";
import CustomerSegments from "@/components/CustomerSegments";
import { LeadManagementHub } from "@/components/lead-management/LeadManagementHub";

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
      case "schedule":
        return <ClassSchedulePage />;
      case "my-bookings":
        return <MyBookingsPage />;
      case "segments":
        return <CustomerSegments />;
      case "lead-management":
        return <LeadManagementHub />;
      case "comments":
        return (
          <div className="talo-container">
            <div className="talo-card-intimate">
              <h1 className="text-2xl font-semibent talo-text-sage">Community Voice</h1>
              <p className="talo-text-earth mt-2">Listen to the wisdom of your students...</p>
            </div>
          </div>
        );
      default:
        return <ClientsTable />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background-subtle">
        <AppSidebar activeRoute={activeRoute} onRouteChange={setActiveRoute} />
        <div className="flex-1 flex flex-col bg-background">
          <TopBar />
          <main className="flex-1 animate-fade-in">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;