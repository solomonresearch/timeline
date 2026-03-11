import { useState, useEffect, useCallback } from 'react'
import type { Lane, TimelineEvent } from '@/types/timeline'
import {
  fetchLanes,
  fetchEvents,
  insertLane,
  updateLaneDb,
  deleteLaneDb,
  insertEvent,
  updateEventDb,
  deleteEventDb,
  mapDbLane,
  mapDbEvent,
  fracYearToDbTime,
} from '@/lib/api'
import {
  DEFAULT_PIXELS_PER_YEAR,
  TIMELINE_YEAR_MIN,
  TIMELINE_YEAR_MAX,
} from '@/lib/constants'

export function useSupabaseTimeline(timelineId: string | null) {
  const [lanes, setLanes] = useState<Lane[]>([])
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [pixelsPerYear, setPixelsPerYear] = useState(DEFAULT_PIXELS_PER_YEAR)
  const [loading, setLoading] = useState(false)

  // Fixed full range for the timeline canvas
  const yearStart = TIMELINE_YEAR_MIN
  const yearEnd = TIMELINE_YEAR_MAX

  // Compute data range from events (for scroll-to-center)
  const allYears = events.flatMap(e =>
    e.endYear != null ? [e.startYear, e.endYear] : [e.startYear],
  )
  const dataYearMin = allYears.length > 0 ? Math.floor(Math.min(...allYears)) - 2 : 1990
  const dataYearMax = allYears.length > 0 ? Math.ceil(Math.max(...allYears)) + 2 : 2026

  // Fetch lanes + events when timeline changes
  useEffect(() => {
    if (!timelineId) {
      setLanes([])
      setEvents([])
      return
    }

    let cancelled = false
    setLoading(true)

    async function load() {
      const [dbLanes, dbEvents] = await Promise.all([
        fetchLanes(timelineId!),
        fetchEvents(timelineId!),
      ])
      if (cancelled) return
      setLanes(dbLanes.map(mapDbLane))
      setEvents(dbEvents.map(mapDbEvent))
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [timelineId])

  // ---- Event CRUD ----

  const addEvent = useCallback(
    async (event: Omit<TimelineEvent, 'id'>) => {
      if (!timelineId) return null
      // Optimistic: add with temp id
      const tempId = `temp-${Date.now()}`
      const optimistic: TimelineEvent = { ...event, id: tempId }
      setEvents(prev => [...prev, optimistic])

      const dbRow = await insertEvent(timelineId, {
        lane_id: event.laneId,
        title: event.title,
        description: event.description,
        start_time: fracYearToDbTime(event.startYear),
        end_time: event.endYear != null ? fracYearToDbTime(event.endYear) : null,
        color: event.color,
        emoji: event.emoji,
        point_value: event.pointValue,
        value_projection: event.valueProjection,
      })

      if (dbRow) {
        const mapped = mapDbEvent(dbRow)
        setEvents(prev => prev.map(e => (e.id === tempId ? mapped : e)))
        return mapped
      } else {
        // Rollback
        setEvents(prev => prev.filter(e => e.id !== tempId))
        return null
      }
    },
    [timelineId],
  )

  const updateEvent = useCallback(
    async (id: string, updates: Partial<Omit<TimelineEvent, 'id'>>) => {
      // Optimistic update
      setEvents(prev => prev.map(e => (e.id === id ? { ...e, ...updates } : e)))

      const dbUpdates: Record<string, unknown> = {}
      if (updates.laneId !== undefined) dbUpdates.lane_id = updates.laneId
      if (updates.title !== undefined) dbUpdates.title = updates.title
      if (updates.description !== undefined) dbUpdates.description = updates.description
      if (updates.startYear !== undefined) dbUpdates.start_time = fracYearToDbTime(updates.startYear)
      if ('endYear' in updates) dbUpdates.end_time = updates.endYear != null ? fracYearToDbTime(updates.endYear) : null
      if ('color' in updates) dbUpdates.color = updates.color ?? null
      if ('emoji' in updates) dbUpdates.emoji = updates.emoji ?? null
      if ('pointValue' in updates) dbUpdates.point_value = updates.pointValue ?? null
      if ('valueProjection' in updates) dbUpdates.value_projection = updates.valueProjection ?? null

      const ok = await updateEventDb(id, dbUpdates as Parameters<typeof updateEventDb>[1])
      if (!ok) {
        // Rollback: re-fetch
        if (timelineId) {
          const dbEvents = await fetchEvents(timelineId)
          setEvents(dbEvents.map(mapDbEvent))
        }
      }
    },
    [timelineId],
  )

  const deleteEvent = useCallback(
    async (id: string) => {
      const prev = events
      setEvents(p => p.filter(e => e.id !== id))
      const ok = await deleteEventDb(id)
      if (!ok) setEvents(prev)
    },
    [events],
  )

  // ---- Lane CRUD ----

  const addLane = useCallback(
    async (lane: Omit<Lane, 'id' | 'order' | 'isDefault'>) => {
      if (!timelineId) return null
      const order = lanes.length
      const tempId = `temp-${Date.now()}`
      const optimistic: Lane = { ...lane, id: tempId, isDefault: false, order }
      setLanes(prev => [...prev, optimistic])

      const dbRow = await insertLane(timelineId, {
        name: lane.name,
        color: lane.color,
        visible: lane.visible,
        order,
      })

      if (dbRow) {
        const mapped = mapDbLane(dbRow)
        setLanes(prev => prev.map(l => (l.id === tempId ? mapped : l)))
        return mapped
      } else {
        setLanes(prev => prev.filter(l => l.id !== tempId))
        return null
      }
    },
    [timelineId, lanes.length],
  )

  const updateLane = useCallback(
    async (id: string, updates: Partial<Omit<Lane, 'id' | 'isDefault'>>) => {
      setLanes(prev => prev.map(l => (l.id === id ? { ...l, ...updates } : l)))

      const dbUpdates: Record<string, unknown> = {}
      if (updates.name !== undefined) dbUpdates.name = updates.name
      if (updates.color !== undefined) dbUpdates.color = updates.color
      if (updates.visible !== undefined) dbUpdates.visible = updates.visible
      if (updates.order !== undefined) dbUpdates.order = updates.order

      const ok = await updateLaneDb(id, dbUpdates as Parameters<typeof updateLaneDb>[1])
      if (!ok && timelineId) {
        const dbLanes = await fetchLanes(timelineId)
        setLanes(dbLanes.map(mapDbLane))
      }
    },
    [timelineId],
  )

  const deleteLane = useCallback(
    async (id: string) => {
      const prevLanes = lanes
      const prevEvents = events
      setLanes(p => p.filter(l => l.id !== id))
      setEvents(p => p.filter(e => e.laneId !== id))

      const ok = await deleteLaneDb(id)
      if (!ok) {
        setLanes(prevLanes)
        setEvents(prevEvents)
      }
    },
    [lanes, events],
  )

  const moveLane = useCallback(
    async (id: string, direction: 'up' | 'down') => {
      const sorted = [...lanes].sort((a, b) => a.order - b.order)
      const idx = sorted.findIndex(l => l.id === id)
      if (idx < 0) return
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= sorted.length) return
      const laneA = sorted[idx]
      const laneB = sorted[swapIdx]
      const orderA = laneB.order
      const orderB = laneA.order
      setLanes(prev => prev.map(l => {
        if (l.id === laneA.id) return { ...l, order: orderA }
        if (l.id === laneB.id) return { ...l, order: orderB }
        return l
      }))
      await Promise.all([
        updateLaneDb(laneA.id, { order: orderA }),
        updateLaneDb(laneB.id, { order: orderB }),
      ])
    },
    [lanes],
  )

  const toggleLaneVisibility = useCallback(
    async (id: string) => {
      const lane = lanes.find(l => l.id === id)
      if (!lane) return
      const newVisible = !lane.visible
      setLanes(prev =>
        prev.map(l => (l.id === id ? { ...l, visible: newVisible } : l)),
      )
      await updateLaneDb(id, { visible: newVisible })
    },
    [lanes],
  )

  return {
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
    loading,
  }
}
