import { useRef } from 'react'
import type { Lane, TimelineEvent } from '@/types/timeline'
import { LaneSidebar } from './LaneSidebar'
import { TimelineHeader } from './TimelineHeader'
import { YearGrid } from './YearGrid'
import { TimelineLane } from './TimelineLane'

interface TimelineContainerProps {
  lanes: Lane[]
  events: TimelineEvent[]
  yearStart: number
  yearEnd: number
  pixelsPerYear: number
  onToggleVisibility: (id: string) => void
  onEditLane: (lane: Lane) => void
  onDeleteLane: (lane: Lane) => void
  onEventClick: (event: TimelineEvent, element: HTMLElement) => void
}

const LANE_HEIGHT = 28

export function TimelineContainer({
  lanes,
  events,
  yearStart,
  yearEnd,
  pixelsPerYear,
  onToggleVisibility,
  onEditLane,
  onDeleteLane,
  onEventClick,
}: TimelineContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const visibleLanes = lanes.filter(l => l.visible)
  const totalHeight = visibleLanes.length * LANE_HEIGHT
  const totalWidth = (yearEnd - yearStart) * pixelsPerYear

  return (
    <div className="flex flex-1 overflow-hidden">
      <LaneSidebar
        lanes={visibleLanes}
        onToggleVisibility={onToggleVisibility}
        onEditLane={onEditLane}
        onDeleteLane={onDeleteLane}
      />
      <div ref={scrollRef} className="flex-1 overflow-auto">
        <div className="relative" style={{ width: totalWidth, minHeight: totalHeight + 24 }}>
          <TimelineHeader yearStart={yearStart} yearEnd={yearEnd} pixelsPerYear={pixelsPerYear} />
          <div className="relative">
            <YearGrid yearStart={yearStart} yearEnd={yearEnd} pixelsPerYear={pixelsPerYear} totalHeight={totalHeight} />
            {visibleLanes.map(lane => (
              <TimelineLane
                key={lane.id}
                lane={lane}
                events={events.filter(e => e.laneId === lane.id)}
                yearStart={yearStart}
                yearEnd={yearEnd}
                pixelsPerYear={pixelsPerYear}
                onEventClick={onEventClick}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
