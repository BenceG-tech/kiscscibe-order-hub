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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      capacity_slots: {
        Row: {
          booked_orders: number
          date: string
          id: string
          max_orders: number
          timeslot: string
        }
        Insert: {
          booked_orders?: number
          date: string
          id?: string
          max_orders?: number
          timeslot: string
        }
        Update: {
          booked_orders?: number
          date?: string
          id?: string
          max_orders?: number
          timeslot?: string
        }
        Relationships: []
      }
      daily_menu_items: {
        Row: {
          daily_menu_id: string | null
          id: string
          item_id: string | null
        }
        Insert: {
          daily_menu_id?: string | null
          id?: string
          item_id?: string | null
        }
        Update: {
          daily_menu_id?: string | null
          id?: string
          item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_menu_items_daily_menu_id_fkey"
            columns: ["daily_menu_id"]
            isOneToOne: false
            referencedRelation: "daily_menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_menu_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_menus: {
        Row: {
          created_at: string | null
          date: string
          id: string
          max_portions: number | null
          note: string | null
          price_huf: number | null
          remaining_portions: number | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          max_portions?: number | null
          note?: string | null
          price_huf?: number | null
          remaining_portions?: number | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          max_portions?: number | null
          note?: string | null
          price_huf?: number | null
          remaining_portions?: number | null
        }
        Relationships: []
      }
      daily_offer_items: {
        Row: {
          daily_offer_id: string | null
          id: string
          is_menu_part: boolean
          item_id: string | null
          menu_role: string | null
          portions_needed: number
        }
        Insert: {
          daily_offer_id?: string | null
          id?: string
          is_menu_part?: boolean
          item_id?: string | null
          menu_role?: string | null
          portions_needed?: number
        }
        Update: {
          daily_offer_id?: string | null
          id?: string
          is_menu_part?: boolean
          item_id?: string | null
          menu_role?: string | null
          portions_needed?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_offer_items_daily_offer_id_fkey"
            columns: ["daily_offer_id"]
            isOneToOne: false
            referencedRelation: "daily_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_offer_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_offer_menus: {
        Row: {
          created_at: string
          daily_offer_id: string
          id: string
          max_portions: number
          menu_price_huf: number
          remaining_portions: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_offer_id: string
          id?: string
          max_portions?: number
          menu_price_huf: number
          remaining_portions?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_offer_id?: string
          id?: string
          max_portions?: number
          menu_price_huf?: number
          remaining_portions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_offer_menus_daily_offer_id_fkey"
            columns: ["daily_offer_id"]
            isOneToOne: true
            referencedRelation: "daily_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_offer_templates: {
        Row: {
          created_at: string
          created_by: string | null
          default_max_portions: number | null
          default_price_huf: number | null
          description: string | null
          id: string
          is_active: boolean
          items: Json
          last_used_at: string | null
          menu_config: Json | null
          name: string
          tags: string[] | null
          updated_at: string
          usage_count: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          default_max_portions?: number | null
          default_price_huf?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          items?: Json
          last_used_at?: string | null
          menu_config?: Json | null
          name: string
          tags?: string[] | null
          updated_at?: string
          usage_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          default_max_portions?: number | null
          default_price_huf?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          items?: Json
          last_used_at?: string | null
          menu_config?: Json | null
          name?: string
          tags?: string[] | null
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      daily_offers: {
        Row: {
          created_at: string | null
          date: string
          facebook_image_url: string | null
          id: string
          max_portions: number | null
          note: string | null
          price_huf: number | null
          remaining_portions: number | null
        }
        Insert: {
          created_at?: string | null
          date: string
          facebook_image_url?: string | null
          id?: string
          max_portions?: number | null
          note?: string | null
          price_huf?: number | null
          remaining_portions?: number | null
        }
        Update: {
          created_at?: string | null
          date?: string
          facebook_image_url?: string | null
          id?: string
          max_portions?: number | null
          note?: string | null
          price_huf?: number | null
          remaining_portions?: number | null
        }
        Relationships: []
      }
      gallery_images: {
        Row: {
          alt_text: string
          created_at: string | null
          gallery_type: string
          id: string
          image_url: string
          is_active: boolean
          sort_order: number
          title: string | null
          updated_at: string | null
        }
        Insert: {
          alt_text: string
          created_at?: string | null
          gallery_type?: string
          id?: string
          image_url: string
          is_active?: boolean
          sort_order?: number
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          alt_text?: string
          created_at?: string | null
          gallery_type?: string
          id?: string
          image_url?: string
          is_active?: boolean
          sort_order?: number
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      item_modifier_options: {
        Row: {
          id: string
          is_default: boolean
          label: string
          modifier_id: string | null
          price_delta_huf: number
          sort: number
        }
        Insert: {
          id?: string
          is_default?: boolean
          label: string
          modifier_id?: string | null
          price_delta_huf?: number
          sort?: number
        }
        Update: {
          id?: string
          is_default?: boolean
          label?: string
          modifier_id?: string | null
          price_delta_huf?: number
          sort?: number
        }
        Relationships: [
          {
            foreignKeyName: "item_modifier_options_modifier_id_fkey"
            columns: ["modifier_id"]
            isOneToOne: false
            referencedRelation: "item_modifiers"
            referencedColumns: ["id"]
          },
        ]
      }
      item_modifiers: {
        Row: {
          id: string
          item_id: string | null
          name: string
          required: boolean
          sort: number
          type: string
        }
        Insert: {
          id?: string
          item_id?: string | null
          name: string
          required?: boolean
          sort?: number
          type: string
        }
        Update: {
          id?: string
          item_id?: string | null
          name?: string
          required?: boolean
          sort?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_modifiers_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          sort: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          sort?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          sort?: number
        }
        Relationships: []
      }
      menu_item_sides: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          is_required: boolean
          main_item_id: string
          max_select: number
          min_select: number
          side_item_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          is_required?: boolean
          main_item_id: string
          max_select?: number
          min_select?: number
          side_item_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          is_required?: boolean
          main_item_id?: string
          max_select?: number
          min_select?: number
          side_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_sides_main_item_id_fkey"
            columns: ["main_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_sides_side_item_id_fkey"
            columns: ["side_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          allergens: string[] | null
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          is_temporary: boolean
          name: string
          price_huf: number
          requires_side_selection: boolean
        }
        Insert: {
          allergens?: string[] | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          is_temporary?: boolean
          name: string
          price_huf: number
          requires_side_selection?: boolean
        }
        Update: {
          allergens?: string[] | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          is_temporary?: boolean
          name?: string
          price_huf?: number
          requires_side_selection?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      order_item_options: {
        Row: {
          id: string
          label_snapshot: string
          option_type: string | null
          order_item_id: string | null
          price_delta_huf: number
          side_item_id: string | null
        }
        Insert: {
          id?: string
          label_snapshot: string
          option_type?: string | null
          order_item_id?: string | null
          price_delta_huf?: number
          side_item_id?: string | null
        }
        Update: {
          id?: string
          label_snapshot?: string
          option_type?: string | null
          order_item_id?: string | null
          price_delta_huf?: number
          side_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_item_options_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_item_options_side_item_id_fkey"
            columns: ["side_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          item_id: string | null
          line_total_huf: number
          name_snapshot: string
          order_id: string | null
          qty: number
          unit_price_huf: number
        }
        Insert: {
          id?: string
          item_id?: string | null
          line_total_huf: number
          name_snapshot: string
          order_id?: string | null
          qty?: number
          unit_price_huf: number
        }
        Update: {
          id?: string
          item_id?: string | null
          line_total_huf?: number
          name_snapshot?: string
          order_id?: string | null
          qty?: number
          unit_price_huf?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          archived: boolean
          code: string
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          payment_method: string
          phone: string
          pickup_time: string | null
          status: string
          total_huf: number
        }
        Insert: {
          archived?: boolean
          code: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          payment_method?: string
          phone: string
          pickup_time?: string | null
          status?: string
          total_huf?: number
        }
        Update: {
          archived?: boolean
          code?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          payment_method?: string
          phone?: string
          pickup_time?: string | null
          status?: string
          total_huf?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          value_json: Json
        }
        Insert: {
          key: string
          value_json: Json
        }
        Update: {
          key?: string
          value_json?: Json
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string | null
          email: string
          id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      [_ in never]: never
    }
    Functions: {
      bootstrap_first_admin: { Args: never; Returns: boolean }
      gen_order_code: { Args: never; Returns: string }
      get_customer_order: {
        Args: { customer_phone: string; order_code: string }
        Returns: {
          code: string
          created_at: string
          id: string
          name: string
          notes: string
          payment_method: string
          phone: string
          pickup_time: string
          status: string
          total_huf: number
        }[]
      }
      get_customer_order_secure: {
        Args: { customer_phone: string; order_code: string }
        Returns: {
          code: string
          created_at: string
          id: string
          name: string
          notes: string
          payment_method: string
          phone: string
          pickup_time: string
          status: string
          total_huf: number
        }[]
      }
      get_daily_data: {
        Args: { target_date: string }
        Returns: {
          items: Json
          menu_id: string
          menu_max_portions: number
          menu_price_huf: number
          menu_remaining_portions: number
          offer_date: string
          offer_id: string
          offer_max_portions: number
          offer_note: string
          offer_price_huf: number
          offer_remaining_portions: number
        }[]
      }
      get_user_role: { Args: { check_user_id?: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_template_usage: {
        Args: { template_id: string }
        Returns: undefined
      }
      is_admin: { Args: { check_user_id?: string }; Returns: boolean }
      is_admin_or_staff: { Args: { _user_id?: string }; Returns: boolean }
      is_date_in_past: { Args: { check_date: string }; Returns: boolean }
      is_staff: { Args: { _user_id?: string }; Returns: boolean }
      is_weekend: { Args: { check_date: string }; Returns: boolean }
      update_daily_portions: {
        Args: { daily_id: string; quantity_needed: number; table_name: string }
        Returns: boolean
      }
      validate_menu_composition: {
        Args: { offer_id: string }
        Returns: boolean
      }
      validate_pickup_time: {
        Args: { pickup_datetime: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "customer" | "staff"
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
      app_role: ["admin", "customer", "staff"],
    },
  },
} as const
