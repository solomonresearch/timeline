import type { Lane, TimelineEvent } from '@/types/timeline'
import type { DbPersonaEvent } from '@/types/database'
import { TimelineEventBar } from './TimelineEvent'
import { PersonaEventBar } from './PersonaEventBar'

interface TimelineLaneProps {
  lane: Lane
  events: TimelineEvent[]
  yearStart: number
  yearEnd: number
  pixelsPerYear: number
  onEventClick: (event: TimelineEvent, element: HTMLElement) => void
  onLaneClick: (laneId: string, year: number) => void
  personaEvents: DbPersonaEvent[]
  personaInitialsMap: Map<string, string>
}

const LANE_HEIGHT = 28

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
      style={{ height: LANE_HEIGHT, width }}
      onClick={handleClick}
    >
      {events.map(event => (
        <TimelineEventBar
          key={event.id}
          event={event}
          yearStart={yearStart}
          pixelsPerYear={pixelsPerYear}
          laneColor={lane.color}
          onClick={onEventClick}
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
        />
      ))}
    </div>
  )
}
