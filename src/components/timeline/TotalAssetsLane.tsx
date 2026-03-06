import { useState, useMemo } from 'react'
import type { TimelineEvent } from '@/types/timeline'
import { computeValueAtYear, formatValue } from '@/lib/valueCompute'
import { useSizeConfig } from '@/contexts/UiSizeContext'

const TEAL = '#14b8a6'
const RED  = '#ef4444'
const NUM_SAMPLES = 120

interface Segment { linePts: string; areaPts: string; positive: boolean }

interface TotalAssetsLaneProps {
  events: TimelineEvent[]
  yearStart: number
  yearEnd: number
  pixelsPerYear: number
}

function computeTotalAtYear(year: number, valueEvents: TimelineEvent[]): number {
  let total = 0
  for (const ev of valueEvents) {
    if (year < ev.startYear - 1e-9) continue
    const evEnd = ev.endYear ?? ev.startYear + 100
    if (year > evEnd + 1e-9) {
      total += computeValueAtYear(evEnd, ev.startYear, ev.valueProjection!)
    } else {
      total += computeValueAtYear(year, ev.startYear, ev.valueProjection!)
    }
  }
  return total
}

export function TotalAssetsLane({
  events,
  yearStart,
  yearEnd,
  pixelsPerYear,
}: TotalAssetsLaneProps) {
  const { sc } = useSizeConfig()
  const { TOTAL_ASSETS_HEIGHT, TOTAL_LABEL_HEIGHT: LABEL_HEIGHT, TOTAL_PAD_V: PAD_V } = sc
  const CHART_H = TOTAL_ASSETS_HEIGHT - LABEL_HEIGHT - PAD_V * 2

  const totalWidth = (yearEnd - yearStart) * pixelsPerYear
  const [tooltip, setTooltip] = useState<{
    clientX: number
    clientY: number
    items: { label: string; value: number }[]
    total: number
  } | null>(null)

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

    const y0 = PAD_V + CHART_H - (CHART_H * (0 - minV)) / vRange
    const showZeroLine = minV < -1e-9 && maxV > 1e-9

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

    const numLabels = Math.max(2, Math.min(6, Math.floor(vizWidth / 110)))
    const labels = Array.from({ length: numLabels }, (_, i) => {
      const t = numLabels === 1 ? 0 : i / (numLabels - 1)
      const year  = rangeStart + t * (rangeEnd - rangeStart)
      const total = computeTotalAtYear(year, valueEvents)
      const [x]   = toXY(year, total)
      return { x, value: total, isFirst: i === 0, isLast: i === numLabels - 1 }
    })

    return { rangeStart, rangeEnd, vizWidth, leftOffset, segments, labels, y0, showZeroLine, toXY }
  }, [valueEvents, pixelsPerYear, yearStart, CHART_H, PAD_V])

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!computed) return
    const rect = e.currentTarget.getBoundingClientRect()
    const hoverYear = yearStart + (e.clientX - rect.left) / pixelsPerYear
    if (hoverYear < computed.rangeStart - 0.01 || hoverYear > computed.rangeEnd + 0.01) {
      setTooltip(null)
      return
    }
    const items: { label: string; value: number }[] = []
    let total = 0
    for (const ev of valueEvents) {
      if (hoverYear < ev.startYear - 1e-9) continue
      const evEnd = ev.endYear ?? ev.startYear + 100
      const val = hoverYear > evEnd + 1e-9
        ? computeValueAtYear(evEnd, ev.startYear, ev.valueProjection!)
        : computeValueAtYear(hoverYear, ev.startYear, ev.valueProjection!)
      items.push({ label: ev.title, value: val })
      total += val
    }
    setTooltip({ clientX: e.clientX, clientY: e.clientY, items, total })
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
          <svg width={vizWidth} height={TOTAL_ASSETS_HEIGHT - LABEL_HEIGHT} style={{ display: 'block' }}>
            {segments.map((seg, i) => (
              <polygon key={`a${i}`} points={seg.areaPts} fill={seg.positive ? `${TEAL}28` : `${RED}28`} />
            ))}
            {showZeroLine && (
              <line x1={0} y1={y0} x2={vizWidth} y2={y0} stroke="#9ca3af" strokeWidth={1} strokeDasharray="3 3" />
            )}
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

          <div className="relative" style={{ height: LABEL_HEIGHT }}>
            {labels.map(({ x, value, isFirst, isLast }, i) => (
              <span
                key={i}
                className="absolute whitespace-nowrap leading-none"
                style={{
                  left: x,
                  top: 2,
                  fontSize: Math.round(LABEL_HEIGHT * 0.65),
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

      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none rounded bg-black/80 text-white px-3 py-2"
          style={{
            left: tooltip.clientX + 16,
            top: tooltip.clientY - (tooltip.items.length * 20 + 44),
            minWidth: 180,
          }}
        >
          {tooltip.items.map((item, i) => (
            <div key={i} className="flex justify-between gap-6 text-xs leading-5">
              <span className="opacity-70 truncate max-w-[140px]">{item.label}</span>
              <span style={{ color: item.value < 0 ? '#fca5a5' : 'inherit' }}>
                {formatValue(item.value)}
              </span>
            </div>
          ))}
          <div className="flex justify-between gap-6 text-xs leading-5 font-bold border-t border-white/30 mt-1 pt-1">
            <span>Total</span>
            <span style={{ color: tooltip.total < 0 ? '#fca5a5' : 'inherit' }}>
              {formatValue(tooltip.total)}
            </span>
          </div>
        </div>
      )}
    </>
  )
}
