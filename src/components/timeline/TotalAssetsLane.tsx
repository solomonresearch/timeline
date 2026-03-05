import { useState, useMemo } from 'react'
import type { TimelineEvent } from '@/types/timeline'
import { computeValueAtYear, formatValue } from '@/lib/valueCompute'
import { TOTAL_ASSETS_HEIGHT } from '@/lib/constants'

const TEAL = '#14b8a6'
const RED  = '#ef4444'
const LABEL_HEIGHT = 14
const PAD_V = 4
const CHART_H = TOTAL_ASSETS_HEIGHT - LABEL_HEIGHT - PAD_V * 2
const NUM_SAMPLES = 120

interface Segment { linePts: string; areaPts: string; positive: boolean }

interface TotalAssetsLaneProps {
  events: TimelineEvent[]
  yearStart: number
  yearEnd: number
  pixelsPerYear: number
  scrollLeft: number
}

function computeTotalAtYear(year: number, valueEvents: TimelineEvent[]): number {
  let total = 0
  for (const ev of valueEvents) {
    const evEnd = ev.endYear ?? ev.startYear + 100
    if (year < ev.startYear - 1e-9 || year > evEnd + 1e-9) continue
    total += computeValueAtYear(year, ev.startYear, ev.valueProjection!)
  }
  return total
}

