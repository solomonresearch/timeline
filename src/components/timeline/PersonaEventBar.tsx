import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { AlignedPersonaEvent } from '@/types/database'
import { BASE_LANE_HEIGHT, BAR_HEIGHT, DOT_SIZE } from '@/lib/constants'

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
  const color = event.color || laneColor
  const left = (event.display_start_year - yearStart) * pixelsPerYear
  const label = `${personaInitials}: ${event.title}`

  const isPast = event.type === 'point'
    ? event.display_start_year < currentYear
    : (event.display_end_year ?? event.display_start_year) < currentYear

  const baseOpacity = 0.4
  const pastOpacity = isPast ? 0.2 : baseOpacity
  const pastFilter = isPast ? 'saturate(0.5)' : undefined

  // Compute vertical offset: if subRowIndex is given, place in sub-row area below user events
  const verticalOffset = subRowIndex != null
    ? BASE_LANE_HEIGHT + subRowIndex * 22 // PERSONA_SUB_ROW_HEIGHT
    : 0

  if (event.type === 'point') {
    const top = verticalOffset + (BASE_LANE_HEIGHT - DOT_SIZE) / 2
    const adjustedTop = subRowIndex != null
      ? verticalOffset + (22 - DOT_SIZE) / 2
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
  const barHeight = subRowIndex != null ? 14 : BAR_HEIGHT
  const top = subRowIndex != null
    ? verticalOffset + (22 - barHeight) / 2
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
          {width > 50 && (
            <span className="px-1 text-[9px] leading-[14px] text-white/80 font-medium truncate block">
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
