import { useState, useEffect, useCallback } from 'react'
import { Play, Pause, Moon, Timer, Target } from 'lucide-react'
import type { FocusSession } from '../../types/dashboard'
import { formatDuration, formatMinutes } from '../../types/dashboard'

/* ──────────────────────────────────────────────────────────
   ActiveFocusCard.tsx — Primary center-stage focus container
   ────────────────────────────────────────────────────────── */

interface ActiveFocusCardProps {
  session: FocusSession | null
  onStart?: () => void
  onPause?: () => void
  onSnooze?: () => void
}

export default function ActiveFocusCard({
  session,
  onStart,
  onPause,
  onSnooze,
}: ActiveFocusCardProps) {
  // ── Live timer ───────────────────────────────────────────
  const [elapsed, setElapsed] = useState(session?.elapsedSeconds ?? 0)

  useEffect(() => {
    setElapsed(session?.elapsedSeconds ?? 0)
  }, [session?.elapsedSeconds])

  useEffect(() => {
    if (!session?.isRunning) return
    const id = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [session?.isRunning])

  const totalSeconds = (session?.durationMinutes ?? 0) * 60
  const progress = totalSeconds > 0 ? Math.min(elapsed / totalSeconds, 1) : 0
  const remaining = Math.max(totalSeconds - elapsed, 0)

  const handleToggle = useCallback(() => {
    if (session?.isRunning) onPause?.()
    else onStart?.()
  }, [session?.isRunning, onStart, onPause])

  // ── Resting state (no active session) ────────────────────
  if (!session) {
    return (
      <div className="rounded-2xl border border-paper-border bg-card-linen px-12 py-10">
        <div className="flex flex-col items-center text-center py-4 space-y-4">
          <div className="w-14 h-14 rounded-full bg-sage/10 flex items-center justify-center">
            <Target size={24} className="text-sage" />
          </div>
          <div className="space-y-2">
            <h2 className="font-lora text-3xl font-medium text-ink">
              Ready when you are
            </h2>
            <p className="font-jakarta text-sm text-charcoal leading-relaxed max-w-sm">
              Select a task from your deck to begin a focus session,
              or let the AI suggest your next move.
            </p>
          </div>
          <button
            type="button"
            onClick={onStart}
            className="
              inline-flex items-center gap-2 rounded-lg
              bg-ink px-8 py-4 font-jakarta text-base font-semibold text-white
              transition-all duration-300
              hover:bg-ink/90 hover:-translate-y-0.5 hover:shadow-md
              active:translate-y-0 active:shadow-sm
            "
          >
            <Play size={15} />
            Start Session
          </button>
        </div>
      </div>
    )
  }

  // ── Active session ───────────────────────────────────────
  return (
    <div className="rounded-2xl border border-paper-border bg-card-linen overflow-hidden">
      {/* Progress bar */}
      <div className="h-1 bg-paper-border/40">
        <div
          className="h-full bg-sage transition-all duration-1000 ease-linear rounded-r-full"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="px-12 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              {session.isRunning && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-sage opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sage" />
                </span>
              )}
              <span className="text-sm font-jakarta font-semibold uppercase tracking-widest text-sage">
                {session.isRunning ? 'Focusing' : 'Paused'}
              </span>
            </div>
            <h2 className="font-lora text-3xl font-medium text-ink leading-snug">
              {session.taskTitle}
            </h2>
            <p className="font-jakarta text-sm text-charcoal font-medium">
              Started {session.startedAt} · {formatMinutes(session.durationMinutes)} block
            </p>
          </div>

          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-sage/10 flex items-center justify-center">
            <Timer size={20} className="text-sage" />
          </div>
        </div>

        {/* Timer display */}
        <div className="flex items-baseline justify-center gap-3 mb-5">
          <span className="font-lora text-5xl sm:text-6xl font-medium tabular-nums text-ink tracking-tight">
            {formatDuration(elapsed)}
          </span>
          <div className="text-left">
            <p className="text-sm font-jakarta font-semibold text-charcoal uppercase tracking-wider">
              remaining
            </p>
            <p className="font-jakarta text-base tabular-nums text-charcoal font-semibold">
              {formatDuration(remaining)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggle}
            className="
              flex-1 inline-flex items-center justify-center gap-2
              rounded-lg bg-ink px-8 py-4
              font-jakarta text-base font-semibold text-white
              transition-all duration-300
              hover:bg-ink/90 hover:-translate-y-0.5 hover:shadow-md
              active:translate-y-0 active:shadow-sm
            "
          >
            {session.isRunning ? (
              <>
                <Pause size={15} />
                Pause
              </>
            ) : (
              <>
                <Play size={15} />
                Resume
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onSnooze}
            className="
              inline-flex items-center justify-center gap-2
              rounded-lg border border-paper-border bg-white/60 px-8 py-4
              font-jakarta text-base font-semibold text-charcoal
              transition-all duration-300
              hover:bg-white hover:border-charcoal/30 hover:-translate-y-0.5 hover:shadow-md
              active:translate-y-0 active:shadow-sm
            "
          >
            <Moon size={15} />
            Snooze
          </button>
        </div>
      </div>
    </div>
  )
}
