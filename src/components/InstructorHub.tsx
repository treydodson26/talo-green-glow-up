import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Users, Clock, TrendingUp, BookOpen, Video, UserCheck, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { useInstructorMetrics, useUpcomingClasses } from "@/hooks/useInstructorData";
import { CreateClassModal } from "@/components/instructor/CreateClassModal";
import { ClassStudentModal } from "@/components/instructor/ClassStudentModal";

const InstructorHub = () => {
  // Default instructor - in a real app, this would come from auth context
  const instructorName = "Default Instructor";
  
  const { data: metrics, isLoading: metricsLoading } = useInstructorMetrics(instructorName);
  const { data: upcomingClasses, isLoading: classesLoading } = useUpcomingClasses(instructorName);

  const getClassStatusColor = (classData: any) => {
    if (classData.needs_substitute) return "bg-red-500";
    if (classData.current_bookings >= classData.max_capacity) return "bg-orange-500";
    if (classData.isToday) return "bg-green-500";
    return "bg-blue-500";
  };

  const getCapacityBadgeVariant = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 100) return "destructive";
    if (percentage >= 80) return "secondary";
    return "outline";
  };

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
              {metricsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{metrics?.totalStudents || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Active students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Classes This Week</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{metrics?.classesThisWeek || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Scheduled classes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hours This Week</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{metrics?.hoursThisWeek || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Teaching hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{metrics?.averageRating?.toFixed(1) || "N/A"}</div>
              )}
              <p className="text-xs text-muted-foreground">Student ratings</p>
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
              {classesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : upcomingClasses && upcomingClasses.length > 0 ? (
                <div className="space-y-4">
                  {upcomingClasses.map((classItem) => (
                    <ClassStudentModal key={classItem.id} classId={classItem.id}>
                      <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${getClassStatusColor(classItem)}`}></div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{classItem.class_name}</p>
                              {classItem.needs_substitute && (
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {classItem.isToday ? "Today" : "Tomorrow"},{" "}
                              {format(new Date(`2000-01-01T${classItem.class_time}`), "h:mm a")}
                              {classItem.room && ` • ${classItem.room}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={getCapacityBadgeVariant(classItem.current_bookings, classItem.max_capacity)}
                          >
                            {classItem.current_bookings}/{classItem.max_capacity}
                          </Badge>
                          {classItem.waitlist_count > 0 && (
                            <Badge variant="outline" className="text-orange-600">
                              +{classItem.waitlist_count} waiting
                            </Badge>
                          )}
                        </div>
                      </div>
                    </ClassStudentModal>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No upcoming classes scheduled
                </div>
              )}
              
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
                <CreateClassModal>
                  <Button className="h-20 flex flex-col gap-2" variant="outline">
                    <BookOpen className="h-6 w-6" />
                    <span className="text-sm">Create Class</span>
                  </Button>
                </CreateClassModal>
                
                <Button className="h-20 flex flex-col gap-2" variant="outline">
                  <Video className="h-6 w-6" />
                  <span className="text-sm">Live Stream</span>
                </Button>
                
                <Button className="h-20 flex flex-col gap-2" variant="outline">
                  <UserCheck className="h-6 w-6" />
                  <span className="text-sm">Attendance</span>
                </Button>
                
                <Button className="h-20 flex flex-col gap-2" variant="outline">
                  <TrendingUp className="h-6 w-6" />
                  <span className="text-sm">Analytics</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Overview */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>Weekly performance metrics and trends</CardDescription>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{metrics?.attendanceRate || 0}%</div>
                  <div className="text-sm text-muted-foreground">Attendance Rate</div>
                  <div className="text-xs text-muted-foreground mt-1">This week</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{metrics?.totalClasses || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Classes</div>
                  <div className="text-xs text-muted-foreground mt-1">This week</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{metrics?.totalStudents || 0}</div>
                  <div className="text-sm text-muted-foreground">Active Students</div>
                  <div className="text-xs text-muted-foreground mt-1">Current</div>
                </div>
              </div>
            )}
            
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium mb-3">Quick Insights</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Most popular class time: Morning sessions (7-9 AM)</p>
                <p>• Average class size: {metrics ? Math.round((metrics.totalStudents || 0) / (metrics.classesThisWeek || 1)) : 0} students</p>
                <p>• Highest attendance: Yoga Flow classes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InstructorHub;