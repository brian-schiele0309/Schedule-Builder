import type { Database } from './database'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Preferences = Database['public']['Tables']['preferences']['Row']
export type LockedEvent = Database['public']['Tables']['locked_events']['Row']
export type Course = Database['public']['Tables']['courses']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type RecurrenceTemplate = Database['public']['Tables']['recurrence_templates']['Row']

export type Priority = 1 | 2 | 3
export const PRIORITY_LABELS: Record<Priority, string> = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  1: 'bg-green-100 text-green-800',
  2: 'bg-yellow-100 text-yellow-800',
  3: 'bg-red-100 text-red-800',
}

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const DAY_FULL_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
