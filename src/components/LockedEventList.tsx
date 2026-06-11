'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Pencil } from 'lucide-react'
import type { LockedEvent } from '@/types'
import { DAY_NAMES } from '@/types'
import { formatTime, cn } from '@/lib/utils'

const PRESET_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6']

interface FormState {
  title: string
  days: number[]
  startTime: string
  endTime: string
  color: string
}

const EMPTY_FORM: FormState = {
  title: '',
  days: [],
  startTime: '09:00',
  endTime: '10:00',
  color: PRESET_COLORS[0],
}

export default function LockedEventList({ lockedEvents }: { lockedEvents: LockedEvent[] }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  function toggleDay(day: number) {
    setForm(f => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter(d => d !== day) : [...f.days, day],
    }))
  }

  function openCreateForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEditForm(event: LockedEvent) {
    setEditingId(event.id)
    setForm({
      title: event.title,
      days: [...event.days_of_week],
      startTime: event.start_time.slice(0, 5),
      endTime: event.end_time.slice(0, 5),
      color: event.color,
    })
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault()
    if (form.days.length === 0) return
    setSaving(true)

    const payload = {
      title: form.title,
      days_of_week: form.days,
      start_time: form.startTime,
      end_time: form.endTime,
      color: form.color,
      recurs_weekly: true,
    }

    if (editingId) {
      await fetch(`/api/locked-events/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch('/api/locked-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }

    setSaving(false)
    closeForm()
    router.refresh()
  }

  async function deleteEvent(id: string) {
    await fetch(`/api/locked-events/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <button
        onClick={() => (showForm && !editingId ? closeForm() : openCreateForm())}
        className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add class or commitment
      </button>

      {showForm && (
        <form onSubmit={submitForm} className="bg-white rounded-xl border p-4 space-y-3">
          <input
            type="text"
            placeholder="e.g. CS 201 Lecture, Work Shift"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          <div>
            <label className="text-xs text-slate-500 block mb-1">Days</label>
            <div className="flex gap-2 flex-wrap">
              {DAY_NAMES.map((day, i) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                    form.days.includes(i)
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Start time</label>
              <input
                type="time"
                value={form.startTime}
                onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">End time</label>
              <input
                type="time"
                value={form.endTime}
                onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1">Color</label>
            <div className="flex gap-2">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={cn(
                    'w-7 h-7 rounded-full border-2 transition-transform',
                    form.color === c ? 'border-slate-900 scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {form.days.length === 0 && (
            <p className="text-xs text-red-500">Select at least one day</p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingId ? 'Save changes' : 'Save'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="border px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {lockedEvents.map(event => (
          <div key={event.id} className="bg-white rounded-xl border px-4 py-3 flex items-center gap-3 group">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: event.color }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{event.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {event.days_of_week.map(d => DAY_NAMES[d]).join(', ')} · {formatTime(event.start_time)} – {formatTime(event.end_time)}
              </p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => openEditForm(event)}
                className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-brand-600"
                title="Edit"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => deleteEvent(event.id)}
                className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-red-500"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        {lockedEvents.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">No classes or commitments added yet.</p>
        )}
      </div>
    </div>
  )
}
