import { useState, useCallback } from 'react'
import { Bug, Settings, LockKeyhole } from 'lucide-react'
import DayDial from '../components/Timeline/DayDial'
import TimelineSpine from '../components/Timeline/TimelineSpine'
import ActiveFocusCard from '../components/Dashboard/ActiveFocusCard'
import TaskDeck from '../components/Dashboard/TaskDeck'
import {
  MOCK_TASKS,
  MOCK_TIMELINE,
  MOCK_DIAL_SEGMENTS,
  MOCK_FOCUS_SESSION,
} from '../types/dashboard'
import type { FocusSession } from '../types/dashboard'

/* ──────────────────────────────────────────────────────────
   Dashboard.tsx — The Chrono-Stage Cockpit
   Split-screen: Chronicle (left 30vw) + Focus Stage (right 70vw)
   ────────────────────────────────────────────────────────── */

// Simulated current time for preview (9:39 AM = 9.65)
const CURRENT_HOUR = 9.65

interface DashboardProps {
  onLock?: () => void
}

export default function Dashboard({ onLock }: DashboardProps) {
  const [session, setSession] = useState<FocusSession | null>(MOCK_FOCUS_SESSION)

  // ── Session controls (mock) ──────────────────────────────
  const handleStart = useCallback(() => {
    setSession((prev) =>
      prev
        ? { ...prev, isRunning: true }
        : { ...MOCK_FOCUS_SESSION, isRunning: true, elapsedSeconds: 0 },
    )
  }, [])

  const handlePause = useCallback(() => {
    setSession((prev) => (prev ? { ...prev, isRunning: false } : null))
  }, [])

  const handleSnooze = useCallback(() => {
    setSession(null)
  }, [])

  const handleLock = useCallback(() => {
    localStorage.removeItem('bearer_token')
    onLock?.()
  }, [onLock])

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* ════════════════════════════════════════════════════
          Header Bar
          ════════════════════════════════════════════════════ */}
      <header className="border-b border-paper-border bg-card-linen/80 backdrop-blur-sm flex-shrink-0">
        <div className="mx-auto max-w-[1440px] px-5 py-3.5 flex items-center justify-between">
          <h1 className="font-lora text-lg font-medium tracking-tight text-ink">
            Life Saver
          </h1>
          <nav className="flex items-center gap-1">
            <button
              type="button"
              title="Debug"
              className="
                rounded-lg p-2 text-charcoal/50
                transition-all duration-200
                hover:bg-paper-border/30 hover:text-charcoal
              "
            >
              <Bug size={16} />
            </button>
            <button
              type="button"
              title="Settings"
              className="
                rounded-lg p-2 text-charcoal/50
                transition-all duration-200
                hover:bg-paper-border/30 hover:text-charcoal
              "
            >
              <Settings size={16} />
            </button>
            <button
              type="button"
              title="Lock workspace"
              onClick={handleLock}
              className="
                rounded-lg p-2 text-charcoal/50
                transition-all duration-200
                hover:bg-terracotta/10 hover:text-terracotta
              "
            >
              <LockKeyhole size={16} />
            </button>
          </nav>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════
          Main Content — Split Grid
          ════════════════════════════════════════════════════ */}
      <main className="flex-1 mx-auto w-full max-w-[1440px]">
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-57px)]">

          {/* ── THE CHRONICLE (Left Column) ────────────── */}
          <aside
            className="
              lg:w-[30%] lg:max-w-[380px] lg:min-w-[280px]
              border-b lg:border-b-0 lg:border-r border-paper-border
              bg-card-linen/40
              overflow-y-auto
            "
          >
            <div className="p-5 space-y-6">
              {/* Section heading */}
              <div className="flex items-center justify-between">
                <h2 className="font-lora text-sm font-medium text-charcoal tracking-wide">
                  Today's Chronicle
                </h2>
                <span className="text-[10px] font-jakarta font-medium text-charcoal/40 uppercase tracking-widest">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>

              {/* Day Dial — hidden on small screens */}
              <div className="hidden sm:flex justify-center py-2">
                <DayDial
                  segments={MOCK_DIAL_SEGMENTS}
                  currentHour={CURRENT_HOUR}
                />
              </div>

              {/* Divider */}
              <div className="h-px bg-paper-border/50" />

              {/* Timeline Spine */}
              <TimelineSpine entries={MOCK_TIMELINE} />
            </div>
          </aside>

          {/* ── THE FOCUS STAGE (Right Column) ─────────── */}
          <section className="flex-1 overflow-y-auto">
            <div className="p-5 lg:p-8 space-y-8 max-w-3xl">
              {/* Active Focus Card */}
              <ActiveFocusCard
                session={session}
                onStart={handleStart}
                onPause={handlePause}
                onSnooze={handleSnooze}
              />

              {/* Task Deck */}
              <TaskDeck tasks={MOCK_TASKS} />
            </div>
          </section>

        </div>
      </main>
    </div>
  )
}
