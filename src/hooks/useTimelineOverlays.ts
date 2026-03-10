import { useState, useEffect, useCallback, useMemo } from 'react'
import { fetchLanes, fetchEvents } from '@/lib/api'
import type { DbLane, DbEvent, OverlayTimelineEvent } from '@/types/database'
import { dateToFracYear } from '@/lib/constants'
import { useTimelineContext } from '@/contexts/TimelineContext'

const ACTIVE_OVERLAYS_KEY = 'timeline_active_overlays'
const DISPLAY_MODES_KEY = 'timeline_overlay_display_modes'
const ALIGNED_OVERLAYS_KEY = 'timeline_overlay_aligned'

export type OverlayDisplayMode = 'integrated' | 'separate'

function loadActiveIds(): Set<string> {
  try {
    const raw = localStorage.getItem(ACTIVE_OVERLAYS_KEY)
    if (raw) return new Set(JSON.parse(raw) as string[])
  } catch { /* ignore */ }
  return new Set()
}

function saveActiveIds(ids: Set<string>) {
  localStorage.setItem(ACTIVE_OVERLAYS_KEY, JSON.stringify([...ids]))
}

function loadDisplayModes(): Map<string, OverlayDisplayMode> {
  try {
    const raw = localStorage.getItem(DISPLAY_MODES_KEY)
    if (raw) return new Map(JSON.parse(raw) as [string, OverlayDisplayMode][])
  } catch { /* ignore */ }
  return new Map()
}

function saveDisplayModes(modes: Map<string, OverlayDisplayMode>) {
  localStorage.setItem(DISPLAY_MODES_KEY, JSON.stringify([...modes.entries()]))
}

function loadAlignedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(ALIGNED_OVERLAYS_KEY)
    if (raw) return new Set(JSON.parse(raw) as string[])
  } catch { /* ignore */ }
  return new Set()
}

function saveAlignedIds(ids: Set<string>) {
  localStorage.setItem(ALIGNED_OVERLAYS_KEY, JSON.stringify([...ids]))
}

export function useTimelineOverlays() {
  const { timelines, selectedTimelineId } = useTimelineContext()

  const mainTimeline = timelines.find(t => t.id === selectedTimelineId)
  const otherTimelines = useMemo(
    () => timelines.filter(t => t.id !== selectedTimelineId),
    [timelines, selectedTimelineId],
  )

  const [activeOverlayIds, setActiveOverlayIds] = useState<Set<string>>(loadActiveIds)
  const [overlayAlignedIds, setOverlayAlignedIds] = useState<Set<string>>(loadAlignedIds)
  const [overlayDisplayModes, setOverlayDisplayModesState] = useState<Map<string, OverlayDisplayMode>>(loadDisplayModes)

  // Raw data per overlay timeline
  const [overlayData, setOverlayData] = useState<Map<string, { lanes: DbLane[]; events: DbEvent[] }>>(new Map())

  // Effective active IDs: never include the currently selected timeline
  const effectiveActiveIds = useMemo(() => {
    const s = new Set(activeOverlayIds)
    if (selectedTimelineId) s.delete(selectedTimelineId)
    return s
  }, [activeOverlayIds, selectedTimelineId])

  // Fetch data for newly activated overlays
  useEffect(() => {
    for (const id of effectiveActiveIds) {
      if (!overlayData.has(id)) {
        Promise.all([fetchLanes(id), fetchEvents(id)]).then(([lanes, events]) => {
          setOverlayData(prev => {
            const next = new Map(prev)
            next.set(id, { lanes, events })
            return next
          })
        })
      }
    }
  }, [effectiveActiveIds, overlayData])

  // Compute aligned display events
  const activeOverlayEvents = useMemo(() => {
    const result: OverlayTimelineEvent[] = []
    for (const id of effectiveActiveIds) {
      const data = overlayData.get(id)
      if (!data) continue
      const timeline = otherTimelines.find(t => t.id === id)
      if (!timeline) continue

      // lane_id → lane_name for this overlay timeline
      const laneNameMap = new Map<string, string>()
      for (const lane of data.lanes) laneNameMap.set(lane.id, lane.name)

      // Alignment offset (shift other timeline's start_year to align with main)
      let offset = 0
      if (overlayAlignedIds.has(id)) {
        const mainStart = mainTimeline?.start_year
        const otherStart = timeline.start_year
        if (mainStart != null && otherStart != null) {
          offset = mainStart - otherStart
        }
      }

      for (const event of data.events) {
        const laneName = laneNameMap.get(event.lane_id)
        if (!laneName) continue
        const startYear = dateToFracYear(new Date(event.start_time))
        const endYear = event.end_time != null ? dateToFracYear(new Date(event.end_time)) : null
        result.push({
          id: event.id,
          timeline_id: id,
          lane_name: laneName,
          title: event.title,
          description: event.description,
          type: endYear != null ? 'range' : 'point',
          start_year: startYear,
          end_year: endYear,
          color: event.color,
          display_start_year: startYear + offset,
          display_end_year: endYear != null ? endYear + offset : null,
        })
      }
    }
    return result
  }, [effectiveActiveIds, overlayData, otherTimelines, mainTimeline, overlayAlignedIds])

  const toggleOverlay = useCallback((timelineId: string) => {
    setActiveOverlayIds(prev => {
      const next = new Set(prev)
      if (next.has(timelineId)) {
        next.delete(timelineId)
      } else {
        next.add(timelineId)
        // Auto-align on first activation
        setOverlayAlignedIds(prevAligned => {
          if (prevAligned.has(timelineId)) return prevAligned
          const nextAligned = new Set(prevAligned)
          nextAligned.add(timelineId)
          saveAlignedIds(nextAligned)
          return nextAligned
        })
      }
      saveActiveIds(next)
      return next
    })
  }, [])

  const toggleOverlayAlignment = useCallback((timelineId: string) => {
    setOverlayAlignedIds(prev => {
      const next = new Set(prev)
      if (next.has(timelineId)) next.delete(timelineId)
      else next.add(timelineId)
      saveAlignedIds(next)
      return next
    })
  }, [])

  const setOverlayDisplayMode = useCallback((timelineId: string, mode: OverlayDisplayMode) => {
    setOverlayDisplayModesState(prev => {
      const next = new Map(prev)
      next.set(timelineId, mode)
      saveDisplayModes(next)
      return next
    })
  }, [])

  const activeOverlayTimelines = useMemo(
    () => otherTimelines.filter(t => effectiveActiveIds.has(t.id)),
    [otherTimelines, effectiveActiveIds],
  )

  return {
    otherTimelines,
    activeOverlayIds: effectiveActiveIds,
    toggleOverlay,
    overlayAlignedIds,
    toggleOverlayAlignment,
    overlayDisplayModes,
    setOverlayDisplayMode,
    activeOverlayEvents,
    activeOverlayTimelines,
  }
}
