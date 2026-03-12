import { useState, useEffect, useCallback, useMemo } from 'react'
import { fetchPersonas, fetchPersonaEvents } from '@/lib/api'
import type { DbPersona, DbPersonaEvent, AlignedPersonaEvent } from '@/types/database'

const ACTIVE_PERSONAS_KEY = 'timeline_active_personas'
const DISPLAY_MODES_KEY = 'timeline_persona_display_modes'
const ALIGNED_PERSONAS_KEY = 'timeline_persona_aligned'

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

function loadAlignedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(ALIGNED_PERSONAS_KEY)
    if (raw) return new Set(JSON.parse(raw) as string[])
  } catch { /* ignore */ }
  // First load: default to aligning all currently active personas
  const activeIds = loadActiveIds()
  if (activeIds.size > 0) {
    saveAlignedIds(activeIds)
    return activeIds
  }
  return new Set()
}

function saveAlignedIds(ids: Set<string>) {
  localStorage.setItem(ALIGNED_PERSONAS_KEY, JSON.stringify([...ids]))
}

export function usePersonas(userBirthYear: number | null = null) {
  const [personas, setPersonas] = useState<DbPersona[]>([])
  const [rawPersonaEvents, setRawPersonaEvents] = useState<DbPersonaEvent[]>([])
  const [activePersonaIds, setActivePersonaIds] = useState<Set<string>>(loadActiveIds)
  const [alignedPersonaIds, setAlignedPersonaIds] = useState<Set<string>>(loadAlignedIds)
  const [personaDisplayModes, setPersonaDisplayModesState] = useState<Map<string, PersonaDisplayMode>>(loadDisplayModes)
  const [loading, setLoading] = useState(true)

  // Fetch all personas on mount
  useEffect(() => {
    let cancelled = false
    async function load() {
      const list = await fetchPersonas()
      if (cancelled) return
      setPersonas(list)

      if (list.length > 0) {
        const events = await fetchPersonaEvents(list.map(p => p.id))
        if (cancelled) return
        setRawPersonaEvents(events)
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Compute aligned events reactively based on alignment toggles
  const allPersonaEvents = useMemo(() => {
    if (rawPersonaEvents.length > 0) {
      console.debug('[usePersonas] alignment calc — userBirthYear:', userBirthYear, 'alignedIds:', [...alignedPersonaIds], 'events:', rawPersonaEvents.length)
    }

    const personaBirthYears = new Map<string, number>()
    for (const p of personas) {
      personaBirthYears.set(p.id, p.birth_year)
    }

    return rawPersonaEvents.map((e): AlignedPersonaEvent => {
      const personaBirth = personaBirthYears.get(e.persona_id)
      if (userBirthYear != null && personaBirth != null && alignedPersonaIds.has(e.persona_id)) {
        const offset = userBirthYear - personaBirth
        return {
          ...e,
          display_start_year: e.start_year + offset,
          display_end_year: e.end_year != null ? e.end_year + offset : null,
        }
      }
      return {
        ...e,
        display_start_year: e.start_year,
        display_end_year: e.end_year,
      }
    })
  }, [rawPersonaEvents, personas, userBirthYear, alignedPersonaIds])

  const togglePersona = useCallback((personaId: string) => {
    setActivePersonaIds(prev => {
      const next = new Set(prev)
      if (next.has(personaId)) {
        next.delete(personaId)
      } else {
        next.add(personaId)
        // Auto-align newly activated personas
        setAlignedPersonaIds(prevAligned => {
          if (prevAligned.has(personaId)) return prevAligned
          const nextAligned = new Set(prevAligned)
          nextAligned.add(personaId)
          saveAlignedIds(nextAligned)
          return nextAligned
        })
        // Default display mode to 'separate' for newly activated personas
        setPersonaDisplayModesState(prevModes => {
          if (prevModes.has(personaId)) return prevModes
          const nextModes = new Map(prevModes)
          nextModes.set(personaId, 'separate')
          saveDisplayModes(nextModes)
          return nextModes
        })
      }
      saveActiveIds(next)
      return next
    })
  }, [])

  const togglePersonaAlignment = useCallback((personaId: string) => {
    setAlignedPersonaIds(prev => {
      const next = new Set(prev)
      if (next.has(personaId)) {
        next.delete(personaId)
      } else {
        next.add(personaId)
      }
      saveAlignedIds(next)
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
    alignedPersonaIds,
    togglePersonaAlignment,
    personaDisplayModes,
    setPersonaDisplayMode,
    loading,
  }
}
