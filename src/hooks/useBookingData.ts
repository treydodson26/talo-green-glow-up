import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, endOfWeek, addDays, isSameDay, parseISO } from 'date-fns';

// Types
export interface ClassScheduleItem {
  id: string;
  class_name: string;
  instructor_name: string;
  class_date: string;
  class_time: string;
  room: string;
  max_capacity: number;
  current_bookings: number;
  waitlist_count: number;
  needs_substitute: boolean;
  spots_remaining: number;
  is_bookable: boolean;
  availability_status: 'available' | 'limited' | 'full' | 'waitlist';
}

export interface CustomerBooking {
  id: string;
  customer_id: number;
  class_id: string;
  booking_status: 'confirmed' | 'waitlisted' | 'cancelled';
  is_waitlisted: boolean;
  waitlist_position: number | null;
  checked_in_at: string | null;
  booking_date: string;
  cancellation_reason: string | null;
  classes_schedule: ClassScheduleItem;
}

export interface BookingRequest {
  customer_id: number;
  class_id: string;
  booking_status?: string;
  is_waitlisted?: boolean;
}

// Hooks
export const useWeeklySchedule = (weekStart?: Date) => {
  const currentWeekStart = weekStart || startOfWeek(new Date());
  const weekEnd = endOfWeek(currentWeekStart);

  return useQuery({
    queryKey: ['weeklySchedule', format(currentWeekStart, 'yyyy-MM-dd')],
    queryFn: async (): Promise<ClassScheduleItem[]> => {
      const { data, error } = await supabase
        .from('classes_schedule')
        .select('*')
        .gte('class_date', format(currentWeekStart, 'yyyy-MM-dd'))
        .lte('class_date', format(weekEnd, 'yyyy-MM-dd'))
        .order('class_date', { ascending: true })
        .order('class_time', { ascending: true });

      if (error) throw error;

      return (data || []).map(classItem => {
        const spotsRemaining = classItem.max_capacity - classItem.current_bookings;
        const now = new Date();
        const classDateTime = new Date(`${classItem.class_date}T${classItem.class_time}`);
        const hoursUntilClass = (classDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        // Business rule: bookable up to 2 hours before start time
        const isBookable = hoursUntilClass > 2;
        
        let availabilityStatus: ClassScheduleItem['availability_status'] = 'available';
        if (spotsRemaining <= 0) {
          availabilityStatus = 'full';
        } else if (spotsRemaining <= 3) {
          availabilityStatus = 'limited';
        }
        
        if (classItem.waitlist_count > 0 && spotsRemaining <= 0) {
          availabilityStatus = 'waitlist';
        }

        return {
          ...classItem,
          spots_remaining: Math.max(0, spotsRemaining),
          is_bookable: isBookable,
          availability_status: availabilityStatus,
        };
      });
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // 5 minutes
  });
};

export const useDailySchedule = (date: Date) => {
  return useQuery({
    queryKey: ['dailySchedule', format(date, 'yyyy-MM-dd')],
    queryFn: async (): Promise<ClassScheduleItem[]> => {
      const { data, error } = await supabase
        .from('classes_schedule')
        .select('*')
        .eq('class_date', format(date, 'yyyy-MM-dd'))
        .order('class_time', { ascending: true });

      if (error) throw error;

      return (data || []).map(classItem => {
        const spotsRemaining = classItem.max_capacity - classItem.current_bookings;
        const now = new Date();
        const classDateTime = new Date(`${classItem.class_date}T${classItem.class_time}`);
        const hoursUntilClass = (classDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        const isBookable = hoursUntilClass > 2;
        
        let availabilityStatus: ClassScheduleItem['availability_status'] = 'available';
        if (spotsRemaining <= 0) {
          availabilityStatus = 'full';
        } else if (spotsRemaining <= 3) {
          availabilityStatus = 'limited';
        }
        
        if (classItem.waitlist_count > 0 && spotsRemaining <= 0) {
          availabilityStatus = 'waitlist';
        }

        return {
          ...classItem,
          spots_remaining: Math.max(0, spotsRemaining),
          is_bookable: isBookable,
          availability_status: availabilityStatus,
        };
      });
    },
    staleTime: 1000 * 60 * 1, // 1 minute
    refetchInterval: 1000 * 60 * 2, // 2 minutes
  });
};

export const useCustomerBookings = (customerId: number) => {
  return useQuery({
    queryKey: ['customerBookings', customerId],
    queryFn: async (): Promise<CustomerBooking[]> => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          classes_schedule (
            id,
            class_name,
            instructor_name,
            class_date,
            class_time,
            room,
            max_capacity,
            current_bookings,
            waitlist_count,
            needs_substitute
          )
        `)
        .eq('customer_id', customerId)
        .order('booking_date', { ascending: false });

      if (error) throw error;

      return (data || []).map(booking => ({
        ...booking,
        classes_schedule: {
          ...booking.classes_schedule,
          spots_remaining: booking.classes_schedule.max_capacity - booking.classes_schedule.current_bookings,
          is_bookable: true,
          availability_status: 'available' as const,
        }
      })) as CustomerBooking[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useUpcomingBookings = (customerId: number) => {
  return useQuery({
    queryKey: ['upcomingBookings', customerId],
    queryFn: async (): Promise<CustomerBooking[]> => {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          classes_schedule (
            id,
            class_name,
            instructor_name,
            class_date,
            class_time,
            room,
            max_capacity,
            current_bookings,
            waitlist_count,
            needs_substitute
          )
        `)
        .eq('customer_id', customerId)
        .gte('classes_schedule.class_date', today)
        .in('booking_status', ['confirmed', 'waitlisted'])
        .order('classes_schedule.class_date', { ascending: true })
        .order('classes_schedule.class_time', { ascending: true });

      if (error) throw error;

      return (data || []).map(booking => ({
        ...booking,
        classes_schedule: {
          ...booking.classes_schedule,
          spots_remaining: booking.classes_schedule.max_capacity - booking.classes_schedule.current_bookings,
          is_bookable: true,
          availability_status: 'available' as const,
        }
      })) as CustomerBooking[];
    },
    staleTime: 1000 * 60 * 1, // 1 minute
    refetchInterval: 1000 * 60 * 3, // 3 minutes
  });
};

// Mutations
export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingRequest: BookingRequest) => {
      // First check if class has available spots
      const { data: classData, error: classError } = await supabase
        .from('classes_schedule')
        .select('max_capacity, current_bookings, waitlist_count')
        .eq('id', bookingRequest.class_id)
        .single();

      if (classError) throw classError;

      const spotsAvailable = classData.max_capacity - classData.current_bookings;
      const shouldWaitlist = spotsAvailable <= 0;

      // Create the booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert([{
          customer_id: bookingRequest.customer_id,
          class_id: bookingRequest.class_id,
          booking_status: shouldWaitlist ? 'waitlisted' : 'confirmed',
          is_waitlisted: shouldWaitlist,
          waitlist_position: shouldWaitlist ? classData.waitlist_count + 1 : null,
          booking_date: new Date().toISOString(),
        }])
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Update class counters
      const updateData: any = {};
      if (shouldWaitlist) {
        updateData.waitlist_count = classData.waitlist_count + 1;
      } else {
        updateData.current_bookings = classData.current_bookings + 1;
      }

      const { error: updateError } = await supabase
        .from('classes_schedule')
        .update(updateData)
        .eq('id', bookingRequest.class_id);

      if (updateError) throw updateError;

      return { booking, wasWaitlisted: shouldWaitlist };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeklySchedule'] });
      queryClient.invalidateQueries({ queryKey: ['dailySchedule'] });
      queryClient.invalidateQueries({ queryKey: ['customerBookings'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingBookings'] });
    },
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason?: string }) => {
      // Get booking details first
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*, classes_schedule(*)')
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;

      // Cancel the booking
      const { data: cancelledBooking, error: cancelError } = await supabase
        .from('bookings')
        .update({
          booking_status: 'cancelled',
          cancellation_reason: reason || 'Customer cancellation',
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (cancelError) throw cancelError;

      // Update class counters
      const updateData: any = {};
      if (booking.is_waitlisted) {
        updateData.waitlist_count = Math.max(0, booking.classes_schedule.waitlist_count - 1);
      } else {
        updateData.current_bookings = Math.max(0, booking.classes_schedule.current_bookings - 1);
      }

      const { error: updateError } = await supabase
        .from('classes_schedule')
        .update(updateData)
        .eq('id', booking.class_id);

      if (updateError) throw updateError;

      return cancelledBooking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeklySchedule'] });
      queryClient.invalidateQueries({ queryKey: ['dailySchedule'] });
      queryClient.invalidateQueries({ queryKey: ['customerBookings'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingBookings'] });
    },
  });
};