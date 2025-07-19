import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import ClientsTable from "@/components/ClientsTable";
import HomePage from "@/components/HomePage";
import InboxPage from "@/components/InboxPage";
import InstructorHub from "@/components/InstructorHub";

const MainLayout = () => {
  const [activeRoute, setActiveRoute] = useState("clients");

  const renderContent = () => {
    switch (activeRoute) {
      case "home":
        return <HomePage />;
      case "instructor-hub":
        return <InstructorHub />;
      case "inbox":
        return <InboxPage />;
      case "clients":
        return <ClientsTable />;
      case "customers":
        return <ClientsTable />; // Same as clients for now
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
    <div className="flex h-screen bg-background">
      <Sidebar activeRoute={activeRoute} onRouteChange={setActiveRoute} />
      <div className="flex-1 flex flex-col">
        <TopBar />
        {renderContent()}
      </div>
    </div>
  );
};

export default MainLayout;