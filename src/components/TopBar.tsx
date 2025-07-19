import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Bell, User } from "lucide-react";

const TopBar = () => {
  return (
    <div className="h-16 bg-black border-b border-gray-800 flex items-center justify-between px-6">
      {/* Left side - Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>Customers</span>
        <span>&gt;</span>
        <span className="text-white">Clients</span>
      </div>

      {/* Center - Search */}
      <div className="flex-1 max-w-md mx-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search"
            className="pl-10 bg-gray-800 text-white border-gray-700"
          />
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
          <Bell className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
          <User className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default TopBar;