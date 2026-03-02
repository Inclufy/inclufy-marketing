export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          plan: string
          settings: Json
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          plan?: string
          settings?: Json
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          plan?: string
          settings?: Json
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: string
          permissions: Json
          invited_by: string | null
          joined_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role?: string
          permissions?: Json
          invited_by?: string | null
          joined_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: string
          permissions?: Json
          invited_by?: string | null
          joined_at?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          status: string
          type: string
          starts_at: string | null
          ends_at: string | null
          timezone: string
          budget_amount: number | null
          budget_currency: string
          spent_amount: number
          audience_filters: Json
          estimated_audience_size: number
          content: Json
          settings: Json
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          status?: string
          type: string
          starts_at?: string | null
          ends_at?: string | null
          timezone?: string
          budget_amount?: number | null
          budget_currency?: string
          spent_amount?: number
          audience_filters?: Json
          estimated_audience_size?: number
          content?: Json
          settings?: Json
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          status?: string
          type?: string
          starts_at?: string | null
          ends_at?: string | null
          timezone?: string
          budget_amount?: number | null
          budget_currency?: string
          spent_amount?: number
          audience_filters?: Json
          estimated_audience_size?: number
          content?: Json
          settings?: Json
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      journeys: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          status: string
          nodes: Json
          edges: Json
          entry_rules: Json
          exit_rules: Json
          settings: Json
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          status?: string
          nodes?: Json
          edges?: Json
          entry_rules?: Json
          exit_rules?: Json
          settings?: Json
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          status?: string
          nodes?: Json
          edges?: Json
          entry_rules?: Json
          exit_rules?: Json
          settings?: Json
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          id: string
          organization_id: string
          email: string | null
          phone: string | null
          external_id: string | null
          first_name: string | null
          last_name: string | null
          full_name: string | null
          birthday: string | null
          gender: string | null
          timezone: string | null
          language: string
          country: string | null
          city: string | null
          attributes: Json
          tags: string[]
          lists: string[]
          segments: Json
          last_seen_at: string | null
          engagement_score: number
          email_consent: boolean
          sms_consent: boolean
          push_consent: boolean
          source: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          email?: string | null
          phone?: string | null
          external_id?: string | null
          first_name?: string | null
          last_name?: string | null
          birthday?: string | null
          gender?: string | null
          timezone?: string | null
          language?: string
          country?: string | null
          city?: string | null
          attributes?: Json
          tags?: string[]
          lists?: string[]
          segments?: Json
          last_seen_at?: string | null
          engagement_score?: number
          email_consent?: boolean
          sms_consent?: boolean
          push_consent?: boolean
          source?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string | null
          phone?: string | null
          external_id?: string | null
          first_name?: string | null
          last_name?: string | null
          birthday?: string | null
          gender?: string | null
          timezone?: string | null
          language?: string
          country?: string | null
          city?: string | null
          attributes?: Json
          tags?: string[]
          lists?: string[]
          segments?: Json
          last_seen_at?: string | null
          engagement_score?: number
          email_consent?: boolean
          sms_consent?: boolean
          push_consent?: boolean
          source?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          organization_id: string
          contact_id: string
          event_type: string
          event_name: string | null
          properties: Json
          campaign_id: string | null
          journey_id: string | null
          journey_enrollment_id: string | null
          channel: string | null
          device_type: string | null
          ip_address: string | null
          user_agent: string | null
          timestamp: string
        }
        Insert: {
          id?: string
          organization_id: string
          contact_id: string
          event_type: string
          event_name?: string | null
          properties?: Json
          campaign_id?: string | null
          journey_id?: string | null
          journey_enrollment_id?: string | null
          channel?: string | null
          device_type?: string | null
          ip_address?: string | null
          user_agent?: string | null
          timestamp?: string
        }
        Update: {
          id?: string
          organization_id?: string
          contact_id?: string
          event_type?: string
          event_name?: string | null
          properties?: Json
          campaign_id?: string | null
          journey_id?: string | null
          journey_enrollment_id?: string | null
          channel?: string | null
          device_type?: string | null
          ip_address?: string | null
          user_agent?: string | null
          timestamp?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          type: string
          category: string | null
          content: Json
          thumbnail_url: string | null
          is_public: boolean
          is_featured: boolean
          uses_count: number
          rating: number | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          type: string
          category?: string | null
          content: Json
          thumbnail_url?: string | null
          is_public?: boolean
          is_featured?: boolean
          uses_count?: number
          rating?: number | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          type?: string
          category?: string | null
          content?: Json
          thumbnail_url?: string | null
          is_public?: boolean
          is_featured?: boolean
          uses_count?: number
          rating?: number | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      segments: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          conditions: Json
          contact_count: number
          last_calculated_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          conditions?: Json
          contact_count?: number
          last_calculated_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          conditions?: Json
          contact_count?: number
          last_calculated_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          id: string
          organization_id: string
          provider: string
          status: string
          credentials: Json
          config: Json
          last_sync_at: string | null
          sync_error: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          provider: string
          status?: string
          credentials?: Json
          config?: Json
          last_sync_at?: string | null
          sync_error?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          provider?: string
          status?: string
          credentials?: Json
          config?: Json
          last_sync_at?: string | null
          sync_error?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      brand_kits: {
        Row: {
          created_at: string
          font_family: string | null
          id: string
          is_default: boolean | null
          logo_url: string | null
          name: string
          primary_color: string
          secondary_color: string
          tagline: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          font_family?: string | null
          id?: string
          is_default?: boolean | null
          logo_url?: string | null
          name: string
          primary_color?: string
          secondary_color?: string
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          font_family?: string | null
          id?: string
          is_default?: boolean | null
          logo_url?: string | null
          name?: string
          primary_color?: string
          secondary_color?: string
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      scheduled_posts: {
        Row: {
          caption: string
          created_at: string
          error_message: string | null
          id: string
          image_base64: string
          platform: string
          published_at: string | null
          scheduled_at: string
          status: string
        }
        Insert: {
          caption: string
          created_at?: string
          error_message?: string | null
          id?: string
          image_base64: string
          platform: string
          published_at?: string | null
          scheduled_at: string
          status?: string
        }
        Update: {
          caption?: string
          created_at?: string
          error_message?: string | null
          id?: string
          image_base64?: string
          platform?: string
          published_at?: string | null
          scheduled_at?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
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
