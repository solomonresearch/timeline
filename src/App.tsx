import { useState, useCallback, useSyncExternalStore, useRef } from 'react'
import type { Lane, TimelineEvent } from '@/types/timeline'
import { useTimelineContext, TimelineProvider } from '@/contexts/TimelineContext'
import { useAuth } from '@/contexts/AuthContext'
import { usePersonas } from '@/hooks/usePersonas'
import { useProfile } from '@/hooks/useProfile'
import { Toolbar, type AppView } from '@/components/Toolbar'
import { TimelineContainer } from '@/components/timeline/TimelineContainer'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { EventPopover } from '@/components/EventPopover'
import { EventDialog } from '@/components/dialogs/EventDialog'
import { LaneDialog } from '@/components/dialogs/LaneDialog'
import { DeleteConfirmDialog } from '@/components/dialogs/DeleteConfirmDialog'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthPage } from '@/components/auth/AuthPage'
import { UpdatePasswordForm } from '@/components/auth/UpdatePasswordForm'

// Lightweight URL-based routing (no dependency needed)
function getViewFromPath(): AppView {
  return window.location.pathname === '/kanban' ? 'kanban' : 'timeline'
}

function useAppView(): [AppView, (view: AppView) => void] {
  const view = useSyncExternalStore(
    (cb) => {
      window.addEventListener('popstate', cb)
      return () => window.removeEventListener('popstate', cb)
    },
    getViewFromPath,
  )

  const setView = useCallback((v: AppView) => {
    const path = v === 'kanban' ? '/kanban' : '/'
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path)
      // Trigger re-render via popstate
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }, [])

  return [view, setView]
}

