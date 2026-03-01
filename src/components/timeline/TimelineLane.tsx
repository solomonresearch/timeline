import type { Lane, TimelineEvent } from '@/types/timeline'
import type { AlignedPersonaEvent } from '@/types/database'
import { TimelineEventBar } from './TimelineEvent'
import { PersonaEventBar } from './PersonaEventBar'
import { BASE_LANE_HEIGHT } from '@/lib/constants'

interface TimelineLaneProps {
  lane: Lane
  events: TimelineEvent[]
  yearStart: number
  yearEnd: number
  pixelsPerYear: number
  onEventClick: (event: TimelineEvent, element: HTMLElement) => void
  onLaneClick: (laneId: string, year: number) => void
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
  yearEnd,
  pixelsPerYear,
  onEventClick,
  onLaneClick,
  personaEvents,
  personaInitialsMap,
  laneHeight,
  personaSubRowMap,
  currentYear,
}: TimelineLaneProps) {
  const width = (yearEnd - yearStart) * pixelsPerYear

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    // Only fire if clicking the lane background, not an event
    if (e.target !== e.currentTarget) return
    const rect = e.currentTarget.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const year = yearStart + offsetX / pixelsPerYear
    const rounded = Math.round(year * 2) / 2 // Round to nearest 0.5
    onLaneClick(lane.id, rounded)
  }

  return (
    <div
      className="relative border-b border-border/30 cursor-crosshair"
      style={{ height: laneHeight, width }}
      onClick={handleClick}
    >
      {/* Separator line between user row and persona sub-rows */}
      {laneHeight > BASE_LANE_HEIGHT && (
        <div
          className="absolute left-0 right-0 border-t border-border/20"
          style={{ top: BASE_LANE_HEIGHT }}
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
