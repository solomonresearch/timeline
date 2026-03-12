import { useState, useEffect, useCallback, useMemo } from 'react'
import { fetchPublicProfile } from '@/lib/api'
import type { OverlayTimelineEvent, DbTimeline } from '@/types/database'
import { dateToFracYear } from '@/lib/constants'
import { useTimelineContext } from '@/contexts/TimelineContext'
import type { OverlayDisplayMode } from '@/hooks/useTimelineOverlays'

const STORAGE_KEY = 'ext_overlays_v1'
const ACTIVE_KEY = 'ext_overlays_active_v1'
const ALIGNED_KEY = 'ext_overlays_aligned_v1'
const MODES_KEY = 'ext_overlays_modes_v1'

export interface ExternalOverlayInfo {
  username: string
  timelineId: string
  timelineName: string
  displayName: string
  startYear: number | null
}

type PublicEvent = { id: string; lane_id: string; timeline_id: string; title: string; description: string; start_time: string; end_time: string | null; color: string | null; emoji: string | null }
type PublicLane = { id: string; timeline_id: string; name: string; color: string; emoji: string | null; order: number }

function loadJson<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); if (r) return JSON.parse(r) as T } catch {}
  return fallback
}
function saveJson(key: string, val: unknown) { localStorage.setItem(key, JSON.stringify(val)) }

export function useExternalOverlays() {
  const { timelines, selectedTimelineId } = useTimelineContext()
  const mainTimeline = timelines.find(t => t.id === selectedTimelineId)

  const [stored, setStored] = useState<ExternalOverlayInfo[]>(() => loadJson(STORAGE_KEY, []))
  const [activeIds, setActiveIds] = useState<Set<string>>(() => new Set(loadJson<string[]>(ACTIVE_KEY, [])))
  const [alignedIds, setAlignedIds] = useState<Set<string>>(() => new Set(loadJson<string[]>(ALIGNED_KEY, [])))
  const [displayModes, setDisplayModesState] = useState<Map<string, OverlayDisplayMode>>(
    () => new Map(loadJson<[string, OverlayDisplayMode][]>(MODES_KEY, []))
  )
  const [fetchedData, setFetchedData] = useState<Map<string, { lanes: PublicLane[]; events: PublicEvent[] }>>(new Map())

  // Fetch data for active overlays not yet loaded
  useEffect(() => {
    for (const id of activeIds) {
      if (fetchedData.has(id)) continue
      const info = stored.find(s => s.timelineId === id)
      if (!info) continue
      fetchPublicProfile(info.username).then(result => {
        if (!result) return
        const lanes = result.lanes.filter(l => l.timeline_id === id)
        const events = result.events.filter(e => e.timeline_id === id)
        setFetchedData(prev => { const next = new Map(prev); next.set(id, { lanes, events }); return next })
      })
    }
  }, [activeIds, fetchedData, stored])

  const externalOverlayEvents = useMemo(() => {
    const result: OverlayTimelineEvent[] = []
    for (const id of activeIds) {
      const data = fetchedData.get(id)
      if (!data) continue
      const info = stored.find(s => s.timelineId === id)
      if (!info) continue
      const laneNameMap = new Map<string, string>()
      for (const lane of data.lanes) laneNameMap.set(lane.id, lane.name)
      let offset = 0
      if (alignedIds.has(id)) {
        const mainStart = mainTimeline?.start_year
        const extStart = info.startYear
        if (mainStart != null && extStart != null) offset = mainStart - extStart
      }
      for (const event of data.events) {
        const laneName = laneNameMap.get(event.lane_id) ?? ''
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
  }, [activeIds, fetchedData, stored, alignedIds, mainTimeline])

  // Fake DbTimeline objects for the overlay renderer (needs id, name, emoji, + all DbTimeline fields)
  const externalOverlayTimelines = useMemo(() =>
    stored.filter(s => activeIds.has(s.timelineId)).map(s => ({
      id: s.timelineId,
      user_id: '',
      name: `${s.displayName} / ${s.timelineName}`,
      emoji: null as string | null,
      start_year: s.startYear,
      end_year: null as number | null,
      color: null as string | null,
      visibility: 'public',
      created_at: '',
      updated_at: '',
    } satisfies DbTimeline)),
    [stored, activeIds]
  )

  const addExternalOverlay = useCallback((info: ExternalOverlayInfo) => {
    setStored(prev => {
      if (prev.find(s => s.timelineId === info.timelineId)) return prev
      const next = [...prev, info]; saveJson(STORAGE_KEY, next); return next
    })
    setActiveIds(prev => { const next = new Set(prev); next.add(info.timelineId); saveJson(ACTIVE_KEY, [...next]); return next })
    setDisplayModesState(prev => {
      const next = new Map(prev)
      if (!next.has(info.timelineId)) next.set(info.timelineId, 'separate')
      saveJson(MODES_KEY, [...next.entries()]); return next
    })
  }, [])

  const removeExternalOverlay = useCallback((timelineId: string) => {
    setStored(prev => { const next = prev.filter(s => s.timelineId !== timelineId); saveJson(STORAGE_KEY, next); return next })
    setActiveIds(prev => { const next = new Set(prev); next.delete(timelineId); saveJson(ACTIVE_KEY, [...next]); return next })
    setAlignedIds(prev => { const next = new Set(prev); next.delete(timelineId); saveJson(ALIGNED_KEY, [...next]); return next })
    setDisplayModesState(prev => { const next = new Map(prev); next.delete(timelineId); saveJson(MODES_KEY, [...next.entries()]); return next })
    setFetchedData(prev => { const next = new Map(prev); next.delete(timelineId); return next })
  }, [])

  const toggleActive = useCallback((timelineId: string) => {
    setActiveIds(prev => { const next = new Set(prev); if (next.has(timelineId)) next.delete(timelineId); else next.add(timelineId); saveJson(ACTIVE_KEY, [...next]); return next })
  }, [])

  const toggleAlignment = useCallback((timelineId: string) => {
    setAlignedIds(prev => { const next = new Set(prev); if (next.has(timelineId)) next.delete(timelineId); else next.add(timelineId); saveJson(ALIGNED_KEY, [...next]); return next })
  }, [])

  const setDisplayMode = useCallback((timelineId: string, mode: OverlayDisplayMode) => {
    setDisplayModesState(prev => { const next = new Map(prev); next.set(timelineId, mode); saveJson(MODES_KEY, [...next.entries()]); return next })
  }, [])

  return { stored, activeIds, alignedIds, displayModes, externalOverlayEvents, externalOverlayTimelines, addExternalOverlay, removeExternalOverlay, toggleActive, toggleAlignment, setDisplayMode }
}
