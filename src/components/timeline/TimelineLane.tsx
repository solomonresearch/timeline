import type { Lane, TimelineEvent } from '@/types/timeline'
import { TimelineEventBar } from './TimelineEvent'

interface TimelineLaneProps {
  lane: Lane
  events: TimelineEvent[]
  yearStart: number
  yearEnd: number
  pixelsPerYear: number
  onEventClick: (event: TimelineEvent, element: HTMLElement) => void
}

const LANE_HEIGHT = 28

export function TimelineLane({ lane, events, yearStart, yearEnd, pixelsPerYear, onEventClick }: TimelineLaneProps) {
  const width = (yearEnd - yearStart) * pixelsPerYear

  return (
    <div
      className="relative border-b border-border/30"
      style={{ height: LANE_HEIGHT, width }}
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
    </div>
  )
}
