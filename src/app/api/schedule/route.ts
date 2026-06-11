import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { scheduleTasks } from '@/lib/scheduler'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: tasks }, { data: lockedEvents }, { data: preferences }] = await Promise.all([
    supabase.from('tasks').select('*').eq('user_id', user.id).eq('completed', false),
    supabase.from('locked_events').select('*').eq('user_id', user.id),
    supabase.from('preferences').select('*').eq('user_id', user.id).single(),
  ])

  if (!preferences) return NextResponse.json({ error: 'No preferences set' }, { status: 400 })

  const scheduledTasks = scheduleTasks(tasks ?? [], lockedEvents ?? [], preferences)

  // Persist scheduled times
  const results = await Promise.all(
    scheduledTasks.map(({ taskId, scheduledStart, scheduledEnd }) =>
      supabase
        .from('tasks')
        .update({
          scheduled_start: scheduledStart.toISOString(),
          scheduled_end: scheduledEnd.toISOString(),
          missed: false,
        })
        .eq('id', taskId)
    )
  )

  const updateErrors = results.filter(r => r.error).map(r => r.error?.message)

  return NextResponse.json({
    scheduled: scheduledTasks.length,
    debug: {
      totalTasksFetched: tasks?.length ?? 0,
      tasksWithoutSchedule: (tasks ?? []).filter(t => !t.completed && !t.scheduled_start).length,
      taskIdsConsidered: (tasks ?? []).filter(t => !t.completed && !t.scheduled_start).map(t => ({ id: t.id, title: t.title, due_date: t.due_date, estimated_minutes: t.estimated_minutes, priority: t.priority })),
      lockedEventsCount: lockedEvents?.length ?? 0,
      preferredDays: preferences.preferred_days,
      workHours: { start: preferences.work_start_time, end: preferences.work_end_time },
      maxSessionMinutes: preferences.max_session_minutes,
      breakMinutes: preferences.break_minutes,
      scheduledTasks: scheduledTasks.map(s => ({ taskId: s.taskId, start: s.scheduledStart.toISOString(), end: s.scheduledEnd.toISOString() })),
      updateErrors,
    },
  })
}
