import { createClient } from '@/lib/supabase/server'
import WeeklyCalendar from '@/components/WeeklyCalendar'
import MissedTasksTray from '@/components/MissedTasksTray'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: tasks }, { data: lockedEvents }, { data: courses }, { data: preferences }] =
    await Promise.all([
      supabase.from('tasks').select('*, courses(name, color)').eq('user_id', user.id).eq('completed', false),
      supabase.from('locked_events').select('*').eq('user_id', user.id),
      supabase.from('courses').select('*').eq('user_id', user.id),
      supabase.from('preferences').select('*').eq('user_id', user.id).single(),
    ])

  const now = new Date()
  const missedTasks = (tasks ?? []).filter(
    t => !t.completed && t.scheduled_end && new Date(t.scheduled_end) < now
  )

  return (
    <div className="p-6 h-full flex flex-col gap-4">
      {missedTasks.length > 0 && <MissedTasksTray tasks={missedTasks} />}
      <WeeklyCalendar
        tasks={tasks ?? []}
        lockedEvents={lockedEvents ?? []}
        courses={courses ?? []}
        preferences={preferences}
      />
    </div>
  )
}
