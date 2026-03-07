/**
 * TimelineOverview — built on the exact same platform as the main timeline:
 * - TimelineHeader + YearGrid for the year ruler and grid
 * - Same pendingScrollRef zoom pattern (wheel, pinch, zoom-toward-center)
 * - Same canvas-windowing guard (MAX_CANVAS_PX)
 * - Own local pixelsPerYear (separate zoom level from main timeline)
 */

import { useRef, useEffect, useLayoutEffect, useState, useCallback } from 'react'
import type { TimelineEvent } from '@/types/timeline'
import { useTimelineContext } from '@/contexts/TimelineContext'
import {
  getCurrentYearFraction,
  MIN_PIXELS_PER_YEAR,
  MAX_PIXELS_PER_YEAR,
  fracYearToMs,
} from '@/lib/constants'
import { useSizeConfig } from '@/contexts/UiSizeContext'
import { TimelineHeader } from './timeline/TimelineHeader'
import { YearGrid } from './timeline/YearGrid'
import { computeValueAtYear, formatValue } from '@/lib/valueCompute'
import { fracYearToLabel } from './TimelineSelector'

// ── Constants ─────────────────────────────────────────────────────────────────

const OVERVIEW_DEFAULT_PPY = 6   // pixels per year at startup
const ROW_HEIGHT = 48
const LABEL_WIDTH = 180
const MAX_CANVAS_PX = 10_000_000
const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ── Helpers (mirrors TimelineContainer) ──────────────────────────────────────

function computeEffWindow(centerYear: number, ppy: number, yrStart: number, yrEnd: number) {
  const totalW = (yrEnd - yrStart) * ppy
  if (totalW <= MAX_CANVAS_PX) return { effStart: yrStart, effEnd: yrEnd }
  let effStart = Math.max(yrStart, centerYear - MAX_CANVAS_PX / (2 * ppy))
  let effEnd = effStart + MAX_CANVAS_PX / ppy
  if (effEnd > yrEnd) {
    effEnd = yrEnd
    effStart = Math.max(yrStart, yrEnd - MAX_CANVAS_PX / ppy)
  }
  return { effStart, effEnd }
}

