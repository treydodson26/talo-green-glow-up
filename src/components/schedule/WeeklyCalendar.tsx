import { format, addDays, isSameDay } from 'date-fns';
import { Clock, Users, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ClassScheduleItem } from '@/hooks/useBookingData';

interface WeeklyCalendarProps {
  classes: ClassScheduleItem[];
  weekStart: Date;
  onClassClick: (classId: string) => void;
  getAvailabilityColor: (status: string) => string;
  getAvailabilityBadge: (classItem: ClassScheduleItem) => React.ReactNode;
}

export const WeeklyCalendar = ({
  classes,
  weekStart,
  onClassClick,
  getAvailabilityColor,
  getAvailabilityBadge,
}: WeeklyCalendarProps) => {
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getClassesForDay = (date: Date) => {
    return classes.filter(classItem =>
      isSameDay(new Date(classItem.class_date), date)
    ).sort((a, b) => a.class_time.localeCompare(b.class_time));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
      {weekDays.map((day, index) => {
        const dayClasses = getClassesForDay(day);
        const isToday = isSameDay(day, new Date());

        return (
          <div key={index} className="space-y-3">
            {/* Day Header */}
            <div className={`text-center p-3 rounded-lg ${isToday ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              <div className="font-medium text-sm">
                {format(day, 'EEE')}
              </div>
              <div className={`text-lg font-bold ${isToday ? '' : 'text-muted-foreground'}`}>
                {format(day, 'd')}
              </div>
            </div>

            {/* Classes for the day */}
            <div className="space-y-2 min-h-[200px]">
              {dayClasses.length > 0 ? (
                dayClasses.map((classItem) => (
                  <Card
                    key={classItem.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${getAvailabilityColor(classItem.availability_status)} ${!classItem.is_bookable ? 'opacity-60' : ''}`}
                    onClick={() => onClassClick(classItem.id)}
                  >
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm line-clamp-1">
                            {classItem.class_name}
                          </div>
                          {getAvailabilityBadge(classItem)}
                        </div>
                        
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(`2000-01-01T${classItem.class_time}`), 'h:mm a')}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {classItem.instructor_name}
                          </div>
                          
                          {classItem.room && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {classItem.room}
                            </div>
                          )}
                        </div>

                        {!classItem.is_bookable && (
                          <div className="text-xs text-red-600 font-medium">
                            Booking closed
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center text-muted-foreground text-sm py-8">
                  No classes scheduled
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};