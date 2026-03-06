import type { DbPersona, AlignedPersonaEvent } from '@/types/database'
import { PersonaEventBar } from './PersonaEventBar'
import { useSizeConfig } from '@/contexts/UiSizeContext'

interface PersonaSeparateTimelineProps {
  persona: DbPersona
  events: AlignedPersonaEvent[]
  yearStart: number
  pixelsPerYear: number
  laneColorMap: Map<string, string>
  currentYear: number
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export function PersonaSeparateTimeline({
  persona,
  events,
  yearStart,
  pixelsPerYear,
  laneColorMap,
  currentYear,
}: PersonaSeparateTimelineProps) {
  const { sc } = useSizeConfig()
  const { BASE_LANE_HEIGHT, PERSONA_SUB_ROW_HEIGHT, SIDEBAR_WIDTH, SIDEBAR_FONT } = sc

  const initials = getInitials(persona.name)
  const laneNames = [...new Set(events.map(e => e.lane_name))].sort()

  return (
    <div>
      {/* Persona header */}
      <div className="relative border-t-2 border-border/60" style={{ height: PERSONA_SUB_ROW_HEIGHT }}>
        <div
          className="h-full flex items-center gap-2 bg-muted/40 border-r border-border/60"
          style={{ position: 'sticky', left: 0, width: SIDEBAR_WIDTH, zIndex: 10, paddingLeft: Math.round(SIDEBAR_WIDTH * 0.04) }}
        >
          <span
            className="font-bold bg-muted-foreground/20 rounded shrink-0"
            style={{ fontSize: Math.round(SIDEBAR_FONT * 0.85), padding: '1px 4px' }}
          >
            {initials}
          </span>
          <span className="font-semibold text-muted-foreground truncate" style={{ fontSize: SIDEBAR_FONT }}>
            {persona.name}
          </span>
          <span
            className="text-muted-foreground/60 shrink-0 hidden xl:inline"
            style={{ fontSize: Math.round(SIDEBAR_FONT * 0.85) }}
          >
            {persona.birth_year}–{persona.death_year ?? 'present'}
          </span>
        </div>
      </div>

      {/* Lane rows */}
      {laneNames.map(laneName => {
        const laneEvents = events.filter(e => e.lane_name === laneName)
        const laneColor = laneColorMap.get(laneName) ?? '#6b7280'
        return (
          <div
            key={laneName}
            className="relative border-b border-border/30"
            style={{ height: BASE_LANE_HEIGHT }}
          >
            {laneEvents.map(e => (
              <PersonaEventBar
                key={e.id}
                event={e}
                personaInitials={initials}
                yearStart={yearStart}
                pixelsPerYear={pixelsPerYear}
                laneColor={laneColor}
                currentYear={currentYear}
              />
            ))}
            <div
              className="bg-white border-r border-border/40 flex items-center text-muted-foreground"
              style={{
                position: 'sticky',
                left: 0,
                width: SIDEBAR_WIDTH,
                height: BASE_LANE_HEIGHT,
                zIndex: 10,
                paddingLeft: Math.round(SIDEBAR_WIDTH * 0.08),
                gap: Math.round(SIDEBAR_FONT / 3),
              }}
            >
              <div
                className="rounded-full shrink-0"
                style={{ width: Math.round(SIDEBAR_FONT / 2), height: Math.round(SIDEBAR_FONT / 2), backgroundColor: laneColor }}
              />
              <span className="truncate" style={{ fontSize: SIDEBAR_FONT }}>{laneName}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
