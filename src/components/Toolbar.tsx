import { useMemo, useCallback } from 'react'
import { Plus, Layers, ZoomIn, ZoomOut, LayoutGrid, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/UserMenu'
import { TimelineSelector } from '@/components/TimelineSelector'
import { PersonaToggle } from '@/components/PersonaToggle'
import type { DbPersona } from '@/types/database'
import type { PersonaDisplayMode } from '@/hooks/usePersonas'
import { MIN_PIXELS_PER_YEAR, MAX_PIXELS_PER_YEAR } from '@/lib/constants'

export type AppView = 'timeline' | 'kanban'

interface ToolbarProps {
  pixelsPerYear: number
  onPixelsPerYearChange: (v: number) => void
  onAddEvent: () => void
  onAddLane: () => void
  personas: DbPersona[]
  activePersonaIds: Set<string>
  onTogglePersona: (id: string) => void
  personaDisplayModes: Map<string, PersonaDisplayMode>
  onSetPersonaDisplayMode: (id: string, mode: PersonaDisplayMode) => void
  activeView: AppView
  onViewChange: (view: AppView) => void
}

export function Toolbar({
  pixelsPerYear,
  onPixelsPerYearChange,
  onAddEvent,
  onAddLane,
  personas,
  activePersonaIds,
  onTogglePersona,
  personaDisplayModes,
  onSetPersonaDisplayMode,
  activeView,
  onViewChange,
}: ToolbarProps) {
  // Logarithmic slider: map linear 0-1000 -> exponential MIN..MAX px/yr
  const logMin = useMemo(() => Math.log(MIN_PIXELS_PER_YEAR), [])
  const logMax = useMemo(() => Math.log(MAX_PIXELS_PER_YEAR), [])

  const sliderValue = useMemo(() => {
    const v = (Math.log(pixelsPerYear) - logMin) / (logMax - logMin) * 1000
    return Math.round(v)
  }, [pixelsPerYear, logMin, logMax])

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Number(e.target.value)
      const ppy = Math.exp(logMin + (v / 1000) * (logMax - logMin))
      onPixelsPerYearChange(Math.round(ppy * 10) / 10)
    },
    [logMin, logMax, onPixelsPerYearChange],
  )

  const zoomLabel = pixelsPerYear >= 10
    ? `${Math.round(pixelsPerYear)} px/yr`
    : `${pixelsPerYear.toFixed(1)} px/yr`

  return (
    <div className="flex items-center justify-between border-b bg-white px-4 py-2">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold">Life Timeline</h1>
        <TimelineSelector />
      </div>
      <div className="flex items-center gap-2">
        {/* View toggle */}
        <div className="flex items-center rounded-md border p-0.5">
          <button
            onClick={() => onViewChange('timeline')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              activeView === 'timeline'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Timeline
          </button>
          <button
            onClick={() => onViewChange('kanban')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              activeView === 'kanban'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Kanban
          </button>
        </div>

        {activeView === 'timeline' && (
          <>
            <div className="flex items-center gap-1 rounded-md border px-2 py-1">
              <ZoomOut className="h-4 w-4 text-muted-foreground" />
              <input
                type="range"
                min={0}
                max={1000}
                value={sliderValue}
                onChange={handleSliderChange}
                className="h-1 w-24 cursor-pointer accent-primary"
              />
              <ZoomIn className="h-4 w-4 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground ml-1 w-14 text-right">{zoomLabel}</span>
            </div>
            <Button variant="outline" size="sm" onClick={onAddLane}>
              <Layers className="h-4 w-4 mr-1" />
              Add Lane
            </Button>
            <Button size="sm" onClick={onAddEvent}>
              <Plus className="h-4 w-4 mr-1" />
              Add Event
            </Button>
            <PersonaToggle
              personas={personas}
              activePersonaIds={activePersonaIds}
              onToggle={onTogglePersona}
              personaDisplayModes={personaDisplayModes}
              onSetDisplayMode={onSetPersonaDisplayMode}
            />
          </>
        )}
        <UserMenu />
      </div>
    </div>
  )
}
