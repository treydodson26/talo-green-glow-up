import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Home, 
  Users, 
  Inbox, 
  Settings,
  BarChart3,
  UserPlus,
  GraduationCap,
  Cog,
  Megaphone
} from "lucide-react";

interface SidebarProps {
  activeRoute?: string;
  onRouteChange?: (route: string) => void;
}

const Sidebar = ({ activeRoute = "home", onRouteChange }: SidebarProps) => {
  const topNavItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "inbox", icon: Inbox, label: "Inbox" },
  ];

  const bottomNavItems = [
    { id: "customers", icon: UserPlus, label: "Customer Hub" },
    { id: "marketing-hub", icon: Megaphone, label: "Marketing Hub" },
    { id: "operations-hub", icon: Cog, label: "Operations Hub" },
    { id: "segments", icon: BarChart3, label: "Segments" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-green rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="font-semibold text-sidebar-foreground">Talo Studio</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {/* Top navigation items */}
          {topNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeRoute === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent",
                  isActive && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                onClick={() => onRouteChange?.(item.id)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
          
          {/* Separator */}
          <div className="py-2">
            <Separator />
          </div>
          
          {/* Bottom navigation items */}
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeRoute === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent",
                  isActive && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                onClick={() => onRouteChange?.(item.id)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;