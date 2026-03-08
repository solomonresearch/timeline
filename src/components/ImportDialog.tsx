import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { CalendarDays, Globe, FileText, Mic, Upload, CheckCircle2, AlertCircle, X, Loader2, ChevronRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { Lane, TimelineEvent } from '@/types/timeline'
import {
  parseCalendarFile,
  mapCategoryToLane,
  isSupportedFile,
  SUPPORTED_EXTENSIONS,
  type ParsedCalendarEvent,
} from '@/lib/calendarParser'
import {
  loadGis,
  requestCalendarToken,
  fetchCalendarList,
  fetchCalendarEvents,
  type GoogleCalendar,
  type GoogleCalEvent,
} from '@/lib/googleCalendar'

export type ImportTab = 'calendar-file' | 'google-calendar' | 'text' | 'voice'

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: ImportTab
  lanes: Lane[]
  addEvent: (event: Omit<TimelineEvent, 'id'>) => Promise<TimelineEvent | null>
  addLane: (lane: Omit<Lane, 'id' | 'order' | 'isDefault'>) => Promise<Lane | null>
}

const TABS: { id: ImportTab; label: string; icon: React.ReactNode }[] = [
  { id: 'calendar-file', label: 'Calendar File', icon: <CalendarDays className="h-4 w-4" /> },
  { id: 'google-calendar', label: 'Google Calendar', icon: <Globe className="h-4 w-4" /> },
  { id: 'text', label: 'Text', icon: <FileText className="h-4 w-4" /> },
  { id: 'voice', label: 'Voice', icon: <Mic className="h-4 w-4" /> },
]

interface CalendarFileTabProps {
  lanes: Lane[]
  addEvent: (event: Omit<TimelineEvent, 'id'>) => Promise<TimelineEvent | null>
  onDone: () => void
}

