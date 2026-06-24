import { useMemo } from 'react'
import { Circle, CheckCircle2, AlertTriangle, Clock } from 'lucide-react'
import type { Task, Priority, TaskStatus } from '../../types/dashboard'
import { priorityLabel, formatMinutes } from '../../types/dashboard'

/* ──────────────────────────────────────────────────────────
   TaskDeck.tsx — Backlog & completed task list
   ────────────────────────────────────────────────────────── */

interface TaskDeckProps {
  tasks: Task[]
}

// ── Priority badge styling ─────────────────────────────────

const PRIORITY_CLASSES: Record<Priority, string> = {
  critical: 'bg-terracotta/12 text-terracotta border-terracotta/20',
  high:     'bg-terracotta/8 text-terracotta/80 border-terracotta/15',
  medium:   'bg-horizon/10 text-horizon border-horizon/20',
  low:      'bg-paper-border/40 text-charcoal border-paper-border',
}

// ── Status icon ────────────────────────────────────────────

function StatusIcon({ status }: { status: TaskStatus }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 size={15} className="text-sage flex-shrink-0" />
    case 'active':
      return (
        <span className="relative flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center">
          <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-sage opacity-50 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-sage" />
        </span>
      )
    default:
      return <Circle size={15} className="text-charcoal/30 flex-shrink-0" />
  }
}

// ── Single task row ────────────────────────────────────────

function TaskRow({ task }: { task: Task }) {
  const isCompleted = task.status === 'completed'

  return (
    <li
      className={`
        group flex items-center gap-3 rounded-lg px-3.5 py-3
        transition-colors duration-200 cursor-default
        ${isCompleted ? 'opacity-60' : 'hover:bg-card-linen'}
      `}
    >
      <StatusIcon status={task.status} />

      <div className="flex-1 min-w-0">
        <p
          className={`
            font-jakarta text-sm leading-snug truncate
            ${isCompleted ? 'line-through text-charcoal/60' : 'text-ink'}
          `}
        >
          {task.title}
        </p>
        {task.dueLabel && !isCompleted && (
          <p className="flex items-center gap-1 mt-0.5 text-[10px] font-jakarta text-charcoal/60">
            <Clock size={9} />
            {task.dueLabel}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[10px] font-jakarta tabular-nums text-charcoal/50">
          {formatMinutes(task.estimatedMinutes)}
        </span>
        <span
          className={`
            inline-flex items-center rounded-full border
            px-2 py-0.5 text-[9px] font-jakarta font-semibold uppercase tracking-wide
            ${PRIORITY_CLASSES[task.priority]}
          `}
        >
          {task.priority === 'critical' && (
            <AlertTriangle size={8} className="mr-0.5" />
          )}
          {priorityLabel(task.priority)}
        </span>
      </div>
    </li>
  )
}

// ── Main component ─────────────────────────────────────────

export default function TaskDeck({ tasks }: TaskDeckProps) {
  const { active, pending, completed } = useMemo(() => {
    const active: Task[] = []
    const pending: Task[] = []
    const completed: Task[] = []
    for (const t of tasks) {
      if (t.status === 'completed') completed.push(t)
      else if (t.status === 'active') active.push(t)
      else pending.push(t)
    }
    // Sort pending by priority weight
    const w: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 }
    pending.sort((a, b) => w[a.priority] - w[b.priority])
    return { active, pending, completed }
  }, [tasks])

  const backlog = [...active, ...pending]

  return (
    <div className="space-y-6">
      {/* ── Backlog ─────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="font-lora text-sm font-medium text-ink">
            Task Deck
          </h3>
          <span className="text-[10px] font-jakarta font-medium text-charcoal/50 uppercase tracking-wider">
            {backlog.length} remaining
          </span>
        </div>
        <div className="rounded-xl border border-paper-border bg-white/40 backdrop-blur-sm overflow-hidden">
          {backlog.length > 0 ? (
            <ul className="divide-y divide-paper-border/40">
              {backlog.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </ul>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-charcoal/50 font-jakarta">
              All clear — nothing in the backlog.
            </p>
          )}
        </div>
      </section>

      {/* ── Completed ───────────────────────────────── */}
      {completed.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="font-lora text-sm font-medium text-charcoal">
              Completed
            </h3>
            <span className="text-[10px] font-jakarta font-medium text-sage uppercase tracking-wider">
              {completed.length} done
            </span>
          </div>
          <div className="rounded-xl border border-paper-border/50 bg-white/20 overflow-hidden">
            <ul className="divide-y divide-paper-border/30">
              {completed.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  )
}
