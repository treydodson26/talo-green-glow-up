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
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  activeRoute?: string;
  onRouteChange?: (route: string) => void;
}

const topNavItems = [
  { id: "home", icon: Home, label: "Home" },
  { id: "inbox", icon: Inbox, label: "Inbox" },
];

const bottomNavItems = [
  { id: "customers", icon: UserPlus, label: "Customer Hub" },
  { id: "marketing-hub", icon: Megaphone, label: "Marketing Hub" },
  { id: "operations-hub", icon: Cog, label: "Operations Hub" },
  { id: "instructor-hub", icon: GraduationCap, label: "Instructor Hub" },
  { id: "segments", icon: BarChart3, label: "Segments" },
  { id: "settings", icon: Settings, label: "Settings" },
];

export function AppSidebar({ activeRoute = "home", onRouteChange }: AppSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleNavigation = (route: string) => {
    onRouteChange?.(route);
  };

  const getNavClass = (itemId: string) => {
    const isActive = activeRoute === itemId;
    return cn(
      "w-full justify-start transition-colors",
      isActive 
        ? "bg-primary text-primary-foreground hover:bg-primary/90" 
        : "hover:bg-accent hover:text-accent-foreground"
    );
  };

  return (
    <Sidebar className="border-r border-border bg-card-dark">
      <SidebarHeader className="border-b border-border p-4 bg-background-subtle">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-foreground">Talo Studio</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Quick Actions */}
        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {topNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => handleNavigation(item.id)}
                      className={getNavClass(item.id)}
                      tooltip={item.label}
                    >
                      <Icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => handleNavigation(item.id)}
                      className={getNavClass(item.id)}
                      tooltip={item.label}
                    >
                      <Icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}