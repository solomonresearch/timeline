import { createContext, useContext } from 'react'
import type { Lane, TimelineEvent } from '@/types/timeline'
import type { DbTimeline } from '@/types/database'
import { useTimelines } from '@/hooks/useTimelines'
import { useSupabaseTimeline } from '@/hooks/useSupabaseTimeline'

interface TimelineContextType {
  // Timeline list
  timelines: DbTimeline[]
  selectedTimelineId: string | null
  selectTimeline: (id: string) => void
  createTimeline: (name?: string, emoji?: string, color?: string, withDefaultLanes?: boolean) => Promise<string | null>
  copyTimelineData: (sourceId: string, destId: string, options: { laneIds?: string[]; eventFilter?: 'all' | 'past_current' | 'none'; perLaneEventFilter?: Record<string, 'all' | 'past_current' | 'none'> }) => Promise<boolean>
  updateTimeline: (id: string, updates: { name?: string; start_year?: number | null; end_year?: number | null; color?: string | null; emoji?: string | null; visibility?: string }) => Promise<boolean>
  renameTimeline: (id: string, name: string) => Promise<boolean>
  deleteTimeline: (id: string) => Promise<boolean>
  timelinesLoading: boolean
  isFirstLogin: boolean
  clearFirstLogin: () => void

  // Active timeline data
  lanes: Lane[]
  events: TimelineEvent[]
  pixelsPerYear: number
  setPixelsPerYear: (v: number) => void
  yearStart: number
  yearEnd: number
  dataYearMin: number
  dataYearMax: number
  addEvent: (event: Omit<TimelineEvent, 'id'>) => Promise<TimelineEvent | null>
  updateEvent: (id: string, updates: Partial<Omit<TimelineEvent, 'id'>>) => Promise<void>
  deleteEvent: (id: string) => Promise<void>
  addLane: (lane: Omit<Lane, 'id' | 'order' | 'isDefault'>) => Promise<Lane | null>
  updateLane: (id: string, updates: Partial<Omit<Lane, 'id' | 'isDefault'>>) => Promise<void>
  deleteLane: (id: string) => Promise<void>
  moveLane: (id: string, direction: 'up' | 'down') => Promise<void>
  toggleLaneVisibility: (id: string) => Promise<void>
  refreshTimeline: () => void
  dataLoading: boolean
}

export const TimelineContext = createContext<TimelineContextType | null>(null)

export function TimelineProvider({ children }: { children: React.ReactNode }) {
  const {
    timelines,
    selectedTimelineId,
    selectTimeline,
    createTimeline,
    copyTimelineData,
    updateTimeline,
    renameTimeline,
    deleteTimeline,
    loading: timelinesLoading,
    isFirstLogin,
    clearFirstLogin,
  } = useTimelines()

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
    refreshTimeline,
    loading: dataLoading,
  } = useSupabaseTimeline(selectedTimelineId)

  return (
    <TimelineContext.Provider
      value={{
        timelines,
        selectedTimelineId,
        selectTimeline,
        createTimeline,
        copyTimelineData,
        updateTimeline,
        renameTimeline,
        deleteTimeline,
        timelinesLoading,
        isFirstLogin,
        clearFirstLogin,
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
        refreshTimeline,
        dataLoading,
      }}
    >
      {children}
    </TimelineContext.Provider>
  )
}

export function useTimelineContext() {
  const context = useContext(TimelineContext)
  if (!context) {
    throw new Error('useTimelineContext must be used within a TimelineProvider')
  }
  return context
}
