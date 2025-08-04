import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardMetrics {
  todays_classes: number;
  avg_capacity_today: number;
  waitlisted_classes: number;
  active_intro_offers: number;
  ending_this_week: number;
  revenue_this_month: number;
  revenue_last_month: number;
  new_leads_week: number;
}

interface TodaysClass {
  id: string;
  class_time: string;
  class_name: string;
  instructor_name: string;
  max_capacity: number;
  current_bookings: number;
  waitlist_count: number;
  room: string;
  needs_substitute: boolean;
}

interface IntroCustomer {
  id: number;
  first_name: string;
  last_name: string;
  client_email: string;
  phone_number: string;
  first_class_date: string;
  intro_end_date: string;
  customer_segment: string;
  source: string;
}

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  last_contact_date: string;
  follow_up_count: number;
}

interface ActivityItem {
  id: string;
  type: 'checkin' | 'signup' | 'booking' | 'payment' | 'message';
  title: string;
  description: string;
  timestamp: string;
  user: string;
  icon?: string;
}

interface LiveMetrics {
  checkins_today: number;
  revenue_today: number;
  new_signups_today: number;
  bookings_today: number;
}

interface ClassHeatMapData {
  time: string;
  day: string;
  bookings: number;
  capacity: number;
  utilization: number;
}

export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dashboard_metrics")
        .select("*")
        .single();

      if (error) throw error;
      return data as DashboardMetrics;
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
};

export const useTodaysClasses = () => {
  return useQuery({
    queryKey: ["todays-classes"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from("classes_schedule")
        .select("*")
        .eq("class_date", today)
        .order("class_time");

      if (error) throw error;
      return data as TodaysClass[];
    },
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes
  });
};

export const useIntroCustomers = () => {
  return useQuery({
    queryKey: ["intro-customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("status", "intro_trial")
        .gte("intro_end_date", new Date().toISOString().split('T')[0])
        .order("first_class_date");

      if (error) throw error;
      return data as IntroCustomer[];
    },
    refetchInterval: 2 * 60 * 1000,
  });
};

export const useRecentLeads = () => {
  return useQuery({
    queryKey: ["recent-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .in("status", ["new", "follow_up_needed"])
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as Lead[];
    },
    refetchInterval: 2 * 60 * 1000,
  });
};

export const useRecentCommunications = () => {
  return useQuery({
    queryKey: ["recent-communications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communications_log")
        .select(`
          *,
          customers (
            first_name,
            last_name
          )
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
  });
};

// Real-time live metrics with subscriptions
export const useLiveMetrics = () => {
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics>({
    checkins_today: 0,
    revenue_today: 0,
    new_signups_today: 0,
    bookings_today: 0,
  });

  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["live-metrics"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's check-ins
      const { count: checkins } = await supabase
        .from("bookings")
        .select("*", { count: 'exact', head: true })
        .not("checked_in_at", "is", null)
        .gte("checked_in_at", `${today}T00:00:00`);

      // Get today's bookings
      const { count: bookings } = await supabase
        .from("bookings")
        .select("*", { count: 'exact', head: true })
        .gte("booking_date", `${today}T00:00:00`);

      // Get today's new customers
      const { count: signups } = await supabase
        .from("customers")
        .select("*", { count: 'exact', head: true })
        .gte("created_at", `${today}T00:00:00`);

      // Calculate today's revenue (placeholder - would integrate with payment system)
      const revenue = Math.random() * 2000 + 500; // Mock revenue

      const metrics = {
        checkins_today: checkins || 0,
        revenue_today: revenue,
        new_signups_today: signups || 0,
        bookings_today: bookings || 0,
      };

      setLiveMetrics(metrics);
      return metrics;
    },
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
  });

  // Set up real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["live-metrics"] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customers'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["live-metrics"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { ...query, data: liveMetrics };
};

// Real-time activity feed
export const useActivityFeed = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["activity-feed"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Get recent bookings
      const { data: recentBookings } = await supabase
        .from("bookings")
        .select(`
          *,
          customers (first_name, last_name),
          classes_schedule (class_name, class_time)
        `)
        .gte("booking_date", `${today}T00:00:00`)
        .order("booking_date", { ascending: false })
        .limit(5);

      // Get recent check-ins
      const { data: recentCheckins } = await supabase
        .from("bookings")
        .select(`
          *,
          customers (first_name, last_name),
          classes_schedule (class_name)
        `)
        .not("checked_in_at", "is", null)
        .gte("checked_in_at", `${today}T00:00:00`)
        .order("checked_in_at", { ascending: false })
        .limit(5);

      // Get new customers
      const { data: newCustomers } = await supabase
        .from("customers")
        .select("*")
        .gte("created_at", `${today}T00:00:00`)
        .order("created_at", { ascending: false })
        .limit(3);

      const activityItems: ActivityItem[] = [];

      // Process bookings
      recentBookings?.forEach(booking => {
        activityItems.push({
          id: `booking-${booking.id}`,
          type: 'booking',
          title: 'New Class Booking',
          description: `${booking.customers?.first_name} ${booking.customers?.last_name} booked ${booking.classes_schedule?.class_name}`,
          timestamp: booking.booking_date,
          user: `${booking.customers?.first_name} ${booking.customers?.last_name}`,
        });
      });

      // Process check-ins
      recentCheckins?.forEach(checkin => {
        activityItems.push({
          id: `checkin-${checkin.id}`,
          type: 'checkin',
          title: 'Class Check-in',
          description: `${checkin.customers?.first_name} ${checkin.customers?.last_name} checked into ${checkin.classes_schedule?.class_name}`,
          timestamp: checkin.checked_in_at,
          user: `${checkin.customers?.first_name} ${checkin.customers?.last_name}`,
        });
      });

      // Process new signups
      newCustomers?.forEach(customer => {
        activityItems.push({
          id: `signup-${customer.id}`,
          type: 'signup',
          title: 'New Member Signup',
          description: `${customer.first_name} ${customer.last_name} joined the studio`,
          timestamp: customer.created_at,
          user: `${customer.first_name} ${customer.last_name}`,
        });
      });

      // Sort by timestamp
      const sortedActivities = activityItems
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

      setActivities(sortedActivities);
      return sortedActivities;
    },
    refetchInterval: 30 * 1000,
  });

  // Real-time subscriptions for activity feed
  useEffect(() => {
    const channel = supabase
      .channel('activity-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["activity-feed"] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customers'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["activity-feed"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { ...query, data: activities };
};

// Weekly class heat map data
export const useClassHeatMap = () => {
  return useQuery({
    queryKey: ["class-heatmap"],
    queryFn: async () => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const { data: classData } = await supabase
        .from("classes_schedule")
        .select(`
          class_time,
          class_date,
          current_bookings,
          max_capacity
        `)
        .gte("class_date", oneWeekAgo.toISOString().split('T')[0])
        .order("class_date")
        .order("class_time");

      const heatMapData: ClassHeatMapData[] = classData?.map(cls => ({
        time: cls.class_time,
        day: new Date(cls.class_date).toLocaleDateString('en-US', { weekday: 'short' }),
        bookings: cls.current_bookings,
        capacity: cls.max_capacity,
        utilization: (cls.current_bookings / cls.max_capacity) * 100,
      })) || [];

      return heatMapData;
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
};