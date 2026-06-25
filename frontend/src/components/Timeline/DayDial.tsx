import { useMemo } from 'react'
import type { DialSegment } from '../../types/dashboard'

/* ──────────────────────────────────────────────────────────
   DayDial.tsx — SVG circular 24-hour clock
   Signature element of the Chrono-Stage cockpit.
   ────────────────────────────────────────────────────────── */

interface DayDialProps {
  segments: DialSegment[]
  /** Current hour as a decimal (e.g. 9.65 = 9:39 AM) */
  currentHour: number
  /** Visible hour window: [start, end] — defaults to a working day */
  range?: [number, number]
}

// ── Geometry constants ─────────────────────────────────────

const SIZE = 288          // px  (w-72)
const CX = SIZE / 2
const CY = SIZE / 2
const OUTER_R = 129        // outer ring
const ARC_R = 114          // colored arcs
const TICK_OUTER = 129
const TICK_INNER = 120
const LABEL_R = 102
const DOT_R = 114          // pulsing current-time dot

// ── Palette lookup ─────────────────────────────────────────

const KIND_COLORS: Record<string, { stroke: string; opacity: number }> = {
  focus:        { stroke: '#6E826E', opacity: 0.45 },   // sage
  calendar:     { stroke: '#668FA8', opacity: 0.45 },   // horizon
  break:        { stroke: '#E5DFD3', opacity: 0.50 },   // paper-border
  intervention: { stroke: '#D47053', opacity: 0.40 },   // terracotta
}

// ── Helpers ────────────────────────────────────────────────

function hourToAngle(hour: number, rangeStart: number, rangeEnd: number): number {
  const span = rangeEnd - rangeStart
  const fraction = (hour - rangeStart) / span
  // Start from top (-90°), sweep clockwise
  return -90 + fraction * 360
}

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function describeArc(
  cx: number, cy: number, r: number,
  startAngle: number, endAngle: number,
): string {
  const start = polarToXY(cx, cy, r, endAngle)
  const end = polarToXY(cx, cy, r, startAngle)
  const sweep = endAngle - startAngle
  const largeArc = sweep > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`
}

// ── Component ──────────────────────────────────────────────

export default function DayDial({
  segments,
  currentHour,
  range = [7, 19],
}: DayDialProps) {
  const [rangeStart, rangeEnd] = range

  // Generate hour tick marks + labels
  const ticks = useMemo(() => {
    const items = []
    for (let h = rangeStart; h <= rangeEnd; h++) {
      const angle = hourToAngle(h, rangeStart, rangeEnd)
      const outerPt = polarToXY(CX, CY, TICK_OUTER, angle)
      const innerPt = polarToXY(CX, CY, TICK_INNER, angle)
      const labelPt = polarToXY(CX, CY, LABEL_R, angle)
      const isMajor = h % 3 === 0
      items.push({ h, angle, outerPt, innerPt, labelPt, isMajor })
    }
    return items
  }, [rangeStart, rangeEnd])

  // Current time dot position
  const currentAngle = hourToAngle(currentHour, rangeStart, rangeEnd)
  const currentPos = polarToXY(CX, CY, DOT_R, currentAngle)

  // Arc segments
  const arcs = useMemo(
    () =>
      segments
        .filter((s) => s.endHour > rangeStart && s.startHour < rangeEnd)
        .map((seg) => {
          const sA = hourToAngle(Math.max(seg.startHour, rangeStart), rangeStart, rangeEnd)
          const eA = hourToAngle(Math.min(seg.endHour, rangeEnd), rangeStart, rangeEnd)
          const palette = KIND_COLORS[seg.kind] ?? KIND_COLORS.focus
          return { ...seg, sA, eA, palette }
        }),
    [segments, rangeStart, rangeEnd],
  )

  return (
    <div className="flex items-center justify-center" role="img" aria-label="Day schedule dial">
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="select-none w-72 h-72"
      >
        {/* ── Outer ring ──────────────────────────────── */}
        <circle
          cx={CX} cy={CY} r={OUTER_R}
          fill="none"
          stroke="var(--color-paper-border)"
          strokeWidth={4}
          opacity={0.8}
        />

        {/* ── Inner subtle ring ───────────────────────── */}
        <circle
          cx={CX} cy={CY} r={ARC_R - 12}
          fill="none"
          stroke="var(--color-paper-border)"
          strokeWidth={2}
          opacity={0.5}
          strokeDasharray="4 6"
        />

        {/* ── Colored arc segments ────────────────────── */}
        {arcs.map((arc, i) => (
          <path
            key={i}
            d={describeArc(CX, CY, ARC_R, arc.sA, arc.eA)}
            fill="none"
            stroke={arc.palette.stroke}
            strokeWidth={10}
            strokeLinecap="round"
            opacity={arc.palette.opacity}
          />
        ))}

        {/* ── Tick marks + labels ─────────────────────── */}
        {ticks.map(({ h, outerPt, innerPt, labelPt, isMajor }) => (
          <g key={h}>
            <line
              x1={innerPt.x} y1={innerPt.y}
              x2={outerPt.x} y2={outerPt.y}
              stroke="var(--color-charcoal)"
              strokeWidth={isMajor ? 2.5 : 1.2}
              opacity={isMajor ? 0.7 : 0.4}
            />
            {isMajor && (
              <text
                x={labelPt.x}
                y={labelPt.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-charcoal font-jakarta"
                fontSize={13}
                fontWeight={600}
                opacity={0.8}
              >
                {h > 12 ? `${h - 12}p` : h === 12 ? '12p' : `${h}a`}
              </text>
            )}
          </g>
        ))}

        {/* ── Center label ────────────────────────────── */}
        <text
          x={CX} y={CY - 10}
          textAnchor="middle"
          className="fill-ink font-lora font-bold"
          fontSize={48}
        >
          {Math.floor(currentHour) > 12
            ? `${Math.floor(currentHour) - 12}`
            : `${Math.floor(currentHour)}`}
          :{String(Math.round((currentHour % 1) * 60)).padStart(2, '0')}
        </text>
        <text
          x={CX} y={CY + 30}
          textAnchor="middle"
          className="fill-charcoal font-jakarta font-semibold"
          fontSize={12}
          letterSpacing={2}
          opacity={0.8}
        >
          {currentHour >= 12 ? 'PM' : 'AM'}
        </text>

        {/* ── Current-time dot (pulsing) ──────────────── */}
        <circle
          cx={currentPos.x}
          cy={currentPos.y}
          r={7.5}
          fill="var(--color-sage)"
          className="animate-dial-pulse"
        />
        <circle
          cx={currentPos.x}
          cy={currentPos.y}
          r={7.5}
          fill="var(--color-sage)"
          opacity={0.3}
          className="animate-dial-ping"
        />
      </svg>
    </div>
  )
}
