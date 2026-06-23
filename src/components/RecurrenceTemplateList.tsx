'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Pencil, Repeat } from 'lucide-react'
import type { RecurrenceTemplate, Course } from '@/types'
import { PRIORITY_LABELS, PRIORITY_COLORS, DAY_NAMES } from '@/types'
import { formatDuration, cn } from '@/lib/utils'

interface Props {
  templates: (RecurrenceTemplate & { courses?: { name: string; color: string } | null })[]
  courses: Course[]
}

interface FormState {
  title: string
  estimatedMinutes: number
  priority: number
  courseId: string
  dueDay: number | null
}

const EMPTY_FORM: FormState = {
  title: '',
  estimatedMinutes: 60,
  priority: 2,
  courseId: '',
  dueDay: null,
}

export default function RecurrenceTemplateList({ templates, courses }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  function openCreateForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEditForm(template: RecurrenceTemplate) {
    setEditingId(template.id)
    setForm({
      title: template.title,
      estimatedMinutes: template.estimated_minutes,
      priority: template.priority ?? 2,
      courseId: template.course_id ?? '',
      dueDay: template.days_of_week?.[0] ?? null,
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
    if (form.dueDay === null) return
    setSaving(true)

    const payload = {
      title: form.title,
      estimated_minutes: form.estimatedMinutes,
      priority: form.priority,
      course_id: form.courseId || null,
      days_of_week: [form.dueDay],
    }

    if (editingId) {
      await fetch(`/api/recurrence-templates/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch('/api/recurrence-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }

    setSaving(false)
    closeForm()
    router.refresh()
  }

  async function deleteTemplate(id: string) {
    await fetch(`/api/recurrence-templates/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
          <Repeat className="w-4 h-4" />
          Recurring tasks
        </h2>
        <button
          onClick={() => (showForm && !editingId ? closeForm() : openCreateForm())}
          className="flex items-center gap-2 bg-brand-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add recurring task
        </button>
      </div>

      {showForm && (
        <form onSubmit={submitForm} className="bg-white rounded-xl border p-4 space-y-3">
          <input
            type="text"
            placeholder="Task title"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <div>
            <label className="text-xs text-slate-500 block mb-1">Due every week on</label>
            <div className="flex gap-1.5">
              {DAY_NAMES.map((name, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, dueDay: idx }))}
                  className={cn(
                    'w-9 h-9 rounded-lg text-xs font-medium border transition-colors',
                    form.dueDay === idx
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'text-slate-500 hover:bg-slate-50'
                  )}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Estimated time (minutes)</label>
              <input
                type="number"
                min={15}
                step={15}
                value={form.estimatedMinutes}
                onChange={e => setForm(f => ({ ...f, estimatedMinutes: Number(e.target.value) }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value={1}>Low</option>
                <option value={2}>Medium</option>
                <option value={3}>High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Course</label>
            <select
              value={form.courseId}
              onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">No course</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || form.dueDay === null}
              className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingId ? 'Save changes' : 'Save recurring task'}
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
        {templates.map(template => (
          <div key={template.id} className="bg-white rounded-xl border px-4 py-3 flex items-center gap-3 group">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{template.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-400">
                  {template.days_of_week?.[0] !== undefined ? `Due ${DAY_NAMES[template.days_of_week[0]]}` : 'No due day set'}
                </span>
                <span className="text-xs text-slate-400">{formatDuration(template.estimated_minutes)}</span>
                <span className={cn('text-xs px-1.5 py-0.5 rounded-full', PRIORITY_COLORS[(template.priority ?? 2) as 1 | 2 | 3])}>
                  {PRIORITY_LABELS[(template.priority ?? 2) as 1 | 2 | 3]}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => openEditForm(template)}
                className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-brand-600"
                title="Edit"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => deleteTemplate(template.id)}
                className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-red-500"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <p className="text-sm text-slate-400">No recurring tasks yet.</p>
        )}
      </div>
    </div>
  )
}
