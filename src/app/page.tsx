import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 to-white">
      <nav className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <span className="text-xl font-bold text-brand-600">Schedule Builder</span>
        <div className="flex gap-4">
          <Link href="/login" className="text-slate-600 hover:text-slate-900 text-sm font-medium">
            Log in
          </Link>
          <Link
            href="/signup"
            className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            Get started free
          </Link>
        </div>
      </nav>

      <section className="text-center px-8 py-24 max-w-4xl mx-auto">
        <div className="inline-block bg-brand-100 text-brand-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          Built for college students
        </div>
        <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-6">
          Stop planning your schedule.<br />
          <span className="text-brand-600">Let it plan itself.</span>
        </h1>
        <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto">
          Tell Schedule Builder what you need to get done and when it&apos;s due.
          It automatically fits tasks into your free time around classes, work, and everything else.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/signup"
            className="bg-brand-600 text-white px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="bg-white text-slate-700 px-8 py-3.5 rounded-xl text-base font-semibold border hover:bg-slate-50 transition-colors"
          >
            Log in
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-8 py-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            title: 'Canvas Sync',
            description: 'Connect Canvas and all your classes and assignments import automatically. No manual entry.',
            icon: '🔗',
          },
          {
            title: 'Smart Scheduling',
            description: 'Tasks get scheduled in free blocks based on your preferences, priorities, and due dates.',
            icon: '🧠',
          },
          {
            title: 'One-Tap Reschedule',
            description: 'Missed a session? Hit reschedule and it finds the next available slot instantly.',
            icon: '↩️',
          },
        ].map(feature => (
          <div key={feature.title} className="bg-white rounded-2xl p-6 border shadow-sm">
            <div className="text-3xl mb-3">{feature.icon}</div>
            <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
