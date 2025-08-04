import { useState } from 'react';
import { format } from 'date-fns';
import { Clock, Users, MapPin, Calendar, Star, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCreateBooking, ClassScheduleItem } from '@/hooks/useBookingData';
import { useToast } from '@/hooks/use-toast';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

interface ClassDetailModalProps {
  classId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ClassDetailModal = ({ classId, open, onOpenChange }: ClassDetailModalProps) => {
  const [isBooking, setIsBooking] = useState(false);
  const { toast } = useToast();
  const createBooking = useCreateBooking();

  // Mock customer ID - in real app this would come from auth context
  const customerId = 1;

  const { data: classDetails, isLoading } = useQuery({
    queryKey: ['classDetails', classId],
    queryFn: async (): Promise<ClassScheduleItem & { description?: string; instructor_bio?: string }> => {
      const { data, error } = await supabase
        .from('classes_schedule')
        .select('*')
        .eq('id', classId)
        .single();

      if (error) throw error;

      const spotsRemaining = data.max_capacity - data.current_bookings;
      const now = new Date();
      const classDateTime = new Date(`${data.class_date}T${data.class_time}`);
      const hoursUntilClass = (classDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      const isBookable = hoursUntilClass > 2;
      
      let availabilityStatus: ClassScheduleItem['availability_status'] = 'available';
      if (spotsRemaining <= 0) {
        availabilityStatus = 'full';
      } else if (spotsRemaining <= 3) {
        availabilityStatus = 'limited';
      }
      
      if (data.waitlist_count > 0 && spotsRemaining <= 0) {
        availabilityStatus = 'waitlist';
      }

      return {
        ...data,
        spots_remaining: Math.max(0, spotsRemaining),
        is_bookable: isBookable,
        availability_status: availabilityStatus,
        description: getClassDescription(data.class_name),
        instructor_bio: getInstructorBio(data.instructor_name),
      };
    },
    enabled: open && !!classId,
  });

  const handleBooking = async () => {
    if (!classDetails) return;

    setIsBooking(true);
    try {
      const result = await createBooking.mutateAsync({
        customer_id: customerId,
        class_id: classId,
      });

      if (result.wasWaitlisted) {
        toast({
          title: 'Added to Waitlist',
          description: `You've been added to the waitlist for ${classDetails.class_name}. We'll notify you if a spot opens up.`,
        });
      } else {
        toast({
          title: 'Booking Confirmed!',
          description: `Your spot in ${classDetails.class_name} has been confirmed.`,
        });
      }
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Booking Failed',
        description: 'Unable to book this class. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsBooking(false);
    }
  };

  const getAvailabilityIcon = (status: string) => {
    switch (status) {
      case 'available': return <div className="w-3 h-3 bg-green-500 rounded-full" />;
      case 'limited': return <div className="w-3 h-3 bg-yellow-500 rounded-full" />;
      case 'full': return <div className="w-3 h-3 bg-red-500 rounded-full" />;
      case 'waitlist': return <div className="w-3 h-3 bg-orange-500 rounded-full" />;
      default: return <div className="w-3 h-3 bg-gray-500 rounded-full" />;
    }
  };

  const getButtonText = () => {
    if (!classDetails?.is_bookable) return 'Booking Closed';
    if (classDetails?.availability_status === 'full' || classDetails?.availability_status === 'waitlist') {
      return 'Join Waitlist';
    }
    return 'Book Class';
  };

  const getButtonVariant = () => {
    if (!classDetails?.is_bookable) return 'outline';
    if (classDetails?.availability_status === 'full' || classDetails?.availability_status === 'waitlist') {
      return 'outline';
    }
    return 'default';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="space-y-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-12" />
            </div>
          </div>
        ) : classDetails ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {getAvailabilityIcon(classDetails.availability_status)}
                {classDetails.class_name}
              </DialogTitle>
              <DialogDescription>
                {format(new Date(classDetails.class_date), 'EEEE, MMMM d, yyyy')} at{' '}
                {format(new Date(`2000-01-01T${classDetails.class_time}`), 'h:mm a')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Class Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{classDetails.instructor_name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{classDetails.room || 'Main Studio'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>60 minutes</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Capacity: </span>
                    <span className="font-medium">
                      {classDetails.current_bookings}/{classDetails.max_capacity}
                    </span>
                  </div>
                  
                  {classDetails.spots_remaining > 0 ? (
                    <Badge variant="secondary" className="text-green-700 bg-green-50">
                      {classDetails.spots_remaining} spots available
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      Full
                    </Badge>
                  )}
                  
                  {classDetails.waitlist_count > 0 && (
                    <div className="text-sm text-orange-600">
                      {classDetails.waitlist_count} on waitlist
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Class Description */}
              {classDetails.description && (
                <div>
                  <h4 className="font-medium mb-2">About This Class</h4>
                  <p className="text-sm text-muted-foreground">
                    {classDetails.description}
                  </p>
                </div>
              )}

              {/* Instructor Bio */}
              {classDetails.instructor_bio && (
                <div>
                  <h4 className="font-medium mb-2">Instructor</h4>
                  <p className="text-sm text-muted-foreground">
                    {classDetails.instructor_bio}
                  </p>
                </div>
              )}

              {/* Warnings */}
              {!classDetails.is_bookable && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Booking Closed</p>
                    <p className="text-yellow-700">Classes cannot be booked within 2 hours of start time.</p>
                  </div>
                </div>
              )}

              {classDetails.needs_substitute && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Users className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800">Substitute Instructor</p>
                    <p className="text-blue-700">This class may have a substitute instructor.</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  variant={getButtonVariant()}
                  onClick={handleBooking}
                  disabled={!classDetails.is_bookable || isBooking}
                  className="flex-1"
                >
                  {isBooking ? 'Booking...' : getButtonText()}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Class details not available</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Helper functions for mock data
const getClassDescription = (className: string): string => {
  const descriptions: Record<string, string> = {
    'Yoga Flow': 'A dynamic flow class linking breath and movement. Perfect for building strength and flexibility while finding your flow.',
    'HIIT Training': 'High-intensity interval training designed to boost metabolism and build lean muscle. Get ready to sweat!',
    'Pilates Core': 'Focus on core strength, stability, and posture. Low-impact movements that challenge your entire body.',
    'Restorative Yoga': 'Gentle, relaxing poses held for longer periods. Perfect for stress relief and deep relaxation.',
    'Power Vinyasa': 'A challenging flow class that builds heat and strength. For experienced practitioners ready for a workout.',
  };
  
  for (const [key, description] of Object.entries(descriptions)) {
    if (className.includes(key)) {
      return description;
    }
  }
  
  return 'A rejuvenating yoga class designed to strengthen, stretch, and center your mind and body.';
};

const getInstructorBio = (instructorName: string): string => {
  const bios: Record<string, string> = {
    'Sarah Johnson': 'Sarah has been teaching yoga for over 8 years and specializes in vinyasa flow and alignment-based practice.',
    'Mike Chen': 'Mike combines his background in athletics with mindful movement, creating challenging yet accessible classes.',
    'Emma Rodriguez': 'Emma brings a gentle and nurturing approach to her classes, perfect for all levels of practitioners.',
    'Default Instructor': 'An experienced instructor dedicated to helping students find balance, strength, and peace through yoga practice.',
  };
  
  return bios[instructorName] || bios['Default Instructor'];
};