'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DAY_NAMES } from '@/types'

const STEPS = ['Work Hours', 'Session Length', 'Preferred Days']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [workStart, setWorkStart] = useState('09:00')
  const [workEnd, setWorkEnd] = useState('22:00')
  const [maxSession, setMaxSession] = useState(90)
  const [breakLen, setBreakLen] = useState(15)
  const [preferredDays, setPreferredDays] = useState([1, 2, 3, 4, 5])
  const [saving, setSaving] = useState(false)

  function toggleDay(day: number) {
    setPreferredDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  async function finish() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('preferences').upsert({
      user_id: user.id,
      work_start_time: workStart,
      work_end_time: workEnd,
      max_session_minutes: maxSession,
      break_minutes: breakLen,
      preferred_days: preferredDays,
    })

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border shadow-sm p-8 w-full max-w-md">
        <div className="mb-6">
          <div className="flex gap-2 mb-6">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  i <= step ? 'bg-brand-600' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-brand-600 font-medium uppercase tracking-wide mb-1">
            Step {step + 1} of {STEPS.length}
          </p>
          <h1 className="text-xl font-semibold text-slate-900">{STEPS[step]}</h1>
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">When do you like to work? We&apos;ll only schedule tasks during these hours.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Start time</label>
                <input
                  type="time"
                  value={workStart}
                  onChange={e => setWorkStart(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">End time</label>
                <input
                  type="time"
                  value={workEnd}
                  onChange={e => setWorkEnd(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <p className="text-sm text-slate-500">How long should individual work sessions be, and how long should breaks be?</p>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Max session length: <span className="text-brand-600">{maxSession} min</span>
              </label>
              <input
                type="range"
                min={30}
                max={180}
                step={15}
                value={maxSession}
                onChange={e => setMaxSession(Number(e.target.value))}
                className="w-full accent-brand-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>30 min</span><span>3 hours</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Break between sessions: <span className="text-brand-600">{breakLen} min</span>
              </label>
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={breakLen}
                onChange={e => setBreakLen(Number(e.target.value))}
                className="w-full accent-brand-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>5 min</span><span>60 min</span>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Which days do you prefer to work on? Tasks will be scheduled on these days first.</p>
            <div className="flex gap-2 flex-wrap">
              {DAY_NAMES.map((day, i) => (
                <button
                  key={day}
                  onClick={() => toggleDay(i)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    preferredDays.includes(i)
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 border rounded-lg py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex-1 bg-brand-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={finish}
              disabled={saving}
              className="flex-1 bg-brand-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Go to my schedule'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
