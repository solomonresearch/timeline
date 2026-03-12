import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  fetchTimelines,
  fetchProfile,
  createTimelineWithDefaults,
  createEmptyTimeline,
  copyTimelineData as copyTimelineDataApi,
  updateTimeline as updateTimelineApi,
  deleteTimeline as deleteTimelineApi,
} from '@/lib/api'
import type { DbTimeline } from '@/types/database'
import { birthDateToFloatYear } from '@/lib/utils'

const SELECTED_TIMELINE_KEY = 'timeline_selected_id'

export function useTimelines() {
  const { user } = useAuth()
  const [timelines, setTimelines] = useState<DbTimeline[]>([])
  const [selectedTimelineId, setSelectedTimelineId] = useState<string | null>(
    () => localStorage.getItem(SELECTED_TIMELINE_KEY),
  )
  const [loading, setLoading] = useState(true)
  const [isFirstLogin, setIsFirstLogin] = useState(false)

  // Persist selected timeline to localStorage
  useEffect(() => {
    if (selectedTimelineId) {
      localStorage.setItem(SELECTED_TIMELINE_KEY, selectedTimelineId)
    } else {
      localStorage.removeItem(SELECTED_TIMELINE_KEY)
    }
  }, [selectedTimelineId])

  // Fetch timelines on mount / user change
  useEffect(() => {
    if (!user) {
      setTimelines([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    async function init() {
      const list = await fetchTimelines(user!.id)

      if (cancelled) return

      if (list.length === 0) {
        // First login — create default timeline
        const newId = await createTimelineWithDefaults(user!.id)
        if (cancelled) return
        if (newId) {
          // Set timeline start/end years from user's birth date
          const profile = await fetchProfile(user!.id)
          if (profile?.birth_date) {
            const floatYear = birthDateToFloatYear(profile.birth_date)
            await updateTimelineApi(newId, {
              start_year: floatYear,
              end_year: floatYear + 100,
            })
          }
          // Check if user wants to import their demo timeline
          if (localStorage.getItem('timeline_import_demo') === '1') {
            try {
              const { DEMO_LANES, DEMO_EVENTS } = await import('@/data/demoData')
              const { applyDemoTimeline } = await import('@/lib/api')
              // Load user-modified demo from localStorage
              const raw = localStorage.getItem('timeline_demo_v3')
              const demoState = raw
                ? (JSON.parse(raw) as { lanes: typeof DEMO_LANES; events: typeof DEMO_EVENTS })
                : { lanes: DEMO_LANES, events: DEMO_EVENTS }
              await applyDemoTimeline(newId, demoState.lanes, demoState.events)
            } catch (e) {
              console.error('Failed to apply demo timeline:', e)
            } finally {
              localStorage.removeItem('timeline_import_demo')
            }
          }
          const refreshed = await fetchTimelines(user!.id)
          if (cancelled) return
          setTimelines(refreshed)
          setSelectedTimelineId(newId)
          setIsFirstLogin(true)
        }
      } else {
        setTimelines(list)
        // If saved selection not in list, pick first
        if (!list.find(t => t.id === selectedTimelineId)) {
          setSelectedTimelineId(list[0].id)
        }
      }
      setLoading(false)
    }

    init()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const selectTimeline = useCallback((id: string) => {
    setSelectedTimelineId(id)
  }, [])

  const createTimeline = useCallback(
    async (name?: string, emoji?: string, color?: string, withDefaultLanes = true) => {
      if (!user) return null
      const newId = withDefaultLanes
        ? await createTimelineWithDefaults(user.id, name, { emoji, color })
        : await createEmptyTimeline(user.id, name, { emoji, color })
      if (newId) {
        const refreshed = await fetchTimelines(user.id)
        setTimelines(refreshed)
        setSelectedTimelineId(newId)
      }
      return newId
    },
    [user],
  )

  const copyTimelineData = useCallback(
    async (sourceId: string, destId: string, options: Parameters<typeof copyTimelineDataApi>[2]) => {
      return copyTimelineDataApi(sourceId, destId, options)
    },
    [],
  )

  const updateTimeline = useCallback(
    async (id: string, updates: { name?: string; start_year?: number | null; end_year?: number | null; color?: string | null; emoji?: string | null; visibility?: string }) => {
      const ok = await updateTimelineApi(id, updates)
      if (ok) {
        setTimelines(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)))
      }
      return ok
    },
    [],
  )

  const renameTimeline = useCallback(
    async (id: string, name: string) => updateTimeline(id, { name }),
    [updateTimeline],
  )

  const deleteTimeline = useCallback(
    async (id: string) => {
      const ok = await deleteTimelineApi(id)
      if (ok) {
        setTimelines(prev => {
          const remaining = prev.filter(t => t.id !== id)
          if (selectedTimelineId === id && remaining.length > 0) {
            setSelectedTimelineId(remaining[0].id)
          }
          return remaining
        })
      }
      return ok
    },
    [selectedTimelineId],
  )

  const clearFirstLogin = useCallback(() => setIsFirstLogin(false), [])

  return {
    timelines,
    selectedTimelineId,
    selectTimeline,
    createTimeline,
    copyTimelineData,
    updateTimeline,
    renameTimeline,
    deleteTimeline,
    loading,
    isFirstLogin,
    clearFirstLogin,
  }
}
