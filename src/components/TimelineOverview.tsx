import { useRef, useState, useCallback } from 'react'
import { useTimelineContext } from '@/contexts/TimelineContext'
import { getCurrentYearFraction, fracYearToMs } from '@/lib/constants'
import type { TimelineEvent } from '@/types/timeline'
import { computeValueAtYear, formatValue } from '@/lib/valueCompute'
import { fracYearToLabel } from './TimelineSelector'

const OVERVIEW_PPY = 3  // pixels per year at overview zoom
const ROW_HEIGHT = 48
const HEADER_HEIGHT = 32
const LABEL_WIDTH = 180
const MIN_BAR_WIDTH = 8

const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fracYearToShortLabel(fy: number): string {
  const d = new Date(fracYearToMs(fy))
  return `${d.getUTCDate()} ${MONTH_ABBR[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

function computeTotalAtYear(year: number, events: TimelineEvent[]): number {
  let total = 0
  for (const ev of events) {
    if (!ev.valueProjection) continue
    if (year < ev.startYear - 1e-9) continue
    const evEnd = ev.endYear ?? ev.startYear + 100
    const val = year > evEnd + 1e-9
      ? computeValueAtYear(evEnd, ev.startYear, ev.valueProjection)
      : computeValueAtYear(year, ev.startYear, ev.valueProjection)
    total += val
  }
  return total
}

interface HoverState {
  timelineId: string
  year: number
  clientX: number
  clientY: number
}

interface TimelineOverviewProps {
  onSelectTimeline: () => void
  /** Events for the currently selected timeline (for wealth tooltip) */
  selectedTimelineEvents?: TimelineEvent[]
}

export function TimelineOverview({ onSelectTimeline, selectedTimelineEvents = [] }: TimelineOverviewProps) {
  const { timelines, selectedTimelineId, selectTimeline, yearStart, yearEnd } = useTimelineContext()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<HoverState | null>(null)

  const currentYear = getCurrentYearFraction()

  // Compute overall year bounds from timeline metadata, fall back to global range
  const minYear = timelines.reduce(
    (m, t) => (t.start_year != null ? Math.min(m, t.start_year) : m),
    yearStart,
  )
  const maxYear = timelines.reduce(
    (m, t) => (t.end_year != null ? Math.max(m, t.end_year) : m),
    yearEnd,
  )

  const totalWidth = Math.max(400, (maxYear - minYear) * OVERVIEW_PPY)

  // Year tick marks — adaptive interval
  const span = maxYear - minYear
  const interval = span > 500 ? 100 : span > 200 ? 50 : span > 100 ? 20 : span > 50 ? 10 : 5
  const tickFirst = Math.ceil(minYear / interval) * interval
  const ticks: number[] = []
  for (let y = tickFirst; y <= maxYear; y += interval) ticks.push(y)

  function handleSelect(id: string) {
    selectTimeline(id)
    onSelectTimeline()
  }

  const handleMouseMove = useCallback((e: React.MouseEvent, timelineId: string) => {
    const el = scrollRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const contentX = el.scrollLeft + (e.clientX - rect.left)
    const year = minYear + contentX / OVERVIEW_PPY
    setHover({ timelineId, year, clientX: e.clientX, clientY: e.clientY })
  }, [minYear])

  const hoveredTimeline = hover ? timelines.find(t => t.id === hover.timelineId) : null
  const valueEvents = selectedTimelineEvents.filter(e => e.type === 'range' && !!e.valueProjection)
  const hasWealth = hover?.timelineId === selectedTimelineId && valueEvents.length > 0

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sticky lane-name sidebar */}
      <div
        className="shrink-0 bg-background border-r z-10 flex flex-col"
        style={{ width: LABEL_WIDTH }}
      >
        {/* Header spacer */}
        <div className="border-b shrink-0" style={{ height: HEADER_HEIGHT }} />
        {/* Timeline name rows */}
        {timelines.map(t => (
          <div
            key={t.id}
            className="flex items-center px-3 border-b shrink-0 gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
            style={{ height: ROW_HEIGHT }}
            onClick={() => handleSelect(t.id)}
          >
            {t.emoji ? (
              <span className="shrink-0 text-base leading-none">{t.emoji}</span>
            ) : t.color ? (
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: t.color }}
              />
            ) : null}
            <div className="flex flex-col min-w-0">
              <span className={`text-sm truncate ${t.id === selectedTimelineId ? 'font-semibold' : ''}`}>
                {t.name}
              </span>
              {(t.start_year != null || t.end_year != null) && (
                <span className="text-[10px] text-muted-foreground">
                  {t.start_year != null ? fracYearToShortLabel(t.start_year) : '?'}
                  {' – '}
                  {t.end_year != null ? fracYearToShortLabel(t.end_year) : '?'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Scrollable content area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto overflow-y-hidden"
        onMouseLeave={() => setHover(null)}
      >
        <div
          className="relative"
          style={{ width: totalWidth, minHeight: HEADER_HEIGHT + timelines.length * ROW_HEIGHT }}
        >
          {/* Year header */}
          <div
            className="sticky top-0 z-10 bg-background border-b"
            style={{ width: totalWidth, height: HEADER_HEIGHT }}
          >
            {ticks.map(y => {
              const left = (y - minYear) * OVERVIEW_PPY
              return (
                <div key={y} className="absolute top-0 h-full" style={{ left }}>
                  <div className="absolute bottom-0 w-px h-2 bg-border" />
                  <span
                    className="absolute text-[10px] text-muted-foreground -translate-x-1/2 select-none"
                    style={{ top: 6 }}
                  >
                    {y}
                  </span>
                </div>
              )
            })}
            {/* Today line in header */}
            <div
              className="absolute top-0 h-full w-0.5 pointer-events-none"
              style={{ left: (currentYear - minYear) * OVERVIEW_PPY, backgroundColor: '#ef4444' }}
            />
            {/* Cursor year line */}
            {hover && (
              <div
                className="absolute top-0 h-full w-px pointer-events-none"
                style={{ left: (hover.year - minYear) * OVERVIEW_PPY, backgroundColor: '#9ca3af', opacity: 0.7 }}
              />
            )}
          </div>

          {/* Timeline bar rows */}
          {timelines.map(t => {
            const start = t.start_year ?? minYear
            const end = t.end_year ?? maxYear
            const left = Math.max(0, (start - minYear) * OVERVIEW_PPY)
            const width = Math.max(MIN_BAR_WIDTH, (end - start) * OVERVIEW_PPY)
            const color = t.color ?? '#3b82f6'
            const isSelected = t.id === selectedTimelineId

            return (
              <div
                key={t.id}
                className="relative border-b"
                style={{ height: ROW_HEIGHT, width: totalWidth }}
                onMouseMove={e => handleMouseMove(e, t.id)}
              >
                {/* Range bar */}
                <button
                  className="absolute rounded-md cursor-pointer transition-all hover:brightness-110 focus-visible:outline-none"
                  style={{
                    top: 8,
                    bottom: 8,
                    left,
                    width,
                    backgroundColor: color,
                    opacity: isSelected ? 1 : 0.5,
                    boxShadow: isSelected ? `0 0 0 2px ${color}, 0 0 0 4px ${color}40` : 'none',
                  }}
                  onClick={() => handleSelect(t.id)}
                />
                {/* Today line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 pointer-events-none"
                  style={{ left: (currentYear - minYear) * OVERVIEW_PPY, backgroundColor: '#ef4444', opacity: 0.3 }}
                />
                {/* Cursor vertical line */}
                {hover?.timelineId === t.id && (
                  <div
                    className="absolute top-0 bottom-0 w-px pointer-events-none"
                    style={{ left: (hover.year - minYear) * OVERVIEW_PPY, backgroundColor: '#9ca3af', opacity: 0.5 }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Hover tooltip */}
      {hover && hoveredTimeline && (
        <div
          className="fixed z-50 pointer-events-none rounded-lg border bg-popover text-popover-foreground shadow-md px-3 py-2.5 text-sm"
          style={{
            left: hover.clientX + 16,
            top: hover.clientY - 12,
            minWidth: 200,
            maxWidth: 280,
            transform: hover.clientX > window.innerWidth - 300 ? 'translateX(-120%)' : undefined,
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-1.5">
            {hoveredTimeline.emoji && (
              <span className="text-base leading-none">{hoveredTimeline.emoji}</span>
            )}
            {hoveredTimeline.color && (
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: hoveredTimeline.color }}
              />
            )}
            <span className="font-semibold truncate">{hoveredTimeline.name}</span>
          </div>

          {/* Date range */}
          {(hoveredTimeline.start_year != null || hoveredTimeline.end_year != null) && (
            <div className="text-xs text-muted-foreground mb-1">
              {hoveredTimeline.start_year != null ? fracYearToLabel(hoveredTimeline.start_year) : '?'}
              {' – '}
              {hoveredTimeline.end_year != null ? fracYearToLabel(hoveredTimeline.end_year) : '?'}
            </div>
          )}

          {/* Cursor year */}
          <div className="text-xs text-muted-foreground border-t pt-1.5 mt-1.5">
            <span className="opacity-70">At cursor: </span>
            {fracYearToLabel(hover.year)}
          </div>

          {/* Wealth value (selected timeline only) */}
          {hasWealth && (() => {
            const total = computeTotalAtYear(hover.year, valueEvents)
            return (
              <div className="text-xs border-t pt-1.5 mt-1 flex justify-between">
                <span className="text-muted-foreground">Total value</span>
                <span
                  className="font-semibold"
                  style={{ color: total < 0 ? '#ef4444' : '#14b8a6' }}
                >
                  {formatValue(total)}
                </span>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
