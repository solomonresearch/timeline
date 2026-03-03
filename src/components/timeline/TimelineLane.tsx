import { useRef, useState } from 'react'
import type { Lane, TimelineEvent } from '@/types/timeline'
import type { AlignedPersonaEvent } from '@/types/database'
import { TimelineEventBar } from './TimelineEvent'
import { PersonaEventBar } from './PersonaEventBar'
import { BASE_LANE_HEIGHT } from '@/lib/constants'

const DRAG_THRESHOLD_PX = 4

interface TimelineLaneProps {
  lane: Lane
  events: TimelineEvent[]
  yearStart: number
  yearEnd: number
  pixelsPerYear: number
  onEventClick: (event: TimelineEvent, element: HTMLElement) => void
  onLaneClick: (laneId: string, year: number) => void
  onLaneDragRange: (laneId: string, startYear: number, endYear: number) => void
  personaEvents: AlignedPersonaEvent[]
  personaInitialsMap: Map<string, string>
  laneHeight: number
  personaSubRowMap: Map<string, number>
  currentYear: number
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
  personaEvents,
  personaInitialsMap,
  laneHeight,
  personaSubRowMap,
  currentYear,
}: TimelineLaneProps) {
  const width = (yearEnd - yearStart) * pixelsPerYear

  // ── Interaction state ────────────────────────────────────────────────────
  const dragState = useRef<{
    startClientX: number
    startYear: number
    isDragging: boolean
  } | null>(null)
  const wasDragRef = useRef(false)

  // Drag preview rectangle (left + width in px relative to lane)
  const [dragPreview, setDragPreview] = useState<{ left: number; width: number } | null>(null)

  function toYear(offsetX: number) {
    return yearStart + offsetX / pixelsPerYear
  }

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return
    if (e.button !== 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    dragState.current = {
      startClientX: e.clientX,
      startYear: toYear(e.clientX - rect.left),
      isDragging: false,
    }
    wasDragRef.current = false
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const ds = dragState.current
    if (!ds) return
    const moved = Math.abs(e.clientX - ds.startClientX)
    if (moved > DRAG_THRESHOLD_PX) {
      ds.isDragging = true
      const rect = e.currentTarget.getBoundingClientRect()
      const startPx = ds.startClientX - rect.left
      const nowPx = e.clientX - rect.left
      setDragPreview({
        left: Math.min(startPx, nowPx),
        width: Math.abs(nowPx - startPx),
      })
    }
  }

  function handleMouseUp(e: React.MouseEvent<HTMLDivElement>) {
    const ds = dragState.current
    if (!ds) return
    if (ds.isDragging) {
      wasDragRef.current = true
      const rect = e.currentTarget.getBoundingClientRect()
      const endYear = toYear(e.clientX - rect.left)
      const [s, en] = ds.startYear < endYear
        ? [ds.startYear, endYear]
        : [endYear, ds.startYear]
      if (en - s > 0.05) {
        const round = (y: number) => Math.round(y * 10) / 10
        onLaneDragRange(lane.id, round(s), round(en))
      }
    }
    dragState.current = null
    setDragPreview(null)
  }

  function handleMouseLeave() {
    // Cancel drag preview if mouse leaves without releasing
    if (dragState.current?.isDragging) {
      dragState.current = null
      setDragPreview(null)
    }
  }

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return
    // Drag just ended — suppress click
    if (wasDragRef.current) {
      wasDragRef.current = false
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    const year = Math.round(toYear(e.clientX - rect.left) * 2) / 2
    onLaneClick(lane.id, year)
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className="relative border-b border-border/30 cursor-crosshair select-none"
      style={{ height: laneHeight, width }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Separator between user row and persona sub-rows */}
      {laneHeight > BASE_LANE_HEIGHT && (
        <div
          className="absolute left-0 right-0 border-t border-border/20"
          style={{ top: BASE_LANE_HEIGHT }}
        />
      )}

      {/* Drag range preview */}
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
