import { useRef, useEffect, useLayoutEffect, useMemo, useCallback, useState } from 'react'
import type { Lane, TimelineEvent } from '@/types/timeline'
import type { DbPersona, AlignedPersonaEvent } from '@/types/database'
import type { PersonaDisplayMode } from '@/hooks/usePersonas'
import { LaneSidebar } from './LaneSidebar'
import { TimelineHeader } from './TimelineHeader'
import { YearGrid } from './YearGrid'
import { TimelineLane } from './TimelineLane'
import { PersonaSeparateTimeline } from './PersonaSeparateTimeline'
import { getCurrentYearFraction, BASE_LANE_HEIGHT, PERSONA_SUB_ROW_HEIGHT, MIN_PIXELS_PER_YEAR, MAX_PIXELS_PER_YEAR } from '@/lib/constants'

// ── Overlap detection & row assignment ───────────────────────────────────────

function eventRange(e: TimelineEvent): [number, number] {
  const end = e.type === 'range' && e.endYear != null ? e.endYear : e.startYear + 0.5
  return [e.startYear, end]
}

function hasAnyOverlaps(events: TimelineEvent[]): boolean {
  for (let i = 0; i < events.length; i++) {
    const [as, ae] = eventRange(events[i])
    for (let j = i + 1; j < events.length; j++) {
      const [bs, be] = eventRange(events[j])
      if (as < be && bs < ae) return true
    }
  }
  return false
}

/** Assign events to rows: newest startYear → row 0 (top), older events pushed down. */
function assignEventRows(events: TimelineEvent[]): Map<string, number> {
  const sorted = [...events].sort((a, b) => b.startYear - a.startYear) // newest first
  const rowSlots: Array<[number, number][]> = []
  const assignment = new Map<string, number>()
  for (const event of sorted) {
    const [evS, evE] = eventRange(event)
    let placed = false
    for (let r = 0; r < rowSlots.length; r++) {
      if (rowSlots[r].every(([s, e]) => evE <= s || evS >= e)) {
        rowSlots[r].push([evS, evE])
        assignment.set(event.id, r)
        placed = true
        break
      }
    }
    if (!placed) {
      rowSlots.push([[evS, evE]])
      assignment.set(event.id, rowSlots.length - 1)
    }
  }
  return assignment
}

interface TimelineContainerProps {
  lanes: Lane[]
  events: TimelineEvent[]
  yearStart: number
  yearEnd: number
  pixelsPerYear: number
  onToggleVisibility: (id: string) => void
  onEditLane: (lane: Lane) => void
  onDeleteLane: (lane: Lane) => void
  onZoom: (ppy: number) => void
  onEventClick: (event: TimelineEvent, element: HTMLElement) => void
  onLaneClick: (laneId: string, year: number) => void
  onLaneDragRange: (laneId: string, startYear: number, endYear: number) => void
  personaEvents: AlignedPersonaEvent[]
  personas: DbPersona[]
  personaDisplayModes: Map<string, PersonaDisplayMode>
  dataYearMin: number
  dataYearMax: number
}

