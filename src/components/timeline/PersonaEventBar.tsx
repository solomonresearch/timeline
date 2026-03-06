import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { AlignedPersonaEvent } from '@/types/database'
import { useSizeConfig } from '@/contexts/UiSizeContext'

interface PersonaEventBarProps {
  event: AlignedPersonaEvent
  personaInitials: string
  yearStart: number
  pixelsPerYear: number
  laneColor: string
  subRowIndex?: number
  currentYear: number
}

export function PersonaEventBar({
  event,
  personaInitials,
  yearStart,
  pixelsPerYear,
  laneColor,
  subRowIndex,
  currentYear,
}: PersonaEventBarProps) {
  const { sc } = useSizeConfig()
  const { BASE_LANE_HEIGHT, PERSONA_SUB_ROW_HEIGHT, BAR_HEIGHT, DOT_SIZE, EVENT_FONT, EVENT_LINE_HEIGHT } = sc

  const color = event.color || laneColor
  const left = (event.display_start_year - yearStart) * pixelsPerYear
  const label = `${personaInitials}: ${event.title}`

  const isPast = event.type === 'point'
    ? event.display_start_year < currentYear
    : (event.display_end_year ?? event.display_start_year) < currentYear

  const baseOpacity = 0.4
  const pastOpacity = isPast ? 0.2 : baseOpacity
  const pastFilter = isPast ? 'saturate(0.5)' : undefined

  const verticalOffset = subRowIndex != null
    ? BASE_LANE_HEIGHT + subRowIndex * PERSONA_SUB_ROW_HEIGHT
    : 0

  if (event.type === 'point') {
    const top = verticalOffset + (BASE_LANE_HEIGHT - DOT_SIZE) / 2
    const adjustedTop = subRowIndex != null
      ? verticalOffset + (PERSONA_SUB_ROW_HEIGHT - DOT_SIZE) / 2
      : top
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="absolute rounded-full border-2 border-dashed border-white/60 cursor-default"
            style={{
              left: left - DOT_SIZE / 2,
              top: adjustedTop,
              width: DOT_SIZE,
              height: DOT_SIZE,
              backgroundColor: color,
              opacity: pastOpacity,
              filter: pastFilter,
            }}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium text-xs">{label}</p>
          {event.description && <p className="text-xs text-muted-foreground">{event.description}</p>}
          <p className="text-xs text-muted-foreground">
            Year: {event.start_year}
            {event.display_start_year !== event.start_year && ` (aligned: ${event.display_start_year})`}
          </p>
        </TooltipContent>
      </Tooltip>
    )
  }

  const displayEnd = event.display_end_year ?? event.display_start_year + 1
  const width = (displayEnd - event.display_start_year) * pixelsPerYear
  const barHeight = subRowIndex != null ? Math.round(BAR_HEIGHT * 0.75) : BAR_HEIGHT
  const top = subRowIndex != null
    ? verticalOffset + (PERSONA_SUB_ROW_HEIGHT - barHeight) / 2
    : (BASE_LANE_HEIGHT - BAR_HEIGHT) / 2

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
            opacity: pastOpacity,
            filter: pastFilter,
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
          {event.start_year}–{event.end_year ?? '?'}
          {event.display_start_year !== event.start_year && (
            <> (aligned: {event.display_start_year}–{event.display_end_year ?? '?'})</>
          )}
        </p>
      </TooltipContent>
    </Tooltip>
  )
}
