import { addDays, startOfWeek, setHours, setMinutes, format, isAfter, isBefore } from 'date-fns'
import type { Task, LockedEvent, Preferences } from '@/types'
import { timeToMinutes } from './utils'

interface TimeBlock {
  start: Date
  end: Date
}

interface ScheduledTask {
  taskId: string
  scheduledStart: Date
  scheduledEnd: Date
}

// Minimum gap reserved after each scheduled session before another task can start
const TASK_GAP_MINUTES = 15

// Maximum total task-minutes the scheduler will pack into a single day before spilling to the next
const MAX_DAILY_TASK_MINUTES = 240

/**
 * Converts a locked event on a specific date into a TimeBlock.
 */
function lockedEventToBlock(event: LockedEvent, date: Date): TimeBlock {
  const [startH, startM] = event.start_time.split(':').map(Number)
  const [endH, endM] = event.end_time.split(':').map(Number)
  const start = setMinutes(setHours(new Date(date), startH), startM)
  const end = setMinutes(setHours(new Date(date), endH), endM)
  return { start, end }
}

/**
 * Returns free time blocks on a given day, given locked blocks and preferences.
 */
function getFreeBlocks(
  date: Date,
  lockedBlocks: TimeBlock[],
  preferences: Preferences
): TimeBlock[] {
  const workStart = timeToMinutes(preferences.work_start_time)
  const workEnd = timeToMinutes(preferences.work_end_time)

  const dayStart = setMinutes(setHours(new Date(date), Math.floor(workStart / 60)), workStart % 60)
  const dayEnd = setMinutes(setHours(new Date(date), Math.floor(workEnd / 60)), workEnd % 60)

  // Sort locked blocks by start time
  const sorted = [...lockedBlocks]
    .filter(b => b.start >= dayStart && b.start < dayEnd)
    .sort((a, b) => a.start.getTime() - b.start.getTime())

  const freeBlocks: TimeBlock[] = []
  let cursor = dayStart

  for (const block of sorted) {
    if (isAfter(block.start, cursor)) {
      freeBlocks.push({ start: new Date(cursor), end: new Date(block.start) })
    }
    if (isAfter(block.end, cursor)) {
      cursor = new Date(block.end)
    }
  }

  if (isBefore(cursor, dayEnd)) {
    freeBlocks.push({ start: new Date(cursor), end: new Date(dayEnd) })
  }

  return freeBlocks
}

/**
 * Splits a free block into session-sized chunks, respecting max session length and breaks.
 */
function splitIntoSessions(block: TimeBlock, maxSessionMinutes: number, breakMinutes: number): TimeBlock[] {
  const sessions: TimeBlock[] = []
  let cursor = new Date(block.start)
  const end = block.end

  while (cursor < end) {
    const sessionEnd = new Date(Math.min(
      cursor.getTime() + maxSessionMinutes * 60 * 1000,
      end.getTime()
    ))

    const sessionLength = (sessionEnd.getTime() - cursor.getTime()) / 60000
    if (sessionLength >= 15) {
      sessions.push({ start: new Date(cursor), end: sessionEnd })
    }

    // Advance past session + break
    cursor = new Date(sessionEnd.getTime() + breakMinutes * 60 * 1000)
  }

  return sessions
}

/**
 * Main scheduling function.
 * Takes unscheduled tasks, locked events, and preferences.
 * Returns tasks with scheduled start/end times.
 */
