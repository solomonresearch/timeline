import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  fetchTimelines,
  createTimelineWithDefaults,
  updateTimeline as updateTimelineApi,
  deleteTimeline as deleteTimelineApi,
} from '@/lib/api'
import type { DbTimeline } from '@/types/database'

const SELECTED_TIMELINE_KEY = 'timeline_selected_id'

export function useTimelines() {
  const { user } = useAuth()
  const [timelines, setTimelines] = useState<DbTimeline[]>([])
  const [selectedTimelineId, setSelectedTimelineId] = useState<string | null>(
    () => localStorage.getItem(SELECTED_TIMELINE_KEY),
  )
  const [loading, setLoading] = useState(true)

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
          const refreshed = await fetchTimelines(user!.id)
          if (cancelled) return
          setTimelines(refreshed)
          setSelectedTimelineId(newId)
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
    async (name?: string) => {
      if (!user) return null
      const newId = await createTimelineWithDefaults(user.id, name)
      if (newId) {
        const refreshed = await fetchTimelines(user.id)
        setTimelines(refreshed)
        setSelectedTimelineId(newId)
      }
      return newId
    },
    [user],
  )

  const updateTimeline = useCallback(
    async (id: string, updates: { name?: string; start_year?: number | null; end_year?: number | null; color?: string | null; emoji?: string | null }) => {
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

  return {
    timelines,
    selectedTimelineId,
    selectTimeline,
    createTimeline,
    updateTimeline,
    renameTimeline,
    deleteTimeline,
    loading,
  }
}
