import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { OverlayTimelineEvent } from '@/types/database'
import { useSizeConfig } from '@/contexts/UiSizeContext'

interface OverlayEventBarProps {
  event: OverlayTimelineEvent
  timelineLabel: string   // emoji or 2-char abbreviation
  timelineName: string
  yearStart: number
  pixelsPerYear: number
  laneColor: string
  rowTop: number          // absolute y offset where this sub-row starts (within parent div)
  rowHeight: number       // height of the sub-row for centering
  currentYear: number
}

export function OverlayEventBar({
  event,
  timelineLabel,
  timelineName,
  yearStart,
  pixelsPerYear,
  laneColor,
  rowTop,
  rowHeight,
  currentYear,
}: OverlayEventBarProps) {
  const { sc } = useSizeConfig()
  const { BAR_HEIGHT, DOT_SIZE, EVENT_FONT, EVENT_LINE_HEIGHT } = sc

  const color = event.color || laneColor
  const left = (event.display_start_year - yearStart) * pixelsPerYear
  const label = `${timelineLabel}: ${event.title}`

  const isPast = event.type === 'point'
    ? event.display_start_year < currentYear
    : (event.display_end_year ?? event.display_start_year) < currentYear

  const opacity = isPast ? 0.22 : 0.45
  const filter = isPast ? 'saturate(0.5)' : undefined

  if (event.type === 'point') {
    const top = rowTop + (rowHeight - DOT_SIZE) / 2
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="absolute rounded-full border-2 border-dashed border-white/60 cursor-default"
            style={{
              left: left - DOT_SIZE / 2,
              top,
              width: DOT_SIZE,
              height: DOT_SIZE,
              backgroundColor: color,
              opacity,
              filter,
            }}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium text-xs">{label}</p>
          {event.description && <p className="text-xs text-muted-foreground">{event.description}</p>}
          <p className="text-xs text-muted-foreground">{timelineName} · {Math.round(event.start_year)}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  const displayEnd = event.display_end_year ?? event.display_start_year + 1
  const width = (displayEnd - event.display_start_year) * pixelsPerYear
  const barHeight = Math.round(BAR_HEIGHT * 0.75)
  const top = rowTop + (rowHeight - barHeight) / 2

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="absolute rounded-sm border-2 border-dashed border-white/60 overflow-hidden cursor-default"
          style={{
            left,
            top,
            width: Math.max(width, 4),
            height: barHeight,
            backgroundColor: color,
            opacity,
            filter,
          }}
        >
          {width > EVENT_FONT * 5 && (
            <span
              className="px-1 text-white/80 font-medium truncate block"
              style={{ fontSize: Math.round(EVENT_FONT * 0.9), lineHeight: `${EVENT_LINE_HEIGHT}px` }}
            >
              {label}
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium text-xs">{label}</p>
        {event.description && <p className="text-xs text-muted-foreground">{event.description}</p>}
        <p className="text-xs text-muted-foreground">
          {timelineName} · {Math.round(event.start_year)}–{event.end_year != null ? Math.round(event.end_year) : '?'}
        </p>
      </TooltipContent>
    </Tooltip>
  )
}