export function scheduleTasks(
  tasks: Task[],
  lockedEvents: LockedEvent[],
  preferences: Preferences,
  startDate: Date = new Date()
): ScheduledTask[] {
  const scheduled: ScheduledTask[] = []
  const weekStart = startOfWeek(startDate, { weekStartsOn: 0 })

  // Build a map of already-occupied slots (starts as locked events)
  const occupiedBlocks: TimeBlock[] = []

  // Tracks total task-minutes already placed on each day (keyed by yyyy-MM-dd)
  const dailyMinutesUsed: Record<string, number> = {}

  // Sort tasks: high priority first, then soonest due date
  const sortedTasks = [...tasks]
    .filter(t => !t.completed)
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      }
      return 0
    })

  for (const task of sortedTasks) {
    let minutesRemaining = task.estimated_minutes
    let placed = false

    // If the due date has already passed, don't let it block scheduling — fit it in ASAP instead
    const dueDate = task.due_date ? new Date(task.due_date) : null
    const dueDatePassed = dueDate ? isBefore(dueDate, startDate) : false

    // Try to place the task within the next 14 days
    for (let dayOffset = 0; dayOffset < 14 && minutesRemaining > 0; dayOffset++) {
      const day = addDays(weekStart, dayOffset)
      const dayOfWeek = day.getDay()
      const dayKey = format(day, 'yyyy-MM-dd')

      // Respect preferred days
      if (!preferences.preferred_days.includes(dayOfWeek)) continue

      // Don't schedule past due date (unless it's already overdue — then schedule ASAP)
      if (dueDate && !dueDatePassed && isAfter(day, dueDate)) break

      // Don't overload a single day — spill remaining work to the next day
      if ((dailyMinutesUsed[dayKey] ?? 0) >= MAX_DAILY_TASK_MINUTES) continue

      // Get locked blocks for this day
      const dayLockedBlocks = lockedEvents
        .filter(e => e.days_of_week.includes(dayOfWeek))
        .map(e => lockedEventToBlock(e, day))

      // Add already-scheduled task blocks for this day
      const dayOccupied = [
        ...dayLockedBlocks,
        ...occupiedBlocks.filter(b => format(b.start, 'yyyy-MM-dd') === dayKey),
      ]

      const freeBlocks = getFreeBlocks(day, dayOccupied, preferences)

      for (const freeBlock of freeBlocks) {
        if (minutesRemaining <= 0) break
        if ((dailyMinutesUsed[dayKey] ?? 0) >= MAX_DAILY_TASK_MINUTES) break

        const sessions = splitIntoSessions(
          freeBlock,
          preferences.max_session_minutes,
          preferences.break_minutes
        )

        for (const session of sessions) {
          if (minutesRemaining <= 0) break
          if ((dailyMinutesUsed[dayKey] ?? 0) >= MAX_DAILY_TASK_MINUTES) break

          const sessionMinutes = (session.end.getTime() - session.start.getTime()) / 60000
          const dailyMinutesLeft = MAX_DAILY_TASK_MINUTES - (dailyMinutesUsed[dayKey] ?? 0)
          const useMinutes = Math.min(sessionMinutes, minutesRemaining, dailyMinutesLeft)
          if (useMinutes < 15) continue

          const taskEnd = new Date(session.start.getTime() + useMinutes * 60 * 1000)

          scheduled.push({
            taskId: task.id,
            scheduledStart: session.start,
            scheduledEnd: taskEnd,
          })

          // Reserve a gap after this session so the next task doesn't start immediately
          const reservedEnd = new Date(taskEnd.getTime() + TASK_GAP_MINUTES * 60 * 1000)
          occupiedBlocks.push({ start: session.start, end: reservedEnd })

          dailyMinutesUsed[dayKey] = (dailyMinutesUsed[dayKey] ?? 0) + useMinutes
          minutesRemaining -= useMinutes
          placed = true
        }
      }
    }

    if (!placed && minutesRemaining > 0) {
      // Task couldn't be fully scheduled — mark as partially scheduled or skip
      console.warn(`Could not schedule task: ${task.title}`)
    }
  }

  return scheduled
}

/**
 * Reschedules a single task, treating its current slot as free.
 */
export function rescheduleTask(
  task: Task,
  allTasks: Task[],
  lockedEvents: LockedEvent[],
  preferences: Preferences
): ScheduledTask | null {
  const taskWithoutSchedule = { ...task, scheduled_start: null, scheduled_end: null }
  const otherTasks = allTasks.filter(t => t.id !== task.id)

  const result = scheduleTasks(
    [taskWithoutSchedule, ...otherTasks],
    lockedEvents,
    preferences,
    new Date()
  )

  return result.find(r => r.taskId === task.id) ?? null
}
