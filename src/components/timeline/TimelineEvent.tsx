import type { TimelineEvent as TEvent } from '@/types/timeline'
import { BASE_LANE_HEIGHT, BAR_HEIGHT, DOT_SIZE } from '@/lib/constants'

interface TimelineEventProps {
  event: TEvent
  yearStart: number
  pixelsPerYear: number
  laneColor: string
  onClick: (event: TEvent, element: HTMLElement) => void
  currentYear: number
  topOffset?: number
}

export function TimelineEventBar({ event, yearStart, pixelsPerYear, laneColor, onClick, currentYear, topOffset = 0 }: TimelineEventProps) {
  const color = event.color || laneColor
  const left = (event.startYear - yearStart) * pixelsPerYear

  const isPast = event.type === 'point'
    ? event.startYear < currentYear
    : (event.endYear ?? event.startYear) < currentYear

  const pastStyle = isPast ? { opacity: 0.35, filter: 'saturate(0.5)' } : undefined

  if (event.type === 'point') {
    const top = (BASE_LANE_HEIGHT - DOT_SIZE) / 2 + topOffset
    return (
      <div
        className="absolute rounded-full cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-black/20 transition-shadow"
        style={{
          left: left - DOT_SIZE / 2,
          top,
          width: DOT_SIZE,
          height: DOT_SIZE,
          backgroundColor: color,
          ...pastStyle,
        }}
        title={event.title}
        onClick={e => onClick(event, e.currentTarget)}
      />
    )
  }

  const width = ((event.endYear ?? event.startYear + 1) - event.startYear) * pixelsPerYear
  const top = (BASE_LANE_HEIGHT - BAR_HEIGHT) / 2 + topOffset

  return (
    <div
      className="absolute rounded-sm cursor-pointer hover:brightness-110 transition-all overflow-hidden"
      style={{
        left,
        top,
        width: Math.max(width, 4),
        height: BAR_HEIGHT,
        backgroundColor: color,
        ...pastStyle,
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
