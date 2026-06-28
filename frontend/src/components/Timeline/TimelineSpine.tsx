import {
  Clock,
  Calendar,
  Coffee,
  Sparkles,
  ChevronRight,
} from 'lucide-react'
import type { TimelineEntry, EventKind } from '../../types/dashboard'

/* ──────────────────────────────────────────────────────────
   TimelineSpine.tsx — Vertical chronological schedule list
   Centered axis symmetry layout.
   ────────────────────────────────────────────────────────── */

interface TimelineSpineProps {
  entries: TimelineEntry[]
}

const KIND_CONFIG: Record<EventKind, {
  icon: typeof Clock
  dotColor: string
  label: string
}> = {
  focus: {
    icon: Clock,
    dotColor: 'bg-sage',
    label: 'Focus',
  },
  calendar: {
    icon: Calendar,
    dotColor: 'bg-horizon',
    label: 'Event',
  },
  break: {
    icon: Coffee,
    dotColor: 'bg-paper-border',
    label: 'Break',
  },
  intervention: {
    icon: Sparkles,
    dotColor: 'bg-terracotta',
    label: 'AI Suggestion',
  },
}

export default function TimelineSpine({ entries }: TimelineSpineProps) {
  return (
    <div className="relative w-full">
      {/* Vertical spine line centered exactly */}
      <div className="absolute left-1/2 top-4 bottom-4 border-l-2 border-paper-border -translate-x-1/2" />

      <ol className="space-y-6 w-full relative">
        {entries.map((entry) => {
          const config = KIND_CONFIG[entry.kind]
          const Icon = config.icon
          const isIntervention = entry.kind === 'intervention'

          return (
            <li key={entry.id} className="relative grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-4 items-start py-2">
              {/* ── Left Column: Time Guideline ────────────────── */}
              <div className="text-right text-sm font-jakarta font-semibold text-charcoal pt-0.5">
                {isIntervention ? (
                  <span className="text-terracotta font-semibold">Suggest</span>
                ) : (
                  entry.time
                )}
              </div>

              {/* ── Middle Column: Spine Dot ───────────────────── */}
              <div className="relative z-10 flex items-center justify-center pt-1.5">
                <div
                  className={`
                    w-3 h-3 rounded-none border-2 border-canvas
                    ${config.dotColor}
                    ${entry.isActive ? 'ring-2 ring-sage/30' : ''}
                  `}
                />
              </div>

              {/* ── Right Column: Transparent Row ──────────────── */}
              <div className="text-left min-w-0 flex flex-col justify-start">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon
                    size={14}
                    className={
                      isIntervention ? 'text-terracotta flex-shrink-0'
                        : entry.isActive ? 'text-sage flex-shrink-0'
                        : 'text-charcoal flex-shrink-0'
                    }
                  />
                  <span
                    className={`
                      text-sm font-jakarta font-bold truncate
                      ${entry.isActive ? 'text-ink' : 'text-charcoal'}
                      ${isIntervention ? 'text-terracotta' : ''}
                    `}
                  >
                    {entry.label}
                  </span>
                </div>

                {/* Active indicator */}
                {entry.isActive && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full rounded-none bg-sage opacity-75 animate-ping" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-none bg-sage" />
                    </span>
                    <span className="text-xs font-jakarta font-semibold text-sage">
                      In progress
                    </span>
                  </div>
                )}

                {/* Intervention hint */}
                {isIntervention && (
                  <div className="mt-1">
                    <p className="text-xs text-charcoal leading-relaxed font-jakarta">
                      AI detected a 90-min gap — schedule a focus block?
                    </p>
                    <button
                      type="button"
                      className="
                        mt-1.5 flex items-center gap-0.5 text-xs font-jakarta
                        font-semibold text-terracotta hover:text-terracotta/80
                        transition-colors self-start
                      "
                    >
                      Review
                      <ChevronRight size={12} />
                    </button>
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
