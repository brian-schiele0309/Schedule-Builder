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
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['preferences']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['preferences']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['locked_events']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['locked_events']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['courses']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['courses']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['recurrence_templates']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['recurrence_templates']['Insert']>
      }
    }
  }
}
