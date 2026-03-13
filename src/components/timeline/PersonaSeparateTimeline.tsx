import type { DbPersona, AlignedPersonaEvent } from '@/types/database'
import { PersonaEventBar } from './PersonaEventBar'
import { useSizeConfig } from '@/contexts/UiSizeContext'

interface PersonaSeparateTimelineProps {
  persona: DbPersona
  events: AlignedPersonaEvent[]
  laneNames: string[]   // stable ordered lane names, provided by parent
  yearStart: number
  yearEnd: number
  pixelsPerYear: number
  laneColorMap: Map<string, string>
  currentYear: number
}

export function PersonaSeparateTimeline({
  persona: _persona,
  events,
  laneNames,
  yearStart,
  yearEnd,
  pixelsPerYear,
  laneColorMap,
  currentYear,
}: PersonaSeparateTimelineProps) {
  const { sc } = useSizeConfig()
  const { BASE_LANE_HEIGHT, PERSONA_SUB_ROW_HEIGHT } = sc
  // Explicit width = same as regular TimelineLane rows — no guessing via inheritance
  const width = (yearEnd - yearStart) * pixelsPerYear
  return (
    <div style={{ width }}>
      {/* Persona header row — height spacer only; label is rendered in LaneSidebar */}
      <div className="border-t-2 border-border/60 bg-muted/10" style={{ height: PERSONA_SUB_ROW_HEIGHT }} />

      {/* Lane rows — event bars only, no in-flow or sticky labels inside */}
      {laneNames.map(laneName => {
        const laneEvents = events.filter(e => e.lane_name === laneName)
        const laneColor = laneColorMap.get(laneName) ?? '#6b7280'
        return (
          <div
            key={laneName}
            className="relative border-b border-border/30"
            style={{ height: BASE_LANE_HEIGHT, width }}
          >
            {laneEvents.map(e => (
              <PersonaEventBar
                key={e.id}
                event={e}
                yearStart={yearStart}
                pixelsPerYear={pixelsPerYear}
                laneColor={laneColor}
                currentYear={currentYear}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}