function CalendarFileTab({ lanes, addEvent, onDone }: CalendarFileTabProps) {
  const [parsedEvents, setParsedEvents] = useState<ParsedCalendarEvent[]>([])
  const [laneAssignments, setLaneAssignments] = useState<Map<number, string>>(new Map())
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [importing, setImporting] = useState(false)
  const [importedCount, setImportedCount] = useState(0)
  const [importProgress, setImportProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const laneNames = lanes.map(l => l.name)

  // Group events by year (descending)
  const yearGroups = useMemo(() => {
    const groups = new Map<number, { idx: number; ev: ParsedCalendarEvent }[]>()
    for (let i = 0; i < parsedEvents.length; i++) {
      const ev = parsedEvents[i]
      const year = Math.floor(ev.startYear)
      const arr = groups.get(year)
      if (arr) arr.push({ idx: i, ev })
      else groups.set(year, [{ idx: i, ev }])
    }
    return [...groups.entries()].sort((a, b) => b[0] - a[0])
  }, [parsedEvents])

  const selectedCount = selectedIndices.size

  const processFile = useCallback((file: File) => {
    setError('')
    setParsedEvents([])
    setImportedCount(0)

    if (!isSupportedFile(file.name)) {
      setError(`Unsupported format. Use: ${SUPPORTED_EXTENSIONS.join(', ')}`)
      return
    }

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      try {
        const events = parseCalendarFile(text, file.name)
        if (events.length === 0) {
          setError('No events found in file')
          return
        }
        setParsedEvents(events)
        // Select all by default
        setSelectedIndices(new Set(events.map((_, i) => i)))
        // Set default lane assignments
        const assignments = new Map<number, string>()
        events.forEach((ev, i) => {
          assignments.set(i, mapCategoryToLane(ev.category, laneNames))
        })
        setLaneAssignments(assignments)
      } catch {
        setError('Failed to parse file')
      }
    }
    reader.onerror = () => setError('Failed to read file')
    reader.readAsText(file)
  }, [laneNames])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }, [processFile])

  const toggleYear = (year: number) => {
    const yearItems = yearGroups.find(([y]) => y === year)?.[1] || []
    const allSelected = yearItems.every(item => selectedIndices.has(item.idx))
    const next = new Set(selectedIndices)
    for (const item of yearItems) {
      if (allSelected) next.delete(item.idx)
      else next.add(item.idx)
    }
    setSelectedIndices(next)
  }

  const handleImport = async () => {
    setImporting(true)
    setImportProgress(0)
    let count = 0
    const selected = parsedEvents
      .map((ev, i) => ({ ev, i }))
      .filter(({ i }) => selectedIndices.has(i))
    for (let j = 0; j < selected.length; j++) {
      const { ev, i } = selected[j]
      const laneName = laneAssignments.get(i) || 'Other Activities'
      const lane = lanes.find(l => l.name === laneName)
      if (!lane) continue
      const result = await addEvent({
        laneId: lane.id,
        title: ev.title,
        description: ev.description,
        type: ev.endYear ? 'range' : 'point',
        startYear: ev.startYear,
        endYear: ev.endYear,
      })
      if (result) count++
      setImportProgress(j + 1)
    }
    setImportedCount(count)
    setImporting(false)
  }

  const handleReset = () => {
    setParsedEvents([])
    setFileName('')
    setError('')
    setImportedCount(0)
    setImportProgress(0)
    setLaneAssignments(new Map())
    setSelectedIndices(new Set())
  }

  // Success state
  if (importedCount > 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <p className="text-sm font-medium">Imported {importedCount} event{importedCount !== 1 ? 's' : ''}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>Import Another</Button>
          <Button size="sm" onClick={onDone}>Done</Button>
        </div>
      </div>
    )
  }

  // Importing state
  if (importing) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Importing events... {importProgress}/{selectedCount}
        </p>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${selectedCount > 0 ? (importProgress / selectedCount) * 100 : 0}%` }}
          />
        </div>
      </div>
    )
  }

  // Preview parsed events — grouped by year
  if (parsedEvents.length > 0) {
    return (
      <div className="flex flex-col gap-3 py-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            {parsedEvents.length} event{parsedEvents.length !== 1 ? 's' : ''} from {fileName}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{selectedCount} selected</span>
            <button onClick={handleReset} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto rounded-md border">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted z-10">
              <tr>
                <th className="w-7 px-2 py-1.5" />
                <th className="text-left px-2 py-1.5 font-medium">Event</th>
                <th className="text-left px-2 py-1.5 font-medium w-20">Date</th>
                <th className="text-left px-2 py-1.5 font-medium w-28">Lane</th>
              </tr>
            </thead>
            <tbody>
              {yearGroups.map(([year, items]) => {
                const yearSelectedCount = items.filter(item => selectedIndices.has(item.idx)).length
                const allYearSelected = yearSelectedCount === items.length
                const someYearSelected = yearSelectedCount > 0 && !allYearSelected
                return (
                  <FileYearGroup
                    key={year}
                    year={year}
                    items={items}
                    allSelected={allYearSelected}
                    someSelected={someYearSelected}
                    selectedIndices={selectedIndices}
                    laneAssignments={laneAssignments}
                    laneNames={laneNames}
                    onToggleYear={() => toggleYear(year)}
                    onToggleEvent={(idx) => {
                      const next = new Set(selectedIndices)
                      if (next.has(idx)) next.delete(idx)
                      else next.add(idx)
                      setSelectedIndices(next)
                    }}
                    onSetLane={(idx, lane) => {
                      const next = new Map(laneAssignments)
                      next.set(idx, lane)
                      setLaneAssignments(next)
                    }}
                  />
                )
              })}
            </tbody>
          </table>
        </div>

        <Button onClick={handleImport} disabled={selectedCount === 0} className="w-full">
          Import {selectedCount} Event{selectedCount !== 1 ? 's' : ''}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center w-full h-40 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/30 bg-muted/30 hover:border-muted-foreground/50'
        }`}
      >
        <Upload className={`h-8 w-8 mb-2 ${isDragging ? 'text-primary' : 'text-muted-foreground/50'}`} />
        <p className="text-sm text-muted-foreground">
          {isDragging ? 'Drop file here' : 'Drop calendar file or click to browse'}
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Supports ICS, VCS, CSV, JSON, XML, TSV
        </p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={SUPPORTED_EXTENSIONS.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}

