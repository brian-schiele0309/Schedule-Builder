import { createClient } from '@/lib/supabase/server'
import TaskList from '@/components/TaskList'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: tasks }, { data: courses }] = await Promise.all([
    supabase
      .from('tasks')
      .select('*, courses(name, color)')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true }),
    supabase.from('courses').select('*').eq('user_id', user.id),
  ])

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Tasks</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your assignments and to-dos</p>
      </div>
      <TaskList tasks={tasks ?? []} courses={courses ?? []} />
    </div>
  )
}
