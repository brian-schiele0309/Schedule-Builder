import { createClient } from '@/lib/supabase/server'
import CanvasConnect from '@/components/CanvasConnect'
import PreferencesForm from '@/components/PreferencesForm'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: profile }, { data: preferences }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('preferences').select('*').eq('user_id', user.id).single(),
  ])

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your preferences and integrations</p>
      </div>
      <div className="space-y-6">
        <CanvasConnect profile={profile} />
        <PreferencesForm preferences={preferences} />
      </div>
    </div>
  )
}
