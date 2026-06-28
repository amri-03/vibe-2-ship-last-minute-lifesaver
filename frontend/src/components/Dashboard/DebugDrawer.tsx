import { X, Database, Sparkles, RefreshCw } from 'lucide-react'
import { useState } from 'react'

interface DebugDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function DebugDrawer({ isOpen, onClose }: DebugDrawerProps) {
  const [seeding, setSeeding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSeed = async () => {
    setSeeding(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await fetch('http://localhost:3000/api/auth/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!res.ok) {
        throw new Error('Failed to seed database.')
      }
      const data = await res.json()
      if (data.token) {
        localStorage.setItem('bearer_token', data.token)
      }
      setSuccess(true)
      // Refresh the page after a brief delay to show the seeded data
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (err: any) {
      setError(err.message || 'Failed to seed database.')
    } finally {
      setSeeding(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 z-30 bg-ink/5 backdrop-blur-[2px] lg:hidden transition-opacity duration-300
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`
          fixed top-0 right-0 bottom-0 z-40 w-full max-w-[360px]
          bg-card-linen border-l border-paper-border
          transform transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1)
          flex flex-col
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-paper-border/60">
          <h2 className="flex items-center gap-2 font-lora text-sm font-semibold text-charcoal">
            <Database size={16} className="text-horizon" />
            Developer Console
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-charcoal/50 hover:text-ink hover:bg-paper-border/40 rounded-none transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 space-y-6 overflow-y-auto bg-canvas">
          <div className="space-y-2">
            <h3 className="font-jakarta text-xs font-semibold text-ink uppercase tracking-wider">
              Database Seeding Engine
            </h3>
            <p className="font-jakarta text-xs leading-relaxed text-charcoal/70">
              Reset your local Supabase database to a clean, pre-configured state. This will delete all existing tasks, focus blocks, and interventions for profile ID 1 and populate:
            </p>
            <ul className="list-disc list-inside font-jakarta text-[11px] text-charcoal/80 space-y-1 pl-1">
              <li>1 Sole profile (master password: <code>password123</code>)</li>
              <li>5 Realistic tasks (priorities critical to low)</li>
              <li>5 Focus blocks (dynamically scheduled relative to now)</li>
              <li>2 Pending AI interventions (proposal outlines & slots)</li>
            </ul>
          </div>

          <div className="pt-2">
            <button
               type="button"
               onClick={handleSeed}
               disabled={seeding}
               className="
                 w-full flex items-center justify-center gap-2
                 rounded-none bg-terracotta px-4 py-3
                 font-jakarta text-sm font-semibold text-white
                 transition-all duration-300
                 hover:bg-terracotta/90 hover:-translate-y-px
                 active:translate-y-0
                 disabled:opacity-50 disabled:pointer-events-none
               "
             >
              {seeding ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              {seeding ? 'Seeding Database...' : 'Seed Demo Data'}
            </button>

            {success && (
              <p className="mt-3 text-center text-xs text-sage font-medium font-jakarta animate-pulse">
                ✓ Seeding complete! Reloading cockpit...
              </p>
            )}

            {error && (
              <p className="mt-3 text-center text-xs text-terracotta font-medium font-jakarta">
                ⚠ {error}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-paper-border/60 bg-white/50 text-[10px] text-charcoal/40 font-jakarta text-center">
          Judge Seeding Engine v1.0.0
        </div>
      </aside>
    </>
  )
}
