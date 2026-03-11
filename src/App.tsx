import { useState, useCallback, useSyncExternalStore, useRef, useMemo } from 'react'
import type { Lane, TimelineEvent } from '@/types/timeline'
import { useTimelineContext, TimelineProvider } from '@/contexts/TimelineContext'
import { useAuth } from '@/contexts/AuthContext'
import { usePersonas } from '@/hooks/usePersonas'
import { useTimelineOverlays } from '@/hooks/useTimelineOverlays'
import { useProfile } from '@/hooks/useProfile'
import { isOpenAIConfigured } from '@/lib/openai'
import { OnboardingQuestionnaire } from '@/components/onboarding/OnboardingQuestionnaire'
import { Toolbar, type AppView } from '@/components/Toolbar'
import { TimelineContainer } from '@/components/timeline/TimelineContainer'
import { TimelineOverview } from '@/components/TimelineOverview'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { EventPopover } from '@/components/EventPopover'
import { EventDialog } from '@/components/dialogs/EventDialog'
import { LaneDialog } from '@/components/dialogs/LaneDialog'
import { DeleteConfirmDialog } from '@/components/dialogs/DeleteConfirmDialog'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthPage } from '@/components/auth/AuthPage'
import { UpdatePasswordForm } from '@/components/auth/UpdatePasswordForm'
import { UiSizeProvider } from '@/contexts/UiSizeContext'
import { SkinProvider } from '@/contexts/SkinContext'

// Lightweight URL-based routing (no dependency needed)
function getViewFromPath(): AppView {
  const p = window.location.pathname
  if (p === '/kanban') return 'kanban'
  if (p === '/overview') return 'overview'
  return 'timeline'
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
    const path = v === 'kanban' ? '/kanban' : v === 'overview' ? '/overview' : '/'
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
    moveLane,
    toggleLaneVisibility,
    timelines,
    selectedTimelineId,
    isFirstLogin,
    clearFirstLogin,
  } = useTimelineContext()

  const selectedTimeline = timelines.find(t => t.id === selectedTimelineId)
  const timelineMeta = selectedTimeline?.start_year != null && selectedTimeline?.end_year != null
    ? { startYear: selectedTimeline.start_year, endYear: selectedTimeline.end_year, color: selectedTimeline.color ?? '#3b82f6' }
    : undefined

  const { user } = useAuth()
  const { profile } = useProfile()

  const birthYear = profile?.birth_year
    ?? (profile?.birth_date ? new Date(profile.birth_date).getUTCFullYear() : null)

  const onboardingKey = user ? `timeline_onboarding_complete_${user.id}` : ''
  const [showQuestionnaire, setShowQuestionnaire] = useState(() => {
    if (!isFirstLogin) return false
    if (!isOpenAIConfigured()) return false
    if (onboardingKey && localStorage.getItem(onboardingKey)) return false
    return true
  })

  // Show questionnaire when isFirstLogin becomes true after initial render
  const prevFirstLoginRef = useRef(isFirstLogin)
  if (isFirstLogin && !prevFirstLoginRef.current && isOpenAIConfigured() && !localStorage.getItem(onboardingKey)) {
    prevFirstLoginRef.current = true
    // Schedule state update
    setTimeout(() => setShowQuestionnaire(true), 0)
  }

  const handleQuestionnaireComplete = useCallback(() => {
    if (onboardingKey) localStorage.setItem(onboardingKey, '1')
    clearFirstLogin()
    setShowQuestionnaire(false)
  }, [onboardingKey, clearFirstLogin])

  const {
    personas,
    activePersonaEvents,
    activePersonaIds,
    togglePersona,
    alignedPersonaIds,
    togglePersonaAlignment,
    personaDisplayModes,
    setPersonaDisplayMode,
  } = usePersonas(birthYear)

  const {
    activeOverlayIds,
    toggleOverlay,
    overlayAlignedIds,
    toggleOverlayAlignment,
    overlayDisplayModes,
    setOverlayDisplayMode,
    activeOverlayEvents,
    activeOverlayTimelines,
  } = useTimelineOverlays()

  // URL-synced view state
  const [activeView, setActiveView] = useAppView()

  const scrollToTodayRef = useRef<(() => void) | null>(null)
  const scrollToEventRef = useRef<((event: TimelineEvent) => void) | null>(null)

  // Max-events filter: show the N longest-duration events (point events have duration 0)
  const [maxEvents, setMaxEvents] = useState(100)
  const [navigatedEventId, setNavigatedEventId] = useState<string | null>(null)
  const displayedEvents = useMemo(() => {
    const sorted = [...events].sort((a, b) => {
      const durA = a.type === 'range' && a.endYear != null ? a.endYear - a.startYear : 0
      const durB = b.type === 'range' && b.endYear != null ? b.endYear - b.startYear : 0
      return durB - durA
    })
    const top = sorted.slice(0, Math.max(1, maxEvents))
    // Always include an event the user navigated to, even if outside the limit
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

  // Drag-drop: move or extend event
  const handleEventDrop = useCallback((eventId: string, newLaneId: string, newStartYear: number, newEndYear: number | undefined) => {
    updateEvent(eventId, { laneId: newLaneId, startYear: newStartYear, ...(newEndYear !== undefined ? { endYear: newEndYear } : { endYear: undefined }) })
  }, [updateEvent])

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
      {showQuestionnaire && birthYear && (
        <OnboardingQuestionnaire
          lanes={lanes}
          addEvent={addEvent}
          birthYear={birthYear}
          onComplete={handleQuestionnaireComplete}
          onSkip={handleQuestionnaireComplete}
        />
      )}
      <div className="flex flex-col h-screen bg-background">
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
          activeView={activeView}
          onSetActiveView={setActiveView}
          onScrollToToday={() => scrollToTodayRef.current?.()}
          lanes={lanes}
          events={events}
          addEvent={addEvent}
          addLane={addLane}
          maxEvents={maxEvents}
          onMaxEventsChange={setMaxEvents}
          onSearchNavigate={handleSearchNavigate}
          activeOverlayIds={activeOverlayIds}
          onToggleOverlay={toggleOverlay}
          overlayAlignedIds={overlayAlignedIds}
          onToggleOverlayAlignment={toggleOverlayAlignment}
          overlayDisplayModes={overlayDisplayModes}
          onSetOverlayDisplayMode={setOverlayDisplayMode}
        />

        {activeView === 'overview' ? (
          <TimelineOverview onSelectTimeline={() => setActiveView('timeline')} selectedTimelineEvents={events} />
        ) : activeView === 'timeline' ? (
          <>
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
              timelineMeta={timelineMeta}
              overlayEvents={activeOverlayEvents}
              overlayDisplayModes={overlayDisplayModes}
              activeOverlayTimelines={activeOverlayTimelines}
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
    <SkinProvider>
      <UiSizeProvider>
        <TimelineProvider>
          <TimelineView />
        </TimelineProvider>
      </UiSizeProvider>
    </SkinProvider>
  )
}

export default App
