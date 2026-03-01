import { useState, useCallback } from 'react'
import type { Lane, TimelineEvent } from '@/types/timeline'
import { useTimelineContext, TimelineProvider } from '@/contexts/TimelineContext'
import { useAuth } from '@/contexts/AuthContext'
import { usePersonas } from '@/hooks/usePersonas'
import { useProfile } from '@/hooks/useProfile'
import { Toolbar } from '@/components/Toolbar'
import { TimelineContainer } from '@/components/timeline/TimelineContainer'
import { EventPopover } from '@/components/EventPopover'
import { EventDialog } from '@/components/dialogs/EventDialog'
import { LaneDialog } from '@/components/dialogs/LaneDialog'
import { DeleteConfirmDialog } from '@/components/dialogs/DeleteConfirmDialog'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthPage } from '@/components/auth/AuthPage'
import { UpdatePasswordForm } from '@/components/auth/UpdatePasswordForm'

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
  } = usePersonas(profile?.birth_year ?? null)

  // Popover state
  const [popover, setPopover] = useState<{ event: TimelineEvent; anchor: HTMLElement } | null>(null)

  // Event dialog state
  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null)
  const [defaultLaneId, setDefaultLaneId] = useState<string | undefined>()
  const [defaultStartYear, setDefaultStartYear] = useState<number | undefined>()

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
  const handleEventClick = useCallback((event: TimelineEvent, element: HTMLElement) => {
    setPopover({ event, anchor: element })
  }, [])

  // Toolbar -> Add Event
  const handleAddEvent = useCallback(() => {
    setEditingEvent(null)
    setDefaultLaneId(undefined)
    setDefaultStartYear(undefined)
    setEventDialogOpen(true)
  }, [])

  // Toolbar -> Add Lane
  const handleAddLane = useCallback(() => {
    setEditingLane(null)
    setLaneDialogOpen(true)
  }, [])

  // Click on lane -> Add Event with pre-filled lane + year
  const handleLaneClick = useCallback((laneId: string, year: number) => {
    setEditingEvent(null)
    setDefaultLaneId(laneId)
    setDefaultStartYear(year)
    setEventDialogOpen(true)
  }, [])

  // Popover -> Edit
  const handleEditEvent = useCallback((event: TimelineEvent) => {
    setPopover(null)
    setEditingEvent(event)
    setDefaultLaneId(undefined)
    setDefaultStartYear(undefined)
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
        />
        <TimelineContainer
          lanes={lanes}
          events={events}
          yearStart={yearStart}
          yearEnd={yearEnd}
          pixelsPerYear={pixelsPerYear}
          dataYearMin={dataYearMin}
          dataYearMax={dataYearMax}
          onToggleVisibility={toggleLaneVisibility}
          onEditLane={handleEditLane}
          onDeleteLane={handleDeleteLane}
          onEventClick={handleEventClick}
          onLaneClick={handleLaneClick}
          personaEvents={activePersonaEvents}
          personas={personas}
        />

        {/* Event popover */}
        {popover && (
          <EventPopover
            event={popover.event}
            anchorEl={popover.anchor}
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
