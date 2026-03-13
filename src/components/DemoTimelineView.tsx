import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import type { Lane, TimelineEvent } from '@/types/timeline'
import { useTimelineContext } from '@/contexts/TimelineContext'
import { usePersonas } from '@/hooks/usePersonas'
import { TimelineContainer } from '@/components/timeline/TimelineContainer'
import { EventDialog } from '@/components/dialogs/EventDialog'
import { LaneDialog } from '@/components/dialogs/LaneDialog'
import { DeleteConfirmDialog } from '@/components/dialogs/DeleteConfirmDialog'
import { EventPopover } from '@/components/EventPopover'
import { TooltipProvider } from '@/components/ui/tooltip'
import { UiSizeProvider, useSizeConfig, type UiSize } from '@/contexts/UiSizeContext'
import { useSkin, SKINS } from '@/contexts/SkinContext'
import { SkinDialog } from '@/components/SkinDialog'
import { ImportDialog, type ImportTab } from '@/components/ImportDialog'
import { SearchDialog } from '@/components/SearchDialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import {
  Plus,
  Layers,
  ZoomIn,
  ZoomOut,
  MoreHorizontal,
  CalendarDays,
  Globe,
  FileText,
  Mic,
  Search,
  Users,
  Link2,
  Link2Off,
  LayoutList,
  ChevronDown,
} from 'lucide-react'
import { MIN_PIXELS_PER_YEAR, MAX_PIXELS_PER_YEAR, SIDEBAR_WIDTH } from '@/lib/constants'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface DemoTimelineViewProps {
  onSignUpWithTimeline: () => void
}

const SIZE_NAMES: Record<UiSize, string> = { small: 'Small', medium: 'Medium', large: 'Large', fitscreen: 'Fit Screen' }