function TimelineView() {
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
    toggleLaneVisibility,
  } = useTimelineContext()

  const { profile } = useProfile()

  const {
    personas,
    activePersonaEvents,
    activePersonaIds,
    togglePersona,
    personaDisplayModes,
    setPersonaDisplayMode,
  } = usePersonas(profile?.birth_year ?? null)

  // URL-synced view state
  const [activeView, setActiveView] = useAppView()

  const scrollToTodayRef = useRef<(() => void) | null>(null)

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
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => void
  }>({ open: false, title: '', description: '', onConfirm: () => {} })

  // Event click -> show popover
  const handleEventClick = useCallback((event: TimelineEvent, element: HTMLElement, clientX: number, clientY: number) => {
    setPopover({ event, anchor: element, x: clientX, y: clientY })
  }, [])

  // Toolbar -> Add Event
  const handleAddEvent = useCallback(() => {
    setEditingEvent(null)
    setDefaultLaneId(undefined)
    setDefaultStartYear(undefined)
    setDefaultEndYear(undefined)
    setEventDialogOpen(true)
  }, [])

  // Toolbar -> Add Lane
  const handleAddLane = useCallback(() => {
    setEditingLane(null)
    setLaneDialogOpen(true)
  }, [])

  // Click on lane -> Add point event pre-filled with lane + year
  const handleLaneClick = useCallback((laneId: string, year: number) => {
    setEditingEvent(null)
    setDefaultLaneId(laneId)
    setDefaultStartYear(year)
    setDefaultEndYear(undefined)
    setEventDialogOpen(true)
  }, [])

  // Drag on lane -> Add range event pre-filled with start + end year
  const handleLaneDragRange = useCallback((laneId: string, startYear: number, endYear: number) => {
    setEditingEvent(null)
    setDefaultLaneId(laneId)
    setDefaultStartYear(startYear)
    setDefaultEndYear(endYear)
    setEventDialogOpen(true)
  }, [])

  // Popover -> Edit
  const handleEditEvent = useCallback((event: TimelineEvent) => {
    setPopover(null)
    setEditingEvent(event)
    setDefaultLaneId(undefined)
    setDefaultStartYear(undefined)
    setDefaultEndYear(undefined)
    setEventDialogOpen(true)
  }, [])

  // Popover -> Delete
  const handleDeleteEvent = useCallback((event: TimelineEvent) => {
    setPopover(null)
    setDeleteDialog({
      open: true,
      title: 'Delete Event',
      description: `Are you sure you want to delete "${event.title}"? This action cannot be undone.`,
      onConfirm: () => {
        deleteEvent(event.id)
        setDeleteDialog(prev => ({ ...prev, open: false }))
      },
    })
  }, [deleteEvent])

  // Sidebar -> Edit Lane
  const handleEditLane = useCallback((lane: Lane) => {
    setEditingLane(lane)
    setLaneDialogOpen(true)
  }, [])

  // Sidebar -> Delete Lane
  const handleDeleteLane = useCallback((lane: Lane) => {
    setDeleteDialog({
      open: true,
      title: 'Delete Lane',
      description: `Are you sure you want to delete "${lane.name}" and all its events? This action cannot be undone.`,
      onConfirm: () => {
        deleteLane(lane.id)
        setDeleteDialog(prev => ({ ...prev, open: false }))
      },
    })
  }, [deleteLane])

  // Save event (add or update)
  const handleSaveEvent = useCallback((data: Omit<TimelineEvent, 'id'>) => {
    if (editingEvent) {
      updateEvent(editingEvent.id, data)
    } else {
      addEvent(data)
    }
  }, [editingEvent, updateEvent, addEvent])

  // Save lane (add or update)
  const handleSaveLane = useCallback((data: { name: string; color: string; visible: boolean }) => {
    if (editingLane) {
      updateLane(editingLane.id, data)
    } else {
      addLane(data)
    }
  }, [editingLane, updateLane, addLane])

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-white">
        <Toolbar
          pixelsPerYear={pixelsPerYear}
          onPixelsPerYearChange={setPixelsPerYear}
          onAddEvent={handleAddEvent}
          onAddLane={handleAddLane}
          personas={personas}
          activePersonaIds={activePersonaIds}
          onTogglePersona={togglePersona}
          personaDisplayModes={personaDisplayModes}
          onSetPersonaDisplayMode={setPersonaDisplayMode}
          activeView={activeView}
          onViewChange={setActiveView}
          onScrollToToday={() => scrollToTodayRef.current?.()}
        />

        {activeView === 'timeline' ? (
          <>
            <TimelineContainer
              lanes={lanes}
              events={events}
              yearStart={yearStart}
              yearEnd={yearEnd}
              pixelsPerYear={pixelsPerYear}
              onZoom={setPixelsPerYear}
              dataYearMin={dataYearMin}
              dataYearMax={dataYearMax}
              onToggleVisibility={toggleLaneVisibility}
              onEditLane={handleEditLane}
              onDeleteLane={handleDeleteLane}
              onEventClick={handleEventClick}
              onLaneClick={handleLaneClick}
              onLaneDragRange={handleLaneDragRange}
              personaEvents={activePersonaEvents}
              personas={personas}
              personaDisplayModes={personaDisplayModes}
              scrollToTodayRef={scrollToTodayRef}
            />

            {/* Event popover */}
            {popover && (
              <EventPopover
                event={popover.event}
                anchorEl={popover.anchor}
                anchorX={popover.x}
                anchorY={popover.y}
                laneName={lanes.find(l => l.id === popover.event.laneId)?.name ?? ''}
                onEdit={handleEditEvent}
                onDelete={handleDeleteEvent}
                onClose={() => setPopover(null)}
              />
            )}

            {/* Dialogs */}
            <EventDialog
              open={eventDialogOpen}
              onOpenChange={setEventDialogOpen}
              lanes={lanes}
              editingEvent={editingEvent}
              onSave={handleSaveEvent}
              defaultLaneId={defaultLaneId}
              defaultStartYear={defaultStartYear}
              defaultEndYear={defaultEndYear}
            />
            <LaneDialog
              open={laneDialogOpen}
              onOpenChange={setLaneDialogOpen}
              editingLane={editingLane}
              onSave={handleSaveLane}
            />
            <DeleteConfirmDialog
              open={deleteDialog.open}
              onOpenChange={open => setDeleteDialog(prev => ({ ...prev, open }))}
              title={deleteDialog.title}
              description={deleteDialog.description}
              onConfirm={deleteDialog.onConfirm}
            />
          </>
        ) : (
          <KanbanBoard />
        )}
      </div>
    </TooltipProvider>
  )
}

function App() {
  const { user, loading, isRecovery } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isRecovery) {
    return <UpdatePasswordForm />
  }

  if (!user) {
    return <AuthPage />
  }

  return (
    <TimelineProvider>
      <TimelineView />
    </TimelineProvider>
  )
}

export default App
