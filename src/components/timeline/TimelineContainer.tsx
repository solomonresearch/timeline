import { useRef, useEffect, useLayoutEffect, useMemo, useCallback, useState, type MutableRefObject } from 'react'
import type { Lane, TimelineEvent } from '@/types/timeline'
import type { DbPersona, AlignedPersonaEvent } from '@/types/database'
import type { PersonaDisplayMode } from '@/hooks/usePersonas'
import { LaneSidebar, type PersonaSidebarSection } from './LaneSidebar'
import { TimelineHeader } from './TimelineHeader'
import { YearGrid } from './YearGrid'
import { TimelineLane } from './TimelineLane'
import { TotalAssetsLane } from './TotalAssetsLane'
import { PersonaSeparateTimeline } from './PersonaSeparateTimeline'
import { getCurrentYearFraction, MIN_PIXELS_PER_YEAR, MAX_PIXELS_PER_YEAR } from '@/lib/constants'
import { useSizeConfig, scaleSizeConfig, SIZE_PRESETS } from '@/contexts/UiSizeContext'

// ── Dynamic canvas windowing ──────────────────────────────────────────────────

const MAX_CANVAS_PX = 10_000_000  // safe max element width across browsers

function computeEffWindow(centerYear: number, ppy: number, yrStart: number, yrEnd: number) {
  const totalW = (yrEnd - yrStart) * ppy
  if (totalW <= MAX_CANVAS_PX) return { effStart: yrStart, effEnd: yrEnd }
  let effStart = Math.max(yrStart, centerYear - MAX_CANVAS_PX / (2 * ppy))
  let effEnd = effStart + MAX_CANVAS_PX / ppy
  if (effEnd > yrEnd) {
    effEnd = yrEnd
    effStart = Math.max(yrStart, yrEnd - MAX_CANVAS_PX / ppy)
  }
  return { effStart, effEnd }
}

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
  onEventClick: (event: TimelineEvent, element: HTMLElement, clientX: number, clientY: number) => void
  onLaneClick: (laneId: string, year: number) => void
  onLaneDragRange: (laneId: string, startYear: number, endYear: number) => void
  personaEvents: AlignedPersonaEvent[]
  personas: DbPersona[]
  personaDisplayModes: Map<string, PersonaDisplayMode>
  dataYearMin: number
  dataYearMax: number
  scrollToTodayRef?: MutableRefObject<(() => void) | null>
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
  scrollToTodayRef,
}: TimelineContainerProps) {
  const { sc, size, updateFitScreenConfig } = useSizeConfig()
  const { BASE_LANE_HEIGHT, PERSONA_SUB_ROW_HEIGHT, TOTAL_ASSETS_HEIGHT } = sc
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasScrolledRef = useRef<string | null>(null)

  // Dynamic canvas windowing: when total width exceeds MAX_CANVAS_PX, render only a window
  const [viewCenterYear, setViewCenterYear] = useState(() => getCurrentYearFraction())
  const viewCenterYearRef = useRef(viewCenterYear)

  // Compute the effective year window for this render
  const { effStart: effectiveYearStart, effEnd: effectiveYearEnd } =
    computeEffWindow(viewCenterYear, pixelsPerYear, yearStart, yearEnd)
  const effectiveTotalWidth = (effectiveYearEnd - effectiveYearStart) * pixelsPerYear

  const handlePan = useCallback((dx: number) => {
    if (scrollRef.current) scrollRef.current.scrollLeft -= dx
  }, [])

  // Scroll position tracking for viewport-aware header/grid rendering
  const [scrollLeft, setScrollLeft] = useState(0)
  const [viewportWidth, setViewportWidth] = useState(1200)
  const rafRef = useRef<number | null>(null)
  const zoomRafRef = useRef<number | null>(null)
  const shiftingWindowRef = useRef(false)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const sl = el.scrollLeft
        const totalW = (yearEnd - yearStart) * ppyRef.current
        // When windowed: shift the effective window if user scrolls near either edge,
        // so they can always reach any event by scrolling (infinite-scroll effect).
        if (totalW > MAX_CANVAS_PX && !shiftingWindowRef.current) {
          const edgeThreshold = MAX_CANVAS_PX * 0.2
          if (sl < edgeThreshold || sl > MAX_CANVAS_PX - edgeThreshold - el.clientWidth) {
            const centerPx = sl + el.clientWidth / 2
            const newCenterYear = yearStartRef.current + centerPx / ppyRef.current
            const { effStart: newEffStart } = computeEffWindow(newCenterYear, ppyRef.current, yearStart, yearEnd)
            if (newEffStart !== yearStartRef.current) {
              shiftingWindowRef.current = true
              yearStartRef.current = newEffStart
              viewCenterYearRef.current = newCenterYear
              pendingScrollRef.current = (newCenterYear - newEffStart) * ppyRef.current - el.clientWidth / 2
              setViewCenterYear(newCenterYear)
              return
            }
          }
        }
        shiftingWindowRef.current = false
        setScrollLeft(sl)
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
  }, [yearStart, yearEnd])

  // Refs for latest ppy/effectiveYearStart — avoid stale closures in wheel handler
  const ppyRef = useRef(pixelsPerYear)
  const yearStartRef = useRef(effectiveYearStart)
  useEffect(() => { ppyRef.current = pixelsPerYear }, [pixelsPerYear])
  // yearStartRef tracks effectiveYearStart; updated synchronously below + in wheel handler
  yearStartRef.current = effectiveYearStart

  // Pending scroll applied after React re-renders new content width
  const pendingScrollRef = useRef<number | null>(null)
  useLayoutEffect(() => {
    if (pendingScrollRef.current !== null && scrollRef.current) {
      // Force layout recalculation before setting scrollLeft (browser may clamp to old width)
      void scrollRef.current.scrollWidth
      scrollRef.current.scrollLeft = pendingScrollRef.current
      pendingScrollRef.current = null
      shiftingWindowRef.current = false  // allow edge detection again after shift is applied
    }
  }, [pixelsPerYear, viewCenterYear])

  // Register scroll-to-today function for external callers (e.g. Toolbar button)
  useEffect(() => {
    if (!scrollToTodayRef) return
    scrollToTodayRef.current = () => {
      const el = scrollRef.current
      if (!el) return
      const today = getCurrentYearFraction()
      const { effStart } = computeEffWindow(today, pixelsPerYear, yearStart, yearEnd)
      yearStartRef.current = effStart
      viewCenterYearRef.current = today
      pendingScrollRef.current = Math.max(0, (today - effStart) * pixelsPerYear - el.clientWidth / 2)
      setViewCenterYear(today)
    }
  }, [scrollToTodayRef, yearStart, yearEnd, pixelsPerYear])

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
      // Chain pending scroll so rapid wheel events don't drift off-cursor
      const sl = pendingScrollRef.current ?? el.scrollLeft
      const yearAtCursor = yearStartRef.current + (sl + mouseX) / ppy
      let dy = e.deltaY
      if (e.deltaMode === 1) dy *= 32
      if (e.deltaMode === 2) dy *= 300
      const factor = Math.exp(-dy * 0.012)
      const newPpy = Math.max(MIN_PIXELS_PER_YEAR, Math.min(MAX_PIXELS_PER_YEAR, ppy * factor))
      ppyRef.current = newPpy
      // Compute new effective window for the new zoom level
      const { effStart: newEffStart } = computeEffWindow(yearAtCursor, newPpy, yearStart, yearEnd)
      yearStartRef.current = newEffStart
      viewCenterYearRef.current = yearAtCursor
      pendingScrollRef.current = (yearAtCursor - newEffStart) * newPpy - mouseX
      // Throttle React re-renders to one per animation frame
      if (zoomRafRef.current !== null) cancelAnimationFrame(zoomRafRef.current)
      zoomRafRef.current = requestAnimationFrame(() => {
        zoomRafRef.current = null
        setViewCenterYear(viewCenterYearRef.current)
        onZoom(ppyRef.current)
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheel)
      if (zoomRafRef.current !== null) cancelAnimationFrame(zoomRafRef.current)
    }
  }, [onZoom, yearStart, yearEnd])

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
  const hasValueEvents = events.some(e => e.type === 'range' && !!e.valueProjection)

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
    const { effStart } = computeEffWindow(dataCenterYear, pixelsPerYear, yearStart, yearEnd)
    yearStartRef.current = effStart
    viewCenterYearRef.current = dataCenterYear
    const dataCenterPx = (dataCenterYear - effStart) * pixelsPerYear
    const viewWidth = scrollRef.current.clientWidth
    pendingScrollRef.current = Math.max(0, dataCenterPx - viewWidth / 2)
    setViewCenterYear(dataCenterYear)
    hasScrolledRef.current = dataKey
  }, [dataKey, dataYearMin, dataYearMax, yearStart, yearEnd, pixelsPerYear])

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleLanes, integratedPersonaEvents, personaInitialsMap, personaNameMap, events, expandedLanes, BASE_LANE_HEIGHT, PERSONA_SUB_ROW_HEIGHT])

  const laneHeights = laneData.map(d => d.laneHeight)
  const totalHeight = laneHeights.reduce((sum, h) => sum + h, 0) + (hasValueEvents ? TOTAL_ASSETS_HEIGHT : 0)

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

  // Lane names in visible order — used for separate persona sections
  const visibleLaneNames = useMemo(() => visibleLanes.map(l => l.name), [visibleLanes])

  // Build sidebar sections for separate personas
  const separatePersonaSections = useMemo<PersonaSidebarSection[]>(() => {
    return separatePersonas.map(p => {
      const parts = p.name.split(' ')
      const initials = parts.map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
      return {
        personaId: p.id,
        name: p.name,
        initials,
        birthYear: p.birth_year,
        deathYear: p.death_year,
        laneNames: visibleLaneNames,
      }
    })
  }, [separatePersonas, visibleLaneNames])

  // Grand total height includes persona section rows for YearGrid coverage
  const personaSectionsTotalHeight = separatePersonas.length * (PERSONA_SUB_ROW_HEIGHT + visibleLaneNames.length * BASE_LANE_HEIGHT)
  const grandTotalHeight = totalHeight + personaSectionsTotalHeight

  // Fit-screen: recompute sizes whenever grandTotalHeight or container height changes.
  // All heights are linear in BASE_LANE_HEIGHT, so K = grandTotalHeight / BASE_LANE_HEIGHT
  // is scale-invariant. We solve: containerHeight = HEADER_HEIGHT + grandTotalHeight
  // ⟹ newBLH = containerHeight / (headerRatio + K).
  const fitRef = useRef({ grandTotalHeight, blh: sc.BASE_LANE_HEIGHT, hr: sc.HEADER_HEIGHT })
  fitRef.current = { grandTotalHeight, blh: sc.BASE_LANE_HEIGHT, hr: sc.HEADER_HEIGHT }

  const computeFitScreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const containerHeight = el.clientHeight
    if (containerHeight <= 0) return
    const { grandTotalHeight: gh, blh, hr } = fitRef.current
    if (gh <= 0 || blh <= 0) return
    const K = gh / blh
    const headerRatio = hr / blh
    const newBLH = containerHeight / (headerRatio + K)
    const scale = newBLH / SIZE_PRESETS.large.BASE_LANE_HEIGHT
    updateFitScreenConfig(scaleSizeConfig(SIZE_PRESETS.large, scale))
  }, [updateFitScreenConfig])

  // Set up ResizeObserver on the container (fires when window/panel resizes)
  useEffect(() => {
    if (size !== 'fitscreen') return
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(computeFitScreen)
    ro.observe(el)
    computeFitScreen()
    return () => ro.disconnect()
  }, [size, computeFitScreen])

  // Also recompute when lane structure changes (lanes added/removed/persona sections)
  useEffect(() => {
    if (size !== 'fitscreen') return
    computeFitScreen()
  }, [size, grandTotalHeight, computeFitScreen])

  return (
    <div ref={containerRef} className="flex flex-1 overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-auto">
        {/* Sidebar and content sit side-by-side inside the single scroll container.
            Sidebar is sticky-left so it stays visible during horizontal scroll,
            but scrolls vertically with the content (no frozen-column misalignment). */}
        <div style={{ display: 'flex' }}>
        <LaneSidebar
          lanes={visibleLanes}
          hiddenLanes={hiddenLanes}
          laneHeights={laneHeights}
          lanePersonaLabels={sidebarPersonaLabels}
          laneHasOverlaps={laneHasOverlaps}
          expandedLanes={expandedLanes}
          separatePersonaSections={separatePersonaSections}
          onToggleExpand={handleToggleExpand}
          onToggleVisibility={onToggleVisibility}
          onEditLane={onEditLane}
          onDeleteLane={onDeleteLane}
          totalAssetsHeight={hasValueEvents ? TOTAL_ASSETS_HEIGHT : undefined}
        />
        <div className="relative" style={{ width: effectiveTotalWidth, minHeight: grandTotalHeight + 24 }}>
          <TimelineHeader yearStart={effectiveYearStart} yearEnd={effectiveYearEnd} pixelsPerYear={pixelsPerYear} currentYear={currentYear} scrollLeft={scrollLeft} viewportWidth={viewportWidth} />
          <div className="relative">
            <YearGrid yearStart={effectiveYearStart} yearEnd={effectiveYearEnd} pixelsPerYear={pixelsPerYear} totalHeight={grandTotalHeight} currentYear={currentYear} scrollLeft={scrollLeft} viewportWidth={viewportWidth} />
            {visibleLanes.map((lane, i) => (
              <TimelineLane
                key={lane.id}
                lane={lane}
                events={events.filter(e => e.laneId === lane.id)}
                yearStart={effectiveYearStart}
                yearEnd={effectiveYearEnd}
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
                scrollLeft={scrollLeft}
              />
            ))}
            {hasValueEvents && (
              <TotalAssetsLane
                events={events}
                yearStart={effectiveYearStart}
                yearEnd={effectiveYearEnd}
                pixelsPerYear={pixelsPerYear}
              />
            )}
          </div>
          {/* Separate persona timeline sections */}
          {separatePersonas.map(persona => (
            <PersonaSeparateTimeline
              key={persona.id}
              persona={persona}
              events={separatePersonaEventsMap.get(persona.id) ?? []}
              laneNames={visibleLaneNames}
              yearStart={effectiveYearStart}
              yearEnd={effectiveYearEnd}
              pixelsPerYear={pixelsPerYear}
              laneColorMap={laneColorMap}
              currentYear={currentYear}
            />
          ))}
        </div>
        </div> {/* end flex row (sidebar + content) */}
      </div>
    </div>
  )
}
