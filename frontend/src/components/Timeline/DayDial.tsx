import { useMemo, useState } from 'react'
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

const SIZE = 320          // px  (w-80)
const CX = SIZE / 2
const CY = SIZE / 2
const OUTER_R = 143        // outer ring
const TICK_OUTER = 143
const TICK_INNER = 133
const LABEL_R = 98
const DOT_R = 125          // pulsing current-time dot centered on the arc path
const INNER_R_ARC = 117    // inner radius for segment fill
const OUTER_R_ARC = 133    // outer radius for segment fill

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

/**
 * Mathematically generates an SVG path for an annular sector (donut segment)
 * with inner radius rIn and outer radius rOut.
 */
function describeDonutSegment(
  cx: number, cy: number,
  rIn: number, rOut: number,
  startAngle: number, endAngle: number,
): string {
  const startRad = (startAngle * Math.PI) / 180
  const endRad = (endAngle * Math.PI) / 180

  const xOutStart = cx + rOut * Math.cos(startRad)
  const yOutStart = cy + rOut * Math.sin(startRad)
  const xOutEnd = cx + rOut * Math.cos(endRad)
  const yOutEnd = cy + rOut * Math.sin(endRad)

  const xInStart = cx + rIn * Math.cos(startRad)
  const yInStart = cy + rIn * Math.sin(startRad)
  const xInEnd = cx + rIn * Math.cos(endRad)
  const yInEnd = cy + rIn * Math.sin(endRad)

  const sweep = endAngle - startAngle
  const largeArc = sweep > 180 ? 1 : 0

  return `
    M ${xOutStart} ${yOutStart}
    A ${rOut} ${rOut} 0 ${largeArc} 1 ${xOutEnd} ${yOutEnd}
    L ${xInEnd} ${yInEnd}
    A ${rIn} ${rIn} 0 ${largeArc} 0 ${xInStart} ${yInStart}
    Z
  `.trim()
}

function formatHourDecimal(h: number): string {
  const isPM = h >= 12
  let hour = Math.floor(h)
  const minutes = Math.round((h % 1) * 60)
  const period = isPM ? 'PM' : 'AM'
  if (hour > 12) hour -= 12
  if (hour === 0) hour = 12
  return `${hour}:${String(minutes).padStart(2, '0')} ${period}`
}

// ── Component ──────────────────────────────────────────────

export default function DayDial({
  segments,
  currentHour,
  range = [7, 19],
}: DayDialProps) {
  const [rangeStart, rangeEnd] = range
  const [hoveredSegment, setHoveredSegment] = useState<DialSegment | null>(null)

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
        className="select-none w-80 h-80"
      >
        {/* ── Outer ring ──────────────────────────────── */}
        <circle
          cx={CX} cy={CY} r={OUTER_R}
          fill="none"
          stroke="var(--color-paper-border)"
          strokeWidth={4}
          opacity={1}
        />

        {/* ── Inner subtle ring ───────────────────────── */}
        <circle
          cx={CX} cy={CY} r={INNER_R_ARC - 4}
          fill="none"
          stroke="var(--color-paper-border)"
          strokeWidth={2}
          opacity={0.8}
          strokeDasharray="4 6"
        />

        {/* ── Colored arc segments ────────────────────── */}
        {arcs.map((arc, i) => (
          <path
            key={i}
            d={describeDonutSegment(CX, CY, INNER_R_ARC, OUTER_R_ARC, arc.sA, arc.eA)}
            fill={arc.palette.stroke}
            opacity={arc.palette.opacity}
            className="transition-all duration-300 origin-center hover:scale-[1.03] hover:opacity-85 cursor-pointer"
            onMouseEnter={() => setHoveredSegment(arc)}
            onMouseLeave={() => setHoveredSegment(null)}
          />
        ))}

        {/* ── Tick marks + labels ─────────────────────── */}
        {ticks.map(({ h, outerPt, innerPt, labelPt, isMajor }) => (
          <g key={h}>
            <line
              x1={innerPt.x} y1={innerPt.y}
              x2={outerPt.x} y2={outerPt.y}
              stroke="#4A4C56"
              strokeWidth={isMajor ? 2.5 : 1.2}
              opacity={1}
            />
            {isMajor && (
              <text
                x={labelPt.x}
                y={labelPt.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#4A4C56"
                className="font-jakarta"
                fontSize={13}
                fontWeight={600}
                opacity={1}
              >
                {h > 12 ? `${h - 12}P` : h === 12 ? '12P' : `${h}A`}
              </text>
            )}
          </g>
        ))}

        {/* ── Center label (HTML container) ───────────────── */}
        <foreignObject
          x={CX - 90}
          y={CY - 50}
          width={180}
          height={100}
        >
          <div className="w-full h-full flex flex-col items-center justify-center text-center px-1 pointer-events-none select-none">
            {hoveredSegment ? (
              <div className="transition-all duration-300 flex flex-col justify-center items-center">
                <p className="font-lora text-sm font-bold text-ink leading-snug line-clamp-2 mb-1.5 max-w-[160px]">
                  {hoveredSegment.title || (hoveredSegment.kind === 'focus' ? 'Focus Block' : hoveredSegment.kind === 'calendar' ? 'Calendar Event' : 'Break')}
                </p>
                <p className="font-jakarta text-[11px] font-bold text-charcoal tracking-wide uppercase">
                  {formatHourDecimal(hoveredSegment.startHour)} - {formatHourDecimal(hoveredSegment.endHour)}
                </p>
              </div>
            ) : (
              <div className="transition-all duration-300 flex flex-col justify-center items-center">
                <p className="font-lora text-4xl sm:text-5xl font-bold text-ink leading-none tracking-tight">
                  {Math.floor(currentHour) > 12 ? `${Math.floor(currentHour) - 12}` : `${Math.floor(currentHour)}`}
                  :{String(Math.round((currentHour % 1) * 60)).padStart(2, '0')}
                  <span className="font-jakarta text-xs font-bold tracking-widest ml-1 text-charcoal uppercase">
                    {currentHour >= 12 ? 'PM' : 'AM'}
                  </span>
                </p>
                <p className="font-jakarta text-[10px] font-semibold text-charcoal uppercase tracking-widest mt-2.5">
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
              </div>
            )}
          </div>
        </foreignObject>

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