interface FileYearGroupProps {
  year: number
  items: { idx: number; ev: ParsedCalendarEvent }[]
  allSelected: boolean
  someSelected: boolean
  selectedIndices: Set<number>
  laneAssignments: Map<number, string>
  laneNames: string[]
  onToggleYear: () => void
  onToggleEvent: (idx: number) => void
  onSetLane: (idx: number, lane: string) => void
}

function FileYearGroup({
  year, items, allSelected, someSelected,
  selectedIndices, laneAssignments, laneNames,
  onToggleYear, onToggleEvent, onSetLane,
}: FileYearGroupProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      <tr className="bg-muted/50 border-t border-muted">
        <td className="px-2 py-1">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => { if (el) el.indeterminate = someSelected }}
            onChange={onToggleYear}
            className="accent-primary"
          />
        </td>
        <td
          colSpan={2}
          className="px-2 py-1 font-medium cursor-pointer select-none"
          onClick={() => setCollapsed(!collapsed)}
        >
          <span className="inline-flex items-center gap-1">
            <ChevronRight className={`h-3 w-3 transition-transform ${collapsed ? '' : 'rotate-90'}`} />
            {year}
          </span>
        </td>
        <td className="px-2 py-1 text-muted-foreground text-right">
          {items.length} event{items.length !== 1 ? 's' : ''}
        </td>
      </tr>
      {!collapsed && items.map(({ idx, ev }) => (
        <tr key={idx} className="border-t border-muted/50">
          <td className="px-2 py-1">
            <input
              type="checkbox"
              checked={selectedIndices.has(idx)}
              onChange={() => onToggleEvent(idx)}
              className="accent-primary"
            />
          </td>
          <td className="px-2 py-1 truncate max-w-[160px]" title={ev.title}>
            {ev.title}
          </td>
          <td className="px-2 py-1 text-muted-foreground whitespace-nowrap">
            {Math.floor(ev.startYear)}{ev.endYear ? `\u2013${Math.floor(ev.endYear)}` : ''}
          </td>
          <td className="px-2 py-1">
            <select
              value={laneAssignments.get(idx) || 'Other Activities'}
              onChange={(e) => onSetLane(idx, e.target.value)}
              className="w-full text-xs bg-transparent border rounded px-1 py-0.5"
            >
              {laneNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </td>
        </tr>
      ))}
    </>
  )
}

type GCalPhase = 'connect' | 'select-calendars' | 'loading-events' | 'select-events' | 'importing' | 'success'

interface GoogleCalendarTabProps {
  lanes: Lane[]
  addEvent: (event: Omit<TimelineEvent, 'id'>) => Promise<TimelineEvent | null>
  addLane: (lane: Omit<Lane, 'id' | 'order' | 'isDefault'>) => Promise<Lane | null>
  onDone: () => void
}

const GCAL_COLORS = [
  '#7986CB', '#33B679', '#8E24AA', '#E67C73', '#F6BF26',
  '#F4511E', '#039BE5', '#616161', '#3F51B5', '#0B8043',
  '#D50000', '#F09300',
]