export function TotalAssetsLane({
  events,
  yearStart,
  yearEnd,
  pixelsPerYear,
  scrollLeft,
}: TotalAssetsLaneProps) {
  const totalWidth = (yearEnd - yearStart) * pixelsPerYear
  const [tooltip, setTooltip] = useState<{ clientX: number; clientY: number; value: number } | null>(null)

  const valueEvents = useMemo(
    () => events.filter(e => e.type === 'range' && !!e.valueProjection),
    [events],
  )

  const computed = useMemo(() => {
    if (valueEvents.length === 0) return null

    const rangeStart = Math.min(...valueEvents.map(e => e.startYear))
    const rangeEnd   = Math.max(...valueEvents.map(e => e.endYear ?? e.startYear))
    const vizWidth   = Math.max(4, (rangeEnd - rangeStart) * pixelsPerYear)
    const leftOffset = (rangeStart - yearStart) * pixelsPerYear

    const samples: { year: number; total: number }[] = []
    for (let i = 0; i <= NUM_SAMPLES; i++) {
      const year = rangeStart + (i / NUM_SAMPLES) * (rangeEnd - rangeStart)
      samples.push({ year, total: computeTotalAtYear(year, valueEvents) })
    }

    const totals  = samples.map(s => s.total)
    const minV    = Math.min(...totals)
    const maxV    = Math.max(...totals)
    const vRange  = maxV - minV || 1

    function toXY(year: number, total: number): [number, number] {
      const x = ((year - rangeStart) / (rangeEnd - rangeStart)) * vizWidth
      const y = PAD_V + CHART_H - (CHART_H * (total - minV)) / vRange
      return [x, y]
    }

    // y-coordinate of the zero line (value = 0)
    const y0 = PAD_V + CHART_H - (CHART_H * (0 - minV)) / vRange
    const showZeroLine = minV < -1e-9 && maxV > 1e-9

    // Build colored segments split at zero crossings
    const segments: Segment[] = []
    let curPts: string[] = []
    let curPos: boolean | null = null

    const finalizeSeg = (pts: string[], positive: boolean) => {
      if (pts.length < 2) return
      const fx = pts[0].split(',')[0]
      const lx = pts[pts.length - 1].split(',')[0]
      segments.push({
        linePts: pts.join(' '),
        areaPts: [`${fx},${y0.toFixed(1)}`, ...pts, `${lx},${y0.toFixed(1)}`].join(' '),
        positive,
      })
    }

    for (let i = 0; i < samples.length; i++) {
      const s = samples[i]
      const [x, y] = toXY(s.year, s.total)
      const isPos = s.total >= 0

      if (curPos === null) {
        curPos = isPos
        curPts = [`${x.toFixed(1)},${y.toFixed(1)}`]
      } else if (isPos !== curPos) {
        // Interpolate zero crossing
        const prev = samples[i - 1]
        const t = prev.total / (prev.total - s.total)
        const zYear = prev.year + t * (s.year - prev.year)
        const [zx] = toXY(zYear, 0)
        curPts.push(`${zx.toFixed(1)},${y0.toFixed(1)}`)
        finalizeSeg(curPts, curPos)
        curPts = [`${zx.toFixed(1)},${y0.toFixed(1)}`, `${x.toFixed(1)},${y.toFixed(1)}`]
        curPos = isPos
      } else {
        curPts.push(`${x.toFixed(1)},${y.toFixed(1)}`)
      }
    }
    if (curPts.length >= 2 && curPos !== null) finalizeSeg(curPts, curPos)

    // Value labels evenly spaced
    const numLabels = Math.max(2, Math.min(6, Math.floor(vizWidth / 110)))
    const labels = Array.from({ length: numLabels }, (_, i) => {
      const t = numLabels === 1 ? 0 : i / (numLabels - 1)
      const year  = rangeStart + t * (rangeEnd - rangeStart)
      const total = computeTotalAtYear(year, valueEvents)
      const [x]   = toXY(year, total)
      return { x, value: total, isFirst: i === 0, isLast: i === numLabels - 1 }
    })

    return { rangeStart, rangeEnd, vizWidth, leftOffset, segments, labels, y0, showZeroLine, toXY }
  }, [valueEvents, pixelsPerYear, yearStart])

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!computed) return
    const rect = e.currentTarget.getBoundingClientRect()
    const hoverYear = yearStart + (scrollLeft + (e.clientX - rect.left)) / pixelsPerYear
    if (hoverYear < computed.rangeStart - 0.01 || hoverYear > computed.rangeEnd + 0.01) {
      setTooltip(null)
      return
    }
    setTooltip({ clientX: e.clientX, clientY: e.clientY, value: computeTotalAtYear(hoverYear, valueEvents) })
  }

  if (!computed) {
    return <div style={{ height: TOTAL_ASSETS_HEIGHT, width: totalWidth }} className="border-b border-border/30" />
  }

  const { vizWidth, leftOffset, segments, labels, y0, showZeroLine } = computed

  return (
    <>
      <div
        className="relative border-b border-border/30 select-none bg-muted/10"
        style={{ height: TOTAL_ASSETS_HEIGHT, width: totalWidth }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        <div
          className="absolute overflow-hidden"
          style={{ left: leftOffset, top: 0, width: vizWidth, height: TOTAL_ASSETS_HEIGHT }}
        >
          {/* Sparkline + colored areas */}
          <svg width={vizWidth} height={TOTAL_ASSETS_HEIGHT - LABEL_HEIGHT} style={{ display: 'block' }}>
            {/* Area fills */}
            {segments.map((seg, i) => (
              <polygon
                key={`a${i}`}
                points={seg.areaPts}
                fill={seg.positive ? `${TEAL}28` : `${RED}28`}
              />
            ))}
            {/* Zero line */}
            {showZeroLine && (
              <line
                x1={0} y1={y0} x2={vizWidth} y2={y0}
                stroke="#9ca3af"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            )}
            {/* Colored line segments */}
            {segments.map((seg, i) => (
              <polyline
                key={`l${i}`}
                points={seg.linePts}
                fill="none"
                stroke={seg.positive ? `${TEAL}cc` : `${RED}cc`}
                strokeWidth={1.5}
                strokeLinejoin="round"
              />
            ))}
          </svg>

          {/* Value labels */}
          <div className="relative" style={{ height: LABEL_HEIGHT }}>
            {labels.map(({ x, value, isFirst, isLast }, i) => (
              <span
                key={i}
                className="absolute text-[9px] whitespace-nowrap leading-none"
                style={{
                  left: x,
                  top: 2,
                  transform: isFirst ? 'none' : isLast ? 'translateX(-100%)' : 'translateX(-50%)',
                  color: value < 0 ? RED : '#6b7280',
                }}
              >
                {formatValue(value)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Hover tooltip — fixed to escape overflow */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none rounded bg-black/80 text-white text-xs px-2 py-1 whitespace-nowrap"
          style={{ left: tooltip.clientX + 14, top: tooltip.clientY - 36 }}
        >
          <span className="opacity-70">Total Wealth: </span>
          <span className="font-semibold" style={{ color: tooltip.value < 0 ? '#fca5a5' : 'white' }}>
            {formatValue(tooltip.value)}
          </span>
        </div>
      )}
    </>
  )
}