function fracYearToShortLabel(fy: number) {
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

// ── Component ─────────────────────────────────────────────────────────────────

interface TimelineOverviewProps {
  onSelectTimeline: () => void
  selectedTimelineEvents?: TimelineEvent[]
}

export function TimelineOverview({ onSelectTimeline, selectedTimelineEvents = [] }: TimelineOverviewProps) {
  const { timelines, selectedTimelineId, selectTimeline, yearStart, yearEnd } = useTimelineContext()
  const { sc } = useSizeConfig()

  // ── Local zoom (independent from main timeline) ───────────────────────────
  const [pixelsPerYear, setPixelsPerYear] = useState(OVERVIEW_DEFAULT_PPY)
  const [viewCenterYear, setViewCenterYear] = useState(() => getCurrentYearFraction())

  // ── Scroll state ──────────────────────────────────────────────────────────
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [viewportWidth, setViewportWidth] = useState(1200)

  // ── Refs (mirror TimelineContainer pattern) ───────────────────────────────
  const ppyRef = useRef(pixelsPerYear)
  const yearStartRef = useRef(yearStart)
  const viewCenterYearRef = useRef(viewCenterYear)
  const pendingScrollRef = useRef<number | null>(null)
  const prevPpyRef = useRef(pixelsPerYear)
  const rafRef = useRef<number | null>(null)
  const zoomRafRef = useRef<number | null>(null)
  const shiftingWindowRef = useRef(false)
  const hasScrolledRef = useRef(false)

  useEffect(() => { ppyRef.current = pixelsPerYear }, [pixelsPerYear])

  // ── Effective canvas window ───────────────────────────────────────────────
  const { effStart: effectiveYearStart, effEnd: effectiveYearEnd } =
    computeEffWindow(viewCenterYear, pixelsPerYear, yearStart, yearEnd)
  const effectiveTotalWidth = (effectiveYearEnd - effectiveYearStart) * pixelsPerYear
  yearStartRef.current = effectiveYearStart

  const currentYear = getCurrentYearFraction()
  const totalHeight = timelines.length * ROW_HEIGHT

  // ── Hover state ───────────────────────────────────────────────────────────
  const [hover, setHover] = useState<{
    timelineId: string; year: number; clientX: number; clientY: number
  } | null>(null)

  // ── Scroll-to-today on mount ──────────────────────────────────────────────
  useEffect(() => {
    if (hasScrolledRef.current || !scrollRef.current) return
    const today = getCurrentYearFraction()
    const el = scrollRef.current
    const { effStart } = computeEffWindow(today, OVERVIEW_DEFAULT_PPY, yearStart, yearEnd)
    yearStartRef.current = effStart
    viewCenterYearRef.current = today
    pendingScrollRef.current = Math.max(0, (today - effStart) * OVERVIEW_DEFAULT_PPY - el.clientWidth / 2)
    setViewCenterYear(today)
    hasScrolledRef.current = true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Scroll tracking ───────────────────────────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const sl = el.scrollLeft
        const totalW = (yearEnd - yearStart) * ppyRef.current
        if (totalW > MAX_CANVAS_PX && !shiftingWindowRef.current) {
          const edgeThreshold = MAX_CANVAS_PX * 0.2
          if (sl < edgeThreshold || sl > MAX_CANVAS_PX - edgeThreshold - el.clientWidth) {
            const centerPx = sl + el.clientWidth / 2
            const newCenterYear = yearStartRef.current + centerPx / ppyRef.current
            const { effStart: newEffStart } = computeEffWindow(newCenterYear, ppyRef.current, yearStart, yearEnd)
            if (newEffStart !== yearStartRef.current) {
              shiftingWindowRef.current = true
              yearStartRef.current = newEffStart
              viewCenterYearRef.current = newCenterYear
              pendingScrollRef.current = (newCenterYear - newEffStart) * ppyRef.current - el.clientWidth / 2
              setViewCenterYear(newCenterYear)
              return
            }
          }
        }
        shiftingWindowRef.current = false
        setScrollLeft(sl)
        setViewportWidth(el.clientWidth)
      })
    }
    const ro = new ResizeObserver(() => {
      setScrollLeft(el.scrollLeft)
      setViewportWidth(el.clientWidth)
    })
    el.addEventListener('scroll', onScroll, { passive: true })
    ro.observe(el)
    setScrollLeft(el.scrollLeft)
    setViewportWidth(el.clientWidth)
    return () => {
      el.removeEventListener('scroll', onScroll)
      ro.disconnect()
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [yearStart, yearEnd])

  // ── Zoom toward center when pixelsPerYear changes externally ──────────────
  useLayoutEffect(() => {
    const prev = prevPpyRef.current
    prevPpyRef.current = pixelsPerYear
    if (prev === pixelsPerYear || pendingScrollRef.current !== null) return
    const el = scrollRef.current
    if (!el) return
    const centerPx = el.scrollLeft + el.clientWidth / 2
    const centerYear = yearStartRef.current + centerPx / prev
    const { effStart } = computeEffWindow(centerYear, pixelsPerYear, yearStart, yearEnd)
    yearStartRef.current = effStart
    viewCenterYearRef.current = centerYear
    pendingScrollRef.current = Math.max(0, (centerYear - effStart) * pixelsPerYear - el.clientWidth / 2)
  }, [pixelsPerYear, yearStart, yearEnd])

  // ── Apply pending scroll ──────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (pendingScrollRef.current !== null && scrollRef.current) {
      void scrollRef.current.scrollWidth
      scrollRef.current.scrollLeft = pendingScrollRef.current
      pendingScrollRef.current = null
      shiftingWindowRef.current = false
    }
  }, [pixelsPerYear, viewCenterYear])

  // ── Wheel zoom toward cursor ──────────────────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
      e.preventDefault()
      const ppy = ppyRef.current
      const rect = el.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const sl = pendingScrollRef.current ?? el.scrollLeft
      const yearAtCursor = yearStartRef.current + (sl + mouseX) / ppy
      let dy = e.deltaY
      if (e.deltaMode === 1) dy *= 32
      if (e.deltaMode === 2) dy *= 300
      const factor = Math.exp(-dy * 0.012)
      const newPpy = Math.max(MIN_PIXELS_PER_YEAR, Math.min(MAX_PIXELS_PER_YEAR, ppy * factor))
      ppyRef.current = newPpy
      const { effStart: newEffStart } = computeEffWindow(yearAtCursor, newPpy, yearStart, yearEnd)
      yearStartRef.current = newEffStart
      viewCenterYearRef.current = yearAtCursor
      pendingScrollRef.current = (yearAtCursor - newEffStart) * newPpy - mouseX
      if (zoomRafRef.current !== null) cancelAnimationFrame(zoomRafRef.current)
      zoomRafRef.current = requestAnimationFrame(() => {
        zoomRafRef.current = null
        setViewCenterYear(viewCenterYearRef.current)
        setPixelsPerYear(ppyRef.current)
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheel)
      if (zoomRafRef.current !== null) cancelAnimationFrame(zoomRafRef.current)
    }
  }, [yearStart, yearEnd])

  // ── Pinch-to-zoom toward finger midpoint ──────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let lastDist = 0, lastMidX = 0, lastMidY = 0
    const touchDist = (t: TouchList) => {
      const dx = t[1].clientX - t[0].clientX
      const dy = t[1].clientY - t[0].clientY
      return Math.sqrt(dx * dx + dy * dy)
    }
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        lastDist = touchDist(e.touches)
        lastMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2
        lastMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2) return
      e.preventDefault()
      const dist = touchDist(e.touches)
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2
      if (lastDist === 0) { lastDist = dist; lastMidX = midX; lastMidY = midY; return }
      const factor = dist / lastDist
      const dMidX = midX - lastMidX
      const dMidY = midY - lastMidY
      lastDist = dist; lastMidX = midX; lastMidY = midY
      const rect = el.getBoundingClientRect()
      const touchX = midX - rect.left
      const ppy = ppyRef.current
      const sl = pendingScrollRef.current ?? el.scrollLeft
      const yearAtPinch = yearStartRef.current + (sl + touchX) / ppy
      const newPpy = Math.max(MIN_PIXELS_PER_YEAR, Math.min(MAX_PIXELS_PER_YEAR, ppy * factor))
      ppyRef.current = newPpy
      const { effStart: newEffStart } = computeEffWindow(yearAtPinch, newPpy, yearStart, yearEnd)
      yearStartRef.current = newEffStart
      viewCenterYearRef.current = yearAtPinch
      pendingScrollRef.current = (yearAtPinch - newEffStart) * newPpy - touchX - dMidX
      el.scrollTop -= dMidY
      if (zoomRafRef.current !== null) cancelAnimationFrame(zoomRafRef.current)
      zoomRafRef.current = requestAnimationFrame(() => {
        zoomRafRef.current = null
        setViewCenterYear(viewCenterYearRef.current)
        setPixelsPerYear(ppyRef.current)
      })
    }
    const onTouchEnd = () => { lastDist = 0; lastMidX = 0; lastMidY = 0 }
    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [yearStart, yearEnd])

  // ── Hover tracking ────────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent, timelineId: string) => {
    const el = scrollRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const contentX = el.scrollLeft + (e.clientX - rect.left)
    const year = effectiveYearStart + contentX / pixelsPerYear
    setHover({ timelineId, year, clientX: e.clientX, clientY: e.clientY })
  }, [effectiveYearStart, pixelsPerYear])

  // ── Derive tooltip data ───────────────────────────────────────────────────
  const hoveredTimeline = hover ? timelines.find(t => t.id === hover.timelineId) : null
  const valueEvents = selectedTimelineEvents.filter(e => e.type === 'range' && !!e.valueProjection)
  const hasWealth = hover?.timelineId === selectedTimelineId && valueEvents.length > 0

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-1 overflow-hidden">

      {/* ── Sticky sidebar ─────────────────────────────────────────────────── */}
      <div
        className="shrink-0 bg-background border-r z-10 flex flex-col"
        style={{ width: LABEL_WIDTH }}
      >
        {/* Spacer matches TimelineHeader height exactly */}
        <div className="border-b shrink-0" style={{ height: sc.HEADER_HEIGHT }} />

        {timelines.map(t => (
          <div
            key={t.id}
            className="flex items-center px-3 border-b shrink-0 gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
            style={{ height: ROW_HEIGHT }}
            onClick={() => { selectTimeline(t.id); onSelectTimeline() }}
          >
            {t.emoji ? (
              <span className="shrink-0 text-base leading-none">{t.emoji}</span>
            ) : t.color ? (
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
            ) : null}
            <div className="flex flex-col min-w-0">
              <span className={`text-sm truncate ${t.id === selectedTimelineId ? 'font-semibold' : ''}`}>
                {t.name}
              </span>
              {(t.start_year != null || t.end_year != null) && (
                <span className="text-[10px] text-muted-foreground leading-tight">
                  {t.start_year != null ? fracYearToShortLabel(t.start_year) : '?'}
                  {' – '}
                  {t.end_year != null ? fracYearToShortLabel(t.end_year) : '?'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Scrollable timeline canvas ──────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto"
        onMouseLeave={() => setHover(null)}
      >
        <div
          className="relative"
          style={{ width: effectiveTotalWidth, minHeight: sc.HEADER_HEIGHT + totalHeight }}
        >
          {/* Year ruler — same component as main timeline */}
          <TimelineHeader
            yearStart={effectiveYearStart}
            yearEnd={effectiveYearEnd}
            pixelsPerYear={pixelsPerYear}
            currentYear={currentYear}
            scrollLeft={scrollLeft}
            viewportWidth={viewportWidth}
          />

          <div className="relative">
            {/* Year grid — same component as main timeline */}
            <YearGrid
              yearStart={effectiveYearStart}
              yearEnd={effectiveYearEnd}
              pixelsPerYear={pixelsPerYear}
              totalHeight={totalHeight}
              currentYear={currentYear}
              scrollLeft={scrollLeft}
              viewportWidth={viewportWidth}
            />

            {/* Cursor vertical line (content-space) */}
            {hover && (
              <div
                className="absolute top-0 pointer-events-none"
                style={{
                  left: (hover.year - effectiveYearStart) * pixelsPerYear,
                  height: totalHeight,
                  borderLeft: '1px dashed #9ca3af',
                  zIndex: 4,
                }}
              />
            )}

            {/* One row per timeline */}
            {timelines.map(t => {
              const start = t.start_year ?? yearStart
              const end   = t.end_year   ?? yearEnd
              const barLeft  = Math.max(0, (start - effectiveYearStart) * pixelsPerYear)
              const barWidth = Math.max(8,  (end   - start) * pixelsPerYear)
              const color    = t.color ?? '#3b82f6'
              const isSelected = t.id === selectedTimelineId

              return (
                <div
                  key={t.id}
                  className="relative border-b"
                  style={{ height: ROW_HEIGHT }}
                  onMouseMove={e => handleMouseMove(e, t.id)}
                >
                  <button
                    className="absolute rounded-md cursor-pointer transition-all hover:brightness-110 focus-visible:outline-none"
                    style={{
                      top: 8, bottom: 8,
                      left: barLeft,
                      width: barWidth,
                      backgroundColor: color,
                      opacity: isSelected ? 1 : 0.55,
                      boxShadow: isSelected ? `0 0 0 2px ${color}, 0 0 0 4px ${color}40` : 'none',
                    }}
                    onClick={() => { selectTimeline(t.id); onSelectTimeline() }}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Hover tooltip ──────────────────────────────────────────────────── */}
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
          <div className="flex items-center gap-2 mb-1.5">
            {hoveredTimeline.emoji && (
              <span className="text-base leading-none">{hoveredTimeline.emoji}</span>
            )}
            {hoveredTimeline.color && (
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: hoveredTimeline.color }} />
            )}
            <span className="font-semibold truncate">{hoveredTimeline.name}</span>
          </div>

          {(hoveredTimeline.start_year != null || hoveredTimeline.end_year != null) && (
            <div className="text-xs text-muted-foreground mb-1">
              {hoveredTimeline.start_year != null ? fracYearToLabel(hoveredTimeline.start_year) : '?'}
              {' – '}
              {hoveredTimeline.end_year != null ? fracYearToLabel(hoveredTimeline.end_year) : '?'}
            </div>
          )}

          <div className="text-xs text-muted-foreground border-t pt-1.5 mt-1.5">
            <span className="opacity-70">At cursor: </span>
            {fracYearToLabel(hover.year)}
          </div>

          {hasWealth && (() => {
            const total = computeTotalAtYear(hover.year, valueEvents)
            return (
              <div className="text-xs border-t pt-1.5 mt-1 flex justify-between gap-4">
                <span className="text-muted-foreground">Total value</span>
                <span className="font-semibold" style={{ color: total < 0 ? '#ef4444' : '#14b8a6' }}>
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
