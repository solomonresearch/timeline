import { useMemo, useCallback, useState } from 'react'
import { Plus, Layers, ZoomIn, ZoomOut, Kanban, ChevronDown, MoreHorizontal, Palette, LayoutList, Download, CalendarDays, Globe, FileText, Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/UserMenu'
import { TimelinePersonaSelector } from '@/components/TimelinePersonaSelector'
import type { DbPersona } from '@/types/database'
import type { Lane, TimelineEvent } from '@/types/timeline'
import type { PersonaDisplayMode } from '@/hooks/usePersonas'
import { MIN_PIXELS_PER_YEAR, MAX_PIXELS_PER_YEAR } from '@/lib/constants'
import { useSizeConfig, type UiSize } from '@/contexts/UiSizeContext'
import { useSkin, SKINS, type SkinId } from '@/contexts/SkinContext'
import { SkinDialog } from '@/components/SkinDialog'
import { ImportDialog, type ImportTab } from '@/components/ImportDialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type AppView = 'timeline' | 'kanban' | 'overview'

interface ToolbarProps {
  pixelsPerYear: number
  onPixelsPerYearChange: (v: number) => void
  onAddEvent: () => void
  onAddLane: () => void
  personas: DbPersona[]
  activePersonaIds: Set<string>
  onTogglePersona: (id: string) => void
  alignedPersonaIds: Set<string>
  onTogglePersonaAlignment: (id: string) => void
  personaDisplayModes: Map<string, PersonaDisplayMode>
  onSetPersonaDisplayMode: (id: string, mode: PersonaDisplayMode) => void
  activeView: AppView
  onSetActiveView: (v: AppView) => void
  onScrollToToday?: () => void
  lanes: Lane[]
  addEvent: (event: Omit<TimelineEvent, 'id'>) => Promise<TimelineEvent | null>
  addLane: (lane: Omit<Lane, 'id' | 'order' | 'isDefault'>) => Promise<Lane | null>
}

const SIZE_LABELS: Record<UiSize, string> = { small: 'S', medium: 'M', large: 'L', fitscreen: 'Fit' }
const SIZE_NAMES: Record<UiSize, string> = { small: 'Small', medium: 'Medium', large: 'Large', fitscreen: 'Fit Screen' }

function SkinSwatch({ bg, accent, size = 14 }: { bg: string; accent: string; size?: number }) {
  return (
    <span className="inline-flex shrink-0 overflow-hidden rounded-sm border border-border/60" style={{ width: size, height: size }}>
      <span style={{ width: '50%', height: '100%', background: bg }} />
      <span style={{ width: '50%', height: '100%', background: accent }} />
    </span>
  )
}

export function Toolbar({
  pixelsPerYear,
  onPixelsPerYearChange,
  onAddEvent,
  onAddLane,
  personas,
  activePersonaIds,
  onTogglePersona,
  alignedPersonaIds,
  onTogglePersonaAlignment,
  personaDisplayModes,
  onSetPersonaDisplayMode,
  activeView,
  onSetActiveView,
  onScrollToToday,
  lanes,
  addEvent,
  addLane,
}: ToolbarProps) {
  const { size, setSize } = useSizeConfig()
  const { skinId, setSkinId, customInput } = useSkin()
  const [skinDialogOpen, setSkinDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importTab, setImportTab] = useState<ImportTab>('calendar-file')

  const logMin = useMemo(() => Math.log(MIN_PIXELS_PER_YEAR), [])
  const logMax = useMemo(() => Math.log(MAX_PIXELS_PER_YEAR), [])

  const stepZoom = useCallback((factor: number) => {
    const next = Math.max(MIN_PIXELS_PER_YEAR, Math.min(MAX_PIXELS_PER_YEAR, pixelsPerYear * factor))
    onPixelsPerYearChange(Math.round(next * 10) / 10)
  }, [pixelsPerYear, onPixelsPerYearChange])

  const sliderValue = useMemo(() => {
    const v = (Math.log(pixelsPerYear) - logMin) / (logMax - logMin) * 250
    return Math.round(v)
  }, [pixelsPerYear, logMin, logMax])

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Number(e.target.value)
      const ppy = Math.exp(logMin + (v / 250) * (logMax - logMin))
      onPixelsPerYearChange(Math.round(ppy * 10) / 10)
    },
    [logMin, logMax, onPixelsPerYearChange],
  )

  const zoomLabel = pixelsPerYear >= 10
    ? `${Math.round(pixelsPerYear)} px/yr`
    : `${pixelsPerYear.toFixed(1)} px/yr`

  const currentSkin = SKINS.find(s => s.id === skinId)
  const swatchBg = currentSkin?.bgColor ?? customInput.background
  const swatchAccent = currentSkin?.accentColor ?? customInput.primary
  const skinLabel = currentSkin?.name ?? 'Custom'

  const handleSelectSkin = (id: SkinId) => {
    setSkinId(id)
    if (id === 'custom') setSkinDialogOpen(true)
  }

  const openImport = (tab: ImportTab) => {
    setImportTab(tab)
    setImportDialogOpen(true)
  }

  return (
    <>
      <div className="flex items-center justify-between border-b bg-background px-3 py-2 gap-2">
        {/* ── Left side ── */}
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-lg font-semibold shrink-0 hidden sm:block">Timeline</h1>
          <TimelinePersonaSelector
            personas={personas}
            activePersonaIds={activePersonaIds}
            onTogglePersona={onTogglePersona}
            alignedPersonaIds={alignedPersonaIds}
            onTogglePersonaAlignment={onTogglePersonaAlignment}
            personaDisplayModes={personaDisplayModes}
            onSetPersonaDisplayMode={onSetPersonaDisplayMode}
          />

          {/* Size selector — desktop only */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1 w-20 hidden md:flex">
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

          {/* Theme selector — desktop only */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 hidden md:flex">
                <SkinSwatch bg={swatchBg} accent={swatchAccent} />
                <span className="text-xs font-medium">{skinLabel}</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {SKINS.map(s => (
                <DropdownMenuItem
                  key={s.id}
                  onClick={() => handleSelectSkin(s.id)}
                  className={`gap-2 ${skinId === s.id ? 'font-semibold' : ''}`}
                >
                  <SkinSwatch bg={s.bgColor} accent={s.accentColor} />
                  {s.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleSelectSkin('custom')}
                className={`gap-2 ${skinId === 'custom' ? 'font-semibold' : ''}`}
              >
                <Palette className="h-3.5 w-3.5 shrink-0" />
                Custom…
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Import dropdown — desktop only */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 hidden md:flex">
                <Download className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Import</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => openImport('calendar-file')}>
                <CalendarDays className="h-4 w-4 mr-2" />
                Calendar File
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openImport('google-calendar')}>
                <Globe className="h-4 w-4 mr-2" />
                Google Calendar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openImport('text')}>
                <FileText className="h-4 w-4 mr-2" />
                Text
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openImport('voice')}>
                <Mic className="h-4 w-4 mr-2" />
                Voice
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ── Right side ── */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Desktop controls */}
          {activeView === 'timeline' && (
            <div className="hidden md:flex items-center gap-2">
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
                  max={250}
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
            </div>
          )}

          {/* Desktop overview toggle */}
          <Button
            variant={activeView === 'overview' ? 'default' : 'outline'}
            size="sm"
            className="hidden md:flex"
            onClick={() => onSetActiveView(activeView === 'overview' ? 'timeline' : 'overview')}
          >
            <LayoutList className="h-4 w-4 mr-1" />
            Overview
          </Button>

          {/* Desktop kanban toggle */}
          <Button
            variant={activeView === 'kanban' ? 'default' : 'outline'}
            size="sm"
            className="hidden md:flex"
            onClick={() => onSetActiveView(activeView === 'kanban' ? 'timeline' : 'kanban')}
          >
            <Kanban className="h-4 w-4 mr-1" />
            Kanban
          </Button>

          {/* Mobile meatball menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex md:hidden px-2">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {activeView === 'timeline' && (
                <>
                  {onScrollToToday && (
                    <DropdownMenuItem onClick={onScrollToToday}>
                      Today
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => stepZoom(1.3)}>
                    <ZoomIn className="h-4 w-4 mr-2" />
                    Zoom In
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => stepZoom(1 / 1.3)}>
                    <ZoomOut className="h-4 w-4 mr-2" />
                    Zoom Out
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onAddLane}>
                    <Layers className="h-4 w-4 mr-2" />
                    Add Lane
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onAddEvent}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Event
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={() => onSetActiveView(activeView === 'overview' ? 'timeline' : 'overview')}>
                <LayoutList className="h-4 w-4 mr-2" />
                {activeView === 'overview' ? 'View Timeline' : 'Overview'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetActiveView(activeView === 'kanban' ? 'timeline' : 'kanban')}>
                <Kanban className="h-4 w-4 mr-2" />
                {activeView === 'kanban' ? 'View Timeline' : 'View Kanban'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* Size options */}
              {(['small', 'medium', 'large', 'fitscreen'] as UiSize[]).map(s => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => setSize(s)}
                  className={size === s ? 'font-semibold' : ''}
                >
                  {SIZE_NAMES[s]}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              {/* Theme options */}
              {SKINS.map(s => (
                <DropdownMenuItem
                  key={s.id}
                  onClick={() => handleSelectSkin(s.id)}
                  className={`gap-2 ${skinId === s.id ? 'font-semibold' : ''}`}
                >
                  <SkinSwatch bg={s.bgColor} accent={s.accentColor} />
                  {s.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                onClick={() => handleSelectSkin('custom')}
                className={`gap-2 ${skinId === 'custom' ? 'font-semibold' : ''}`}
              >
                <Palette className="h-4 w-4 mr-1 shrink-0" />
                Custom Theme…
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* Import options */}
              <DropdownMenuItem onClick={() => openImport('calendar-file')}>
                <CalendarDays className="h-4 w-4 mr-2" />
                Import Calendar File
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openImport('google-calendar')}>
                <Globe className="h-4 w-4 mr-2" />
                Import Google Calendar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openImport('text')}>
                <FileText className="h-4 w-4 mr-2" />
                Import from Text
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openImport('voice')}>
                <Mic className="h-4 w-4 mr-2" />
                Import from Voice
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <UserMenu />
        </div>
      </div>

      <SkinDialog open={skinDialogOpen} onOpenChange={setSkinDialogOpen} />
      <ImportDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} defaultTab={importTab} lanes={lanes} addEvent={addEvent} addLane={addLane} />
    </>
  )
}
