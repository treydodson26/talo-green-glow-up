import { useQuery } from "@tanstack/react-query";
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