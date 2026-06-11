import { createClient } from '@/lib/supabase/server'
import LockedEventList from '@/components/LockedEventList'

export default async function ClassesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: lockedEvents } = await supabase
    .from('locked_events')
    .select('*')
    .eq('user_id', user.id)
    .order('start_time', { ascending: true })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Classes & Commitments</h1>
        <p className="text-sm text-slate-500 mt-1">
          Add your classes, work shifts, and other fixed events. Tasks will be scheduled around these.
        </p>
      </div>
      <LockedEventList lockedEvents={lockedEvents ?? []} />
    </div>
  )
}
