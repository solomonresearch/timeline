import { useRef, useState } from 'react'
import type { Lane, TimelineEvent } from '@/types/timeline'
import type { AlignedPersonaEvent } from '@/types/database'
import { TimelineEventBar } from './TimelineEvent'
import { PersonaEventBar } from './PersonaEventBar'
import { useSizeConfig } from '@/contexts/UiSizeContext'

const RANGE_HOLD_MS = 1000  // hold this long without moving to enter range-draw mode
const PAN_THRESHOLD_PX = 4  // move this far within RANGE_HOLD_MS to enter pan mode

type Mode = 'idle' | 'pending' | 'panning' | 'ranging'

interface TimelineLaneProps {
  lane: Lane
  events: TimelineEvent[]
  yearStart: number
  yearEnd: number
  pixelsPerYear: number
  onEventClick: (event: TimelineEvent, element: HTMLElement, clientX: number, clientY: number) => void
  onLaneClick: (laneId: string, year: number) => void
  onLaneDragRange: (laneId: string, startYear: number, endYear: number) => void
  onPan: (deltaX: number) => void
  eventRowMap?: Map<string, number>
  personaEvents: AlignedPersonaEvent[]
  personaInitialsMap: Map<string, string>
  laneHeight: number
  personaSubRowMap: Map<string, number>
  currentYear: number
  scrollLeft: number
}

export function TimelineLane({
  lane,
  events,
  yearStart,
  pixelsPerYear,
  yearEnd,
  onEventClick,
  onLaneClick,
  onLaneDragRange,
  onPan,
  eventRowMap,
  personaEvents,
  personaInitialsMap,
  laneHeight,
  personaSubRowMap,
  currentYear,
  scrollLeft,
}: TimelineLaneProps) {
  const { sc } = useSizeConfig()
  const { BASE_LANE_HEIGHT } = sc
  const width = (yearEnd - yearStart) * pixelsPerYear
  const laneRef = useRef<HTMLDivElement>(null)
  const modeRef = useRef<Mode>('idle')
  const startClientXRef = useRef(0)
  const startYearRef = useRef(0)
  const lastClientXRef = useRef(0)
  const rangeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [dragPreview, setDragPreview] = useState<{ left: number; width: number } | null>(null)
  const [isPanning, setIsPanning] = useState(false)

  function clearTimer() {
    if (rangeTimerRef.current) {
      clearTimeout(rangeTimerRef.current)
      rangeTimerRef.current = null
    }
  }

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return
    if (e.button !== 0) return

    const rect = e.currentTarget.getBoundingClientRect()
    modeRef.current = 'pending'
    startClientXRef.current = e.clientX
    lastClientXRef.current = e.clientX
    startYearRef.current = yearStart + (e.clientX - rect.left) / pixelsPerYear

    // Closures capture onPan, onLaneClick, onLaneDragRange, lane, yearStart, pixelsPerYear
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - lastClientXRef.current
      lastClientXRef.current = ev.clientX

      if (modeRef.current === 'pending') {
        if (Math.abs(ev.clientX - startClientXRef.current) > PAN_THRESHOLD_PX) {
          clearTimer()
          modeRef.current = 'panning'
          setIsPanning(true)
          onPan(dx)
        }
      } else if (modeRef.current === 'panning') {
        onPan(dx)
      } else if (modeRef.current === 'ranging') {
        const el = laneRef.current
        if (!el) return
        const r = el.getBoundingClientRect()
        const startPx = startClientXRef.current - r.left
        const nowPx = ev.clientX - r.left
        setDragPreview({ left: Math.min(startPx, nowPx), width: Math.abs(nowPx - startPx) })
      }
    }

    const onUp = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      clearTimer()
      const mode = modeRef.current
      modeRef.current = 'idle'

      if (mode === 'pending') {
        // Quick click → add point event
        const el = laneRef.current
        if (!el) return
        const r = el.getBoundingClientRect()
        const year = Math.round((yearStart + (ev.clientX - r.left) / pixelsPerYear) * 2) / 2
        onLaneClick(lane.id, year)
      } else if (mode === 'panning') {
        setIsPanning(false)
      } else if (mode === 'ranging') {
        setDragPreview(null)
        const el = laneRef.current
        if (!el) return
        const r = el.getBoundingClientRect()
        const endYear = yearStart + (ev.clientX - r.left) / pixelsPerYear
        const [s, en] = startYearRef.current < endYear
          ? [startYearRef.current, endYear]
          : [endYear, startYearRef.current]
        if (en - s > 0.05) {
          const round = (y: number) => Math.round(y * 10) / 10
          onLaneDragRange(lane.id, round(s), round(en))
        }
      }
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)

    // After 1s of staying put, switch to range-draw mode
    rangeTimerRef.current = setTimeout(() => {
      rangeTimerRef.current = null
      if (modeRef.current !== 'pending') return
      modeRef.current = 'ranging'
      const el = laneRef.current
      if (el) {
        const r = el.getBoundingClientRect()
        setDragPreview({ left: startClientXRef.current - r.left, width: 0 })
      }
    }, RANGE_HOLD_MS)
  }

  // ── Render ───────────────────────────────────────────────────────────────
  // Separator is only drawn at the boundary between event rows and persona sub-rows,
  // NOT between stacked event rows. This prevents grey lines inside expanded lanes.
  const numEventRows = eventRowMap && eventRowMap.size > 0
    ? Math.max(...eventRowMap.values()) + 1
    : 1
  const hasPersonaRows = personaEvents.length > 0

  return (
    <div
      ref={laneRef}
      className={`relative border-b border-border/30 select-none ${isPanning ? 'cursor-grabbing' : 'cursor-crosshair'}`}
      style={{ height: laneHeight, width }}
      onMouseDown={handleMouseDown}
    >
      {/* Separator only at event-rows / persona-sub-rows boundary */}
      {hasPersonaRows && (
        <div
          className="absolute left-0 right-0 border-t border-border/20"
          style={{ top: numEventRows * BASE_LANE_HEIGHT }}
        />
      )}

      {/* Range-draw preview */}
      {dragPreview && (
        <div
          className="absolute top-0 pointer-events-none rounded-sm"
          style={{
            left: dragPreview.left,
            width: dragPreview.width,
            height: BASE_LANE_HEIGHT,
            backgroundColor: lane.color,
            opacity: 0.25,
            border: `2px dashed ${lane.color}`,
          }}
        />
      )}

      {events.map(event => (
        <TimelineEventBar
          key={event.id}
          event={event}
          yearStart={yearStart}
          pixelsPerYear={pixelsPerYear}
          laneColor={lane.color}
          onClick={onEventClick}
          currentYear={currentYear}
          topOffset={(eventRowMap?.get(event.id) ?? 0) * BASE_LANE_HEIGHT}
          scrollLeft={scrollLeft}
        />
      ))}
      {personaEvents.map(pe => (
        <PersonaEventBar
          key={pe.id}
          event={pe}
          personaInitials={personaInitialsMap.get(pe.persona_id) ?? '??'}
          yearStart={yearStart}
          pixelsPerYear={pixelsPerYear}
          laneColor={lane.color}
          subRowIndex={personaSubRowMap.get(pe.persona_id)}
          currentYear={currentYear}
        />
      ))}
    </div>
  )
}
