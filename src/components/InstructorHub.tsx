import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Users, Clock, TrendingUp, BookOpen, Video } from "lucide-react";

const InstructorHub = () => {
  return (
    <div className="flex-1 p-6 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Instructor Hub</h1>
          <p className="text-muted-foreground mt-2">Manage your classes, track performance, and engage with students</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">127</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Classes This Week</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18</div>
              <p className="text-xs text-muted-foreground">3 more than last week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hours Taught</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24.5</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.8</div>
              <p className="text-xs text-muted-foreground">+0.2 from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Classes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Upcoming Classes
              </CardTitle>
              <CardDescription>Your schedule for today and tomorrow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Yoga Flow - Beginner</p>
                      <p className="text-sm text-muted-foreground">Today, 9:00 AM</p>
                    </div>
                  </div>
                  <Badge variant="secondary">12 students</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">HIIT Training</p>
                      <p className="text-sm text-muted-foreground">Today, 6:00 PM</p>
                    </div>
                  </div>
                  <Badge variant="secondary">8 students</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Pilates Core</p>
                      <p className="text-sm text-muted-foreground">Tomorrow, 7:00 AM</p>
                    </div>
                  </div>
                  <Badge variant="secondary">15 students</Badge>
                </div>
              </div>
              
              <Button className="w-full mt-4" variant="outline">
                View Full Schedule
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button className="h-20 flex flex-col gap-2" variant="outline">
                  <BookOpen className="h-6 w-6" />
                  <span className="text-sm">Create Class</span>
                </Button>
                
                <Button className="h-20 flex flex-col gap-2" variant="outline">
                  <Video className="h-6 w-6" />
                  <span className="text-sm">Live Stream</span>
                </Button>
                
                <Button className="h-20 flex flex-col gap-2" variant="outline">
                  <Users className="h-6 w-6" />
                  <span className="text-sm">Student List</span>
                </Button>
                
                <Button className="h-20 flex flex-col gap-2" variant="outline">
                  <TrendingUp className="h-6 w-6" />
                  <span className="text-sm">Analytics</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your classes and students</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 border border-border rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">New student joined Yoga Flow - Beginner</p>
                  <p className="text-sm text-muted-foreground">Sarah Miller • 2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 border border-border rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Class review received</p>
                  <p className="text-sm text-muted-foreground">"Amazing HIIT session!" - Mike Johnson • 5 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 border border-border rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Class capacity reached</p>
                  <p className="text-sm text-muted-foreground">Pilates Core is now full • 1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InstructorHub;