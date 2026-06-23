'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, CheckCircle2, Circle, RefreshCw, Trash2, Pencil } from 'lucide-react'
import type { Task, Course } from '@/types'
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@/types'
import { formatDuration, cn } from '@/lib/utils'
import { format } from 'date-fns'

interface Props {
  tasks: (Task & { courses?: { name: string; color: string } | null })[]
  courses: Course[]
}

interface TaskFormState {
  title: string
  dueDate: string
  dueTime: string
  estimatedMinutes: number
  priority: number
  courseId: string
}

const EMPTY_FORM: TaskFormState = {
  title: '',
  dueDate: '',
  dueTime: '',
  estimatedMinutes: 60,
  priority: 2,
  courseId: '',
}

/** Splits an ISO due_date into separate date and time fields, omitting time if it's the default end-of-day placeholder. */
function splitDueDate(dueDate: string | null): { dueDate: string; dueTime: string } {
  if (!dueDate) return { dueDate: '', dueTime: '' }
  const date = new Date(dueDate)
  const datePart = format(date, 'yyyy-MM-dd')
  const timePart = format(date, 'HH:mm')
  return { dueDate: datePart, dueTime: timePart === '23:59' ? '' : timePart }
}

function buildDueDate(dueDate: string, dueTime: string): string | null {
  if (!dueDate) return null
  return `${dueDate}T${dueTime || '23:59'}:00`
}

export default function TaskList({ tasks, courses }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<TaskFormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  function openCreateForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEditForm(task: Task) {
    const { dueDate, dueTime } = splitDueDate(task.due_date)
    setEditingId(task.id)
    setForm({
      title: task.title,
      dueDate,
      dueTime,
      estimatedMinutes: task.estimated_minutes,
      priority: task.priority,
      courseId: task.course_id ?? '',
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
    setSaving(true)

    const payload = {
      title: form.title,
      due_date: buildDueDate(form.dueDate, form.dueTime),
      estimated_minutes: form.estimatedMinutes,
      priority: form.priority,
      course_id: form.courseId || null,
    }

    if (editingId) {
      await fetch(`/api/tasks/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }

    setSaving(false)
    closeForm()
    router.refresh()
  }

  async function toggleComplete(task: Task) {
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        completed: !task.completed,
        completed_at: !task.completed ? new Date().toISOString() : null,
      }),
    })
    router.refresh()
  }

  async function deleteTask(id: string) {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  async function reschedule(id: string) {
    await fetch(`/api/tasks/${id}/reschedule`, { method: 'POST' })
    router.refresh()
  }

  const pending = tasks.filter(t => !t.completed)
  const completed = tasks.filter(t => t.completed)

  return (
    <div className="space-y-4 max-w-2xl">
      <button
        onClick={() => (showForm && !editingId ? closeForm() : openCreateForm())}
        className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add one-time task
      </button>

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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Due date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Due time (optional)</label>
              <input
                type="time"
                value={form.dueTime}
                onChange={e => setForm(f => ({ ...f, dueTime: e.target.value }))}
                disabled={!form.dueDate}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-400"
              />
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
              disabled={saving}
              className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingId ? 'Save changes' : 'Save task'}
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
        {pending.map(task => (
          <div key={task.id} className="bg-white rounded-xl border px-4 py-3 flex items-center gap-3 group">
            <button onClick={() => toggleComplete(task)} className="shrink-0 text-slate-400 hover:text-brand-600">
              <Circle className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {task.due_date && (() => {
                  const { dueTime } = splitDueDate(task.due_date)
                  return (
                    <span className="text-xs text-slate-400">
                      Due {format(new Date(task.due_date), 'MMM d')}
                      {dueTime && ` at ${format(new Date(task.due_date), 'h:mm a')}`}
                    </span>
                  )
                })()}
                <span className="text-xs text-slate-400">{formatDuration(task.estimated_minutes)}</span>
                <span className={cn('text-xs px-1.5 py-0.5 rounded-full', PRIORITY_COLORS[task.priority as 1|2|3])}>
                  {PRIORITY_LABELS[task.priority as 1|2|3]}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => openEditForm(task)}
                className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-brand-600"
                title="Edit"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => reschedule(task.id)}
                className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-brand-600"
                title="Reschedule"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => deleteTask(task.id)}
                className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-red-500"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {completed.length > 0 && (
        <div className="mt-6">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">Completed</p>
          <div className="space-y-2">
            {completed.slice(0, 5).map(task => (
              <div key={task.id} className="bg-slate-50 rounded-xl border px-4 py-3 flex items-center gap-3 opacity-60">
                <button onClick={() => toggleComplete(task)} className="shrink-0 text-brand-500">
                  <CheckCircle2 className="w-5 h-5" />
                </button>
                <p className="text-sm text-slate-500 line-through truncate">{task.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
