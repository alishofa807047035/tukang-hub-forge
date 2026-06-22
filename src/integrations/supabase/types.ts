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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      articles: {
        Row: {
          content: string | null
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          slug: string
          title: string
        }
        Insert: {
          content?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          slug: string
          title: string
        }
        Update: {
          content?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          slug?: string
          title?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string
          id: string
          image: string | null
          is_active: boolean
          link: string | null
          sort_order: number | null
          subtitle: string | null
          title: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image?: string | null
          is_active?: boolean
          link?: string | null
          sort_order?: number | null
          subtitle?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image?: string | null
          is_active?: boolean
          link?: string | null
          sort_order?: number | null
          subtitle?: string | null
          title?: string | null
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          price: number
          product_id: string
          qty: number
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          price?: number
          product_id: string
          qty?: number
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          price?: number
          product_id?: string
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_active: boolean
          question: string
          sort_order: number | null
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          is_active?: boolean
          question: string
          sort_order?: number | null
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_active?: boolean
          question?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          price: number
          product_id: string | null
          product_name: string
          qty: number
        }
        Insert: {
          id?: string
          order_id: string
          price?: number
          product_id?: string | null
          product_name: string
          qty?: number
        }
        Update: {
          id?: string
          order_id?: string
          price?: number
          product_id?: string | null
          product_name?: string
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          city: string | null
          courier: string
          created_at: string
          district: string | null
          id: string
          order_number: string
          payment_method: string
          postal_code: string | null
          province: string | null
          recipient_name: string
          recipient_phone: string
          reject_reason: string | null
          shipping_address: string
          shipping_cost: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          tracking_number: string | null
          updated_at: string
          user_id: string
          village: string | null
        }
        Insert: {
          city?: string | null
          courier: string
          created_at?: string
          district?: string | null
          id?: string
          order_number: string
          payment_method: string
          postal_code?: string | null
          province?: string | null
          recipient_name: string
          recipient_phone: string
          reject_reason?: string | null
          shipping_address: string
          shipping_cost?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          tracking_number?: string | null
          updated_at?: string
          user_id: string
          village?: string | null
        }
        Update: {
          city?: string | null
          courier?: string
          created_at?: string
          district?: string | null
          id?: string
          order_number?: string
          payment_method?: string
          postal_code?: string | null
          province?: string | null
          recipient_name?: string
          recipient_phone?: string
          reject_reason?: string | null
          shipping_address?: string
          shipping_cost?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string
          village?: string | null
        }
        Relationships: []
      }
      payment_confirmations: {
        Row: {
          amount: number
          id: string
          order_id: string
          proof_image: string | null
          sender_name: string
          status: Database["public"]["Enums"]["payment_status"]
          transfer_bank: string
          uploaded_at: string
        }
        Insert: {
          amount?: number
          id?: string
          order_id: string
          proof_image?: string | null
          sender_name: string
          status?: Database["public"]["Enums"]["payment_status"]
          transfer_bank: string
          uploaded_at?: string
        }
        Update: {
          amount?: number
          id?: string
          order_id?: string
          proof_image?: string | null
          sender_name?: string
          status?: Database["public"]["Enums"]["payment_status"]
          transfer_bank?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_confirmations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          brand: string | null
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          images: string[]
          name: string
          price: number
          sku: string | null
          slug: string
          status: Database["public"]["Enums"]["product_status"]
          stock: number
          updated_at: string
          weight: number
        }
        Insert: {
          brand?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[]
          name: string
          price?: number
          sku?: string | null
          slug: string
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          updated_at?: string
          weight?: number
        }
        Update: {
          brand?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[]
          name?: string
          price?: number
          sku?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          created_at: string
          email: string | null
          fullname: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          email?: string | null
          fullname?: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          email?: string | null
          fullname?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating?: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_addresses: {
        Row: {
          city: string
          created_at: string
          district: string | null
          full_address: string
          id: string
          is_default: boolean
          phone: string
          postal_code: string | null
          province: string
          recipient_name: string
          user_id: string
          village: string | null
        }
        Insert: {
          city: string
          created_at?: string
          district?: string | null
          full_address: string
          id?: string
          is_default?: boolean
          phone: string
          postal_code?: string | null
          province: string
          recipient_name: string
          user_id: string
          village?: string | null
        }
        Update: {
          city?: string
          created_at?: string
          district?: string | null
          full_address?: string
          id?: string
          is_default?: boolean
          phone?: string
          postal_code?: string | null
          province?: string
          recipient_name?: string
          user_id?: string
          village?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          data: Json
          id: number
          updated_at: string
        }
        Insert: {
          data?: Json
          id?: number
          updated_at?: string
        }
        Update: {
          data?: Json
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          avatar: string | null
          content: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          rating: number | null
          role: string | null
        }
        Insert: {
          avatar?: string | null
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          rating?: number | null
          role?: string | null
        }
        Update: {
          avatar?: string | null
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          rating?: number | null
          role?: string | null
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
      generate_order_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "customer" | "admin"
      order_status:
        | "menunggu_pembayaran"
        | "menunggu_verifikasi"
        | "diproses"
        | "dikemas"
        | "dikirim"
        | "dalam_perjalanan"
        | "selesai"
        | "ditolak"
        | "dibatalkan"
      payment_status: "pending" | "approved" | "rejected"
      product_status: "active" | "inactive"
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
      app_role: ["customer", "admin"],
      order_status: [
        "menunggu_pembayaran",
        "menunggu_verifikasi",
        "diproses",
        "dikemas",
        "dikirim",
        "dalam_perjalanan",
        "selesai",
        "ditolak",
        "dibatalkan",
      ],
      payment_status: ["pending", "approved", "rejected"],
      product_status: ["active", "inactive"],
    },
  },
} as const
