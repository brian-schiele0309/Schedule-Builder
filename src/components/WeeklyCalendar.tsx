'use client'

import { useState } from 'react'
import { startOfWeek, addDays, format, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react'
import type { Task, LockedEvent, Course, Preferences } from '@/types'
import { formatTime, cn } from '@/lib/utils'
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

export default function WeeklyCalendar({ tasks, lockedEvents, preferences }: Props) {
  const [weekOffset, setWeekOffset] = useState(0)
  const today = new Date()
  const weekStart = addDays(startOfWeek(today, { weekStartsOn: 0 }), weekOffset * 7)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

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
        <button className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors">
          <Zap className="w-3.5 h-3.5" />
          Auto-schedule
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

            return (
              <div
                key={day.toISOString()}
                className={cn('border-r last:border-r-0 relative', isSameDay(day, today) && 'bg-brand-50/30')}
              >
                {/* Hour grid lines */}
                {HOURS.map(h => <div key={h} className="h-16 border-b" />)}

                {/* Locked events */}
                {dayLocked.map(event => {
                  const top = timeToPercent(event.start_time)
                  const height = timeToPercent(event.end_time) - top
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
                {dayTasks.map(task => {
                  if (!task.scheduled_start || !task.scheduled_end) return null
                  const startTime = format(new Date(task.scheduled_start), 'HH:mm')
                  const endTime = format(new Date(task.scheduled_end), 'HH:mm')
                  const top = timeToPercent(startTime)
                  const height = timeToPercent(endTime) - top
                  return (
                    <div
                      key={task.id}
                      className="absolute left-0.5 right-0.5 rounded px-1.5 py-1 bg-brand-100 border border-brand-300 text-brand-800 text-xs font-medium overflow-hidden"
                      style={{ top: `${top}%`, height: `${height}%` }}
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
