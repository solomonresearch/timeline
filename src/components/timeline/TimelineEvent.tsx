import { useState, useMemo } from 'react'
import type { TimelineEvent as TEvent } from '@/types/timeline'
import { computeValueAtYear, generateSparklineSeries, formatValue } from '@/lib/valueCompute'
import { useSizeConfig } from '@/contexts/UiSizeContext'

interface TimelineEventProps {
  event: TEvent
  yearStart: number
  pixelsPerYear: number
  laneColor: string
  onClick: (event: TEvent, element: HTMLElement, clientX: number, clientY: number) => void
  currentYear: number
  topOffset?: number
  scrollLeft?: number
}

interface TooltipState { clientX: number; clientY: number; value: number }

export function TimelineEventBar({
  event, yearStart, pixelsPerYear, laneColor, onClick, currentYear, topOffset = 0, scrollLeft = 0,
}: TimelineEventProps) {
  const { sc } = useSizeConfig()
  const { BASE_LANE_HEIGHT, BAR_HEIGHT, DOT_SIZE, EVENT_FONT, EVENT_LINE_HEIGHT } = sc
  const color = event.color || laneColor
  const left = (event.startYear - yearStart) * pixelsPerYear

  const isPast = event.type === 'point'
    ? event.startYear < currentYear
    : (event.endYear ?? event.startYear) < currentYear

  const pastStyle = isPast ? { opacity: 0.35, filter: 'saturate(0.5)' } : undefined

  const hasValue = !!event.valueProjection
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  // Build sparkline series (memoised — only recalculates when data changes)
  const sparklineSeries = useMemo(() => {
    if (!hasValue || event.type !== 'range' || !event.valueProjection) return []
    const endY = event.endYear ?? currentYear
    return generateSparklineSeries(event.startYear, endY, event.valueProjection, currentYear)
  }, [hasValue, event.startYear, event.endYear, event.valueProjection, event.type, currentYear])

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!hasValue || !event.valueProjection) return
    const rect = e.currentTarget.getBoundingClientRect()
    const relX = e.clientX - rect.left
    const hoverYear = event.startYear + relX / pixelsPerYear
    const val = computeValueAtYear(hoverYear, event.startYear, event.valueProjection)
    setTooltip({ clientX: e.clientX, clientY: e.clientY, value: val })
  }

  if (event.type === 'point') {
    const top = (BASE_LANE_HEIGHT - DOT_SIZE) / 2 + topOffset
    const hasPointValue = event.pointValue != null

    if (event.emoji) {
      // Render emoji instead of colored dot
      return (
        <>
          <div
            className="absolute flex items-center justify-center cursor-pointer hover:scale-110 transition-transform select-none"
            style={{ left: left - DOT_SIZE / 2, top, width: DOT_SIZE, height: DOT_SIZE, fontSize: DOT_SIZE - 2, lineHeight: 1, ...pastStyle }}
            title={event.title}
            onClick={e => onClick(event, e.currentTarget, e.clientX, e.clientY)}
            onMouseEnter={hasPointValue ? e => setTooltip({ clientX: e.clientX, clientY: e.clientY, value: event.pointValue! }) : undefined}
            onMouseMove={hasPointValue ? e => setTooltip({ clientX: e.clientX, clientY: e.clientY, value: event.pointValue! }) : undefined}
            onMouseLeave={hasPointValue ? () => setTooltip(null) : undefined}
          >
            {event.emoji}
          </div>
          {tooltip && (
            <div
              className="fixed z-50 pointer-events-none rounded bg-black/80 text-white text-xs px-2 py-1 whitespace-nowrap"
              style={{ left: tooltip.clientX + 14, top: tooltip.clientY - 36 }}
            >
              <span className="opacity-70">{event.title}: </span>
              <span className="font-semibold">{formatValue(tooltip.value)}</span>
            </div>
          )}
        </>
      )
    }

    return (
      <>
        <div
          className="absolute rounded-full cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-black/20 transition-shadow"
          style={{ left: left - DOT_SIZE / 2, top, width: DOT_SIZE, height: DOT_SIZE, backgroundColor: color, ...pastStyle }}
          title={event.title}
          onClick={e => onClick(event, e.currentTarget, e.clientX, e.clientY)}
          onMouseEnter={hasPointValue ? e => setTooltip({ clientX: e.clientX, clientY: e.clientY, value: event.pointValue! }) : undefined}
          onMouseMove={hasPointValue ? e => setTooltip({ clientX: e.clientX, clientY: e.clientY, value: event.pointValue! }) : undefined}
          onMouseLeave={hasPointValue ? () => setTooltip(null) : undefined}
        />
        {tooltip && (
          <div
            className="fixed z-50 pointer-events-none rounded bg-black/80 text-white text-xs px-2 py-1 whitespace-nowrap"
            style={{ left: tooltip.clientX + 14, top: tooltip.clientY - 36 }}
          >
            <span className="opacity-70">{event.title}: </span>
            <span className="font-semibold">{formatValue(tooltip.value)}</span>
          </div>
        )}
      </>
    )
  }

  const width = ((event.endYear ?? event.startYear + 1) - event.startYear) * pixelsPerYear
  const top = (BASE_LANE_HEIGHT - BAR_HEIGHT) / 2 + topOffset
  const textLeft = Math.max(4, scrollLeft - left + 4)

  // Sparkline geometry
  let sparklinePath: string | null = null
  let projectionPath: string | null = null
  if (sparklineSeries.length >= 2) {
    const values = sparklineSeries.map(p => p.value)
    const minV = Math.min(...values)
    const maxV = Math.max(...values)
    const range = maxV - minV || 1
    const pad = 2
    const chartH = BAR_HEIGHT - pad * 2

    const toXY = (p: { year: number; value: number }) => {
      const x = (p.year - event.startYear) * pixelsPerYear
      const y = pad + chartH - chartH * (p.value - minV) / range
      return `${x.toFixed(1)},${y.toFixed(1)}`
    }

    // Split at first projected point
    const splitIdx = sparklineSeries.findIndex(p => p.projected)
    const histPts = splitIdx >= 0 ? sparklineSeries.slice(0, splitIdx + 1) : sparklineSeries
    const projPts = splitIdx >= 0 ? sparklineSeries.slice(splitIdx) : []

    if (histPts.length >= 2) sparklinePath = histPts.map(toXY).join(' ')
    if (projPts.length >= 2) projectionPath = projPts.map(toXY).join(' ')
  }

  const label = event.emoji ? `${event.emoji} ${event.title}` : event.title

  return (
    <>
      <div
        className="absolute rounded-sm cursor-pointer hover:brightness-110 transition-all overflow-hidden"
        style={{ left, top, width: Math.max(width, 4), height: BAR_HEIGHT, backgroundColor: color, ...pastStyle }}
        title={event.title}
        onClick={e => onClick(event, e.currentTarget, e.clientX, e.clientY)}
        onMouseMove={hasValue ? handleMouseMove : undefined}
        onMouseLeave={hasValue ? () => setTooltip(null) : undefined}
      >
        {/* Sparkline */}
        {sparklineSeries.length >= 2 && (
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: '100%', height: '100%', overflow: 'hidden' }}
            preserveAspectRatio="none"
          >
            {sparklinePath && (
              <polyline points={sparklinePath} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth={1.5} strokeLinejoin="round" />
            )}
            {projectionPath && (
              <polyline points={projectionPath} fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth={1.5} strokeDasharray="3 2" strokeLinejoin="round" />
            )}
          </svg>
        )}

        {/* Title — sticky at visible left edge */}
        {width > EVENT_FONT * 2 && (
          <span
            className="absolute text-white font-medium whitespace-nowrap drop-shadow-[0_0_2px_rgba(0,0,0,0.6)]"
            style={{ left: textLeft, fontSize: EVENT_FONT, lineHeight: `${EVENT_LINE_HEIGHT}px` }}
          >
            {label}
          </span>
        )}
      </div>

      {/* Value tooltip — fixed position so it escapes overflow:hidden */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none rounded bg-black/80 text-white text-xs px-2 py-1 whitespace-nowrap"
          style={{ left: tooltip.clientX + 14, top: tooltip.clientY - 36 }}
        >
          <span className="opacity-70">{event.title}: </span>
          <span className="font-semibold">{formatValue(tooltip.value)}</span>
        </div>
      )}
    </>
  )
}
