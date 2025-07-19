import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, Clock, Zap, Server, Database, Users, Activity } from "lucide-react";

const OperationsHub = () => {
  return (
    <div className="flex-1 p-6 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Operations Hub</h1>
          <p className="text-muted-foreground mt-2">Monitor system performance, manage tasks, and oversee operations</p>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">All Systems</div>
              <p className="text-xs text-muted-foreground">Operational</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,847</div>
              <p className="text-xs text-muted-foreground">+15% from yesterday</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98ms</div>
              <p className="text-xs text-muted-foreground">Average response</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">99.9%</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Server Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Server Performance
              </CardTitle>
              <CardDescription>Real-time system metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">CPU Usage</span>
                    <span className="text-sm text-muted-foreground">45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Memory Usage</span>
                    <span className="text-sm text-muted-foreground">67%</span>
                  </div>
                  <Progress value={67} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Disk Usage</span>
                    <span className="text-sm text-muted-foreground">23%</span>
                  </div>
                  <Progress value={23} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Network I/O</span>
                    <span className="text-sm text-muted-foreground">12%</span>
                  </div>
                  <Progress value={12} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Active Tasks
              </CardTitle>
              <CardDescription>Current operations and background jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="font-medium">Data Backup</p>
                      <p className="text-sm text-muted-foreground">Running for 5 minutes</p>
                    </div>
                  </div>
                  <Badge variant="secondary">In Progress</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Email Queue Processing</p>
                      <p className="text-sm text-muted-foreground">245 emails remaining</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">System Maintenance</p>
                      <p className="text-sm text-muted-foreground">Scheduled in 2 hours</p>
                    </div>
                  </div>
                  <Badge variant="outline">Scheduled</Badge>
                </div>
              </div>
              
              <Button className="w-full mt-4" variant="outline">
                View All Tasks
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Database & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Database Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Status
              </CardTitle>
              <CardDescription>Connection pools and query performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Connection Pool</span>
                  <Badge variant="secondary">8/20 Active</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Average Query Time</span>
                  <span className="text-sm text-muted-foreground">15ms</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Slow Queries</span>
                  <Badge variant="destructive">2</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Cache Hit Rate</span>
                  <span className="text-sm text-green-600">94.2%</span>
                </div>
              </div>
              
              <Button className="w-full mt-4" variant="outline">
                Database Details
              </Button>
            </CardContent>
          </Card>

          {/* System Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                System Alerts
              </CardTitle>
              <CardDescription>Recent warnings and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">High Memory Usage</p>
                    <p className="text-sm text-yellow-700">Server memory at 85% capacity</p>
                    <p className="text-xs text-yellow-600">2 minutes ago</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 border border-blue-200 bg-blue-50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">Backup Completed</p>
                    <p className="text-sm text-blue-700">Daily backup finished successfully</p>
                    <p className="text-xs text-blue-600">1 hour ago</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 border border-green-200 bg-green-50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">Security Scan Clear</p>
                    <p className="text-sm text-green-700">No vulnerabilities detected</p>
                    <p className="text-xs text-green-600">3 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OperationsHub;