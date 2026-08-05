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
      configuracoes_integracao: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
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
      logs_integracao: {
        Row: {
          created_at: string
          direction: string
          error: string | null
          id: string
          method: string
          nonce_used: string | null
          resource: string
          signature_ok: boolean | null
          status: number | null
          ts_used: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          direction?: string
          error?: string | null
          id?: string
          method?: string
          nonce_used?: string | null
          resource: string
          signature_ok?: boolean | null
          status?: number | null
          ts_used?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          direction?: string
          error?: string | null
          id?: string
          method?: string
          nonce_used?: string | null
          resource?: string
          signature_ok?: boolean | null
          status?: number | null
          ts_used?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      org_units: {
        Row: {
          active: boolean
          code: string | null
          created_at: string
          id: string
          name: string
          parent_id: string | null
          short_name: string | null
          type: Database["public"]["Enums"]["org_unit_type"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          code?: string | null
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          short_name?: string | null
          type: Database["public"]["Enums"]["org_unit_type"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string | null
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          short_name?: string | null
          type?: Database["public"]["Enums"]["org_unit_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_units_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "org_units"
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
          active: boolean
          address: string | null
          capacity: number | null
          city: string | null
          cnpj: string | null
          created_at: string
          district: string | null
          email: string | null
          id: string
          inep_code: string | null
          latitude: number | null
          longitude: number | null
          modalities: string[]
          name: string
          org_unit_id: string | null
          phone: string | null
          postal_code: string | null
          shifts: string[]
          state: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          capacity?: number | null
          city?: string | null
          cnpj?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          id?: string
          inep_code?: string | null
          latitude?: number | null
          longitude?: number | null
          modalities?: string[]
          name: string
          org_unit_id?: string | null
          phone?: string | null
          postal_code?: string | null
          shifts?: string[]
          state?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          capacity?: number | null
          city?: string | null
          cnpj?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          id?: string
          inep_code?: string | null
          latitude?: number | null
          longitude?: number | null
          modalities?: string[]
          name?: string
          org_unit_id?: string | null
          phone?: string | null
          postal_code?: string | null
          shifts?: string[]
          state?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schools_org_unit_id_fkey"
            columns: ["org_unit_id"]
            isOneToOne: false
            referencedRelation: "org_units"
            referencedColumns: ["id"]
          },
        ]
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
          org_unit_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          school_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_unit_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_unit_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_org_unit_id_fkey"
            columns: ["org_unit_id"]
            isOneToOne: false
            referencedRelation: "org_units"
            referencedColumns: ["id"]
          },
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
      has_org_unit_access: { Args: { _org_unit_id: string }; Returns: boolean }
      has_school_access: { Args: { _school_id: string }; Returns: boolean }
      is_superadmin: { Args: { _user_id?: string }; Returns: boolean }
      list_all_schools: {
        Args: never
        Returns: {
          city: string
          id: string
          name: string
        }[]
      }
      user_org_unit_ids: { Args: never; Returns: string[] }
      user_school_ids: { Args: never; Returns: string[] }
      user_scope_school_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      app_role:
        | "diretor"
        | "pedagogo"
        | "professor"
        | "superadmin"
        | "secretario"
        | "subsecretario"
        | "gestor_regional"
        | "gestor_distrital"
        | "coordenador"
      observation_type: "text" | "audio" | "image"
      org_unit_type: "secretaria" | "subsecretaria" | "regional" | "distrito"
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
      app_role: [
        "diretor",
        "pedagogo",
        "professor",
        "superadmin",
        "secretario",
        "subsecretario",
        "gestor_regional",
        "gestor_distrital",
        "coordenador",
      ],
      observation_type: ["text", "audio", "image"],
      org_unit_type: ["secretaria", "subsecretaria", "regional", "distrito"],
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
