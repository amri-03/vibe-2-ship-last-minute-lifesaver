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
  critical: 'bg-terracotta/15 text-terracotta border-terracotta/30',
  high:     'bg-terracotta/10 text-terracotta border-terracotta/25',
  medium:   'bg-horizon/15 text-horizon border-horizon/30',
  low:      'bg-paper-border text-charcoal border-paper-border/80',
}

// ── Status icon ────────────────────────────────────────────

function StatusIcon({ status }: { status: TaskStatus }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 size={16} className="text-sage flex-shrink-0" />
    case 'active':
    case 'in_progress':
      return (
        <span className="relative flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center">
          <span className="absolute inline-flex h-2.5 w-2.5 rounded-none bg-sage opacity-50 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-none bg-sage" />
        </span>
      )
    default:
      return <Circle size={16} className="text-charcoal/40 flex-shrink-0" />
  }
}

// ── Single task row ────────────────────────────────────────

function TaskRow({ task }: { task: Task }) {
  const isCompleted = task.status === 'completed'

  return (
    <li
      className={`
        group flex items-center gap-3 rounded-none px-5 py-4
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
          <p className="flex items-center gap-1.5 mt-1 text-sm font-jakarta text-charcoal">
            <Clock size={11} className="flex-shrink-0" />
            {task.dueLabel}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-sm font-jakarta font-medium tabular-nums text-charcoal">
          {formatMinutes(task.estimatedMinutes)}
        </span>
        <span
          className={`
            inline-flex items-center rounded-none border
            px-2.5 py-1 text-xs font-jakarta font-semibold uppercase tracking-wide
            ${PRIORITY_CLASSES[task.priority]}
          `}
        >
          {task.priority === 'critical' && (
            <AlertTriangle size={10} className="mr-0.5" />
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
      else if (t.status === 'active' || t.status === 'in_progress') active.push(t)
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
          <h3 className="font-lora text-xl font-medium text-ink">
            Task Deck
          </h3>
          <span className="text-sm font-jakarta font-semibold text-charcoal uppercase tracking-wider">
            {backlog.length} remaining
          </span>
        </div>
        <div className="rounded-none border border-paper-border bg-white/40 backdrop-blur-sm overflow-hidden">
          {backlog.length > 0 ? (
            <ul className="divide-y divide-paper-border/40">
              {backlog.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </ul>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-charcoal font-jakarta">
              All clear — nothing in the backlog.
            </p>
          )}
        </div>
      </section>

      {/* ── Completed ───────────────────────────────── */}
      {completed.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="font-lora text-xl font-medium text-ink">
              Completed
            </h3>
            <span className="text-sm font-jakarta font-semibold text-sage uppercase tracking-wider">
              {completed.length} done
            </span>
          </div>
          <div className="rounded-none border border-paper-border/50 bg-white/20 overflow-hidden">
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
