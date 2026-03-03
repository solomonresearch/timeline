import type { DbPersona, AlignedPersonaEvent } from '@/types/database'
import { PersonaEventBar } from './PersonaEventBar'
import { BASE_LANE_HEIGHT, PERSONA_SUB_ROW_HEIGHT } from '@/lib/constants'

const SIDEBAR_WIDTH = 160

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
  const initials = getInitials(persona.name)
  const laneNames = [...new Set(events.map(e => e.lane_name))].sort()

  return (
    <div>
      {/* Persona header */}
      <div className="relative border-t-2 border-border/60" style={{ height: PERSONA_SUB_ROW_HEIGHT }}>
        <div
          className="h-full flex items-center gap-2 px-2 bg-muted/40 border-r border-border/60"
          style={{ position: 'sticky', left: 0, width: SIDEBAR_WIDTH, zIndex: 10 }}
        >
          <span className="text-[9px] font-bold bg-muted-foreground/20 rounded px-1 py-0.5 shrink-0">
            {initials}
          </span>
          <span className="text-[10px] font-semibold text-muted-foreground truncate">
            {persona.name}
          </span>
          <span className="text-[9px] text-muted-foreground/60 shrink-0 hidden xl:inline">
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
            {/* Events positioned absolute (rendered behind sidebar) */}
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
            {/* Sticky sidebar label — same compact style as integrated sub-rows */}
            <div
              className="bg-white border-r border-border/40 flex items-center gap-1 pl-3 text-muted-foreground"
              style={{
                position: 'sticky',
                left: 0,
                width: SIDEBAR_WIDTH,
                height: BASE_LANE_HEIGHT,
                zIndex: 10,
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: laneColor }} />
              <span className="text-[10px] truncate">{laneName}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
