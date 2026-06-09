import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { rescheduleTask } from '@/lib/scheduler'

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const [{ data: task }, { data: allTasks }, { data: lockedEvents }, { data: preferences }] =
    await Promise.all([
      supabase.from('tasks').select('*').eq('id', id).eq('user_id', user.id).single(),
      supabase.from('tasks').select('*').eq('user_id', user.id).eq('completed', false),
      supabase.from('locked_events').select('*').eq('user_id', user.id),
      supabase.from('preferences').select('*').eq('user_id', user.id).single(),
    ])

  if (!task || !preferences) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const result = rescheduleTask(task, allTasks ?? [], lockedEvents ?? [], preferences)

  if (!result) return NextResponse.json({ error: 'No available slot found' }, { status: 409 })

  await supabase
    .from('tasks')
    .update({
      scheduled_start: result.scheduledStart.toISOString(),
      scheduled_end: result.scheduledEnd.toISOString(),
      missed: false,
    })
    .eq('id', id)

  return NextResponse.json(result)
}