export function TimelineContainer({
  lanes,
  events,
  yearStart,
  yearEnd,
  pixelsPerYear,
  onZoom,
  onToggleVisibility,
  onEditLane,
  onDeleteLane,
  onEventClick,
  onLaneClick,
  onLaneDragRange,
  personaEvents,
  personas,
  personaDisplayModes,
  dataYearMin,
  dataYearMax,
}: TimelineContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasScrolledRef = useRef<string | null>(null)

  const handlePan = useCallback((dx: number) => {
    if (scrollRef.current) scrollRef.current.scrollLeft -= dx
  }, [])

  // Scroll position tracking for viewport-aware header/grid rendering
  const [scrollLeft, setScrollLeft] = useState(0)
  const [viewportWidth, setViewportWidth] = useState(1200)
  const rafRef = useRef<number | null>(null)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        setScrollLeft(el.scrollLeft)
        setViewportWidth(el.clientWidth)
      })
    }
    const ro = new ResizeObserver(() => {
      setScrollLeft(el.scrollLeft)
      setViewportWidth(el.clientWidth)
    })
    el.addEventListener('scroll', onScroll, { passive: true })
    ro.observe(el)
    setScrollLeft(el.scrollLeft)
    setViewportWidth(el.clientWidth)
    return () => {
      el.removeEventListener('scroll', onScroll)
      ro.disconnect()
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Refs for latest ppy/yearStart — avoid stale closures in wheel handler
  const ppyRef = useRef(pixelsPerYear)
  const yearStartRef = useRef(yearStart)
  useEffect(() => { ppyRef.current = pixelsPerYear }, [pixelsPerYear])
  useEffect(() => { yearStartRef.current = yearStart }, [yearStart])

  // Pending scroll applied after React re-renders new content width
  const pendingScrollRef = useRef<number | null>(null)
  useLayoutEffect(() => {
    if (pendingScrollRef.current !== null && scrollRef.current) {
      scrollRef.current.scrollLeft = pendingScrollRef.current
      pendingScrollRef.current = null
    }
  }, [pixelsPerYear])

  // Wheel zoom toward cursor
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
      e.preventDefault()
      const ppy = ppyRef.current
      const rect = el.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const yearAtCursor = yearStartRef.current + (el.scrollLeft + mouseX) / ppy
      let dy = e.deltaY
      if (e.deltaMode === 1) dy *= 32
      if (e.deltaMode === 2) dy *= 300
      const factor = Math.exp(-dy * 0.006)
      const newPpy = Math.max(MIN_PIXELS_PER_YEAR, Math.min(MAX_PIXELS_PER_YEAR, ppy * factor))
      pendingScrollRef.current = (yearAtCursor - yearStartRef.current) * newPpy - mouseX
      onZoom(newPpy)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [onZoom])

  const [expandedLanes, setExpandedLanes] = useState<Set<string>>(new Set())
  const handleToggleExpand = useCallback((laneId: string) => {
    setExpandedLanes(prev => {
      const next = new Set(prev)
      next.has(laneId) ? next.delete(laneId) : next.add(laneId)
      return next
    })
  }, [])

  const visibleLanes = lanes.filter(l => l.visible)
  const hiddenLanes = lanes.filter(l => !l.visible)
  const currentYear = getCurrentYearFraction()
  const totalWidth = (yearEnd - yearStart) * pixelsPerYear

  // Split persona events into integrated (sub-rows in lanes) vs separate (own section below)
  const integratedPersonaEvents = useMemo(
    () => personaEvents.filter(e => (personaDisplayModes.get(e.persona_id) ?? 'integrated') === 'integrated'),
    [personaEvents, personaDisplayModes],
  )

  const separatePersonas = useMemo(() => {
    const ids = new Set(
      personaEvents
        .filter(e => personaDisplayModes.get(e.persona_id) === 'separate')
        .map(e => e.persona_id),
    )
    return personas.filter(p => ids.has(p.id))
  }, [personas, personaEvents, personaDisplayModes])

  const separatePersonaEventsMap = useMemo(() => {
    const m = new Map<string, AlignedPersonaEvent[]>()
    for (const e of personaEvents) {
      if (personaDisplayModes.get(e.persona_id) === 'separate') {
        const list = m.get(e.persona_id) ?? []
        list.push(e)
        m.set(e.persona_id, list)
      }
    }
    return m
  }, [personaEvents, personaDisplayModes])

  // Lane name -> color map (for separate persona timelines)
  const laneColorMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const lane of lanes) m.set(lane.name, lane.color)
    return m
  }, [lanes])

  // Build a unique key for the current data range to detect timeline changes
  const dataKey = `${dataYearMin}-${dataYearMax}`

  // Scroll to center of user's data on load / timeline change
  useEffect(() => {
    if (!scrollRef.current) return
    if (hasScrolledRef.current === dataKey) return
    const dataCenterYear = (dataYearMin + dataYearMax) / 2
    const dataCenterPx = (dataCenterYear - yearStart) * pixelsPerYear
    const viewWidth = scrollRef.current.clientWidth
    scrollRef.current.scrollLeft = dataCenterPx - viewWidth / 2
    hasScrolledRef.current = dataKey
  }, [dataKey, dataYearMin, dataYearMax, yearStart, pixelsPerYear])

  // Build a map of persona id -> initials + name
  const personaInitialsMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const p of personas) {
      const parts = p.name.split(' ')
      const initials = parts.map(w => w[0]).join('').toUpperCase().slice(0, 2)
      m.set(p.id, initials)
    }
    return m
  }, [personas])

  const personaNameMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const p of personas) {
      m.set(p.id, p.name)
    }
    return m
  }, [personas])

  // Compute per-lane persona events, sub-row assignments, dynamic heights, and overlap rows
  const laneData = useMemo(() => {
    const result: {
      laneHeight: number
      personaSubRowMap: Map<string, number>
      lanePersonaLabels: { initials: string; name: string }[]
      filteredPersonaEvents: AlignedPersonaEvent[]
      hasOverlaps: boolean
      eventRowMap: Map<string, number>
    }[] = []

    for (const lane of visibleLanes) {
      const lanePersonaEvents = integratedPersonaEvents.filter(pe => pe.lane_name === lane.name)
      const laneEvents = events.filter(e => e.laneId === lane.id)

      // Collect unique persona IDs in this lane, sorted for determinism
      const personaIdsInLane = [...new Set(lanePersonaEvents.map(pe => pe.persona_id))].sort()
      const personaCount = personaIdsInLane.length

      // Build sub-row index map
      const personaSubRowMap = new Map<string, number>()
      personaIdsInLane.forEach((pid, idx) => {
        personaSubRowMap.set(pid, idx)
      })

      // Build labels for sidebar
      const lanePersonaLabels = personaIdsInLane.map(pid => ({
        initials: personaInitialsMap.get(pid) ?? '??',
        name: personaNameMap.get(pid) ?? 'Unknown',
      }))

      // Overlap detection & row assignment
      const hasOverlaps = hasAnyOverlaps(laneEvents)
      const isExpanded = hasOverlaps && expandedLanes.has(lane.id)
      const eventRowMap = isExpanded ? assignEventRows(laneEvents) : new Map<string, number>()
      const numEventRows = isExpanded ? (eventRowMap.size > 0 ? Math.max(...eventRowMap.values()) + 1 : 1) : 1

      result.push({
        laneHeight: numEventRows * BASE_LANE_HEIGHT + personaCount * PERSONA_SUB_ROW_HEIGHT,
        personaSubRowMap,
        lanePersonaLabels,
        filteredPersonaEvents: lanePersonaEvents,
        hasOverlaps,
        eventRowMap,
      })
    }

    return result
  }, [visibleLanes, integratedPersonaEvents, personaInitialsMap, personaNameMap, events, expandedLanes])

  const laneHeights = laneData.map(d => d.laneHeight)
  const totalHeight = laneHeights.reduce((sum, h) => sum + h, 0)

  // Build sidebar maps: lane name -> persona labels, lane id -> hasOverlaps
  const sidebarPersonaLabels = useMemo(() => {
    const m = new Map<string, { initials: string; name: string }[]>()
    visibleLanes.forEach((lane, i) => {
      m.set(lane.name, laneData[i].lanePersonaLabels)
    })
    return m
  }, [visibleLanes, laneData])

  const laneHasOverlaps = useMemo(() => {
    const m = new Map<string, boolean>()
    visibleLanes.forEach((lane, i) => m.set(lane.id, laneData[i].hasOverlaps))
    return m
  }, [visibleLanes, laneData])

  return (
    <div className="flex flex-1 overflow-hidden">
      <LaneSidebar
        lanes={visibleLanes}
        hiddenLanes={hiddenLanes}
        laneHeights={laneHeights}
        lanePersonaLabels={sidebarPersonaLabels}
        laneHasOverlaps={laneHasOverlaps}
        expandedLanes={expandedLanes}
        onToggleExpand={handleToggleExpand}
        onToggleVisibility={onToggleVisibility}
        onEditLane={onEditLane}
        onDeleteLane={onDeleteLane}
      />
      <div ref={scrollRef} className="flex-1 overflow-auto">
        <div className="relative" style={{ width: totalWidth, minHeight: totalHeight + 24 }}>
          <TimelineHeader yearStart={yearStart} yearEnd={yearEnd} pixelsPerYear={pixelsPerYear} currentYear={currentYear} scrollLeft={scrollLeft} viewportWidth={viewportWidth} />
          <div className="relative">
            <YearGrid yearStart={yearStart} yearEnd={yearEnd} pixelsPerYear={pixelsPerYear} totalHeight={totalHeight} currentYear={currentYear} scrollLeft={scrollLeft} viewportWidth={viewportWidth} />
            {visibleLanes.map((lane, i) => (
              <TimelineLane
                key={lane.id}
                lane={lane}
                events={events.filter(e => e.laneId === lane.id)}
                yearStart={yearStart}
                yearEnd={yearEnd}
                pixelsPerYear={pixelsPerYear}
                onEventClick={onEventClick}
                onLaneClick={onLaneClick}
                onLaneDragRange={onLaneDragRange}
                onPan={handlePan}
                eventRowMap={laneData[i].eventRowMap}
                personaEvents={laneData[i].filteredPersonaEvents}
                personaInitialsMap={personaInitialsMap}
                laneHeight={laneData[i].laneHeight}
                personaSubRowMap={laneData[i].personaSubRowMap}
                currentYear={currentYear}
              />
            ))}
          </div>
          {/* Separate persona timeline sections */}
          {separatePersonas.map(persona => (
            <PersonaSeparateTimeline
              key={persona.id}
              persona={persona}
              events={separatePersonaEventsMap.get(persona.id) ?? []}
              yearStart={yearStart}
              pixelsPerYear={pixelsPerYear}
              laneColorMap={laneColorMap}
              currentYear={currentYear}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
