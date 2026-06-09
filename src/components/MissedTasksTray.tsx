'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import type { Task } from '@/types'

export default function MissedTasksTray({ tasks }: { tasks: Task[] }) {
  const router = useRouter()
  const [rescheduling, setRescheduling] = useState<string | null>(null)

  async function reschedule(taskId: string) {
    setRescheduling(taskId)
    await fetch(`/api/tasks/${taskId}/reschedule`, { method: 'POST' })
    router.refresh()
    setRescheduling(null)
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-semibold text-amber-800">
          {tasks.length} missed task{tasks.length > 1 ? 's' : ''}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {tasks.map(task => (
          <div key={task.id} className="flex items-center gap-2 bg-white border border-amber-200 rounded-lg px-3 py-1.5">
            <span className="text-sm text-slate-700">{task.title}</span>
            <button
              onClick={() => reschedule(task.id)}
              disabled={rescheduling === task.id}
              className="flex items-center gap-1 text-xs text-brand-600 font-medium hover:text-brand-800 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${rescheduling === task.id ? 'animate-spin' : ''}`} />
              Reschedule
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
