import { useMemo, useCallback, useState } from 'react'
import { Plus, ZoomIn, ZoomOut, MoreHorizontal, CalendarSearch, Globe, FileText, Mic, Search, LogOut, UserPen } from 'lucide-react' // Globe kept for import menu item
import { Button } from '@/components/ui/button'
import { TimelinePersonaSelector } from '@/components/TimelinePersonaSelector'
import { ProfileDialog } from '@/components/ProfileDialog'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/hooks/useProfile'
import type { DbPersona, SharedWithMeItem } from '@/types/database'
import type { Lane, TimelineEvent } from '@/types/timeline'
import type { PersonaDisplayMode } from '@/hooks/usePersonas'
import type { OverlayDisplayMode } from '@/hooks/useTimelineOverlays'
import type { ExternalOverlayInfo } from '@/hooks/useExternalOverlays'
import { MIN_PIXELS_PER_YEAR, MAX_PIXELS_PER_YEAR } from '@/lib/constants'
import { useSizeConfig, type UiSize } from '@/contexts/UiSizeContext'
import { useSkin, SKINS, type SkinId } from '@/contexts/SkinContext'
import { SkinDialog } from '@/components/SkinDialog'
import { ImportDialog, type ImportTab } from '@/components/ImportDialog'
import { SearchDialog } from '@/components/SearchDialog'
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
  todayOffScreen?: { direction: 'left' | 'right' } | null
  lanes: Lane[]
  events: TimelineEvent[]
  addEvent: (event: Omit<TimelineEvent, 'id'>) => Promise<TimelineEvent | null>
  addLane: (lane: Omit<Lane, 'id' | 'order' | 'isDefault'>) => Promise<Lane | null>
  maxEvents: number
  onMaxEventsChange: (v: number) => void
  onSearchNavigate: (event: TimelineEvent) => void
  activeOverlayIds: Set<string>
  onToggleOverlay: (id: string) => void
  overlayAlignedIds: Set<string>
  onToggleOverlayAlignment: (id: string) => void
  overlayDisplayModes: Map<string, OverlayDisplayMode>
  onSetOverlayDisplayMode: (id: string, mode: OverlayDisplayMode) => void
  externalStored?: ExternalOverlayInfo[]
  externalActiveIds?: Set<string>
  externalAlignedIds?: Set<string>
  externalDisplayModes?: Map<string, OverlayDisplayMode>
  onAddExternal?: (info: ExternalOverlayInfo) => void
  onRemoveExternal?: (timelineId: string) => void
  onToggleExternalActive?: (timelineId: string) => void
  onToggleExternalAlignment?: (timelineId: string) => void
  onSetExternalDisplayMode?: (timelineId: string, mode: OverlayDisplayMode) => void
  mainStartYear?: number | null
  sharedWithMe?: SharedWithMeItem[]
  onAddTimeline?: () => void
  requestCreateTimeline?: boolean
  onRequestCreateTimelineHandled?: () => void
  showUserMenu?: boolean
  extraActions?: React.ReactNode
}

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
  onSetActiveView: _onSetActiveView,
  onScrollToToday,
  todayOffScreen,
  lanes,
  events,
  addEvent,
  addLane,
  maxEvents,
  onMaxEventsChange,
  onSearchNavigate,
  activeOverlayIds,
  onToggleOverlay,
  overlayAlignedIds,
  onToggleOverlayAlignment,
  overlayDisplayModes,
  onSetOverlayDisplayMode,
  externalStored,
  externalActiveIds,
  externalAlignedIds,
  externalDisplayModes,
  onAddExternal,
  onRemoveExternal,
  onToggleExternalActive,
  onToggleExternalAlignment,
  onSetExternalDisplayMode,
  mainStartYear,
  sharedWithMe,
  onAddTimeline,
  requestCreateTimeline,
  onRequestCreateTimelineHandled,
  showUserMenu = true,
  extraActions,
}: ToolbarProps) {
  const { size, setSize } = useSizeConfig()
  const { skinId, setSkinId, customInput } = useSkin()
  const { user, signOut } = useAuth()
  const { profile } = useProfile()
  const [skinDialogOpen, setSkinDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importTab, setImportTab] = useState<ImportTab>('calendar-file')
  const [searchOpen, setSearchOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

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

  const displayName = profile?.display_name || ''
  const userInitial = (displayName || user?.email?.[0] || '?').charAt(0).toUpperCase()

  return (
    <>
      <div className="flex items-center justify-between border-b bg-background px-3 py-2 gap-2">
        {/* ── Left: branding + timeline selector ── */}
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-lg font-semibold shrink-0 hidden sm:block">TimeLANE</h1>
          <TimelinePersonaSelector
            personas={personas}
            activePersonaIds={activePersonaIds}
            onTogglePersona={onTogglePersona}
            alignedPersonaIds={alignedPersonaIds}
            onTogglePersonaAlignment={onTogglePersonaAlignment}
            personaDisplayModes={personaDisplayModes}
            onSetPersonaDisplayMode={onSetPersonaDisplayMode}
            activeOverlayIds={activeOverlayIds}
            onToggleOverlay={onToggleOverlay}
            overlayAlignedIds={overlayAlignedIds}
            onToggleOverlayAlignment={onToggleOverlayAlignment}
            overlayDisplayModes={overlayDisplayModes}
            onSetOverlayDisplayMode={onSetOverlayDisplayMode}
            externalStored={externalStored}
            externalActiveIds={externalActiveIds}
            externalAlignedIds={externalAlignedIds}
            externalDisplayModes={externalDisplayModes}
            onAddExternal={onAddExternal}
            onRemoveExternal={onRemoveExternal}
            onToggleExternalActive={onToggleExternalActive}
            onToggleExternalAlignment={onToggleExternalAlignment}
            onSetExternalDisplayMode={onSetExternalDisplayMode}
            mainStartYear={mainStartYear}
            sharedWithMe={sharedWithMe}
            requestCreate={requestCreateTimeline}
            onRequestCreateHandled={onRequestCreateTimelineHandled}
          />
        </div>

        {/* ── Right: lean action bar ── */}
        <div className="flex items-center gap-1.5 shrink-0">
          {activeView === 'timeline' && (
            <>
              {onScrollToToday && todayOffScreen && (
                <button
                  onClick={onScrollToToday}
                  className="fixed top-14 left-1/2 -translate-x-1/2 whitespace-nowrap flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold border-2 border-red-500 bg-red-500 text-white hover:bg-red-600 hover:border-red-600 transition-colors z-50 shadow-md"
                >
                  {todayOffScreen.direction === 'left' ? '← ' : '→ '}Back to Today
                </button>
              )}
              <Button variant="outline" size="sm" onClick={() => stepZoom(1 / 1.3)} title="Zoom out">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => stepZoom(1.3)} title="Zoom in">
                <ZoomIn className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* ── + dropdown: Event / Lane / Timeline ── */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="px-2.5" title="Add…">
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onAddEvent}>
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAddLane}>
                <Plus className="h-4 w-4 mr-2" />
                Add Lane
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAddTimeline}>
                <Plus className="h-4 w-4 mr-2" />
                Add Timeline
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* ── 3-dot menu: everything else ── */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="px-2">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="max-h-[85vh] overflow-y-auto">

                {/* Search */}
                <DropdownMenuItem onClick={() => setSearchOpen(true)}>
                  <Search className="h-4 w-4 mr-2" />
                  Search Events
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Zoom slider + label */}
                <div className="px-2 py-1.5 flex items-center gap-2">
                  <ZoomOut className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <input
                    type="range"
                    min={0}
                    max={250}
                    value={sliderValue}
                    onChange={handleSliderChange}
                    className="h-1 flex-1 cursor-pointer accent-primary"
                    onClick={e => e.stopPropagation()}
                  />
                  <ZoomIn className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-[10px] text-muted-foreground w-12 text-right shrink-0">{zoomLabel}</span>
                </div>

                {/* Max events */}
                <div className="px-2 py-1.5 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Max events:</span>
                  <input
                    type="number"
                    min={1}
                    max={99999}
                    value={maxEvents}
                    onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1) onMaxEventsChange(v) }}
                    onClick={e => e.stopPropagation()}
                    className="w-16 h-7 rounded-md border border-input bg-background px-2 text-xs text-center ml-auto"
                    title="Maximum number of events to display (longest first)"
                  />
                </div>

                <DropdownMenuSeparator />

                {/* Size */}
                {(['small', 'large', 'fitscreen'] as UiSize[]).map(s => (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => setSize(s)}
                    className={size === s ? 'font-semibold' : ''}
                  >
                    {SIZE_NAMES[s]}
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />

                {/* Theme */}
                {SKINS.filter(s => ['classic', 'dark', 'sepia'].includes(s.id)).map(s => (
                  <DropdownMenuItem
                    key={s.id}
                    onClick={() => handleSelectSkin(s.id)}
                    className={`gap-2 ${skinId === s.id ? 'font-semibold' : ''}`}
                  >
                    <SkinSwatch bg={s.bgColor} accent={s.accentColor} />
                    {s.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={() => handleSelectSkin('custom')} className={`gap-2 ${skinId === 'custom' ? 'font-semibold' : ''}`}>
                  <SkinSwatch bg={swatchBg} accent={swatchAccent} />
                  {skinId === 'custom' ? skinLabel : 'Custom…'}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Import */}
                <DropdownMenuItem onClick={() => openImport('calendar-file')}>
                  <CalendarSearch className="h-4 w-4 mr-2" />
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

                {/* User section */}
                {showUserMenu && user && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5 text-xs text-muted-foreground truncate flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-medium shrink-0">
                        {userInitial}
                      </span>
                      {displayName || user.email}
                    </div>
                    <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                      <UserPen className="h-4 w-4 mr-2" />
                      Edit Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {extraActions}
        </div>
      </div>

      <SkinDialog open={skinDialogOpen} onOpenChange={setSkinDialogOpen} />
      <ImportDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} defaultTab={importTab} lanes={lanes} addEvent={addEvent} addLane={addLane} />
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} events={events} lanes={lanes} onNavigate={onSearchNavigate} />
      {showUserMenu && <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />}
    </>
  )
}
