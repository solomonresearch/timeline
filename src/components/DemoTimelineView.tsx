import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import type { Lane, TimelineEvent } from '@/types/timeline'
import { useTimelineContext } from '@/contexts/TimelineContext'
import { usePersonas } from '@/hooks/usePersonas'
import { TimelineContainer } from '@/components/timeline/TimelineContainer'
import { Toolbar } from '@/components/Toolbar'
import { EventDialog } from '@/components/dialogs/EventDialog'
import { LaneDialog } from '@/components/dialogs/LaneDialog'
import { DeleteConfirmDialog } from '@/components/dialogs/DeleteConfirmDialog'
import { EventPopover } from '@/components/EventPopover'
import { TooltipProvider } from '@/components/ui/tooltip'
import { UiSizeProvider } from '@/contexts/UiSizeContext'
import { Button } from '@/components/ui/button'


interface DemoTimelineViewProps {
  onSignUpWithTimeline: () => void
}

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

  // Alex Weber's birth year for persona alignment
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

  // Pre-activate Einstein with alignment on first load (when no personas are active yet)
  const einsteinInitRef = useRef(false)
  useEffect(() => {
    if (einsteinInitRef.current) return
    if (personas.length === 0) return
    einsteinInitRef.current = true
    if (activePersonaIds.size > 0) return // user already has choices
    const einstein = personas.find(p => p.name.toLowerCase().includes('einstein'))
    if (einstein && !activePersonaIds.has(einstein.id)) {
      togglePersona(einstein.id)
    }
  }, [personas, activePersonaIds, togglePersona])

  const scrollToTodayRef = useRef<(() => void) | null>(null)
  const scrollToEventRef = useRef<((event: TimelineEvent) => void) | null>(null)

  const [maxEvents, setMaxEvents] = useState(100)
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

  const handleSaveLane = useCallback((data: { name: string; color: string; visible: boolean; emoji?: string; visibility: string }) => {
    if (editingLane) updateLane(editingLane.id, data); else addLane(data)
  }, [editingLane, updateLane, addLane])

  const signUpButton = (
    <Button size="sm" onClick={onSignUpWithTimeline} className="shrink-0">
      Sign up with this timeline →
    </Button>
  )

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <Toolbar
        pixelsPerYear={pixelsPerYear}
        onPixelsPerYearChange={setPixelsPerYear}
        onAddEvent={handleAddEvent}
        onAddLane={handleAddLane}
        personas={personas}
        activePersonaIds={activePersonaIds}
        onTogglePersona={togglePersona}
        alignedPersonaIds={alignedPersonaIds}
        onTogglePersonaAlignment={togglePersonaAlignment}
        personaDisplayModes={personaDisplayModes}
        onSetPersonaDisplayMode={setPersonaDisplayMode}
        activeView="timeline"
        onSetActiveView={() => {}}
        onScrollToToday={() => scrollToTodayRef.current?.()}
        lanes={lanes}
        events={events}
        addEvent={addEvent}
        addLane={addLane}
        maxEvents={maxEvents}
        onMaxEventsChange={setMaxEvents}
        onSearchNavigate={handleSearchNavigate}
        activeOverlayIds={new Set()}
        onToggleOverlay={() => {}}
        overlayAlignedIds={new Set()}
        onToggleOverlayAlignment={() => {}}
        overlayDisplayModes={new Map()}
        onSetOverlayDisplayMode={() => {}}
        showUserMenu={false}
        extraActions={signUpButton}
      />

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
