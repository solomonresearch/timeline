import { useState, useRef, useCallback } from 'react'
import { CalendarDays, Globe, FileText, Mic, Upload, CheckCircle2, AlertCircle, X } from 'lucide-react'
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

export type ImportTab = 'calendar-file' | 'google-calendar' | 'text' | 'voice'

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: ImportTab
  lanes: Lane[]
  addEvent: (event: Omit<TimelineEvent, 'id'>) => Promise<TimelineEvent | null>
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
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [importing, setImporting] = useState(false)
  const [importedCount, setImportedCount] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const laneNames = lanes.map(l => l.name)

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
    // Reset so the same file can be re-selected
    e.target.value = ''
  }, [processFile])

  const handleImport = async () => {
    setImporting(true)
    let count = 0
    for (let i = 0; i < parsedEvents.length; i++) {
      const ev = parsedEvents[i]
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
    }
    setImportedCount(count)
    setImporting(false)
  }

  const handleReset = () => {
    setParsedEvents([])
    setFileName('')
    setError('')
    setImportedCount(0)
    setLaneAssignments(new Map())
  }

  // After successful import, show success state
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

  // Preview parsed events
  if (parsedEvents.length > 0) {
    return (
      <div className="flex flex-col gap-3 py-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            {parsedEvents.length} event{parsedEvents.length !== 1 ? 's' : ''} from {fileName}
          </p>
          <button onClick={handleReset} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-60 overflow-y-auto rounded-md border">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted">
              <tr>
                <th className="text-left px-2 py-1.5 font-medium">Event</th>
                <th className="text-left px-2 py-1.5 font-medium w-20">Year</th>
                <th className="text-left px-2 py-1.5 font-medium w-28">Lane</th>
              </tr>
            </thead>
            <tbody>
              {parsedEvents.map((ev, i) => (
                <tr key={i} className="border-t border-muted">
                  <td className="px-2 py-1.5 truncate max-w-[140px]" title={ev.title}>{ev.title}</td>
                  <td className="px-2 py-1.5 text-muted-foreground">
                    {Math.floor(ev.startYear)}{ev.endYear ? `–${Math.floor(ev.endYear)}` : ''}
                  </td>
                  <td className="px-2 py-1.5">
                    <select
                      value={laneAssignments.get(i) || 'Other Activities'}
                      onChange={(e) => {
                        const next = new Map(laneAssignments)
                        next.set(i, e.target.value)
                        setLaneAssignments(next)
                      }}
                      className="w-full text-xs bg-transparent border rounded px-1 py-0.5"
                    >
                      {laneNames.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Button onClick={handleImport} disabled={importing} className="w-full">
          {importing ? 'Importing...' : `Import ${parsedEvents.length} Event${parsedEvents.length !== 1 ? 's' : ''}`}
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

function GoogleCalendarTab() {
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="flex flex-col items-center gap-3 w-full">
        <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
          <Globe className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Connect your Google account to import calendar events
        </p>
        <Button variant="outline" className="gap-2" onClick={() => {}}>
          <Globe className="h-4 w-4" />
          Connect Google Calendar
        </Button>
      </div>
      <div className="w-full mt-2 space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Your calendars</p>
        {['Personal', 'Work', 'Birthdays'].map(name => (
          <div key={name} className="flex items-center gap-2 rounded-md border px-3 py-2 opacity-50">
            <div className="h-3 w-3 rounded-full bg-muted-foreground/30" />
            <span className="text-sm text-muted-foreground">{name}</span>
          </div>
        ))}
      </div>
    </div>
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

export function ImportDialog({ open, onOpenChange, defaultTab = 'calendar-file', lanes, addEvent }: ImportDialogProps) {
  const [activeTab, setActiveTab] = useState<ImportTab>(defaultTab)

  // Sync defaultTab when dialog opens with a different tab
  const handleOpenChange = (v: boolean) => {
    if (v) setActiveTab(defaultTab)
    onOpenChange(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
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
        {activeTab === 'google-calendar' && <GoogleCalendarTab />}
        {activeTab === 'text' && <TextTab />}
        {activeTab === 'voice' && <VoiceTab />}
      </DialogContent>
    </Dialog>
  )
}
