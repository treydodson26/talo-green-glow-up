import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, endOfWeek, isToday, isTomorrow } from 'date-fns';

// Types
export interface InstructorClass {
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
}

export interface InstructorMetrics {
  totalStudents: number;
  classesThisWeek: number;
  hoursThisWeek: number;
  averageRating: number;
  totalClasses: number;
  attendanceRate: number;
}

export interface ClassWithBookings extends InstructorClass {
  bookings: Array<{
    id: string;
    customer_id: number;
    booking_status: string;
    checked_in_at: string | null;
    customers: {
      first_name: string;
      last_name: string;
      client_email: string;
      phone_number: string;
    };
  }>;
}

// Hooks
export const useInstructorClasses = (instructorName?: string) => {
  return useQuery({
    queryKey: ['instructorClasses', instructorName],
    queryFn: async () => {
      const today = new Date();
      const weekStart = startOfWeek(today);
      const weekEnd = endOfWeek(today);

      let query = supabase
        .from('classes_schedule')
        .select('*')
        .gte('class_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('class_date', format(weekEnd, 'yyyy-MM-dd'))
        .order('class_date', { ascending: true })
        .order('class_time', { ascending: true });

      if (instructorName) {
        query = query.eq('instructor_name', instructorName);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as InstructorClass[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useUpcomingClasses = (instructorName?: string) => {
  return useQuery({
    queryKey: ['upcomingClasses', instructorName],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const tomorrow = format(new Date(Date.now() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

      let query = supabase
        .from('classes_schedule')
        .select('*')
        .in('class_date', [today, tomorrow])
        .order('class_date', { ascending: true })
        .order('class_time', { ascending: true });

      if (instructorName) {
        query = query.eq('instructor_name', instructorName);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data as InstructorClass[]).map(cls => ({
        ...cls,
        isToday: isToday(new Date(cls.class_date)),
        isTomorrow: isTomorrow(new Date(cls.class_date)),
      }));
    },
    refetchInterval: 1000 * 60, // 1 minute
  });
};

export const useInstructorMetrics = (instructorName?: string) => {
  return useQuery({
    queryKey: ['instructorMetrics', instructorName],
    queryFn: async (): Promise<InstructorMetrics> => {
      const today = new Date();
      const weekStart = startOfWeek(today);
      const weekEnd = endOfWeek(today);

      // Get classes this week
      let classesQuery = supabase
        .from('classes_schedule')
        .select('*')
        .gte('class_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('class_date', format(weekEnd, 'yyyy-MM-dd'));

      if (instructorName) {
        classesQuery = classesQuery.eq('instructor_name', instructorName);
      }

      const { data: weekClasses, error: classesError } = await classesQuery;
      if (classesError) throw classesError;

      // Get total students (unique customers who have bookings)
      let studentsQuery = supabase
        .from('bookings')
        .select(`
          customer_id,
          classes_schedule!inner(instructor_name)
        `)
        .eq('booking_status', 'confirmed');

      if (instructorName) {
        studentsQuery = studentsQuery.eq('classes_schedule.instructor_name', instructorName);
      }

      const { data: studentBookings, error: studentsError } = await studentsQuery;
      if (studentsError) throw studentsError;

      const uniqueStudents = new Set(studentBookings?.map(b => b.customer_id) || []);

      // Calculate hours this week (assuming 1 hour per class)
      const hoursThisWeek = weekClasses?.length || 0;

      // Mock rating for now (would come from a reviews table)
      const averageRating = 4.8;

      return {
        totalStudents: uniqueStudents.size,
        classesThisWeek: weekClasses?.length || 0,
        hoursThisWeek,
        averageRating,
        totalClasses: weekClasses?.length || 0,
        attendanceRate: 85, // Mock value
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useClassWithBookings = (classId: string) => {
  return useQuery({
    queryKey: ['classWithBookings', classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes_schedule')
        .select(`
          *,
          bookings (
            id,
            customer_id,
            booking_status,
            checked_in_at,
            customers (
              first_name,
              last_name,
              client_email,
              phone_number
            )
          )
        `)
        .eq('id', classId)
        .single();

      if (error) throw error;
      return data as ClassWithBookings;
    },
  });
};

// Mutations
export const useCreateClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (classData: Omit<InstructorClass, 'id'>) => {
      const { data, error } = await supabase
        .from('classes_schedule')
        .insert([classData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructorClasses'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingClasses'] });
      queryClient.invalidateQueries({ queryKey: ['instructorMetrics'] });
    },
  });
};

export const useUpdateClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InstructorClass> & { id: string }) => {
      const { data, error } = await supabase
        .from('classes_schedule')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructorClasses'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingClasses'] });
      queryClient.invalidateQueries({ queryKey: ['classWithBookings'] });
    },
  });
};

export const useCheckInStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { data, error } = await supabase
        .from('bookings')
        .update({ checked_in_at: new Date().toISOString() })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classWithBookings'] });
    },
  });
};