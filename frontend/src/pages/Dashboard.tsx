import { useState, useCallback, useEffect } from 'react'
import { Bug, Settings, LockKeyhole, MessageSquare } from 'lucide-react'
import DayDial from '../components/Timeline/DayDial'
import TimelineSpine from '../components/Timeline/TimelineSpine'
import ActiveFocusCard from '../components/Dashboard/ActiveFocusCard'
import TaskDeck from '../components/Dashboard/TaskDeck'
import InterventionSheet from '../components/Interventions/InterventionSheet'
import CompanionDrawer from '../components/Dashboard/CompanionDrawer'
import { MOCK_DIAL_SEGMENTS } from '../types/dashboard'
import type { FocusSession } from '../types/dashboard'
import { useTasks } from '../hooks/useTasks'
import { useFocusBlocks } from '../hooks/useFocusBlocks'
import { useInterventions } from '../hooks/useInterventions'

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
  const { tasks, fetchTasks } = useTasks()
  const { timeline, fetchFocusBlocks } = useFocusBlocks()
  const { interventions, updateInterventionStatus, fetchInterventions } = useInterventions()

  const [session, setSession] = useState<FocusSession | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Fetch interventions on mount
  useEffect(() => {
    fetchInterventions()
  }, [fetchInterventions])

  // Derive active intervention from interventions array
  const activeIntervention = interventions.find((i) => i.status === 'active') || null

  // ── Session controls ──────────────────────────────
  const handleStart = useCallback(() => {
    const activeTask = tasks.find((t) => t.status === 'in_progress') || tasks.find((t) => t.status === 'pending')
    const taskTitle = activeTask ? activeTask.title : 'General Session'
    const taskId = activeTask ? activeTask.id : 'general'

    setSession((prev) =>
      prev
        ? { ...prev, isRunning: true }
        : {
            taskTitle,
            taskId,
            startedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
            durationMinutes: 45,
            elapsedSeconds: 0,
            isRunning: true,
          }
    )
  }, [tasks])

  const handlePause = useCallback(() => {
    setSession((prev) => (prev ? { ...prev, isRunning: false } : null))
  }, [])

  const handleSnooze = useCallback(() => {
    setSession(null)
  }, [])

  const handleLock = useCallback(() => {
    onLock?.()
  }, [onLock])

  // ── Intervention Handlers ────────────────────────────────
  const handleAcceptDraft = useCallback(async () => {
    if (!activeIntervention) return
    try {
      await updateInterventionStatus(activeIntervention.id, 'accepted')
      await fetchTasks()
      await fetchFocusBlocks()
      await fetchInterventions()
    } catch (err) {
      console.error('Failed to accept draft:', err)
    }
  }, [activeIntervention, updateInterventionStatus, fetchTasks, fetchFocusBlocks, fetchInterventions])

  const handleConfirmSlots = useCallback(async () => {
    if (!activeIntervention) return
    try {
      await updateInterventionStatus(activeIntervention.id, 'accepted')
      await fetchTasks()
      await fetchFocusBlocks()
      await fetchInterventions()
    } catch (err) {
      console.error('Failed to confirm slots:', err)
    }
  }, [activeIntervention, updateInterventionStatus, fetchTasks, fetchFocusBlocks, fetchInterventions])

  const handleSnoozeIntervention = useCallback(async () => {
    if (!activeIntervention) return
    try {
      await updateInterventionStatus(activeIntervention.id, 'snoozed')
      await fetchInterventions()
    } catch (err) {
      console.error('Failed to snooze intervention:', err)
    }
  }, [activeIntervention, updateInterventionStatus, fetchInterventions])

  const handleDismissIntervention = useCallback(async () => {
    if (!activeIntervention) return
    try {
      await updateInterventionStatus(activeIntervention.id, 'dismissed')
      await fetchInterventions()
    } catch (err) {
      console.error('Failed to dismiss intervention:', err)
    }
  }, [activeIntervention, updateInterventionStatus, fetchInterventions])

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
              title="Companion"
              onClick={() => setIsDrawerOpen(true)}
              className="
                rounded-lg p-2 text-charcoal/50
                transition-all duration-200
                hover:bg-sage/10 hover:text-sage
              "
            >
              <MessageSquare size={16} />
            </button>
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
              <TimelineSpine entries={timeline} />
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
              <TaskDeck tasks={tasks} />
            </div>
          </section>

        </div>
      </main>

      {/* ── Overlays ────────────────────────────────────────── */}
      <InterventionSheet
        intervention={activeIntervention?.status === 'active' ? activeIntervention : null}
        onAcceptDraft={handleAcceptDraft}
        onConfirmSlots={handleConfirmSlots}
        onSnooze={handleSnoozeIntervention}
        onDismiss={handleDismissIntervention}
      />

      <CompanionDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  )
}
