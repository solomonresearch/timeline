import { useState, useCallback } from 'react'
import type { Lane, TimelineEvent } from '@/types/timeline'
import { defaultLanes, seedEvents } from '@/data/seedData'

let nextId = 100

function genId() {
  return `id-${nextId++}`
}

export function useTimeline() {
  const [lanes, setLanes] = useState<Lane[]>(defaultLanes)
  const [events, setEvents] = useState<TimelineEvent[]>(seedEvents)
  const [pixelsPerYear, setPixelsPerYear] = useState(80)

  const yearStart = 1988
  const yearEnd = 2028

  // Event CRUD
  const addEvent = useCallback((event: Omit<TimelineEvent, 'id'>) => {
    const newEvent = { ...event, id: genId() }
    setEvents(prev => [...prev, newEvent])
    return newEvent
  }, [])

  const updateEvent = useCallback((id: string, updates: Partial<Omit<TimelineEvent, 'id'>>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
  }, [])

  const deleteEvent = useCallback((id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id))
  }, [])

  // Lane CRUD
  const addLane = useCallback((lane: Omit<Lane, 'id' | 'order' | 'isDefault'>) => {
    const newLane: Lane = {
      ...lane,
      id: genId(),
      isDefault: false,
      order: lanes.length,
    }
    setLanes(prev => [...prev, newLane])
    return newLane
  }, [lanes.length])

  const updateLane = useCallback((id: string, updates: Partial<Omit<Lane, 'id' | 'isDefault'>>) => {
    setLanes(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l))
  }, [])

  const deleteLane = useCallback((id: string) => {
    setLanes(prev => prev.filter(l => l.id !== id))
    setEvents(prev => prev.filter(e => e.laneId !== id))
  }, [])

  const toggleLaneVisibility = useCallback((id: string) => {
    setLanes(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l))
  }, [])

  return {
    lanes,
    events,
    pixelsPerYear,
    setPixelsPerYear,
    yearStart,
    yearEnd,
    addEvent,
    updateEvent,
    deleteEvent,
    addLane,
    updateLane,
    deleteLane,
    toggleLaneVisibility,
  }
}
