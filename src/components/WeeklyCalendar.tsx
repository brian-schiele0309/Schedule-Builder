'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { startOfWeek, addDays, format, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Zap, Loader2 } from 'lucide-react'
import type { Task, LockedEvent, Course, Preferences } from '@/types'
import { cn } from '@/lib/utils'
import { DAY_NAMES } from '@/types'

const HOURS = Array.from({ length: 17 }, (_, i) => i + 7) // 7am to 11pm

interface Props {
  tasks: (Task & { courses?: { name: string; color: string } | null })[]
  lockedEvents: LockedEvent[]
  courses: Course[]
  preferences: Preferences | null
}

function timeToPercent(time: string, dayStart = 7): number {
  const [h, m] = time.split(':').map(Number)
  return ((h + m / 60 - dayStart) / 16) * 100
}

// Clamp a block's top/height so it never renders outside the visible grid
function clampBlock(top: number, height: number): { top: number; height: number } {
  const bottom = Math.min(top + height, 100)
  const clampedTop = Math.max(top, 0)
  return { top: clampedTop, height: Math.max(bottom - clampedTop, 0) }
}

// Assign overlapping tasks to side-by-side columns so they don't visually stack
function layoutOverlaps<T extends { top: number; height: number }>(
  items: T[]
): (T & { col: number; cols: number })[] {
  const sorted = [...items].sort((a, b) => a.top - b.top)
  const result: (T & { col: number; cols: number })[] = []
  let cluster: (T & { col: number; cols: number })[] = []
  let clusterEnd = -Infinity

  const flushCluster = () => {
    if (cluster.length === 0) return
    const cols = cluster.length
    cluster.forEach((item, i) => {
      item.col = i
      item.cols = cols
    })
    result.push(...cluster)
    cluster = []
  }

  for (const item of sorted) {
    const withCols = { ...item, col: 0, cols: 1 }
    if (withCols.top >= clusterEnd) {
      flushCluster()
      clusterEnd = withCols.top + withCols.height
    } else {
      clusterEnd = Math.max(clusterEnd, withCols.top + withCols.height)
    }
    cluster.push(withCols)
  }
  flushCluster()

  return result
}

export default function WeeklyCalendar({ tasks, lockedEvents, preferences }: Props) {
  const router = useRouter()
  const [weekOffset, setWeekOffset] = useState(0)
  const [scheduling, setScheduling] = useState(false)
  const today = new Date()
  const weekStart = addDays(startOfWeek(today, { weekStartsOn: 0 }), weekOffset * 7)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  async function handleAutoSchedule() {
    setScheduling(true)
    try {
      await fetch('/api/schedule', { method: 'POST' })
      router.refresh()
    } finally {
      setScheduling(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border shadow-sm flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekOffset(o => o - 1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="font-semibold text-slate-900">
            {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </h2>
          <button
            onClick={() => setWeekOffset(o => o + 1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="text-xs text-brand-600 font-medium hover:underline ml-1"
          >
            Today
          </button>
        </div>
        <button
          onClick={handleAutoSchedule}
          disabled={scheduling}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
        >
          {scheduling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
          {scheduling ? 'Scheduling...' : 'Auto-schedule'}
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-8 border-b">
        <div className="border-r" />
        {weekDays.map(day => (
          <div
            key={day.toISOString()}
            className={cn(
              'py-3 text-center border-r last:border-r-0',
              isSameDay(day, today) && 'bg-brand-50'
            )}
          >
            <p className="text-xs text-slate-400">{DAY_NAMES[day.getDay()]}</p>
            <p className={cn(
              'text-sm font-semibold mt-0.5',
              isSameDay(day, today) ? 'text-brand-600' : 'text-slate-800'
            )}>
              {format(day, 'd')}
            </p>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-8 relative" style={{ minHeight: '640px' }}>
          {/* Hour labels */}
          <div className="border-r">
            {HOURS.map(h => (
              <div key={h} className="h-16 border-b flex items-start pt-1 px-2">
                <span className="text-xs text-slate-400">
                  {h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map(day => {
            const dayOfWeek = day.getDay()
            const dayLocked = lockedEvents.filter(e => e.days_of_week.includes(dayOfWeek))
            const dayTasks = tasks.filter(t =>
              t.scheduled_start && isSameDay(new Date(t.scheduled_start), day)
            )

            const taskBlocks = layoutOverlaps(
              dayTasks
                .map(task => {
                  if (!task.scheduled_start || !task.scheduled_end) return null
                  const startTime = format(new Date(task.scheduled_start), 'HH:mm')
                  const endTime = format(new Date(task.scheduled_end), 'HH:mm')
                  const rawTop = timeToPercent(startTime)
                  const rawHeight = timeToPercent(endTime) - rawTop
                  const { top, height } = clampBlock(rawTop, rawHeight)
                  if (height <= 0) return null
                  return { task, top, height }
                })
                .filter((b): b is { task: typeof dayTasks[number]; top: number; height: number } => b !== null)
            )

            return (
              <div
                key={day.toISOString()}
                className={cn('border-r last:border-r-0 relative overflow-hidden', isSameDay(day, today) && 'bg-brand-50/30')}
              >
                {/* Hour grid lines */}
                {HOURS.map(h => <div key={h} className="h-16 border-b" />)}

                {/* Locked events */}
                {dayLocked.map(event => {
                  const rawTop = timeToPercent(event.start_time)
                  const rawHeight = timeToPercent(event.end_time) - rawTop
                  const { top, height } = clampBlock(rawTop, rawHeight)
                  if (height <= 0) return null
                  return (
                    <div
                      key={event.id}
                      className="absolute left-0.5 right-0.5 rounded px-1.5 py-1 text-white text-xs font-medium overflow-hidden"
                      style={{
                        top: `${top}%`,
                        height: `${height}%`,
                        backgroundColor: event.color,
                      }}
                    >
                      {event.title}
                    </div>
                  )
                })}

                {/* Scheduled tasks */}
                {taskBlocks.map(({ task, top, height, col, cols }) => {
                  const widthPct = 100 / cols
                  const leftPct = col * widthPct
                  return (
                    <div
                      key={task.id}
                      className="absolute rounded px-1.5 py-1 bg-brand-100 border border-brand-300 text-brand-800 text-xs font-medium overflow-hidden"
                      style={{
                        top: `${top}%`,
                        height: `${height}%`,
                        left: `calc(${leftPct}% + 2px)`,
                        width: `calc(${widthPct}% - 4px)`,
                      }}
                    >
                      {task.title}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
