import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Send, Download, Calendar, Target } from "lucide-react";

export const QuickActions = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Button className="flex flex-col items-center justify-center h-16 p-3">
            <UserPlus className="h-5 w-5 mb-1" />
            <span className="text-xs">Add Customer</span>
          </Button>
          
          <Button variant="outline" className="flex flex-col items-center justify-center h-16 p-3">
            <Send className="h-5 w-5 mb-1" />
            <span className="text-xs">Send Broadcast</span>
          </Button>
          
          <Button variant="outline" className="flex flex-col items-center justify-center h-16 p-3">
            <Download className="h-5 w-5 mb-1" />
            <span className="text-xs">Export Report</span>
          </Button>
          
          <Button variant="outline" className="flex flex-col items-center justify-center h-16 p-3">
            <Calendar className="h-5 w-5 mb-1" />
            <span className="text-xs">Manage Coverage</span>
          </Button>
          
          <Button variant="outline" className="flex flex-col items-center justify-center h-16 p-3">
            <Target className="h-5 w-5 mb-1" />
            <span className="text-xs">Create Campaign</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};