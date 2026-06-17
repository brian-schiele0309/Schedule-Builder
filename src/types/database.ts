export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          is_pro: boolean
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          canvas_url: string | null
          canvas_token_encrypted: string | null
          canvas_last_synced_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          is_pro?: boolean
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          canvas_url?: string | null
          canvas_token_encrypted?: string | null
          canvas_last_synced_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: never[]
      }
      preferences: {
        Row: {
          id: string
          user_id: string
          work_start_time: string
          work_end_time: string
          max_session_minutes: number
          break_minutes: number
          preferred_days: number[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          work_start_time?: string
          work_end_time?: string
          max_session_minutes?: number
          break_minutes?: number
          preferred_days?: number[]
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['preferences']['Insert']>
        Relationships: never[]
      }
      locked_events: {
        Row: {
          id: string
          user_id: string
          title: string
          days_of_week: number[]
          start_time: string
          end_time: string
          recurs_weekly: boolean
          color: string
          canvas_course_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          days_of_week: number[]
          start_time: string
          end_time: string
          recurs_weekly?: boolean
          color?: string
          canvas_course_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['locked_events']['Insert']>
        Relationships: never[]
      }
      courses: {
        Row: {
          id: string
          user_id: string
          name: string
          course_code: string | null
          color: string
          canvas_course_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          course_code?: string | null
          color?: string
          canvas_course_id?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['courses']['Insert']>
        Relationships: never[]
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          course_id: string | null
          title: string
          description: string | null
          due_date: string | null
          estimated_minutes: number
          priority: number
          completed: boolean
          completed_at: string | null
          scheduled_start: string | null
          scheduled_end: string | null
          missed: boolean
          is_recurring: boolean
          recurrence_template_id: string | null
          canvas_assignment_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id?: string | null
          title: string
          description?: string | null
          due_date?: string | null
          estimated_minutes?: number
          priority?: number
          completed?: boolean
          completed_at?: string | null
          scheduled_start?: string | null
          scheduled_end?: string | null
          missed?: boolean
          is_recurring?: boolean
          recurrence_template_id?: string | null
          canvas_assignment_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'tasks_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          }
        ]
      }
      recurrence_templates: {
        Row: {
          id: string
          user_id: string
          title: string
          course_id: string | null
          estimated_minutes: number
          priority: number
          days_of_week: number[] | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          course_id?: string | null
          estimated_minutes: number
          priority?: number
          days_of_week?: number[] | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['recurrence_templates']['Insert']>
        Relationships: never[]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
