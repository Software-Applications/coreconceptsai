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
      chapters: {
        Row: {
          chapter_number: number
          created_at: string | null
          id: string
          subject_id: string
          title: string
        }
        Insert: {
          chapter_number: number
          created_at?: string | null
          id?: string
          subject_id: string
          title: string
        }
        Update: {
          chapter_number?: number
          created_at?: string | null
          id?: string
          subject_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      flash_summaries: {
        Row: {
          ai_generated: boolean | null
          bullet_points: string[] | null
          created_at: string | null
          difficulty: string | null
          id: string
          topic_id: string
          visual_content: string | null
          visual_type: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          bullet_points?: string[] | null
          created_at?: string | null
          difficulty?: string | null
          id?: string
          topic_id: string
          visual_content?: string | null
          visual_type?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          bullet_points?: string[] | null
          created_at?: string | null
          difficulty?: string | null
          id?: string
          topic_id?: string
          visual_content?: string | null
          visual_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flash_summaries_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      pinned_cards: {
        Row: {
          flash_summary_id: string
          id: string
          pinned_at: string | null
          user_id: string
        }
        Insert: {
          flash_summary_id: string
          id?: string
          pinned_at?: string | null
          user_id: string
        }
        Update: {
          flash_summary_id?: string
          id?: string
          pinned_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pinned_cards_flash_summary_id_fkey"
            columns: ["flash_summary_id"]
            isOneToOne: false
            referencedRelation: "flash_summaries"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          chapter_id: string
          completed_at: string | null
          id: string
          quiz_id: number
          score: number
          total_questions: number
          user_id: string
        }
        Insert: {
          chapter_id: string
          completed_at?: string | null
          id?: string
          quiz_id: number
          score: number
          total_questions: number
          user_id: string
        }
        Update: {
          chapter_id?: string
          completed_at?: string | null
          id?: string
          quiz_id?: number
          score?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          image_url: string | null
          name: string
          textbook_author: string | null
          textbook_image_url: string | null
          textbook_title: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          name: string
          textbook_author?: string | null
          textbook_image_url?: string | null
          textbook_title?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          name?: string
          textbook_author?: string | null
          textbook_image_url?: string | null
          textbook_title?: string | null
        }
        Relationships: []
      }
      topic_requests: {
        Row: {
          created_at: string
          id: string
          query: string
          status: string
          subject_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          query: string
          status?: string
          subject_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          query?: string
          status?: string
          subject_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topic_requests_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          audio_url: string | null
          chapter_id: string
          created_at: string | null
          description: string | null
          duration: string | null
          generated_audio_url: string | null
          id: string
          title: string
        }
        Insert: {
          audio_url?: string | null
          chapter_id: string
          created_at?: string | null
          description?: string | null
          duration?: string | null
          generated_audio_url?: string | null
          id?: string
          title: string
        }
        Update: {
          audio_url?: string | null
          chapter_id?: string
          created_at?: string | null
          description?: string | null
          duration?: string | null
          generated_audio_url?: string | null
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          completed: boolean | null
          id: string
          listened_at: string | null
          progress_percentage: number | null
          topic_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          id?: string
          listened_at?: string | null
          progress_percentage?: number | null
          topic_id: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          id?: string
          listened_at?: string | null
          progress_percentage?: number | null
          topic_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
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