function GoogleCalendarTab({ lanes, addEvent, addLane, onDone }: GoogleCalendarTabProps) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

  const [phase, setPhase] = useState<GCalPhase>('connect')
  const [error, setError] = useState('')
  const [token, setToken] = useState('')
  const [gisLoaded, setGisLoaded] = useState(false)
  const [connecting, setConnecting] = useState(false)

  // Calendar selection
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([])
  const [selectedCalIds, setSelectedCalIds] = useState<Set<string>>(new Set())

  // Events
  const [allEvents, setAllEvents] = useState<GoogleCalEvent[]>([])
  const [fetchProgress, setFetchProgress] = useState({ done: 0, total: 0 })
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set())
  const [laneAssignments, setLaneAssignments] = useState<Map<string, string>>(new Map())

  // Import
  const [importedCount, setImportedCount] = useState(0)
  const [importProgress, setImportProgress] = useState(0)

  // Load GIS script on mount
  useEffect(() => {
    if (!clientId) return
    loadGis().then(() => setGisLoaded(true)).catch(() => setError('Failed to load Google sign-in'))
  }, [clientId])

  // Group events by year (descending)
  const yearGroups = useMemo(() => {
    const groups = new Map<number, GoogleCalEvent[]>()
    for (const ev of allEvents) {
      const year = Math.floor(ev.startYear)
      const arr = groups.get(year)
      if (arr) arr.push(ev)
      else groups.set(year, [ev])
    }
    return [...groups.entries()].sort((a, b) => b[0] - a[0])
  }, [allEvents])

  const laneNames = lanes.map(l => l.name)

  const selectedCount = selectedEventIds.size

  // ── Connect ──
  const handleConnect = async () => {
    if (!clientId) return
    setError('')
    setConnecting(true)
    try {
      const result = await requestCalendarToken(clientId)
      setToken(result.access_token)
      // Fetch calendar list
      const cals = await fetchCalendarList(result.access_token)
      setCalendars(cals)
      // Pre-select primary calendar
      const preSelected = new Set<string>()
      for (const c of cals) {
        if (c.primary) preSelected.add(c.id)
      }
      if (preSelected.size === 0 && cals.length > 0) preSelected.add(cals[0].id)
      setSelectedCalIds(preSelected)
      setPhase('select-calendars')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect')
    } finally {
      setConnecting(false)
    }
  }

  // ── Fetch Events ──
  const handleFetchEvents = async () => {
    setPhase('loading-events')
    setError('')
    const selected = calendars.filter(c => selectedCalIds.has(c.id))
    setFetchProgress({ done: 0, total: selected.length })

    try {
      const results: GoogleCalEvent[] = []
      for (let i = 0; i < selected.length; i++) {
        const cal = selected[i]
        const events = await fetchCalendarEvents(token, cal.id, cal.summary)
        results.push(...events)
        setFetchProgress({ done: i + 1, total: selected.length })
      }

      if (results.length === 0) {
        setError('No events found in selected calendars')
        setPhase('select-calendars')
        return
      }

      setAllEvents(results)
      // Select all by default
      setSelectedEventIds(new Set(results.map(e => e.id)))
      // Auto-assign lanes
      const assignments = new Map<string, string>()
      for (const ev of results) {
        assignments.set(ev.id, mapCategoryToLane(ev.calendarName, laneNames))
      }
      setLaneAssignments(assignments)
      setPhase('select-events')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events')
      setPhase('select-calendars')
    }
  }

  // ── Year checkbox toggle ──
  const toggleYear = (year: number) => {
    const yearEvents = yearGroups.find(([y]) => y === year)?.[1] || []
    const allSelected = yearEvents.every(e => selectedEventIds.has(e.id))
    const next = new Set(selectedEventIds)
    for (const ev of yearEvents) {
      if (allSelected) next.delete(ev.id)
      else next.add(ev.id)
    }
    setSelectedEventIds(next)
  }

  // ── Import ──
  const handleImport = async () => {
    setPhase('importing')
    setImportProgress(0)

    // Collect unique new lane names needed
    const neededLanes = new Map<string, string>() // laneName -> color
    const existingLaneNames = new Set(lanes.map(l => l.name))
    for (const [evId, laneName] of laneAssignments) {
      if (selectedEventIds.has(evId) && !existingLaneNames.has(laneName) && !neededLanes.has(laneName)) {
        // Pick a color from calendar or fallback
        const ev = allEvents.find(e => e.id === evId)
        const cal = ev ? calendars.find(c => c.id === ev.calendarId) : undefined
        neededLanes.set(laneName, cal?.backgroundColor || GCAL_COLORS[neededLanes.size % GCAL_COLORS.length])
      }
    }

    // Create new lanes
    const laneNameToId = new Map<string, string>()
    for (const l of lanes) laneNameToId.set(l.name, l.id)
    for (const [name, color] of neededLanes) {
      const newLane = await addLane({ name, color, visible: true })
      if (newLane) laneNameToId.set(name, newLane.id)
    }

    // Import events
    const selected = allEvents.filter(e => selectedEventIds.has(e.id))
    let count = 0
    for (let i = 0; i < selected.length; i++) {
      const ev = selected[i]
      const laneName = laneAssignments.get(ev.id) || 'Other Activities'
      const laneId = laneNameToId.get(laneName)
      if (!laneId) continue
      const result = await addEvent({
        laneId,
        title: ev.title,
        description: ev.description,
        type: ev.endYear ? 'range' : 'point',
        startYear: ev.startYear,
        endYear: ev.endYear,
      })
      if (result) count++
      setImportProgress(i + 1)
    }
    setImportedCount(count)
    setPhase('success')
  }

  const handleReset = () => {
    setPhase('connect')
    setToken('')
    setCalendars([])
    setSelectedCalIds(new Set())
    setAllEvents([])
    setSelectedEventIds(new Set())
    setLaneAssignments(new Map())
    setImportedCount(0)
    setError('')
  }

  // ── No client ID ──
  if (!clientId) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <Globe className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground text-center">
          Google Calendar import requires a Google OAuth Client ID.<br />
          Set <code className="text-xs bg-muted px-1 py-0.5 rounded">VITE_GOOGLE_CLIENT_ID</code> in your .env file.
        </p>
      </div>
    )
  }

  // ── Success ──
  if (phase === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <p className="text-sm font-medium">Imported {importedCount} event{importedCount !== 1 ? 's' : ''}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>Import More</Button>
          <Button size="sm" onClick={onDone}>Done</Button>
        </div>
      </div>
    )
  }

  // ── Importing ──
  if (phase === 'importing') {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Importing events... {importProgress}/{selectedCount}
        </p>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${selectedCount > 0 ? (importProgress / selectedCount) * 100 : 0}%` }}
          />
        </div>
      </div>
    )
  }

  // ── Connect ──
  if (phase === 'connect') {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
          <Globe className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Connect your Google account to import calendar events
        </p>
        <Button
          variant="outline"
          className="gap-2"
          onClick={handleConnect}
          disabled={!gisLoaded || connecting}
        >
          {connecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Globe className="h-4 w-4" />
          )}
          {connecting ? 'Connecting...' : 'Connect Google Calendar'}
        </Button>
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
      </div>
    )
  }

  // ── Select Calendars ──
  if (phase === 'select-calendars') {
    return (
      <div className="flex flex-col gap-3 py-2">
        <p className="text-sm font-medium">Select calendars to import</p>
        <div className="max-h-48 overflow-y-auto space-y-1">
          {calendars.map(cal => (
            <label
              key={cal.id}
              className="flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer hover:bg-muted/50"
            >
              <input
                type="checkbox"
                checked={selectedCalIds.has(cal.id)}
                onChange={() => {
                  const next = new Set(selectedCalIds)
                  if (next.has(cal.id)) next.delete(cal.id)
                  else next.add(cal.id)
                  setSelectedCalIds(next)
                }}
                className="accent-primary"
              />
              <div
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: cal.backgroundColor }}
              />
              <span className="text-sm truncate">{cal.summary}</span>
              {cal.primary && <span className="text-[10px] text-muted-foreground ml-auto shrink-0">Primary</span>}
            </label>
          ))}
        </div>
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <Button onClick={handleFetchEvents} disabled={selectedCalIds.size === 0} className="w-full">
          Fetch Events
        </Button>
      </div>
    )
  }

  // ── Loading Events ──
  if (phase === 'loading-events') {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Fetching events... {fetchProgress.done}/{fetchProgress.total} calendar{fetchProgress.total !== 1 ? 's' : ''}
        </p>
      </div>
    )
  }

  // ── Select & Assign Events ──
  return (
    <div className="flex flex-col gap-3 py-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          {allEvents.length} event{allEvents.length !== 1 ? 's' : ''} found
        </p>
        <span className="text-xs text-muted-foreground">{selectedCount} selected</span>
      </div>

      <div className="max-h-72 overflow-y-auto rounded-md border">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted z-10">
            <tr>
              <th className="w-7 px-2 py-1.5" />
              <th className="text-left px-2 py-1.5 font-medium">Event</th>
              <th className="text-left px-2 py-1.5 font-medium w-20">Date</th>
              <th className="text-left px-2 py-1.5 font-medium w-28">Lane</th>
            </tr>
          </thead>
          <tbody>
            {yearGroups.map(([year, events]) => {
              const yearSelectedCount = events.filter(e => selectedEventIds.has(e.id)).length
              const allYearSelected = yearSelectedCount === events.length
              const someYearSelected = yearSelectedCount > 0 && !allYearSelected
              return (
                <YearGroup
                  key={year}
                  year={year}
                  events={events}
                  allSelected={allYearSelected}
                  someSelected={someYearSelected}
                  selectedEventIds={selectedEventIds}
                  laneAssignments={laneAssignments}
                  laneNames={laneNames}
                  calendars={calendars}
                  onToggleYear={() => toggleYear(year)}
                  onToggleEvent={(id) => {
                    const next = new Set(selectedEventIds)
                    if (next.has(id)) next.delete(id)
                    else next.add(id)
                    setSelectedEventIds(next)
                  }}
                  onSetLane={(id, lane) => {
                    const next = new Map(laneAssignments)
                    next.set(id, lane)
                    setLaneAssignments(next)
                  }}
                />
              )
            })}
          </tbody>
        </table>
      </div>

      <Button onClick={handleImport} disabled={selectedCount === 0} className="w-full">
        Import {selectedCount} Event{selectedCount !== 1 ? 's' : ''}
      </Button>
    </div>
  )
}

interface YearGroupProps {
  year: number
  events: GoogleCalEvent[]
  allSelected: boolean
  someSelected: boolean
  selectedEventIds: Set<string>
  laneAssignments: Map<string, string>
  laneNames: string[]
  calendars: GoogleCalendar[]
  onToggleYear: () => void
  onToggleEvent: (id: string) => void
  onSetLane: (id: string, lane: string) => void
}

function YearGroup({
  year, events, allSelected, someSelected,
  selectedEventIds, laneAssignments, laneNames, calendars,
  onToggleYear, onToggleEvent, onSetLane,
}: YearGroupProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      {/* Year header */}
      <tr className="bg-muted/50 border-t border-muted">
        <td className="px-2 py-1">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => { if (el) el.indeterminate = someSelected }}
            onChange={onToggleYear}
            className="accent-primary"
          />
        </td>
        <td
          colSpan={2}
          className="px-2 py-1 font-medium cursor-pointer select-none"
          onClick={() => setCollapsed(!collapsed)}
        >
          <span className="inline-flex items-center gap-1">
            <ChevronRight className={`h-3 w-3 transition-transform ${collapsed ? '' : 'rotate-90'}`} />
            {year}
          </span>
        </td>
        <td className="px-2 py-1 text-muted-foreground text-right">
          {events.length} event{events.length !== 1 ? 's' : ''}
        </td>
      </tr>
      {/* Event rows */}
      {!collapsed && events.map(ev => {
        const cal = calendars.find(c => c.id === ev.calendarId)
        const currentLane = laneAssignments.get(ev.id) || 'Other Activities'
        const isNewLane = !laneNames.includes(currentLane)
        return (
          <tr key={ev.id} className="border-t border-muted/50">
            <td className="px-2 py-1">
              <input
                type="checkbox"
                checked={selectedEventIds.has(ev.id)}
                onChange={() => onToggleEvent(ev.id)}
                className="accent-primary"
              />
            </td>
            <td className="px-2 py-1 truncate max-w-[160px]" title={ev.title}>
              {ev.title}
            </td>
            <td className="px-2 py-1 text-muted-foreground whitespace-nowrap">
              {Math.floor(ev.startYear)}{ev.endYear ? `\u2013${Math.floor(ev.endYear)}` : ''}
            </td>
            <td className="px-2 py-1">
              <select
                value={currentLane}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === '__create__') {
                    // Default new lane name = calendar name
                    onSetLane(ev.id, cal?.summary || 'New Lane')
                  } else {
                    onSetLane(ev.id, val)
                  }
                }}
                className={`w-full text-xs bg-transparent border rounded px-1 py-0.5 ${isNewLane ? 'text-primary font-medium' : ''}`}
              >
                {laneNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
                {isNewLane && (
                  <option value={currentLane}>+ {currentLane}</option>
                )}
                <option value="__create__">+ Create new lane...</option>
              </select>
              {isNewLane && (
                <input
                  type="text"
                  value={currentLane}
                  onChange={(e) => onSetLane(ev.id, e.target.value)}
                  className="w-full text-xs border rounded px-1 py-0.5 mt-0.5"
                  placeholder="Lane name"
                />
              )}
            </td>
          </tr>
        )
      })}
    </>
  )
}

function TextTab() {
  return (
    <div className="flex flex-col gap-4 py-4">
      <Textarea
        placeholder="Describe your events...&#10;&#10;e.g. &quot;I lived in NYC from 2015 to 2019, worked at Google from 2016 to 2020, graduated MIT in 2015&quot;"
        className="min-h-[140px] resize-none"
        disabled
      />
      <p className="text-xs text-muted-foreground">
        Describe events in natural language. Dates, date ranges, and descriptions will be parsed automatically.
      </p>
      <Button disabled className="w-full">Parse &amp; Import</Button>
    </div>
  )
}

function VoiceTab() {
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
        <Mic className="h-8 w-8 text-muted-foreground" />
      </div>
      <Button variant="outline" className="gap-2" onClick={() => {}}>
        <Mic className="h-4 w-4" />
        Start Recording
      </Button>
      <div className="w-full h-16 rounded-lg bg-muted/30 border border-dashed border-muted-foreground/20 flex items-center justify-center">
        <div className="flex items-end gap-0.5 h-8">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="w-1 rounded-full bg-muted-foreground/20"
              style={{ height: `${4 + Math.random() * 20}px` }}
            />
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Dictate your life events and they&apos;ll be transcribed and added to your timeline
      </p>
    </div>
  )
}

export function ImportDialog({ open, onOpenChange, defaultTab = 'calendar-file', lanes, addEvent, addLane }: ImportDialogProps) {
  const [activeTab, setActiveTab] = useState<ImportTab>(defaultTab)

  // Sync defaultTab when dialog opens with a different tab
  const handleOpenChange = (v: boolean) => {
    if (v) setActiveTab(defaultTab)
    onOpenChange(v)
  }

  const isWide = activeTab === 'google-calendar' || activeTab === 'calendar-file'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={isWide ? 'sm:max-w-2xl' : 'sm:max-w-md'}>
        <DialogHeader>
          <DialogTitle>Import Events</DialogTitle>
        </DialogHeader>

        {/* Tab navigation */}
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'calendar-file' && (
          <CalendarFileTab lanes={lanes} addEvent={addEvent} onDone={() => onOpenChange(false)} />
        )}
        {activeTab === 'google-calendar' && (
          <GoogleCalendarTab lanes={lanes} addEvent={addEvent} addLane={addLane} onDone={() => onOpenChange(false)} />
        )}
        {activeTab === 'text' && <TextTab />}
        {activeTab === 'voice' && <VoiceTab />}
      </DialogContent>
    </Dialog>
  )
}
