import { ChevronDown, CalendarPlus, FileText, Zap } from 'lucide-react'
import type { Intervention } from '../../types/dashboard'

/* ──────────────────────────────────────────────────────────
   InterventionSheet.tsx — Slide-up AI Action Panel
   ────────────────────────────────────────────────────────── */

interface InterventionSheetProps {
  intervention: Intervention | null
  onAcceptDraft?: (draftText: string) => void
  onConfirmSlots?: () => void
  onSnooze?: () => void
  onDismiss?: () => void
}

export default function InterventionSheet({
  intervention,
  onAcceptDraft,
  onConfirmSlots,
  onSnooze,
  onDismiss,
}: InterventionSheetProps) {
  const isOpen = !!intervention

  return (
    <>
      {/* ── Backdrop ────────────────────────────────────────── */}
      <div
        className={`
          fixed inset-0 z-40 bg-ink/10 backdrop-blur-sm transition-opacity duration-300
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        aria-hidden="true"
        onClick={onDismiss}
      />

      {/* ── Sheet Container ─────────────────────────────────── */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-50 flex justify-center
          transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1)
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
        `}
      >
        <div
          className="
            w-full max-w-3xl rounded-none
            bg-gradient-to-tr from-card-linen via-white/95 to-card-linen
            border-t border-x border-paper-border
            p-6 sm:p-8
          "
        >
          {/* Header & Close */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="flex items-center gap-2 font-lora text-xl font-medium text-ink">
              <SparklesIcon type={intervention?.type} />
              {intervention?.title}
            </h2>
            <button
              onClick={onDismiss}
              className="p-2 text-charcoal/50 hover:text-ink transition-colors rounded-none hover:bg-paper-border/30"
              aria-label="Close"
            >
              <ChevronDown size={20} />
            </button>
          </div>

          {/* Body Content */}
          <div className="min-h-[120px] max-h-[50vh] overflow-y-auto mb-6 pr-2">
            {intervention?.type === 'draft_proposal' && (
              <div className="space-y-4">
                <p className="font-jakarta text-sm text-charcoal">
                  {intervention.message}
                </p>
                <div className="bg-white/60 border border-paper-border rounded-none p-5 font-jakarta text-sm text-ink whitespace-pre-wrap leading-relaxed">
                  {intervention.payload?.draftText}
                </div>
              </div>
            )}

            {intervention?.type === 'scheduling_proposal' && (
              <div className="space-y-4 text-center py-4">
                <p className="font-jakarta text-sm text-charcoal mb-4">
                  {intervention.message}
                </p>
                <div className="inline-flex flex-col gap-3">
                  {intervention.payload?.slots?.map((slot: string, i: number) => (
                    <div key={i} className="px-4 py-3 bg-white border border-paper-border rounded-none font-jakarta text-sm font-medium text-ink">
                      {slot}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {intervention?.type === 'procrastination_nudge' && (
              <div className="text-center py-8 space-y-4">
                <p className="font-lora text-lg text-ink">
                  {intervention.message}
                </p>
                <p className="font-jakarta text-sm text-charcoal max-w-sm mx-auto">
                  Taking the first step is the hardest part. Let's block out 45 minutes right now to get momentum.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-paper-border/50">
            {intervention?.type === 'draft_proposal' && (
              <>
                <button
                  onClick={onDismiss}
                  className="px-5 py-2.5 rounded-none font-jakarta text-sm font-medium text-charcoal hover:bg-paper-border/30 transition-colors"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => onAcceptDraft?.(intervention.payload?.draftText)}
                  className="px-5 py-2.5 rounded-none bg-ink text-white font-jakarta text-sm font-semibold hover:-translate-y-px transition-all duration-300"
                >
                  Accept Draft
                </button>
              </>
            )}

            {intervention?.type === 'scheduling_proposal' && (
              <>
                <button
                  onClick={onSnooze}
                  className="px-5 py-2.5 rounded-none font-jakarta text-sm font-medium text-charcoal hover:bg-paper-border/30 transition-colors"
                >
                  Snooze
                </button>
                <button
                  onClick={onConfirmSlots}
                  className="px-5 py-2.5 rounded-none bg-ink text-white font-jakarta text-sm font-semibold hover:-translate-y-px transition-all duration-300"
                >
                  Confirm Slots
                </button>
              </>
            )}

            {intervention?.type === 'procrastination_nudge' && (
              <>
                <button
                  onClick={onDismiss}
                  className="px-5 py-2.5 rounded-none font-jakarta text-sm font-medium text-charcoal hover:bg-paper-border/30 transition-colors"
                >
                  Not Now
                </button>
                <button
                  onClick={onConfirmSlots}
                  className="px-5 py-2.5 rounded-none bg-terracotta text-white font-jakarta text-sm font-semibold hover:-translate-y-px transition-all duration-300 flex items-center gap-2"
                >
                  <Zap size={16} />
                  Start 45m Session Now
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function SparklesIcon({ type }: { type?: string }) {
  if (type === 'draft_proposal') return <FileText size={20} className="text-sage" />
  if (type === 'scheduling_proposal') return <CalendarPlus size={20} className="text-horizon" />
  if (type === 'procrastination_nudge') return <Zap size={20} className="text-terracotta" />
  return <FileText size={20} className="text-charcoal" />
}
