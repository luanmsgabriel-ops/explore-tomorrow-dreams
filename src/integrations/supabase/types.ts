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
      account_shared_access: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          primary_user_id: string
          shared_email: string
          shared_user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          primary_user_id: string
          shared_email: string
          shared_user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          primary_user_id?: string
          shared_email?: string
          shared_user_id?: string
        }
        Relationships: []
      }
      ai_generated_images: {
        Row: {
          created_at: string
          destination_id: string
          destination_name: string
          id: string
          image_url: string
          prompt: string
          status: string
          user_email: string | null
          user_whatsapp: string | null
        }
        Insert: {
          created_at?: string
          destination_id: string
          destination_name: string
          id?: string
          image_url: string
          prompt: string
          status?: string
          user_email?: string | null
          user_whatsapp?: string | null
        }
        Update: {
          created_at?: string
          destination_id?: string
          destination_name?: string
          id?: string
          image_url?: string
          prompt?: string
          status?: string
          user_email?: string | null
          user_whatsapp?: string | null
        }
        Relationships: []
      }
      ai_itineraries: {
        Row: {
          created_at: string
          destination_id: string
          destination_name: string
          id: string
          itinerary_content: string
          preferences: string | null
          quote_requested: boolean
          quote_requested_at: string | null
          selected_activities: Json | null
          status: string
          travel_mood: string | null
          user_email: string
          user_whatsapp: string
        }
        Insert: {
          created_at?: string
          destination_id: string
          destination_name: string
          id?: string
          itinerary_content: string
          preferences?: string | null
          quote_requested?: boolean
          quote_requested_at?: string | null
          selected_activities?: Json | null
          status?: string
          travel_mood?: string | null
          user_email: string
          user_whatsapp: string
        }
        Update: {
          created_at?: string
          destination_id?: string
          destination_name?: string
          id?: string
          itinerary_content?: string
          preferences?: string | null
          quote_requested?: boolean
          quote_requested_at?: string | null
          selected_activities?: Json | null
          status?: string
          travel_mood?: string | null
          user_email?: string
          user_whatsapp?: string
        }
        Relationships: []
      }
      ai_usage_tracking: {
        Row: {
          created_at: string
          feature: string
          id: string
          ip_address: string
        }
        Insert: {
          created_at?: string
          feature: string
          id?: string
          ip_address: string
        }
        Update: {
          created_at?: string
          feature?: string
          id?: string
          ip_address?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          ip_hash: string | null
          page_path: string | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          ip_hash?: string | null
          page_path?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_hash?: string | null
          page_path?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      banner_history: {
        Row: {
          caption: string | null
          created_at: string
          destination_name: string
          format: string
          id: string
          image_url: string
          offer_id: string
          offer_title: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          destination_name: string
          format: string
          id?: string
          image_url: string
          offer_id: string
          offer_title: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          destination_name?: string
          format?: string
          id?: string
          image_url?: string
          offer_id?: string
          offer_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "banner_history_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "promotional_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          destination_id: string
          id: string
          role: string
          session_id: string
          user_name: string | null
          user_whatsapp: string | null
        }
        Insert: {
          content: string
          created_at?: string
          destination_id: string
          id?: string
          role: string
          session_id: string
          user_name?: string | null
          user_whatsapp?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          destination_id?: string
          id?: string
          role?: string
          session_id?: string
          user_name?: string | null
          user_whatsapp?: string | null
        }
        Relationships: []
      }
      chat_sessions: {
        Row: {
          created_at: string
          destination_id: string
          destination_name: string
          id: string
          session_id: string
          updated_at: string
          user_name: string
          user_whatsapp: string
        }
        Insert: {
          created_at?: string
          destination_id: string
          destination_name: string
          id?: string
          session_id: string
          updated_at?: string
          user_name: string
          user_whatsapp: string
        }
        Update: {
          created_at?: string
          destination_id?: string
          destination_name?: string
          id?: string
          session_id?: string
          updated_at?: string
          user_name?: string
          user_whatsapp?: string
        }
        Relationships: []
      }
      checkin_notifications: {
        Row: {
          created_at: string
          email_sent_at: string
          id: string
          trip_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_sent_at?: string
          id?: string
          trip_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_sent_at?: string
          id?: string
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkin_notifications_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "client_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items_default: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          item_text: string
          sort_order: number
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          item_text: string
          sort_order?: number
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          item_text?: string
          sort_order?: number
        }
        Relationships: []
      }
      client_trips: {
        Row: {
          created_at: string
          departure_date: string
          destination_id: string | null
          destination_name: string
          flight_departure_time: string | null
          flight_locator: string | null
          flight_number: string | null
          flight_return_number: string | null
          flight_return_time: string | null
          hotel_address: string | null
          hotel_checkin_date: string | null
          hotel_checkin_time: string | null
          hotel_checkout_date: string | null
          hotel_checkout_time: string | null
          hotel_link: string | null
          hotel_name: string | null
          id: string
          notes: string | null
          return_date: string
          trip_status: string
          trip_tips: string | null
          updated_at: string
          user_id: string
          welcome_caption: string | null
          welcome_image_url: string | null
        }
        Insert: {
          created_at?: string
          departure_date: string
          destination_id?: string | null
          destination_name: string
          flight_departure_time?: string | null
          flight_locator?: string | null
          flight_number?: string | null
          flight_return_number?: string | null
          flight_return_time?: string | null
          hotel_address?: string | null
          hotel_checkin_date?: string | null
          hotel_checkin_time?: string | null
          hotel_checkout_date?: string | null
          hotel_checkout_time?: string | null
          hotel_link?: string | null
          hotel_name?: string | null
          id?: string
          notes?: string | null
          return_date: string
          trip_status?: string
          trip_tips?: string | null
          updated_at?: string
          user_id: string
          welcome_caption?: string | null
          welcome_image_url?: string | null
        }
        Update: {
          created_at?: string
          departure_date?: string
          destination_id?: string | null
          destination_name?: string
          flight_departure_time?: string | null
          flight_locator?: string | null
          flight_number?: string | null
          flight_return_number?: string | null
          flight_return_time?: string | null
          hotel_address?: string | null
          hotel_checkin_date?: string | null
          hotel_checkin_time?: string | null
          hotel_checkout_date?: string | null
          hotel_checkout_time?: string | null
          hotel_link?: string | null
          hotel_name?: string | null
          id?: string
          notes?: string | null
          return_date?: string
          trip_status?: string
          trip_tips?: string | null
          updated_at?: string
          user_id?: string
          welcome_caption?: string | null
          welcome_image_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_trips_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      destinations: {
        Row: {
          best_price_periods: Json | null
          best_time: string
          category: string
          created_at: string
          description: string
          for_who: string
          id: string
          ideal_duration: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          location: string
          name: string
          slug: string
          type: string
          updated_at: string
          videos: Json | null
        }
        Insert: {
          best_price_periods?: Json | null
          best_time: string
          category: string
          created_at?: string
          description: string
          for_who: string
          id?: string
          ideal_duration: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          location: string
          name: string
          slug: string
          type: string
          updated_at?: string
          videos?: Json | null
        }
        Update: {
          best_price_periods?: Json | null
          best_time?: string
          category?: string
          created_at?: string
          description?: string
          for_who?: string
          id?: string
          ideal_duration?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          location?: string
          name?: string
          slug?: string
          type?: string
          updated_at?: string
          videos?: Json | null
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          body: string
          created_at: string
          data: Json | null
          error_message: string | null
          id: string
          notification_type: string
          sent_at: string | null
          status: string
          title: string
          trip_id: string | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json | null
          error_message?: string | null
          id?: string
          notification_type: string
          sent_at?: string | null
          status?: string
          title: string
          trip_id?: string | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json | null
          error_message?: string | null
          id?: string
          notification_type?: string
          sent_at?: string | null
          status?: string
          title?: string
          trip_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promotional_offers: {
        Row: {
          cash_price: number | null
          created_at: string
          departure_date: string | null
          destination_id: string
          id: string
          inclusions: string[]
          installment_value: number | null
          installments: number | null
          is_active: boolean
          promo_image_url: string | null
          return_date: string | null
          tagline: string | null
          title: string
          total_price: number
          updated_at: string
          valid_from: string
          valid_until: string
        }
        Insert: {
          cash_price?: number | null
          created_at?: string
          departure_date?: string | null
          destination_id: string
          id?: string
          inclusions?: string[]
          installment_value?: number | null
          installments?: number | null
          is_active?: boolean
          promo_image_url?: string | null
          return_date?: string | null
          tagline?: string | null
          title: string
          total_price: number
          updated_at?: string
          valid_from?: string
          valid_until: string
        }
        Update: {
          cash_price?: number | null
          created_at?: string
          departure_date?: string | null
          destination_id?: string
          id?: string
          inclusions?: string[]
          installment_value?: number | null
          installments?: number | null
          is_active?: boolean
          promo_image_url?: string | null
          return_date?: string | null
          tagline?: string | null
          title?: string
          total_price?: number
          updated_at?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotional_offers_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_requests: {
        Row: {
          client_name: string | null
          created_at: string
          destination_id: string | null
          destination_name: string | null
          email: string
          flight_time_preference: string | null
          follow_up_date: string | null
          id: string
          is_manual: boolean | null
          notes: string | null
          num_people: string | null
          preferred_airport: string | null
          preferred_contact_channel: string | null
          preferred_contact_time: string | null
          source_channel: string | null
          special_requests: string | null
          status: string
          travel_date: string | null
          travel_type: string | null
          travel_word: string | null
          traveling_with_children: boolean | null
          whatsapp: string
        }
        Insert: {
          client_name?: string | null
          created_at?: string
          destination_id?: string | null
          destination_name?: string | null
          email: string
          flight_time_preference?: string | null
          follow_up_date?: string | null
          id?: string
          is_manual?: boolean | null
          notes?: string | null
          num_people?: string | null
          preferred_airport?: string | null
          preferred_contact_channel?: string | null
          preferred_contact_time?: string | null
          source_channel?: string | null
          special_requests?: string | null
          status?: string
          travel_date?: string | null
          travel_type?: string | null
          travel_word?: string | null
          traveling_with_children?: boolean | null
          whatsapp: string
        }
        Update: {
          client_name?: string | null
          created_at?: string
          destination_id?: string | null
          destination_name?: string | null
          email?: string
          flight_time_preference?: string | null
          follow_up_date?: string | null
          id?: string
          is_manual?: boolean | null
          notes?: string | null
          num_people?: string | null
          preferred_airport?: string | null
          preferred_contact_channel?: string | null
          preferred_contact_time?: string | null
          source_channel?: string | null
          special_requests?: string | null
          status?: string
          travel_date?: string | null
          travel_type?: string | null
          travel_word?: string | null
          traveling_with_children?: boolean | null
          whatsapp?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          client_email: string | null
          client_name: string
          client_phone: string | null
          commission_value: number | null
          created_at: string
          created_by: string | null
          departure_date: string | null
          destination_name: string
          id: string
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          quote_id: string | null
          return_date: string | null
          sale_date: string
          source_channel: string | null
          total_value: number
          trip_id: string | null
          updated_at: string
        }
        Insert: {
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          commission_value?: number | null
          created_at?: string
          created_by?: string | null
          departure_date?: string | null
          destination_name: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          quote_id?: string | null
          return_date?: string | null
          sale_date?: string
          source_channel?: string | null
          total_value: number
          trip_id?: string | null
          updated_at?: string
        }
        Update: {
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          commission_value?: number | null
          created_at?: string
          created_by?: string | null
          departure_date?: string | null
          destination_name?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          quote_id?: string | null
          return_date?: string | null
          sale_date?: string
          source_channel?: string | null
          total_value?: number
          trip_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "client_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_checklist: {
        Row: {
          created_at: string
          id: string
          is_completed: boolean
          is_default_item: boolean
          item_text: string
          sort_order: number
          trip_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_completed?: boolean
          is_default_item?: boolean
          item_text: string
          sort_order?: number
          trip_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_completed?: boolean
          is_default_item?: boolean
          item_text?: string
          sort_order?: number
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_checklist_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "client_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_consultants: {
        Row: {
          consultant_email: string | null
          consultant_name: string
          consultant_phone: string | null
          consultant_photo_url: string | null
          created_at: string
          id: string
          is_primary: boolean
          notes: string | null
          trip_id: string
          updated_at: string
        }
        Insert: {
          consultant_email?: string | null
          consultant_name: string
          consultant_phone?: string | null
          consultant_photo_url?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          notes?: string | null
          trip_id: string
          updated_at?: string
        }
        Update: {
          consultant_email?: string | null
          consultant_name?: string
          consultant_phone?: string | null
          consultant_photo_url?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          notes?: string | null
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_consultants_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "client_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_documents: {
        Row: {
          created_at: string
          document_name: string
          document_type: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          trip_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          document_name: string
          document_type: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          trip_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          document_name?: string
          document_type?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          trip_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_documents_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "client_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_emergency_contacts: {
        Row: {
          contact_name: string
          contact_type: string
          created_at: string
          email: string | null
          id: string
          notes: string | null
          phone: string | null
          sort_order: number
          trip_id: string
        }
        Insert: {
          contact_name: string
          contact_type: string
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          sort_order?: number
          trip_id: string
        }
        Update: {
          contact_name?: string
          contact_type?: string
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          sort_order?: number
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_emergency_contacts_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "client_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      user_push_tokens: {
        Row: {
          created_at: string
          device_name: string | null
          device_type: string
          id: string
          is_active: boolean
          push_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_name?: string | null
          device_type?: string
          id?: string
          is_active?: boolean
          push_token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_name?: string | null
          device_type?: string
          id?: string
          is_active?: boolean
          push_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      analytics_daily_stats: {
        Row: {
          day: string | null
          event_count: number | null
          event_type: string | null
          page_path: string | null
          unique_sessions: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_add_role: {
        Args: {
          target_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: undefined
      }
      admin_remove_role: {
        Args: {
          target_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: undefined
      }
      check_ai_usage_limit: {
        Args: {
          p_daily_limit?: number
          p_feature: string
          p_ip_address: string
          p_monthly_limit?: number
        }
        Returns: Json
      }
      cleanup_old_usage_tracking: { Args: never; Returns: undefined }
      get_ai_usage_stats: {
        Args: {
          p_daily_limit?: number
          p_feature: string
          p_ip_address: string
          p_monthly_limit?: number
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
