import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Search, Plus, Bell, User, Sparkles, BarChart3, Users } from "lucide-react";
import { Link } from "react-router-dom";

const TopBar = () => {
  return (
    <div className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      {/* Left side - Sidebar trigger and Breadcrumb */}
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Customers</span>
          <span>&gt;</span>
          <span className="text-foreground">Clients</span>
        </div>
      </div>

      {/* Center - Search */}
      <div className="flex-1 max-w-md mx-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search"
            className="pl-10 bg-background border-input"
          />
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        <Button asChild variant="secondary" size="sm">
          <Link to="/bi" aria-label="Open BI Insights" className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Insights</span>
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/students" aria-label="Open Students Gallery" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Students</span>
          </Link>
        </Button>
        <Button variant="ghost" size="icon">
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>
        <Button asChild variant="secondary" size="sm">
          <Link to="/ai" aria-label="Open Claude AI Playground" className="flex items-center gap-1">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Claude</span>
          </Link>
        </Button>
        <Button variant="ghost" size="icon">
          <User className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default TopBar;