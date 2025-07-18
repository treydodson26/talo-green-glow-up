export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      communications_log: {
        Row: {
          content: string
          created_at: string | null
          customer_id: number
          delivered_at: string | null
          delivery_status: string | null
          email_message_id: string | null
          error_message: string | null
          id: number
          message_sequence_id: number
          message_type: string
          read_at: string | null
          recipient_email: string | null
          recipient_phone: string | null
          sent_at: string | null
          subject: string | null
          updated_at: string | null
          whatsapp_message_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          customer_id: number
          delivered_at?: string | null
          delivery_status?: string | null
          email_message_id?: string | null
          error_message?: string | null
          id?: number
          message_sequence_id: number
          message_type: string
          read_at?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          subject?: string | null
          updated_at?: string | null
          whatsapp_message_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          customer_id?: number
          delivered_at?: string | null
          delivery_status?: string | null
          email_message_id?: string | null
          error_message?: string | null
          id?: number
          message_sequence_id?: number
          message_type?: string
          read_at?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          subject?: string | null
          updated_at?: string | null
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communications_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "intro_offer_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_log_message_sequence_id_fkey"
            columns: ["message_sequence_id"]
            isOneToOne: false
            referencedRelation: "message_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      csv_imports: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_details: Json | null
          failed_records: number | null
          filename: string
          id: number
          new_records: number
          processing_time_ms: number | null
          started_at: string | null
          status: string | null
          total_records: number
          updated_records: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_details?: Json | null
          failed_records?: number | null
          filename: string
          id?: number
          new_records: number
          processing_time_ms?: number | null
          started_at?: string | null
          status?: string | null
          total_records: number
          updated_records: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_details?: Json | null
          failed_records?: number | null
          filename?: string
          id?: number
          new_records?: number
          processing_time_ms?: number | null
          started_at?: string | null
          status?: string | null
          total_records?: number
          updated_records?: number
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          agree_to_liability_waiver: boolean | null
          birthday: string | null
          client_email: string
          client_name: string
          created_at: string | null
          first_name: string
          first_seen: string | null
          id: number
          last_name: string
          last_seen: string | null
          marketing_email_opt_in: boolean | null
          marketing_text_opt_in: boolean | null
          phone_number: string | null
          pre_arketa_milestone_count: number | null
          tags: string | null
          transactional_text_opt_in: boolean | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          agree_to_liability_waiver?: boolean | null
          birthday?: string | null
          client_email: string
          client_name: string
          created_at?: string | null
          first_name: string
          first_seen?: string | null
          id?: number
          last_name: string
          last_seen?: string | null
          marketing_email_opt_in?: boolean | null
          marketing_text_opt_in?: boolean | null
          phone_number?: string | null
          pre_arketa_milestone_count?: number | null
          tags?: string | null
          transactional_text_opt_in?: boolean | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          agree_to_liability_waiver?: boolean | null
          birthday?: string | null
          client_email?: string
          client_name?: string
          created_at?: string | null
          first_name?: string
          first_seen?: string | null
          id?: number
          last_name?: string
          last_seen?: string | null
          marketing_email_opt_in?: boolean | null
          marketing_text_opt_in?: boolean | null
          phone_number?: string | null
          pre_arketa_milestone_count?: number | null
          tags?: string | null
          transactional_text_opt_in?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      message_sequences: {
        Row: {
          active: boolean | null
          content: string
          created_at: string | null
          day: number
          id: number
          message_type: string
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          content: string
          created_at?: string | null
          day: number
          id?: number
          message_type: string
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          content?: string
          created_at?: string | null
          day?: number
          id?: number
          message_type?: string
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      customers_by_stage: {
        Row: {
          customer_count: number | null
          customers: Json | null
          stage: string | null
        }
        Relationships: []
      }
      intro_offer_customers: {
        Row: {
          address: string | null
          agree_to_liability_waiver: boolean | null
          birthday: string | null
          client_email: string | null
          client_name: string | null
          created_at: string | null
          current_day: number | null
          days_remaining: number | null
          first_name: string | null
          first_seen: string | null
          id: number | null
          intro_end_date: string | null
          intro_start_date: string | null
          intro_status: string | null
          last_name: string | null
          last_seen: string | null
          marketing_email_opt_in: boolean | null
          marketing_text_opt_in: boolean | null
          phone_number: string | null
          pre_arketa_milestone_count: number | null
          tags: string | null
          transactional_text_opt_in: boolean | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          agree_to_liability_waiver?: boolean | null
          birthday?: string | null
          client_email?: string | null
          client_name?: string | null
          created_at?: string | null
          current_day?: never
          days_remaining?: never
          first_name?: string | null
          first_seen?: string | null
          id?: number | null
          intro_end_date?: never
          intro_start_date?: string | null
          intro_status?: never
          last_name?: string | null
          last_seen?: string | null
          marketing_email_opt_in?: boolean | null
          marketing_text_opt_in?: boolean | null
          phone_number?: string | null
          pre_arketa_milestone_count?: number | null
          tags?: string | null
          transactional_text_opt_in?: boolean | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          agree_to_liability_waiver?: boolean | null
          birthday?: string | null
          client_email?: string | null
          client_name?: string | null
          created_at?: string | null
          current_day?: never
          days_remaining?: never
          first_name?: string | null
          first_seen?: string | null
          id?: number | null
          intro_end_date?: never
          intro_start_date?: string | null
          intro_status?: never
          last_name?: string | null
          last_seen?: string | null
          marketing_email_opt_in?: boolean | null
          marketing_text_opt_in?: boolean | null
          phone_number?: string | null
          pre_arketa_milestone_count?: number | null
          tags?: string | null
          transactional_text_opt_in?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
