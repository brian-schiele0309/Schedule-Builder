'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Link2, CheckCircle, Loader2 } from 'lucide-react'
import type { Profile } from '@/types'
import { format } from 'date-fns'

export default function CanvasConnect({ profile }: { profile: Profile | null }) {
  const router = useRouter()
  const [canvasUrl, setCanvasUrl] = useState(profile?.canvas_url ?? '')
  const [canvasToken, setCanvasToken] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<{ coursesCreated: number; tasksCreated: number; eventsCreated: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSync(e: React.FormEvent) {
    e.preventDefault()
    setSyncing(true)
    setError(null)
    setResult(null)

    const res = await fetch('/api/canvas/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ canvasUrl, canvasToken }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
    } else {
      setResult(data)
      router.refresh()
    }
    setSyncing(false)
  }

  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="flex items-center gap-2 mb-4">
        <Link2 className="w-4 h-4 text-brand-600" />
        <h2 className="font-semibold text-slate-900">Canvas Integration</h2>
        {profile?.canvas_last_synced_at && (
          <span className="ml-auto text-xs text-slate-400">
            Last synced {format(new Date(profile.canvas_last_synced_at), 'MMM d, h:mm a')}
          </span>
        )}
      </div>

      <p className="text-sm text-slate-500 mb-4">
        Connect your Canvas account to automatically import your classes and assignments.
        Generate an API token in <strong>Canvas &gt; Account &gt; Settings &gt; New Access Token</strong>.
      </p>

      <form onSubmit={handleSync} className="space-y-3">
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Canvas URL</label>
          <input
            type="text"
            placeholder="canvas.yourschool.edu"
            value={canvasUrl}
            onChange={e => setCanvasUrl(e.target.value)}
            required
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">API Token</label>
          <input
            type="password"
            placeholder="Paste your Canvas access token"
            value={canvasToken}
            onChange={e => setCanvasToken(e.target.value)}
            required
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>
        )}

        {result && (
          <div className="bg-green-50 text-green-700 text-sm px-3 py-2 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Synced {result.coursesCreated} courses, {result.tasksCreated} assignments, {result.eventsCreated} class events
          </div>
        )}

        <button
          type="submit"
          disabled={syncing}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
        >
          {syncing && <Loader2 className="w-4 h-4 animate-spin" />}
          {syncing ? 'Syncing...' : profile?.canvas_url ? 'Re-sync Canvas' : 'Connect Canvas'}
        </button>
      </form>
    </div>
  )
}
