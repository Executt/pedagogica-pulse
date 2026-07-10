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
      ai_suggestions: {
        Row: {
          class_id: string | null
          created_at: string
          description: string
          feedback: string | null
          handled_at: string | null
          handled_by: string | null
          id: string
          school_id: string
          status: Database["public"]["Enums"]["suggestion_status"]
          student_id: string | null
          title: string
          type: Database["public"]["Enums"]["suggestion_type"]
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          description: string
          feedback?: string | null
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          school_id: string
          status?: Database["public"]["Enums"]["suggestion_status"]
          student_id?: string | null
          title: string
          type?: Database["public"]["Enums"]["suggestion_type"]
        }
        Update: {
          class_id?: string | null
          created_at?: string
          description?: string
          feedback?: string | null
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          school_id?: string
          status?: Database["public"]["Enums"]["suggestion_status"]
          student_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["suggestion_type"]
        }
        Relationships: [
          {
            foreignKeyName: "ai_suggestions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_suggestions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_suggestions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          school_id: string | null
          title: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          school_id?: string | null
          title: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          school_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          grade: string
          id: string
          name: string
          school_id: string
          teacher_id: string | null
          year: number
        }
        Insert: {
          created_at?: string
          grade: string
          id?: string
          name: string
          school_id: string
          teacher_id?: string | null
          year?: number
        }
        Update: {
          created_at?: string
          grade?: string
          id?: string
          name?: string
          school_id?: string
          teacher_id?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          class_id: string | null
          created_at: string
          creator_id: string
          description: string | null
          ends_at: string | null
          id: string
          location: string | null
          school_id: string
          starts_at: string
          student_id: string | null
          title: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          ends_at?: string | null
          id?: string
          location?: string | null
          school_id: string
          starts_at: string
          student_id?: string | null
          title: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          location?: string | null
          school_id?: string
          starts_at?: string
          student_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          class_id: string | null
          created_at: string
          description: string | null
          duration_seconds: number | null
          external_id: string | null
          id: string
          mime_type: string | null
          name: string
          school_id: string
          size_bytes: number | null
          student_id: string | null
          sync_error: string | null
          synced_at: string | null
          tags: string[] | null
          time_range_end: string | null
          time_range_start: string | null
          uploader_id: string
          url: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          external_id?: string | null
          id?: string
          mime_type?: string | null
          name: string
          school_id: string
          size_bytes?: number | null
          student_id?: string | null
          sync_error?: string | null
          synced_at?: string | null
          tags?: string[] | null
          time_range_end?: string | null
          time_range_start?: string | null
          uploader_id: string
          url: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          external_id?: string | null
          id?: string
          mime_type?: string | null
          name?: string
          school_id?: string
          size_bytes?: number | null
          student_id?: string | null
          sync_error?: string | null
          synced_at?: string | null
          tags?: string[] | null
          time_range_end?: string | null
          time_range_start?: string | null
          uploader_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      observations: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          media_url: string | null
          sentiment: string | null
          student_id: string
          type: Database["public"]["Enums"]["observation_type"]
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          media_url?: string | null
          sentiment?: string | null
          student_id: string
          type?: Database["public"]["Enums"]["observation_type"]
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          media_url?: string | null
          sentiment?: string | null
          student_id?: string
          type?: Database["public"]["Enums"]["observation_type"]
        }
        Relationships: [
          {
            foreignKeyName: "observations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      schools: {
        Row: {
          city: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          attendance_rate: number | null
          avatar_url: string | null
          birthdate: string | null
          class_id: string
          created_at: string
          full_name: string
          guardian_contact: string | null
          guardian_name: string | null
          has_pei: boolean
          id: string
          risk: Database["public"]["Enums"]["risk_level"]
        }
        Insert: {
          attendance_rate?: number | null
          avatar_url?: string | null
          birthdate?: string | null
          class_id: string
          created_at?: string
          full_name: string
          guardian_contact?: string | null
          guardian_name?: string | null
          has_pei?: boolean
          id?: string
          risk?: Database["public"]["Enums"]["risk_level"]
        }
        Update: {
          attendance_rate?: number | null
          avatar_url?: string | null
          birthdate?: string | null
          class_id?: string
          created_at?: string
          full_name?: string
          guardian_contact?: string | null
          guardian_name?: string | null
          has_pei?: boolean
          id?: string
          risk?: Database["public"]["Enums"]["risk_level"]
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          school_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          school_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_school_access: { Args: { _school_id: string }; Returns: boolean }
      list_all_schools: {
        Args: never
        Returns: {
          city: string
          id: string
          name: string
        }[]
      }
      user_school_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      app_role: "diretor" | "pedagogo" | "professor"
      observation_type: "text" | "audio" | "image"
      risk_level: "low" | "medium" | "high"
      suggestion_status: "pending" | "applied" | "scheduled" | "discarded"
      suggestion_type:
        | "reforco"
        | "emocional"
        | "encaminhamento"
        | "engajamento"
        | "outro"
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
      app_role: ["diretor", "pedagogo", "professor"],
      observation_type: ["text", "audio", "image"],
      risk_level: ["low", "medium", "high"],
      suggestion_status: ["pending", "applied", "scheduled", "discarded"],
      suggestion_type: [
        "reforco",
        "emocional",
        "encaminhamento",
        "engajamento",
        "outro",
      ],
    },
  },
} as const
