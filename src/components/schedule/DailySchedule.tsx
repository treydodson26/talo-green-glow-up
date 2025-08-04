import { useState } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, Users, MapPin } from 'lucide-react';
import { useDailySchedule, ClassScheduleItem } from '@/hooks/useBookingData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface DailyScheduleProps {
  date: Date;
  onDateChange: (date: Date) => void;
  onClassClick: (classId: string) => void;
  getAvailabilityColor: (status: string) => string;
  getAvailabilityBadge: (classItem: ClassScheduleItem) => React.ReactNode;
}

export const DailySchedule = ({
  date,
  onDateChange,
  onClassClick,
  getAvailabilityColor,
  getAvailabilityBadge,
}: DailyScheduleProps) => {
  const { data: dayClasses, isLoading } = useDailySchedule(date);

  const navigateDay = (direction: 'prev' | 'next') => {
    onDateChange(direction === 'next' ? addDays(date, 1) : subDays(date, 1));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigateDay('prev')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <h2 className="text-2xl font-bold">{format(date, 'EEEE')}</h2>
          <p className="text-muted-foreground">{format(date, 'MMMM d, yyyy')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigateDay('next')}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Classes List */}
      <div className="max-w-2xl mx-auto space-y-4">
        {dayClasses && dayClasses.length > 0 ? (
          dayClasses.map((classItem) => (
            <Card
              key={classItem.id}
              className={`cursor-pointer transition-all hover:shadow-md ${getAvailabilityColor(classItem.availability_status)} ${!classItem.is_bookable ? 'opacity-60' : ''}`}
              onClick={() => onClassClick(classItem.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{classItem.class_name}</h3>
                      {getAvailabilityBadge(classItem)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {format(new Date(`2000-01-01T${classItem.class_time}`), 'h:mm a')}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {classItem.instructor_name}
                      </div>
                      
                      {classItem.room && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {classItem.room}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <span>
                        Capacity: {classItem.current_bookings}/{classItem.max_capacity}
                      </span>
                      {classItem.waitlist_count > 0 && (
                        <span className="text-orange-600">
                          Waitlist: {classItem.waitlist_count}
                        </span>
                      )}
                      {!classItem.is_bookable && (
                        <span className="text-red-600 font-medium">
                          Booking closed (within 2 hours)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No classes scheduled</h3>
              <p>No classes are scheduled for {format(date, 'MMMM d, yyyy')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};