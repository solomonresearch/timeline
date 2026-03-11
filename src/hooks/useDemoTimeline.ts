import { useState, useCallback, useEffect } from 'react'
import type { Lane, TimelineEvent } from '@/types/timeline'
import type { DbTimeline } from '@/types/database'
import { DEMO_LANES, DEMO_EVENTS } from '@/data/demoData'
import {
  TIMELINE_YEAR_MIN,
  TIMELINE_YEAR_MAX,
} from '@/lib/constants'

const STORAGE_KEY = 'timeline_demo_v1'

interface DemoState {
  lanes: Lane[]
  events: TimelineEvent[]
}

const DEMO_TIMELINE: DbTimeline = {
  id: 'demo',
  user_id: '',
  name: "Alex's Life",
  start_year: 1980,
  end_year: 2065,
  color: '#6366f1',
  emoji: '👤',
  visibility: 'public',
  created_at: '',
  updated_at: '',
}

function loadState(): DemoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DemoState
      if (Array.isArray(parsed.lanes) && Array.isArray(parsed.events)) {
        return parsed
      }
    }
  } catch {
    // ignore
  }
  return { lanes: DEMO_LANES, events: DEMO_EVENTS }
}

function saveState(state: DemoState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

export function useDemoTimeline() {
  const [lanes, setLanes] = useState<Lane[]>(() => loadState().lanes)
  const [events, setEvents] = useState<TimelineEvent[]>(() => loadState().events)
  const [pixelsPerYear, setPixelsPerYear] = useState(6) // second-furthest-out zoom

  const yearStart = TIMELINE_YEAR_MIN
  const yearEnd = TIMELINE_YEAR_MAX

  // Persist to localStorage on every change
  useEffect(() => {
    saveState({ lanes, events })
  }, [lanes, events])

  const allYears = events.flatMap(e =>
    e.endYear != null ? [e.startYear, e.endYear] : [e.startYear],
  )
  const dataYearMin = allYears.length > 0 ? Math.floor(Math.min(...allYears)) - 2 : 1990
  const dataYearMax = allYears.length > 0 ? Math.ceil(Math.max(...allYears)) + 2 : 2026

  // ---- Event CRUD ----

  const addEvent = useCallback(async (event: Omit<TimelineEvent, 'id'>): Promise<TimelineEvent | null> => {
    const newEvent: TimelineEvent = { ...event, id: crypto.randomUUID() }
    setEvents(prev => [...prev, newEvent])
    return newEvent
  }, [])

  const updateEvent = useCallback(async (id: string, updates: Partial<Omit<TimelineEvent, 'id'>>): Promise<void> => {
    setEvents(prev => prev.map(e => (e.id === id ? { ...e, ...updates } : e)))
  }, [])

  const deleteEvent = useCallback(async (id: string): Promise<void> => {
    setEvents(prev => prev.filter(e => e.id !== id))
  }, [])

  // ---- Lane CRUD ----

  const addLane = useCallback(async (lane: Omit<Lane, 'id' | 'order' | 'isDefault'>): Promise<Lane | null> => {
    const newLane: Lane = {
      ...lane,
      id: crypto.randomUUID(),
      isDefault: false,
      order: 0, // will be set below
    }
    setLanes(prev => {
      const maxOrder = prev.length > 0 ? Math.max(...prev.map(l => l.order)) : -1
      return [...prev, { ...newLane, order: maxOrder + 1 }]
    })
    return newLane
  }, [])

  const updateLane = useCallback(async (id: string, updates: Partial<Omit<Lane, 'id' | 'isDefault'>>): Promise<void> => {
    setLanes(prev => prev.map(l => (l.id === id ? { ...l, ...updates } : l)))
  }, [])

  const deleteLane = useCallback(async (id: string): Promise<void> => {
    setLanes(prev => prev.filter(l => l.id !== id))
    setEvents(prev => prev.filter(e => e.laneId !== id))
  }, [])

  const moveLane = useCallback(async (id: string, direction: 'up' | 'down'): Promise<void> => {
    setLanes(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order)
      const idx = sorted.findIndex(l => l.id === id)
      if (idx < 0) return prev
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= sorted.length) return prev
      const orderA = sorted[swapIdx].order
      const orderB = sorted[idx].order
      return prev.map(l => {
        if (l.id === sorted[idx].id) return { ...l, order: orderA }
        if (l.id === sorted[swapIdx].id) return { ...l, order: orderB }
        return l
      }).sort((a, b) => a.order - b.order)
    })
  }, [])

  const toggleLaneVisibility = useCallback(async (id: string): Promise<void> => {
    setLanes(prev => prev.map(l => (l.id === id ? { ...l, visible: !l.visible } : l)))
  }, [])

  // ---- Timeline management (noops for demo) ----

  const selectTimeline = useCallback((_id: string) => {}, [])
  const createTimeline = useCallback(async (_name?: string): Promise<string | null> => null, [])
  const updateTimeline = useCallback(async (_id: string, _updates: object): Promise<boolean> => true, [])
  const renameTimeline = useCallback(async (_id: string, _name: string): Promise<boolean> => true, [])
  const deleteTimeline = useCallback(async (_id: string): Promise<boolean> => false, [])
  const clearFirstLogin = useCallback(() => {}, [])

  return {
    // Timeline list management
    timelines: [DEMO_TIMELINE],
    selectedTimelineId: 'demo' as string | null,
    selectTimeline,
    createTimeline,
    updateTimeline,
    renameTimeline,
    deleteTimeline,
    timelinesLoading: false,
    isFirstLogin: false,
    clearFirstLogin,

    // Active timeline data
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
    dataLoading: false,
  }
}
