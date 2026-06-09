'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save } from 'lucide-react'
import type { Preferences } from '@/types'
import { DAY_NAMES } from '@/types'
import { cn } from '@/lib/utils'

export default function PreferencesForm({ preferences }: { preferences: Preferences | null }) {
  const router = useRouter()
  const [workStart, setWorkStart] = useState(preferences?.work_start_time ?? '09:00')
  const [workEnd, setWorkEnd] = useState(preferences?.work_end_time ?? '22:00')
  const [maxSession, setMaxSession] = useState(preferences?.max_session_minutes ?? 90)
  const [breakLen, setBreakLen] = useState(preferences?.break_minutes ?? 15)
  const [preferredDays, setPreferredDays] = useState(preferences?.preferred_days ?? [1,2,3,4,5])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function toggleDay(day: number) {
    setPreferredDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        work_start_time: workStart,
        work_end_time: workEnd,
        max_session_minutes: maxSession,
        break_minutes: breakLen,
        preferred_days: preferredDays,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl border p-5">
      <h2 className="font-semibold text-slate-900 mb-4">Scheduling Preferences</h2>
      <form onSubmit={save} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Work start time</label>
            <input type="time" value={workStart} onChange={e => setWorkStart(e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Work end time</label>
            <input type="time" value={workEnd} onChange={e => setWorkEnd(e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">
            Max session length: <span className="text-brand-600">{maxSession} min</span>
          </label>
          <input type="range" min={30} max={180} step={15} value={maxSession}
            onChange={e => setMaxSession(Number(e.target.value))} className="w-full accent-brand-600" />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">
            Break between sessions: <span className="text-brand-600">{breakLen} min</span>
          </label>
          <input type="range" min={5} max={60} step={5} value={breakLen}
            onChange={e => setBreakLen(Number(e.target.value))} className="w-full accent-brand-600" />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">Preferred work days</label>
          <div className="flex gap-2 flex-wrap">
            {DAY_NAMES.map((day, i) => (
              <button key={day} type="button" onClick={() => toggleDay(i)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                  preferredDays.includes(i)
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                )}>
                {day}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50">
          <Save className="w-4 h-4" />
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save preferences'}
        </button>
      </form>
    </div>
  )
}
