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
      assessment_dimension_scores: {
        Row: {
          assessment_id: string
          dimension_id: string
          id: string
          score: number
        }
        Insert: {
          assessment_id: string
          dimension_id: string
          id?: string
          score?: number
        }
        Update: {
          assessment_id?: string
          dimension_id?: string
          id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessment_dimension_scores_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_dimension_scores_dimension_id_fkey"
            columns: ["dimension_id"]
            isOneToOne: false
            referencedRelation: "compass_dimensions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_responses: {
        Row: {
          assessment_id: string
          id: string
          notes: string | null
          points: number
          question_id: string
        }
        Insert: {
          assessment_id: string
          id?: string
          notes?: string | null
          points?: number
          question_id: string
        }
        Update: {
          assessment_id?: string
          id?: string
          notes?: string | null
          points?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_responses_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "compass_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          business_id: string
          created_at: string
          created_by: string | null
          id: string
          overall_score: number | null
          review_notes: string | null
          status: Database["public"]["Enums"]["assessment_status"]
          submitted_at: string | null
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          overall_score?: number | null
          review_notes?: string | null
          status?: Database["public"]["Enums"]["assessment_status"]
          submitted_at?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          overall_score?: number | null
          review_notes?: string | null
          status?: Database["public"]["Enums"]["assessment_status"]
          submitted_at?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          detail: Json
          entity_id: string | null
          entity_type: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          detail?: Json
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          detail?: Json
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Relationships: []
      }
      businesses: {
        Row: {
          accessible: boolean
          address: string | null
          awards: string[]
          biosphere_score: number | null
          category_id: string | null
          certifications: string[]
          cia_completed: boolean
          circular_economy: boolean
          community_contribution: boolean
          created_at: string
          description: string | null
          email: string | null
          featured: boolean
          id: string
          image_key: string
          last_assessed_at: string | null
          latitude: number | null
          longitude: number | null
          name: string
          opening_hours: Json
          owner_id: string | null
          parish: string | null
          phone: string | null
          published: boolean
          renewable_energy: boolean
          services: string[]
          slug: string
          social_links: Json
          sustainable_tourism: boolean
          tagline: string | null
          updated_at: string
          verified: boolean
          website: string | null
        }
        Insert: {
          accessible?: boolean
          address?: string | null
          awards?: string[]
          biosphere_score?: number | null
          category_id?: string | null
          certifications?: string[]
          cia_completed?: boolean
          circular_economy?: boolean
          community_contribution?: boolean
          created_at?: string
          description?: string | null
          email?: string | null
          featured?: boolean
          id?: string
          image_key?: string
          last_assessed_at?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          opening_hours?: Json
          owner_id?: string | null
          parish?: string | null
          phone?: string | null
          published?: boolean
          renewable_energy?: boolean
          services?: string[]
          slug: string
          social_links?: Json
          sustainable_tourism?: boolean
          tagline?: string | null
          updated_at?: string
          verified?: boolean
          website?: string | null
        }
        Update: {
          accessible?: boolean
          address?: string | null
          awards?: string[]
          biosphere_score?: number | null
          category_id?: string | null
          certifications?: string[]
          cia_completed?: boolean
          circular_economy?: boolean
          community_contribution?: boolean
          created_at?: string
          description?: string | null
          email?: string | null
          featured?: boolean
          id?: string
          image_key?: string
          last_assessed_at?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          opening_hours?: Json
          owner_id?: string | null
          parish?: string | null
          phone?: string | null
          published?: boolean
          renewable_energy?: boolean
          services?: string[]
          slug?: string
          social_links?: Json
          sustainable_tourism?: boolean
          tagline?: string | null
          updated_at?: string
          verified?: boolean
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          display_order: number
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          display_order?: number
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          display_order?: number
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      compass_dimensions: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          display_order: number
          id: string
          name: string
          slug: string
          weight: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name: string
          slug: string
          weight?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name?: string
          slug?: string
          weight?: number
        }
        Relationships: []
      }
      compass_questions: {
        Row: {
          active: boolean
          created_at: string
          dimension_id: string
          display_order: number
          help_text: string | null
          id: string
          max_points: number
          prompt: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          dimension_id: string
          display_order?: number
          help_text?: string | null
          id?: string
          max_points?: number
          prompt: string
        }
        Update: {
          active?: boolean
          created_at?: string
          dimension_id?: string
          display_order?: number
          help_text?: string | null
          id?: string
          max_points?: number
          prompt?: string
        }
        Relationships: [
          {
            foreignKeyName: "compass_questions_dimension_id_fkey"
            columns: ["dimension_id"]
            isOneToOne: false
            referencedRelation: "compass_dimensions"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_files: {
        Row: {
          assessment_id: string
          created_at: string
          file_path: string
          id: string
          label: string | null
          uploaded_by: string | null
        }
        Insert: {
          assessment_id: string
          created_at?: string
          file_path: string
          id?: string
          label?: string | null
          uploaded_by?: string | null
        }
        Update: {
          assessment_id?: string
          created_at?: string
          file_path?: string
          id?: string
          label?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evidence_files_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      assessment_status:
        | "draft"
        | "submitted"
        | "published"
        | "verified"
        | "rejected"
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
      app_role: ["admin", "moderator", "user"],
      assessment_status: [
        "draft",
        "submitted",
        "published",
        "verified",
        "rejected",
      ],
    },
  },
} as const
