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
   ────────────────────────────────────────────────────────── */

interface TimelineSpineProps {
  entries: TimelineEntry[]
}

// ── Kind → visual config ───────────────────────────────────

const KIND_CONFIG: Record<EventKind, {
  icon: typeof Clock
  dotColor: string
  bg: string
  label: string
}> = {
  focus: {
    icon: Clock,
    dotColor: 'bg-sage',
    bg: 'bg-sage/8',
    label: 'Focus',
  },
  calendar: {
    icon: Calendar,
    dotColor: 'bg-horizon',
    bg: 'bg-horizon/8',
    label: 'Event',
  },
  break: {
    icon: Coffee,
    dotColor: 'bg-paper-border',
    bg: 'bg-paper-border/30',
    label: 'Break',
  },
  intervention: {
    icon: Sparkles,
    dotColor: 'bg-terracotta',
    bg: 'bg-terracotta/8',
    label: 'AI Suggestion',
  },
}

// ── Component ──────────────────────────────────────────────

export default function TimelineSpine({ entries }: TimelineSpineProps) {
  return (
    <div className="relative pl-4">
      {/* Vertical spine line */}
      <div className="absolute left-[19px] top-2 bottom-2 w-px bg-paper-border/60" />

      <ol className="space-y-1">
        {entries.map((entry, idx) => {
          const config = KIND_CONFIG[entry.kind]
          const Icon = config.icon
          const isLast = idx === entries.length - 1
          const isIntervention = entry.kind === 'intervention'

          return (
            <li key={entry.id} className="relative flex gap-3 group">
              {/* ── Dot on spine ─────────────────────── */}
              <div className="relative z-10 flex-shrink-0 mt-3">
                <div
                  className={`
                    w-2.5 h-2.5 rounded-full border-2 border-canvas
                    ${config.dotColor}
                    ${entry.isActive ? 'ring-2 ring-sage/30' : ''}
                  `}
                />
              </div>

              {/* ── Entry card ───────────────────────── */}
              <div
                className={`
                  flex-1 rounded-lg px-3 py-2.5 transition-colors duration-200
                  ${isIntervention
                    ? 'border border-dashed border-terracotta/30 bg-terracotta/5'
                    : `${config.bg} group-hover:bg-card-linen`
                  }
                  ${isLast ? '' : 'mb-0.5'}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon
                      size={13}
                      className={
                        isIntervention ? 'text-terracotta flex-shrink-0'
                          : entry.isActive ? 'text-sage flex-shrink-0'
                          : 'text-charcoal/50 flex-shrink-0'
                      }
                    />
                    <span
                      className={`
                        text-xs font-jakarta font-medium truncate
                        ${entry.isActive ? 'text-ink' : 'text-charcoal'}
                      `}
                    >
                      {entry.label}
                    </span>
                  </div>

                  {isIntervention ? (
                    <button
                      type="button"
                      className="
                        flex items-center gap-0.5 text-[10px] font-jakarta
                        font-semibold text-terracotta hover:text-terracotta/80
                        transition-colors
                      "
                    >
                      Review
                      <ChevronRight size={11} />
                    </button>
                  ) : (
                    <span className="text-[10px] text-charcoal/50 font-jakarta tabular-nums flex-shrink-0 ml-2">
                      {entry.time}
                    </span>
                  )}
                </div>

                {/* Active indicator */}
                {entry.isActive && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-sage opacity-75 animate-ping" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sage" />
                    </span>
                    <span className="text-[10px] font-jakarta font-medium text-sage">
                      In progress
                    </span>
                  </div>
                )}

                {/* Intervention hint */}
                {isIntervention && (
                  <p className="mt-1 text-[10px] text-charcoal/60 font-jakarta leading-relaxed">
                    AI detected a 90-min gap — schedule a focus block?
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
