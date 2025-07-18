import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

const HomePage = () => {
  return (
    <div className="flex-1 p-6 bg-background">
      <h1 className="text-2xl font-semibold text-foreground mb-8">Home</h1>
      
      {/* Refer a Friend Card */}
      <Card className="mb-6 shadow-soft border-talo-green-light">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-foreground">Refer a Friend</CardTitle>
              <CardDescription className="mt-2 text-muted-foreground">
                Refer a studio to Arketa and get $750 when they launch their business using Arketa! 
                Refer a solo practitioner and get $50 when they launch their first class!
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Button className="bg-primary hover:bg-primary/90">
            Refer
          </Button>
        </CardContent>
      </Card>

      {/* Push Notifications Card */}
      <Card className="shadow-soft border-talo-green-light">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-foreground">Push notifications are here!</CardTitle>
              <CardDescription className="mt-2 text-muted-foreground">
                Click to learn more about how you can send push notifications directly 
                through your branded mobile app.
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground ml-4">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <Button className="bg-primary hover:bg-primary/90">
              Book a demo
            </Button>
            
            {/* Mobile App Mockups */}
            <div className="flex gap-2">
              <div className="w-12 h-20 bg-gradient-green rounded-lg flex items-center justify-center relative">
                <div className="w-8 h-16 bg-white/20 rounded backdrop-blur-sm"></div>
                <div className="absolute top-2 left-2 w-2 h-2 bg-white/40 rounded-full"></div>
              </div>
              <div className="w-12 h-20 bg-talo-green-dark rounded-lg flex items-center justify-center relative">
                <div className="w-8 h-16 bg-white/20 rounded backdrop-blur-sm"></div>
                <div className="absolute top-2 left-2 w-2 h-2 bg-white/40 rounded-full"></div>
              </div>
              <div className="w-12 h-20 bg-gradient-green rounded-lg flex items-center justify-center relative">
                <div className="w-8 h-16 bg-white/20 rounded backdrop-blur-sm"></div>
                <div className="absolute top-2 left-2 w-2 h-2 bg-white/40 rounded-full"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HomePage;