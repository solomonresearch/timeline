import { useState, useEffect, useCallback, useMemo } from 'react'
import { fetchPersonas, fetchPersonaEvents } from '@/lib/api'
import type { DbPersona, DbPersonaEvent } from '@/types/database'

const ACTIVE_PERSONAS_KEY = 'timeline_active_personas'

function loadActiveIds(): Set<string> {
  try {
    const raw = localStorage.getItem(ACTIVE_PERSONAS_KEY)
    if (raw) return new Set(JSON.parse(raw) as string[])
  } catch { /* ignore */ }
  return new Set()
}

function saveActiveIds(ids: Set<string>) {
  localStorage.setItem(ACTIVE_PERSONAS_KEY, JSON.stringify([...ids]))
}

export function usePersonas() {
  const [personas, setPersonas] = useState<DbPersona[]>([])
  const [allPersonaEvents, setAllPersonaEvents] = useState<DbPersonaEvent[]>([])
  const [activePersonaIds, setActivePersonaIds] = useState<Set<string>>(loadActiveIds)
  const [loading, setLoading] = useState(true)

  // Fetch all personas on mount
  useEffect(() => {
    let cancelled = false
    async function load() {
      const list = await fetchPersonas()
      if (cancelled) return
      setPersonas(list)

      // Pre-fetch all persona events
      if (list.length > 0) {
        const events = await fetchPersonaEvents(list.map(p => p.id))
        if (cancelled) return
        setAllPersonaEvents(events)
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const togglePersona = useCallback((personaId: string) => {
    setActivePersonaIds(prev => {
      const next = new Set(prev)
      if (next.has(personaId)) {
        next.delete(personaId)
      } else {
        next.add(personaId)
      }
      saveActiveIds(next)
      return next
    })
  }, [])

  const activePersonaEvents = useMemo(
    () => allPersonaEvents.filter(e => activePersonaIds.has(e.persona_id)),
    [allPersonaEvents, activePersonaIds],
  )

  return {
    personas,
    activePersonaEvents,
    activePersonaIds,
    togglePersona,
    loading,
  }
}
