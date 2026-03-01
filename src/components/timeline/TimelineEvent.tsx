import type { TimelineEvent as TEvent } from '@/types/timeline'

interface TimelineEventProps {
  event: TEvent
  yearStart: number
  pixelsPerYear: number
  laneColor: string
  onClick: (event: TEvent, element: HTMLElement) => void
}

const LANE_HEIGHT = 28
const BAR_HEIGHT = 18
const DOT_SIZE = 12

export function TimelineEventBar({ event, yearStart, pixelsPerYear, laneColor, onClick }: TimelineEventProps) {
  const color = event.color || laneColor
  const left = (event.startYear - yearStart) * pixelsPerYear

  if (event.type === 'point') {
    const top = (LANE_HEIGHT - DOT_SIZE) / 2
    return (
      <div
        className="absolute rounded-full cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-black/20 transition-shadow"
        style={{
          left: left - DOT_SIZE / 2,
          top,
          width: DOT_SIZE,
          height: DOT_SIZE,
          backgroundColor: color,
        }}
        title={event.title}
        onClick={e => onClick(event, e.currentTarget)}
      />
    )
  }

  const width = ((event.endYear ?? event.startYear + 1) - event.startYear) * pixelsPerYear
  const top = (LANE_HEIGHT - BAR_HEIGHT) / 2

  return (
    <div
      className="absolute rounded-sm cursor-pointer hover:brightness-110 transition-all overflow-hidden"
      style={{
        left,
        top,
        width: Math.max(width, 4),
        height: BAR_HEIGHT,
        backgroundColor: color,
      }}
      title={event.title}
      onClick={e => onClick(event, e.currentTarget)}
    >
      {width > 40 && (
        <span className="px-1.5 text-[10px] leading-[18px] text-white font-medium truncate block">
          {event.title}
        </span>
      )}
    </div>
  )
}
