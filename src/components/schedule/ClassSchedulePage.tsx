import { useState } from 'react';
import { format, addWeeks, subWeeks, startOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Filter, Clock, Users, MapPin } from 'lucide-react';
import { useWeeklySchedule } from '@/hooks/useBookingData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { WeeklyCalendar } from './WeeklyCalendar';
import { DailySchedule } from './DailySchedule';
import { ClassDetailModal } from './ClassDetailModal';

export const ClassSchedulePage = () => {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date()));
  const [viewMode, setViewMode] = useState<'weekly' | 'daily'>('weekly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [filterInstructor, setFilterInstructor] = useState<string>('');
  const [filterClassType, setFilterClassType] = useState<string>('');

  const { data: weeklyClasses, isLoading } = useWeeklySchedule(currentWeek);

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1));
  };

  const instructors = Array.from(new Set(weeklyClasses?.map(c => c.instructor_name) || []));
  const classTypes = Array.from(new Set(weeklyClasses?.map(c => c.class_name.split(' - ')[0]) || []));

  const filteredClasses = weeklyClasses?.filter(classItem => {
    if (filterInstructor && classItem.instructor_name !== filterInstructor) return false;
    if (filterClassType && !classItem.class_name.includes(filterClassType)) return false;
    return true;
  }) || [];

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 border-green-300 text-green-800';
      case 'limited': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'full': return 'bg-red-100 border-red-300 text-red-800';
      case 'waitlist': return 'bg-orange-100 border-orange-300 text-orange-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getAvailabilityBadge = (classItem: any) => {
    const { availability_status, spots_remaining, waitlist_count } = classItem;
    
    switch (availability_status) {
      case 'available':
        return <Badge variant="secondary" className="bg-green-50 text-green-700">{spots_remaining} spots</Badge>;
      case 'limited':
        return <Badge variant="secondary" className="bg-yellow-50 text-yellow-700">{spots_remaining} left</Badge>;
      case 'full':
        return <Badge variant="destructive">Full</Badge>;
      case 'waitlist':
        return <Badge variant="outline" className="border-orange-300 text-orange-700">Waitlist ({waitlist_count})</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 p-6 bg-background max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Class Schedule</h1>
        <p className="text-muted-foreground mt-2">Book your classes and manage your yoga journey</p>
      </div>

      {/* Navigation and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        {/* Week Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">
              {format(currentWeek, 'MMM d')} - {format(addWeeks(currentWeek, 1), 'MMM d, yyyy')}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-md">
          <Button
            variant={viewMode === 'weekly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('weekly')}
          >
            Weekly
          </Button>
          <Button
            variant={viewMode === 'daily' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('daily')}
          >
            Daily
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 lg:ml-auto">
          <select
            value={filterInstructor}
            onChange={(e) => setFilterInstructor(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm bg-background"
          >
            <option value="">All Instructors</option>
            {instructors.map(instructor => (
              <option key={instructor} value={instructor}>{instructor}</option>
            ))}
          </select>
          
          <select
            value={filterClassType}
            onChange={(e) => setFilterClassType(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm bg-background"
          >
            <option value="">All Classes</option>
            {classTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      ) : viewMode === 'weekly' ? (
        <WeeklyCalendar
          classes={filteredClasses}
          weekStart={currentWeek}
          onClassClick={setSelectedClassId}
          getAvailabilityColor={getAvailabilityColor}
          getAvailabilityBadge={getAvailabilityBadge}
        />
      ) : (
        <DailySchedule
          date={selectedDate}
          onDateChange={setSelectedDate}
          onClassClick={setSelectedClassId}
          getAvailabilityColor={getAvailabilityColor}
          getAvailabilityBadge={getAvailabilityBadge}
        />
      )}

      {/* Class Detail Modal */}
      {selectedClassId && (
        <ClassDetailModal
          classId={selectedClassId}
          open={!!selectedClassId}
          onOpenChange={(open) => !open && setSelectedClassId(null)}
        />
      )}

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{filteredClasses.length}</div>
                <div className="text-sm text-muted-foreground">Classes This Week</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">
                  {filteredClasses.filter(c => c.availability_status === 'available').length}
                </div>
                <div className="text-sm text-muted-foreground">Available Classes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">
                  {Array.from(new Set(filteredClasses.map(c => c.instructor_name))).length}
                </div>
                <div className="text-sm text-muted-foreground">Instructors</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};