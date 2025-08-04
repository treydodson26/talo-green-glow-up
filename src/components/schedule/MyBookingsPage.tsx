import { useState } from 'react';
import { format, isPast, isFuture } from 'date-fns';
import { Calendar, Clock, MapPin, Users, X, AlertCircle } from 'lucide-react';
import { useCustomerBookings, useUpcomingBookings, useCancelBooking } from '@/hooks/useBookingData';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export const MyBookingsPage = () => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const { toast } = useToast();
  const cancelBooking = useCancelBooking();

  // Mock customer ID - in real app this would come from auth context
  const customerId = 1;

  const { data: allBookings, isLoading: allBookingsLoading } = useCustomerBookings(customerId);
  const { data: upcomingBookings, isLoading: upcomingLoading } = useUpcomingBookings(customerId);

  const pastBookings = allBookings?.filter(booking => 
    isPast(new Date(booking.classes_schedule.class_date)) &&
    booking.booking_status !== 'cancelled'
  ) || [];

  const handleCancelBooking = async (bookingId: string, className: string) => {
    try {
      await cancelBooking.mutateAsync({ 
        bookingId, 
        reason: 'Customer cancellation' 
      });
      
      toast({
        title: 'Booking Cancelled',
        description: `Your booking for ${className} has been cancelled.`,
      });
    } catch (error) {
      toast({
        title: 'Cancellation Failed',
        description: 'Unable to cancel this booking. Please contact support.',
        variant: 'destructive',
      });
    }
  };

  const getBookingStatusBadge = (booking: any) => {
    switch (booking.booking_status) {
      case 'confirmed':
        return <Badge variant="secondary" className="bg-green-50 text-green-700">Confirmed</Badge>;
      case 'waitlisted':
        return <Badge variant="outline" className="border-orange-300 text-orange-700">
          Waitlisted #{booking.waitlist_position}
        </Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return null;
    }
  };

  const canCancelBooking = (booking: any) => {
    const classDateTime = new Date(`${booking.classes_schedule.class_date}T${booking.classes_schedule.class_time}`);
    const hoursUntilClass = (classDateTime.getTime() - new Date().getTime()) / (1000 * 60 * 60);
    
    // Can cancel if more than 12 hours before class and not already cancelled
    return hoursUntilClass > 12 && booking.booking_status !== 'cancelled';
  };

  const getCancellationPolicy = (booking: any) => {
    const classDateTime = new Date(`${booking.classes_schedule.class_date}T${booking.classes_schedule.class_time}`);
    const hoursUntilClass = (classDateTime.getTime() - new Date().getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilClass > 12) {
      return { canCancel: true, fee: false, message: 'Free cancellation' };
    } else if (hoursUntilClass > 2) {
      return { canCancel: true, fee: true, message: 'Late cancellation fee applies' };
    } else {
      return { canCancel: false, fee: false, message: 'Cannot cancel within 2 hours' };
    }
  };

  if (upcomingLoading || allBookingsLoading) {
    return (
      <div className="flex-1 p-6 bg-background max-w-4xl mx-auto">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 bg-background max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">My Bookings</h1>
        <p className="text-muted-foreground mt-2">Manage your class bookings and view your yoga journey</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{upcomingBookings?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Upcoming Classes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{pastBookings.length}</div>
                <div className="text-sm text-muted-foreground">Classes Attended</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">
                  {upcomingBookings?.filter(b => b.is_waitlisted).length || 0}
                </div>
                <div className="text-sm text-muted-foreground">On Waitlist</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">Upcoming Classes</TabsTrigger>
          <TabsTrigger value="history">Class History</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4 mt-6">
          {upcomingBookings && upcomingBookings.length > 0 ? (
            upcomingBookings.map((booking) => {
              const cancellationPolicy = getCancellationPolicy(booking);
              
              return (
                <Card key={booking.id} className="transition-all hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <div>
                            <h3 className="text-lg font-semibold">{booking.classes_schedule.class_name}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(booking.classes_schedule.class_date), 'EEE, MMM d')}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {format(new Date(`2000-01-01T${booking.classes_schedule.class_time}`), 'h:mm a')}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {booking.classes_schedule.instructor_name}
                              </div>
                              {booking.classes_schedule.room && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {booking.classes_schedule.room}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {getBookingStatusBadge(booking)}
                          
                          {booking.checked_in_at && (
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                              Checked In
                            </Badge>
                          )}
                        </div>

                        {/* Cancellation Policy Info */}
                        <div className="mt-3 text-xs text-muted-foreground">
                          {cancellationPolicy.canCancel ? (
                            <span className={cancellationPolicy.fee ? 'text-orange-600' : 'text-green-600'}>
                              {cancellationPolicy.message}
                            </span>
                          ) : (
                            <span className="text-red-600">{cancellationPolicy.message}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {canCancelBooking(booking) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to cancel your booking for {booking.classes_schedule.class_name}?
                                  {getCancellationPolicy(booking).fee && (
                                    <div className="mt-2 flex items-start gap-2 p-2 bg-orange-50 border border-orange-200 rounded">
                                      <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                                      <span className="text-sm text-orange-800">
                                        A late cancellation fee may apply as this is within 12 hours of the class.
                                      </span>
                                    </div>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleCancelBooking(booking.id, booking.classes_schedule.class_name)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Cancel Booking
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Upcoming Classes</h3>
                <p className="text-muted-foreground mb-4">
                  You don't have any upcoming class bookings. Ready to book your next class?
                </p>
                <Button>Browse Classes</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-6">
          {pastBookings.length > 0 ? (
            pastBookings.map((booking) => (
              <Card key={booking.id} className="transition-all hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div>
                          <h3 className="text-lg font-semibold">{booking.classes_schedule.class_name}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(booking.classes_schedule.class_date), 'EEE, MMM d, yyyy')}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {format(new Date(`2000-01-01T${booking.classes_schedule.class_time}`), 'h:mm a')}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {booking.classes_schedule.instructor_name}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {booking.checked_in_at ? (
                          <Badge variant="secondary" className="bg-green-50 text-green-700">
                            Attended
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600 border-red-300">
                            No Show
                          </Badge>
                        )}
                        
                        <span className="text-xs text-muted-foreground">
                          Booked on {format(new Date(booking.booking_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Class History</h3>
                <p className="text-muted-foreground">
                  Your attended classes will appear here after you start taking classes.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};