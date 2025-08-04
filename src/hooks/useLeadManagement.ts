import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CustomerSegment {
  id: string;
  customer_id: number;
  segment_type: 'prospect' | 'drop_in' | 'intro_offer';
  assigned_at: string;
  manually_assigned: boolean;
  total_spend: number;
  last_visit_date: string;
  notes?: string;
  customers?: {
    first_name: string;
    last_name: string;
    client_email: string;
    phone_number?: string;
  };
}

export interface EmailTemplate {
  id: string;
  template_name: string;
  template_type: 'prospect_welcome' | 'drop_in_followup' | 'intro_day_0' | 'intro_day_10' | 'intro_day_28';
  subject: string;
  content: string;
  variables: string[];
  is_active: boolean;
}

export interface EmailQueue {
  id: string;
  customer_id: number;
  template_id: string;
  segment_type: string;
  scheduled_for: string;
  sent_at?: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  error_message?: string;
  email_data?: any;
}

export interface SegmentAnalytics {
  segment_type: string;
  total_customers: number;
  emails_sent: number;
  emails_opened: number;
  emails_clicked: number;
  conversions: number;
}

// Get all customer segments with customer details
export const useCustomerSegments = () => {
  return useQuery({
    queryKey: ["customer-segments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_segments")
        .select(`
          *,
          customers (
            first_name,
            last_name,
            client_email,
            phone_number,
            status,
            created_at
          )
        `)
        .order("assigned_at", { ascending: false });

      if (error) throw error;
      return data as CustomerSegment[];
    },
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes
  });
};

// Get segment statistics
export const useSegmentAnalytics = () => {
  return useQuery({
    queryKey: ["segment-analytics"],
    queryFn: async () => {
      // Get current segment counts
      const { data: segmentCounts, error: segmentError } = await supabase
        .from("customer_segments")
        .select("segment_type, customer_id")
        .order("segment_type");

      if (segmentError) throw segmentError;

      // Group by segment type
      const analytics = segmentCounts?.reduce((acc, item) => {
        const existing = acc.find(a => a.segment_type === item.segment_type);
        if (existing) {
          existing.total_customers += 1;
        } else {
          acc.push({
            segment_type: item.segment_type,
            total_customers: 1,
            emails_sent: 0,
            emails_opened: 0,
            emails_clicked: 0,
            conversions: 0,
          });
        }
        return acc;
      }, [] as SegmentAnalytics[]) || [];

      // Get email stats from email_tracking
      const { data: emailStats } = await supabase
        .from("email_tracking")
        .select("template_type")
        .gte("sent_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

      // Add email stats to analytics
      emailStats?.forEach(email => {
        const segmentType = email.template_type.includes('prospect') ? 'prospect' :
                           email.template_type.includes('drop_in') ? 'drop_in' : 'intro_offer';
        const segment = analytics.find(a => a.segment_type === segmentType);
        if (segment) {
          segment.emails_sent += 1;
        }
      });

      return analytics;
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
};

// Get email templates
export const useEmailTemplates = () => {
  return useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .eq("is_active", true)
        .order("template_type");

      if (error) throw error;
      return data as EmailTemplate[];
    },
  });
};

// Get email queue
export const useEmailQueue = () => {
  return useQuery({
    queryKey: ["email-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_queue")
        .select(`
          *,
          customers (
            first_name,
            last_name,
            client_email
          ),
          email_templates (
            template_name,
            subject
          )
        `)
        .order("scheduled_for", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
  });
};

// Assign customer to segment
export const useAssignSegment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      customerId,
      segmentType,
      totalSpend = 0,
      notes = ""
    }: {
      customerId: number;
      segmentType: 'prospect' | 'drop_in' | 'intro_offer';
      totalSpend?: number;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("customer_segments")
        .upsert({
          customer_id: customerId,
          segment_type: segmentType,
          total_spend: totalSpend,
          manually_assigned: true,
          notes,
          assigned_at: new Date().toISOString(),
        }, {
          onConflict: 'customer_id,segment_type'
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-segments"] });
      queryClient.invalidateQueries({ queryKey: ["segment-analytics"] });
      toast({
        title: "Success",
        description: "Customer segment updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update segment: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

// Update email template
export const useUpdateEmailTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      templateId,
      subject,
      content,
    }: {
      templateId: string;
      subject: string;
      content: string;
    }) => {
      const { data, error } = await supabase
        .from("email_templates")
        .update({
          subject,
          content,
          updated_at: new Date().toISOString(),
        })
        .eq("id", templateId);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({
        title: "Success",
        description: "Email template updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update template: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

// Queue email for sending
export const useQueueEmail = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      customerId,
      templateId,
      segmentType,
      scheduledFor = new Date(),
    }: {
      customerId: number;
      templateId: string;
      segmentType: string;
      scheduledFor?: Date;
    }) => {
      // Check if email already sent to prevent duplicates
      const { data: existingEmail } = await supabase
        .from("email_tracking")
        .select("id")
        .eq("customer_id", customerId)
        .eq("template_type", segmentType)
        .gte("sent_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

      if (existingEmail && existingEmail.length > 0) {
        throw new Error("Email already sent to this customer recently");
      }

      const { data, error } = await supabase
        .from("email_queue")
        .insert({
          customer_id: customerId,
          template_id: templateId,
          segment_type: segmentType,
          scheduled_for: scheduledFor.toISOString(),
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-queue"] });
      toast({
        title: "Success",
        description: "Email queued for sending",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to queue email: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

// Bulk process customers for segmentation
export const useProcessCustomers = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (customerIds: number[]) => {
      const results = [];
      
      for (const customerId of customerIds) {
        try {
          const { data, error } = await supabase
            .rpc("assign_customer_segment", { customer_id_param: customerId });

          if (error) throw error;
          results.push({ customerId, segment: data, success: true });
        } catch (error) {
          results.push({ 
            customerId, 
            error: error.message, 
            success: false 
          });
        }
      }

      return results;
    },
    onSuccess: (results) => {
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      queryClient.invalidateQueries({ queryKey: ["customer-segments"] });
      queryClient.invalidateQueries({ queryKey: ["segment-analytics"] });
      
      toast({
        title: "Processing Complete",
        description: `${successful} customers processed successfully. ${failed} failed.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to process customers: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};