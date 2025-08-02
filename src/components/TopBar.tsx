import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Search, Plus, Bell, User } from "lucide-react";

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
        <Button variant="ghost" size="icon">
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <User className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default TopBar;