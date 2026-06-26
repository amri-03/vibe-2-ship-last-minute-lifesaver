/* ──────────────────────────────────────────────────────────
   Dashboard Types & Mock Data
   ────────────────────────────────────────────────────────── */

// ── Core Types ─────────────────────────────────────────────

export type Priority = 'critical' | 'high' | 'medium' | 'low'
export type TaskStatus = 'active' | 'in_progress' | 'pending' | 'completed' | 'snoozed'
export type EventKind = 'focus' | 'calendar' | 'break' | 'intervention'

export interface Task {
  id: string
  title: string
  description?: string
  estimatedMinutes: number
  priority: Priority
  status: TaskStatus
  dueLabel?: string
}

export interface TimelineEntry {
  id: string
  time: string        // "09:00 AM"
  label: string
  kind: EventKind
  durationMinutes: number
  isActive?: boolean
}

export interface FocusSession {
  taskTitle: string
  taskId: string
  startedAt: string   // ISO timestamp or display string
  durationMinutes: number
  elapsedSeconds: number
  isRunning: boolean
}

export interface DialSegment {
  startHour: number   // 0–24 (fractional for minutes)
  endHour: number
  kind: EventKind
  title?: string
}

export type InterventionType = 'draft_proposal' | 'scheduling_proposal' | 'procrastination_nudge'
export type InterventionStatus = 'active' | 'snoozed' | 'dismissed' | 'accepted'

export interface Intervention {
  id: string
  type: InterventionType
  status: InterventionStatus
  title: string
  message: string
  payload?: any
}

// ── Mock Data ──────────────────────────────────────────────

export const MOCK_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Finalize pitch deck slides 8–12',
    estimatedMinutes: 45,
    priority: 'critical',
    status: 'active',
    dueLabel: 'Today 3:00 PM',
  },
  {
    id: 't2',
    title: 'Review PR #247 — auth middleware',
    estimatedMinutes: 20,
    priority: 'high',
    status: 'pending',
    dueLabel: 'Today 5:00 PM',
  },
  {
    id: 't3',
    title: 'Draft weekly standup notes',
    estimatedMinutes: 10,
    priority: 'medium',
    status: 'pending',
  },
  {
    id: 't4',
    title: 'Update Figma component library',
    estimatedMinutes: 30,
    priority: 'medium',
    status: 'pending',
    dueLabel: 'Tomorrow',
  },
  {
    id: 't5',
    title: 'Write unit tests for calendar sync',
    estimatedMinutes: 35,
    priority: 'low',
    status: 'pending',
  },
  {
    id: 't6',
    title: 'Fix timezone bug in event parser',
    estimatedMinutes: 15,
    priority: 'high',
    status: 'completed',
  },
  {
    id: 't7',
    title: 'Set up CI pipeline for staging',
    estimatedMinutes: 25,
    priority: 'medium',
    status: 'completed',
  },
]

export const MOCK_TIMELINE: TimelineEntry[] = [
  {
    id: 'e1',
    time: '08:30 AM',
    label: 'Morning planning',
    kind: 'focus',
    durationMinutes: 30,
  },
  {
    id: 'e2',
    time: '09:00 AM',
    label: 'Daily standup',
    kind: 'calendar',
    durationMinutes: 15,
  },
  {
    id: 'e3',
    time: '09:30 AM',
    label: 'Deep work — pitch deck',
    kind: 'focus',
    durationMinutes: 90,
    isActive: true,
  },
  {
    id: 'e4',
    time: '11:00 AM',
    label: 'Propose focus block?',
    kind: 'intervention',
    durationMinutes: 0,
  },
  {
    id: 'e5',
    time: '11:30 AM',
    label: 'Break',
    kind: 'break',
    durationMinutes: 15,
  },
  {
    id: 'e6',
    time: '12:00 PM',
    label: 'Lunch',
    kind: 'break',
    durationMinutes: 60,
  },
  {
    id: 'e7',
    time: '01:00 PM',
    label: 'Code review session',
    kind: 'focus',
    durationMinutes: 45,
  },
  {
    id: 'e8',
    time: '02:00 PM',
    label: 'Client sync call',
    kind: 'calendar',
    durationMinutes: 30,
  },
]

export const MOCK_DIAL_SEGMENTS: DialSegment[] = [
  { startHour: 8.5,  endHour: 9,    kind: 'focus', title: 'Morning planning' },
  { startHour: 9,    endHour: 9.25, kind: 'calendar', title: 'Daily standup' },
  { startHour: 9.5,  endHour: 11,   kind: 'focus', title: 'Deep work — pitch deck' },
  { startHour: 11.5, endHour: 11.75, kind: 'break', title: 'Break' },
  { startHour: 12,   endHour: 13,   kind: 'break', title: 'Lunch' },
  { startHour: 13,   endHour: 13.75, kind: 'focus', title: 'Code review session' },
  { startHour: 14,   endHour: 14.5, kind: 'calendar', title: 'Client sync call' },
]

export const MOCK_FOCUS_SESSION: FocusSession = {
  taskTitle: 'Finalize pitch deck slides 8–12',
  taskId: 't1',
  startedAt: '09:30 AM',
  durationMinutes: 90,
  elapsedSeconds: 2340, // 39 minutes in
  isRunning: true,
}

export const MOCK_INTERVENTION: Intervention = {
  id: 'i1',
  type: 'draft_proposal',
  status: 'active',
  title: 'Draft Proposal',
  message: 'I have generated a draft outline for your pitch deck slides.',
  payload: {
    draftText: '1. Introduction\n2. Market Opportunity\n3. Product Architecture\n4. Go-to-Market Strategy\n5. Financial Projections'
  }
}

// ── Helpers ────────────────────────────────────────────────

export function priorityLabel(p: Priority): string {
  return { critical: 'Critical', high: 'High', medium: 'Med', low: 'Low' }[p]
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}
