import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const CANVAS_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
]

async function canvasFetch(canvasUrl: string, token: string, path: string) {
  const res = await fetch(`https://${canvasUrl}/api/v1${path}?per_page=50`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Canvas API error: ${res.status}`)
  return res.json()
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { canvasUrl, canvasToken } = await request.json()
  if (!canvasUrl || !canvasToken) {
    return NextResponse.json({ error: 'Missing canvasUrl or canvasToken' }, { status: 400 })
  }

  try {
    // Fetch active courses
    const courses: CanvasCourse[] = await canvasFetch(canvasUrl, canvasToken, '/courses?enrollment_state=active')

    let coursesCreated = 0
    let tasksCreated = 0
    let eventsCreated = 0

    for (let i = 0; i < courses.length; i++) {
      const course = courses[i]
      const color = CANVAS_COLORS[i % CANVAS_COLORS.length]

      // Upsert course
      const { data: dbCourse } = await supabase
        .from('courses')
        .upsert(
          { user_id: user.id, name: course.name, course_code: course.course_code, color, canvas_course_id: String(course.id) },
          { onConflict: 'user_id,canvas_course_id' }
        )
        .select()
        .single()

      coursesCreated++

      // Fetch and upsert assignments
      try {
        const assignments: CanvasAssignment[] = await canvasFetch(
          canvasUrl, canvasToken,
          `/courses/${course.id}/assignments?order_by=due_at&bucket=future`
        )

        for (const a of assignments) {
          if (!a.due_at) continue
          await supabase.from('tasks').upsert(
            {
              user_id: user.id,
              course_id: dbCourse?.id ?? null,
              title: a.name,
              due_date: a.due_at,
              estimated_minutes: 60,
              priority: 2,
              completed: a.has_submitted_submissions,
              canvas_assignment_id: String(a.id),
            },
            { onConflict: 'user_id,canvas_assignment_id' }
          )
          tasksCreated++
        }
      } catch {
        // Some courses may not have assignments endpoint accessible
      }

      // Fetch and create locked events from course sections (class times)
      try {
        const sections: CanvasSection[] = await canvasFetch(
          canvasUrl, canvasToken,
          `/courses/${course.id}/sections?include[]=students`
        )

        for (const section of sections) {
          if (!section.start_at || !section.end_at) continue
          // Canvas doesn't expose recurring meeting times via sections API directly
          // This is handled via calendar_events instead
        }

        const calEvents: CanvasCalendarEvent[] = await canvasFetch(
          canvasUrl, canvasToken,
          `/calendar_events?context_codes[]=course_${course.id}&type=event&start_date=${new Date().toISOString().split('T')[0]}`
        )

        for (const event of calEvents) {
          if (!event.start_at || !event.end_at) continue
          const startDate = new Date(event.start_at)
          const endDate = new Date(event.end_at)
          const startTime = `${String(startDate.getHours()).padStart(2,'0')}:${String(startDate.getMinutes()).padStart(2,'0')}`
          const endTime = `${String(endDate.getHours()).padStart(2,'0')}:${String(endDate.getMinutes()).padStart(2,'0')}`

          await supabase.from('locked_events').upsert(
            {
              user_id: user.id,
              title: event.title ?? course.name,
              days_of_week: [startDate.getDay()],
              start_time: startTime,
              end_time: endTime,
              color,
              canvas_course_id: String(course.id),
            },
            { onConflict: 'user_id,canvas_course_id,start_time,days_of_week' }
          )
          eventsCreated++
        }
      } catch {
        // Calendar events may not be accessible for all courses
      }
    }

    // Save Canvas credentials and last sync time
    await supabase.from('profiles').update({
      canvas_url: canvasUrl,
      canvas_token_encrypted: canvasToken,
      canvas_last_synced_at: new Date().toISOString(),
    }).eq('id', user.id)

    return NextResponse.json({ coursesCreated, tasksCreated, eventsCreated })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Canvas sync failed' },
      { status: 500 }
    )
  }
}

interface CanvasCourse { id: number; name: string; course_code: string }
interface CanvasAssignment { id: number; name: string; due_at: string | null; has_submitted_submissions: boolean }
interface CanvasSection { start_at: string | null; end_at: string | null }
interface CanvasCalendarEvent { id: number; title: string; start_at: string; end_at: string }
