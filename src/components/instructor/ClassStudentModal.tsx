import { useState } from 'react';
import { CheckCircle, Circle, Mail, Phone, Users } from 'lucide-react';
import { useClassWithBookings, useCheckInStudent } from '@/hooks/useInstructorData';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

interface ClassStudentModalProps {
  classId: string;
  children: React.ReactNode;
}

export const ClassStudentModal = ({ classId, children }: ClassStudentModalProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { data: classData, isLoading } = useClassWithBookings(classId);
  const checkInStudent = useCheckInStudent();

  const handleCheckIn = async (bookingId: string, studentName: string) => {
    try {
      await checkInStudent.mutateAsync(bookingId);
      toast({
        title: 'Student checked in',
        description: `${studentName} has been checked in`,
      });
    } catch (error) {
      toast({
        title: 'Check-in failed',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  if (!open) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        ) : classData ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {classData.class_name}
              </DialogTitle>
              <DialogDescription>
                {format(new Date(classData.class_date), 'PPP')} at{' '}
                {format(new Date(`2000-01-01T${classData.class_time}`), 'h:mm a')} • {classData.room}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Class Stats */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold">{classData.current_bookings}</div>
                  <div className="text-sm text-muted-foreground">Enrolled</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{classData.max_capacity}</div>
                  <div className="text-sm text-muted-foreground">Capacity</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{classData.waitlist_count}</div>
                  <div className="text-sm text-muted-foreground">Waitlist</div>
                </div>
              </div>

              <Separator />

              {/* Student List */}
              <div>
                <h4 className="font-medium mb-3">Enrolled Students</h4>
                <ScrollArea className="max-h-64">
                  {classData.bookings && classData.bookings.length > 0 ? (
                    <div className="space-y-2">
                      {classData.bookings
                        .filter((booking) => booking.booking_status === 'confirmed')
                        .map((booking) => {
                          const student = booking.customers;
                          const isCheckedIn = !!booking.checked_in_at;

                          return (
                            <div
                              key={booking.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    !isCheckedIn &&
                                    handleCheckIn(
                                      booking.id,
                                      `${student.first_name} ${student.last_name}`
                                    )
                                  }
                                  disabled={isCheckedIn || checkInStudent.isPending}
                                  className="p-1"
                                >
                                  {isCheckedIn ? (
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                  ) : (
                                    <Circle className="h-5 w-5" />
                                  )}
                                </Button>
                                <div>
                                  <div className="font-medium">
                                    {student.first_name} {student.last_name}
                                  </div>
                                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                                    <Mail className="h-3 w-3" />
                                    {student.client_email}
                                    {student.phone_number && (
                                      <>
                                        <Phone className="h-3 w-3 ml-2" />
                                        {student.phone_number}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {isCheckedIn && (
                                  <Badge variant="secondary" className="text-green-700 bg-green-50">
                                    Checked In
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No students enrolled yet
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Waitlist */}
              {classData.waitlist_count > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-3">Waitlist</h4>
                    <div className="space-y-2">
                      {classData.bookings
                        ?.filter((booking) => booking.booking_status === 'waitlisted')
                        .map((booking) => {
                          const student = booking.customers;
                          return (
                            <div
                              key={booking.id}
                              className="flex items-center justify-between p-3 border rounded-lg bg-orange-50"
                            >
                              <div>
                                <div className="font-medium">
                                  {student.first_name} {student.last_name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {student.client_email}
                                </div>
                              </div>
                              <Badge variant="outline" className="text-orange-700 border-orange-200">
                                Waitlisted
                              </Badge>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button>Send Message to Class</Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Class not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};