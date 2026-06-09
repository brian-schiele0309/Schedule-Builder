'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, CheckCircle2, Circle, RefreshCw, Trash2 } from 'lucide-react'
import type { Task, Course } from '@/types'
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@/types'
import { formatDuration, cn } from '@/lib/utils'
import { format } from 'date-fns'

interface Props {
  tasks: (Task & { courses?: { name: string; color: string } | null })[]
  courses: Course[]
}

export default function TaskList({ tasks, courses }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState(60)
  const [priority, setPriority] = useState(2)
  const [courseId, setCourseId] = useState('')
  const [saving, setSaving] = useState(false)

  async function createTask(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        due_date: dueDate || null,
        estimated_minutes: estimatedMinutes,
        priority,
        course_id: courseId || null,
      }),
    })
    setTitle('')
    setDueDate('')
    setEstimatedMinutes(60)
    setPriority(2)
    setCourseId('')
    setShowForm(false)
    setSaving(false)
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
        onClick={() => setShowForm(s => !s)}
        className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add task
      </button>

      {showForm && (
        <form onSubmit={createTask} className="bg-white rounded-xl border p-4 space-y-3">
          <input
            type="text"
            placeholder="Task title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Due date</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Estimated time (minutes)</label>
              <input
                type="number"
                min={15}
                step={15}
                value={estimatedMinutes}
                onChange={e => setEstimatedMinutes(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value={1}>Low</option>
                <option value={2}>Medium</option>
                <option value={3}>High</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Course</label>
              <select
                value={courseId}
                onChange={e => setCourseId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">No course</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save task'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
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
                {task.due_date && (
                  <span className="text-xs text-slate-400">
                    Due {format(new Date(task.due_date), 'MMM d')}
                  </span>
                )}
                <span className="text-xs text-slate-400">{formatDuration(task.estimated_minutes)}</span>
                <span className={cn('text-xs px-1.5 py-0.5 rounded-full', PRIORITY_COLORS[task.priority as 1|2|3])}>
                  {PRIORITY_LABELS[task.priority as 1|2|3]}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