function DemoTimelineViewInner({ onSignUpWithTimeline }: DemoTimelineViewProps) {
  const {
    lanes,
    events,
    pixelsPerYear,
    setPixelsPerYear,
    yearStart,
    yearEnd,
    dataYearMin,
    dataYearMax,
    addEvent,
    updateEvent,
    deleteEvent,
    addLane,
    updateLane,
    deleteLane,
    moveLane,
    toggleLaneVisibility,
  } = useTimelineContext()

  // Alex Weber's birth year — used for age-aligning persona overlays
  const DEMO_BIRTH_YEAR = 1980

  const {
    personas,
    activePersonaEvents,
    activePersonaIds,
    togglePersona,
    alignedPersonaIds,
    togglePersonaAlignment,
    personaDisplayModes,
    setPersonaDisplayMode,
  } = usePersonas(DEMO_BIRTH_YEAR)

  // Auto-activate Einstein with age alignment and separate display on first load
  const einsteinInitRef = useRef(false)
  useEffect(() => {
    if (einsteinInitRef.current) return
    if (personas.length === 0) return
    einsteinInitRef.current = true
    const einstein = personas.find(p => p.name.toLowerCase().includes('einstein'))
    if (einstein) {
      if (!activePersonaIds.has(einstein.id)) togglePersona(einstein.id)
      if (!alignedPersonaIds.has(einstein.id)) togglePersonaAlignment(einstein.id)
      // Always default Einstein to separate timeline on the demo page
      if (personaDisplayModes.get(einstein.id) !== 'separate') {
        setPersonaDisplayMode(einstein.id, 'separate')
      }
    }
  }, [personas, activePersonaIds, alignedPersonaIds, personaDisplayModes, togglePersona, togglePersonaAlignment, setPersonaDisplayMode])

  // Set initial zoom so ~180 years (90 back + 90 forward) fills the screen, centred on today
  useEffect(() => {
    const isMobile = window.innerWidth <= 767
    const contentW = window.innerWidth - (isMobile ? 0 : SIDEBAR_WIDTH)
    const ppy = Math.max(MIN_PIXELS_PER_YEAR, contentW / 180)
    setPixelsPerYear(Math.round(ppy * 100) / 100)
    // Scroll to today after layout settles
    requestAnimationFrame(() => { scrollToTodayRef.current?.() })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const { size, setSize } = useSizeConfig()
  const { skinId, setSkinId } = useSkin()
  const [skinDialogOpen, setSkinDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importTab, setImportTab] = useState<ImportTab>('calendar-file')
  const [searchOpen, setSearchOpen] = useState(false)

  const stepZoom = useCallback((factor: number) => {
    const next = Math.max(MIN_PIXELS_PER_YEAR, Math.min(MAX_PIXELS_PER_YEAR, pixelsPerYear * factor))
    setPixelsPerYear(Math.round(next * 10) / 10)
  }, [pixelsPerYear, setPixelsPerYear])

  const openImport = (tab: ImportTab) => {
    setImportTab(tab)
    setImportDialogOpen(true)
  }

  const handleSelectSkin = (id: Parameters<typeof setSkinId>[0]) => {
    setSkinId(id)
    if (id === 'custom') setSkinDialogOpen(true)
  }

  const scrollToTodayRef = useRef<(() => void) | null>(null)
  const scrollToEventRef = useRef<((event: TimelineEvent) => void) | null>(null)

  const [maxEvents] = useState(100)
  const [navigatedEventId, setNavigatedEventId] = useState<string | null>(null)
  const displayedEvents = useMemo(() => {
    const sorted = [...events].sort((a, b) => {
      const durA = a.type === 'range' && a.endYear != null ? a.endYear - a.startYear : 0
      const durB = b.type === 'range' && b.endYear != null ? b.endYear - b.startYear : 0
      return durB - durA
    })
    const top = sorted.slice(0, Math.max(1, maxEvents))
    if (navigatedEventId && !top.find(e => e.id === navigatedEventId)) {
      const target = events.find(e => e.id === navigatedEventId)
      if (target) top.push(target)
    }
    return top
  }, [events, maxEvents, navigatedEventId])

  const handleSearchNavigate = useCallback((event: TimelineEvent) => {
    setNavigatedEventId(event.id)
    scrollToEventRef.current?.(event)
  }, [])

  // Popover state
  const [popover, setPopover] = useState<{ event: TimelineEvent; anchor: HTMLElement; x: number; y: number } | null>(null)

  // Event dialog state
  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null)
  const [defaultLaneId, setDefaultLaneId] = useState<string | undefined>()
  const [defaultStartYear, setDefaultStartYear] = useState<number | undefined>()
  const [defaultEndYear, setDefaultEndYear] = useState<number | undefined>()

  // Lane dialog state
  const [laneDialogOpen, setLaneDialogOpen] = useState(false)
  const [editingLane, setEditingLane] = useState<Lane | null>(null)

  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; title: string; description: string; onConfirm: () => void }>
    ({ open: false, title: '', description: '', onConfirm: () => {} })

  const handleEventClick = useCallback((event: TimelineEvent, element: HTMLElement, clientX: number, clientY: number) => {
    setPopover({ event, anchor: element, x: clientX, y: clientY })
  }, [])

  const handleAddEvent = useCallback(() => {
    setEditingEvent(null); setDefaultLaneId(undefined); setDefaultStartYear(undefined); setDefaultEndYear(undefined)
    setEventDialogOpen(true)
  }, [])

  const handleAddLane = useCallback(() => { setEditingLane(null); setLaneDialogOpen(true) }, [])

  const handleLaneClick = useCallback((laneId: string, year: number) => {
    setEditingEvent(null); setDefaultLaneId(laneId); setDefaultStartYear(year); setDefaultEndYear(undefined)
    setEventDialogOpen(true)
  }, [])

  const handleLaneDragRange = useCallback((laneId: string, startYear: number, endYear: number) => {
    setEditingEvent(null); setDefaultLaneId(laneId); setDefaultStartYear(startYear); setDefaultEndYear(endYear)
    setEventDialogOpen(true)
  }, [])

  const handleEditEvent = useCallback((event: TimelineEvent) => {
    setPopover(null); setEditingEvent(event); setDefaultLaneId(undefined); setDefaultStartYear(undefined); setDefaultEndYear(undefined)
    setEventDialogOpen(true)
  }, [])

  const handleDeleteEvent = useCallback((event: TimelineEvent) => {
    setPopover(null)
    setDeleteDialog({ open: true, title: 'Delete Event', description: `Delete "${event.title}"?`, onConfirm: () => { deleteEvent(event.id); setDeleteDialog(p => ({ ...p, open: false })) } })
  }, [deleteEvent])

  const handleEditLane = useCallback((lane: Lane) => { setEditingLane(lane); setLaneDialogOpen(true) }, [])

  const handleDeleteLane = useCallback((lane: Lane) => {
    setDeleteDialog({ open: true, title: 'Delete Lane', description: `Delete "${lane.name}" and all its events?`, onConfirm: () => { deleteLane(lane.id); setDeleteDialog(p => ({ ...p, open: false })) } })
  }, [deleteLane])

  const handleSaveEvent = useCallback((data: Omit<TimelineEvent, 'id'>) => {
    if (editingEvent) updateEvent(editingEvent.id, data); else addEvent(data)
  }, [editingEvent, updateEvent, addEvent])

  const handleEventDrop = useCallback((eventId: string, newLaneId: string, newStartYear: number, newEndYear: number | undefined) => {
    updateEvent(eventId, { laneId: newLaneId, startYear: newStartYear, ...(newEndYear !== undefined ? { endYear: newEndYear } : { endYear: undefined }) })
  }, [updateEvent])

  const handleSaveLane = useCallback((data: { name: string; color: string; visible: boolean; emoji?: string }) => {
    if (editingLane) updateLane(editingLane.id, data); else addLane(data)
  }, [editingLane, updateLane, addLane])

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Minimal demo toolbar */}
      <div className="flex items-center justify-between border-b bg-background px-3 py-2 gap-2 shrink-0">
        {/* ── Left side ── */}
        <div className="flex items-center gap-2 min-w-0">
        {/* Compare with… persona selector */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Compare with…</span>
              {activePersonaIds.size > 0 && (
                <span className="rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground shrink-0">
                  {activePersonaIds.size}
                </span>
              )}
              <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-0 max-h-[80vh] overflow-y-auto">
            <div className="px-1 pt-1 pb-2">
              {personas.length === 0 ? (
                <p className="px-2 py-2 text-xs text-muted-foreground text-center">No personas available</p>
              ) : (
                personas.map(p => {
                  const isActive = activePersonaIds.has(p.id)
                  const aligned = alignedPersonaIds.has(p.id)
                  const mode = personaDisplayModes.get(p.id) ?? 'integrated'
                  return (
                    <div key={p.id} className="rounded-md px-2 py-1.5 hover:bg-accent">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.birth_year}–{p.death_year ?? 'present'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isActive && (
                            <>
                              <button
                                onClick={() => togglePersonaAlignment(p.id)}
                                title={aligned ? 'Showing age-aligned — click for real years' : 'Showing real years — click to age-align'}
                                className={cn(
                                  'p-1 rounded transition-colors',
                                  aligned
                                    ? 'text-primary bg-primary/10 hover:bg-primary/20'
                                    : 'text-muted-foreground hover:bg-muted',
                                )}
                              >
                                {aligned ? <Link2 className="h-3 w-3" /> : <Link2Off className="h-3 w-3" />}
                              </button>
                              <div className="flex items-center rounded border overflow-hidden">
                                <button
                                  onClick={() => setPersonaDisplayMode(p.id, 'integrated')}
                                  title="Blend into timeline lanes"
                                  className={cn(
                                    'p-1 transition-colors',
                                    mode === 'integrated'
                                      ? 'bg-primary text-primary-foreground'
                                      : 'text-muted-foreground hover:bg-muted',
                                  )}
                                >
                                  <Layers className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => setPersonaDisplayMode(p.id, 'separate')}
                                  title="Show as separate timeline below"
                                  className={cn(
                                    'p-1 transition-colors',
                                    mode === 'separate'
                                      ? 'bg-primary text-primary-foreground'
                                      : 'text-muted-foreground hover:bg-muted',
                                  )}
                                >
                                  <LayoutList className="h-3 w-3" />
                                </button>
                              </div>
                            </>
                          )}
                          <Switch checked={isActive} onCheckedChange={() => togglePersona(p.id)} />
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </PopoverContent>
        </Popover>
        </div>

        {/* ── Right side ── */}
        <div className="flex items-center gap-2 shrink-0">
        {/* Today */}
        <Button variant="outline" size="sm" onClick={() => scrollToTodayRef.current?.()} title="Scroll to today">
          <CalendarDays className="h-4 w-4" />
        </Button>

        {/* Zoom out */}
        <Button variant="outline" size="sm" onClick={() => stepZoom(1 / 1.3)} title="Zoom out">
          <ZoomOut className="h-4 w-4" />
        </Button>

        {/* Zoom in */}
        <Button variant="outline" size="sm" onClick={() => stepZoom(1.3)} title="Zoom in">
          <ZoomIn className="h-4 w-4" />
        </Button>

        {/* Add Event */}
        <Button size="sm" onClick={handleAddEvent}>
          <Plus className="h-4 w-4 mr-1" />
          Event
        </Button>

        {/* Three-dot overflow menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="px-2">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="max-h-[70vh] overflow-y-auto">
              <DropdownMenuItem onClick={handleAddLane}>
                <Layers className="h-4 w-4 mr-2" />
                Add Lane
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSearchOpen(true)}>
                <Search className="h-4 w-4 mr-2" />
                Search Events
              </DropdownMenuItem>
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
                  className={skinId === s.id ? 'font-semibold' : ''}
                >
                  {s.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              {/* Import */}
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
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSignUpWithTimeline}>
                Sign up with this timeline →
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <TimelineContainer
          lanes={lanes}
          events={displayedEvents}
          yearStart={yearStart}
          yearEnd={yearEnd}
          pixelsPerYear={pixelsPerYear}
          onZoom={setPixelsPerYear}
          dataYearMin={dataYearMin}
          dataYearMax={dataYearMax}
          onToggleVisibility={toggleLaneVisibility}
          onMoveLane={moveLane}
          onEditLane={handleEditLane}
          onDeleteLane={handleDeleteLane}
          onEventClick={handleEventClick}
          onLaneClick={handleLaneClick}
          onLaneDragRange={handleLaneDragRange}
          onEventDrop={handleEventDrop}
          personaEvents={activePersonaEvents}
          personas={personas}
          personaDisplayModes={personaDisplayModes}
          scrollToTodayRef={scrollToTodayRef}
          scrollToEventRef={scrollToEventRef}
          lifeSpan={{ birthYear: 1980, endYear: null }}
          overlayEvents={[]}
          overlayDisplayModes={new Map()}
          activeOverlayTimelines={[]}
        />
      </div>

      {popover && (
        <EventPopover
          event={popover.event}
          anchorEl={popover.anchor}
          anchorX={popover.x}
          anchorY={popover.y}
          laneEmoji={lanes.find(l => l.id === popover.event.laneId)?.emoji}
          laneName={lanes.find(l => l.id === popover.event.laneId)?.name ?? ''}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
          onClose={() => setPopover(null)}
        />
      )}

      <EventDialog open={eventDialogOpen} onOpenChange={setEventDialogOpen} lanes={lanes} editingEvent={editingEvent} onSave={handleSaveEvent} defaultLaneId={defaultLaneId} defaultStartYear={defaultStartYear} defaultEndYear={defaultEndYear} />
      <LaneDialog open={laneDialogOpen} onOpenChange={setLaneDialogOpen} editingLane={editingLane} onSave={handleSaveLane} />
      <DeleteConfirmDialog open={deleteDialog.open} onOpenChange={open => setDeleteDialog(p => ({ ...p, open }))} title={deleteDialog.title} description={deleteDialog.description} onConfirm={deleteDialog.onConfirm} />
      <SkinDialog open={skinDialogOpen} onOpenChange={setSkinDialogOpen} />
      <ImportDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} defaultTab={importTab} lanes={lanes} addEvent={addEvent} addLane={addLane} />
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} events={events} lanes={lanes} onNavigate={handleSearchNavigate} />
    </div>
  )
}

export function DemoTimelineView({ onSignUpWithTimeline }: DemoTimelineViewProps) {
  return (
    <TooltipProvider>
      <UiSizeProvider storageKey="ui-size-demo" initialSize="small">
        <DemoTimelineViewInner onSignUpWithTimeline={onSignUpWithTimeline} />
      </UiSizeProvider>
    </TooltipProvider>
  )
}
