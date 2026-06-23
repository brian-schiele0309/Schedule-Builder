import { addDays, format, startOfDay } from 'date-fns'
import type { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

// How far ahead to materialize future due dates, giving the scheduler plenty of
// lead time to place work before each recurring due day actually arrives.
const LOOKAHEAD_DAYS = 21

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

/**
 * Materializes recurrence_templates into actual task rows for every upcoming
 * occurrence of their due day within LOOKAHEAD_DAYS, skipping any (template, day)
 * pair that already has a task.
 */
export async function generateRecurringTasks(supabase: SupabaseServerClient, userId: string) {
  const { data: templates } = await supabase
    .from('recurrence_templates')
    .select('*')
    .eq('user_id', userId)

  if (!templates || templates.length === 0) return

  const { data: existingTasks } = await supabase
    .from('tasks')
    .select('recurrence_template_id, due_date')
    .eq('user_id', userId)
    .not('recurrence_template_id', 'is', null)

  const existingKeys = new Set(
    (existingTasks ?? [])
      .filter(t => t.recurrence_template_id && t.due_date)
      .map(t => `${t.recurrence_template_id}_${format(new Date(t.due_date as string), 'yyyy-MM-dd')}`)
  )

  const today = startOfDay(new Date())
  const newTasks: Database['public']['Tables']['tasks']['Insert'][] = []

  for (const template of templates) {
    if (!template.days_of_week || template.days_of_week.length === 0) continue

    // Only the first selected day is used as the recurring due day.
    const dueDayOfWeek = template.days_of_week[0]

    for (let offset = 0; offset < LOOKAHEAD_DAYS; offset++) {
      const dueDay = addDays(today, offset)
      if (dueDay.getDay() !== dueDayOfWeek) continue

      const dayKey = format(dueDay, 'yyyy-MM-dd')
      const key = `${template.id}_${dayKey}`
      if (existingKeys.has(key)) continue

      newTasks.push({
        user_id: userId,
        course_id: template.course_id,
        title: template.title,
        estimated_minutes: template.estimated_minutes,
        priority: template.priority ?? 2,
        due_date: `${dayKey}T23:59:00`,
        is_recurring: true,
        recurrence_template_id: template.id,
      })
    }
  }

  if (newTasks.length > 0) {
    await supabase.from('tasks').insert(newTasks)
  }
}
