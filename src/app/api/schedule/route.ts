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
  await Promise.all(
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

  return NextResponse.json({ scheduled: scheduledTasks.length })
}
