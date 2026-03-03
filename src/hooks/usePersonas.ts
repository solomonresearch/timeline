import { useState, useEffect, useCallback, useMemo } from 'react'
import { fetchPersonas, fetchPersonaEvents } from '@/lib/api'
import type { DbPersona, AlignedPersonaEvent } from '@/types/database'

const ACTIVE_PERSONAS_KEY = 'timeline_active_personas'
const DISPLAY_MODES_KEY = 'timeline_persona_display_modes'

export type PersonaDisplayMode = 'integrated' | 'separate'

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

function loadDisplayModes(): Map<string, PersonaDisplayMode> {
  try {
    const raw = localStorage.getItem(DISPLAY_MODES_KEY)
    if (raw) return new Map(JSON.parse(raw) as [string, PersonaDisplayMode][])
  } catch { /* ignore */ }
  return new Map()
}

function saveDisplayModes(modes: Map<string, PersonaDisplayMode>) {
  localStorage.setItem(DISPLAY_MODES_KEY, JSON.stringify([...modes.entries()]))
}

export function usePersonas(userBirthYear: number | null = null) {
  const [personas, setPersonas] = useState<DbPersona[]>([])
  const [allPersonaEvents, setAllPersonaEvents] = useState<AlignedPersonaEvent[]>([])
  const [activePersonaIds, setActivePersonaIds] = useState<Set<string>>(loadActiveIds)
  const [personaDisplayModes, setPersonaDisplayModesState] = useState<Map<string, PersonaDisplayMode>>(loadDisplayModes)
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
        const rawEvents = await fetchPersonaEvents(list.map(p => p.id))
        if (cancelled) return

        // Build persona birth year lookup
        const personaBirthYears = new Map<string, number>()
        for (const p of list) {
          personaBirthYears.set(p.id, p.birth_year)
        }

        // Compute aligned events
        const aligned: AlignedPersonaEvent[] = rawEvents.map(e => {
          const personaBirth = personaBirthYears.get(e.persona_id)
          if (userBirthYear != null && personaBirth != null) {
            const offset = userBirthYear - personaBirth
            return {
              ...e,
              display_start_year: e.start_year + offset,
              display_end_year: e.end_year != null ? e.end_year + offset : null,
            }
          }
          // No alignment — display at real years
          return {
            ...e,
            display_start_year: e.start_year,
            display_end_year: e.end_year,
          }
        })

        setAllPersonaEvents(aligned)
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [userBirthYear])

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

  const setPersonaDisplayMode = useCallback((personaId: string, mode: PersonaDisplayMode) => {
    setPersonaDisplayModesState(prev => {
      const next = new Map(prev)
      next.set(personaId, mode)
      saveDisplayModes(next)
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
    personaDisplayModes,
    setPersonaDisplayMode,
    loading,
  }
}
