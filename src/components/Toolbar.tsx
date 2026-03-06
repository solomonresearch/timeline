import { useMemo, useCallback } from 'react'
import { Plus, Layers, ZoomIn, ZoomOut, Kanban, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/UserMenu'
import { TimelinePersonaSelector } from '@/components/TimelinePersonaSelector'
import type { DbPersona } from '@/types/database'
import type { PersonaDisplayMode } from '@/hooks/usePersonas'
import { MIN_PIXELS_PER_YEAR, MAX_PIXELS_PER_YEAR } from '@/lib/constants'
import { useSizeConfig, type UiSize } from '@/contexts/UiSizeContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
  onSetActiveView: (v: AppView) => void
  onScrollToToday?: () => void
}

const SIZE_LABELS: Record<UiSize, string> = { small: 'S', medium: 'M', large: 'L', fitscreen: 'Fit' }
const SIZE_NAMES: Record<UiSize, string> = { small: 'Small', medium: 'Medium', large: 'Large', fitscreen: 'Fit Screen' }

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
  onSetActiveView,
  onScrollToToday,
}: ToolbarProps) {
  const { size, setSize } = useSizeConfig()

  const logMin = useMemo(() => Math.log(MIN_PIXELS_PER_YEAR), [])
  const logMax = useMemo(() => Math.log(MAX_PIXELS_PER_YEAR), [])

  const stepZoom = useCallback((factor: number) => {
    const next = Math.max(MIN_PIXELS_PER_YEAR, Math.min(MAX_PIXELS_PER_YEAR, pixelsPerYear * factor))
    onPixelsPerYearChange(Math.round(next * 10) / 10)
  }, [pixelsPerYear, onPixelsPerYearChange])

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
        <TimelinePersonaSelector
          personas={personas}
          activePersonaIds={activePersonaIds}
          onTogglePersona={onTogglePersona}
          personaDisplayModes={personaDisplayModes}
          onSetPersonaDisplayMode={onSetPersonaDisplayMode}
        />
        {/* Size selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 w-20">
              <span className="text-xs text-muted-foreground">Size:</span>
              <span className="font-medium">{SIZE_LABELS[size]}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {(['small', 'medium', 'large', 'fitscreen'] as UiSize[]).map(s => (
              <DropdownMenuItem
                key={s}
                onClick={() => setSize(s)}
                className={size === s ? 'font-semibold' : ''}
              >
                {SIZE_NAMES[s]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2">
        {activeView === 'timeline' && (
          <>
            {onScrollToToday && (
              <Button variant="outline" size="sm" onClick={onScrollToToday}>
                Today
              </Button>
            )}
            <div className="flex items-center gap-1 rounded-md border px-2 py-1">
              <button onClick={() => stepZoom(1 / 1.3)} className="text-muted-foreground hover:text-foreground">
                <ZoomOut className="h-4 w-4" />
              </button>
              <input
                type="range"
                min={0}
                max={1000}
                value={sliderValue}
                onChange={handleSliderChange}
                className="h-1 w-24 cursor-pointer accent-primary"
              />
              <button onClick={() => stepZoom(1.3)} className="text-muted-foreground hover:text-foreground">
                <ZoomIn className="h-4 w-4" />
              </button>
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
          </>
        )}
        <Button
          variant={activeView === 'kanban' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSetActiveView(activeView === 'kanban' ? 'timeline' : 'kanban')}
        >
          <Kanban className="h-4 w-4 mr-1" />
          Kanban
        </Button>
        <UserMenu />
      </div>
    </div>
  )
}
