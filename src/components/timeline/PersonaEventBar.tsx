import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { DbPersonaEvent } from '@/types/database'

interface PersonaEventBarProps {
  event: DbPersonaEvent
  personaInitials: string
  yearStart: number
  pixelsPerYear: number
  laneColor: string
}

const LANE_HEIGHT = 28
const BAR_HEIGHT = 18
const DOT_SIZE = 12

export function PersonaEventBar({
  event,
  personaInitials,
  yearStart,
  pixelsPerYear,
  laneColor,
}: PersonaEventBarProps) {
  const color = event.color || laneColor
  const left = (event.start_year - yearStart) * pixelsPerYear
  const label = `${personaInitials}: ${event.title}`

  if (event.type === 'point') {
    const top = (LANE_HEIGHT - DOT_SIZE) / 2
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="absolute rounded-full opacity-40 border-2 border-dashed border-white/60 cursor-default"
            style={{
              left: left - DOT_SIZE / 2,
              top,
              width: DOT_SIZE,
              height: DOT_SIZE,
              backgroundColor: color,
            }}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium text-xs">{label}</p>
          {event.description && <p className="text-xs text-muted-foreground">{event.description}</p>}
          <p className="text-xs text-muted-foreground">Year: {event.start_year}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  const width = ((event.end_year ?? event.start_year + 1) - event.start_year) * pixelsPerYear
  const top = (LANE_HEIGHT - BAR_HEIGHT) / 2

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="absolute rounded-sm opacity-40 border-2 border-dashed border-white/60 overflow-hidden cursor-default"
          style={{
            left,
            top,
            width: Math.max(width, 4),
            height: BAR_HEIGHT,
            backgroundColor: color,
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
        </p>
      </TooltipContent>
    </Tooltip>
  )
}
