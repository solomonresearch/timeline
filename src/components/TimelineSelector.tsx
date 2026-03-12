import { useState, useEffect } from 'react'
import { ChevronDown, Plus, Pencil, Trash2, X, Copy } from 'lucide-react'
import { useTimelineContext } from '@/contexts/TimelineContext'
import { fracYearToMs, msToFracYear } from '@/lib/constants'
import { fetchLanes } from '@/lib/api'
import type { DbLane } from '@/types/database'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

const DEFAULT_COLOR = '#3b82f6'

const EMOJI_OPTIONS = [
  '🌍','🌎','🌏','🗺️','📍','📌','🏠','🏡','🏢','🏗️',
  '🎓','📚','✏️','🔬','🧪','💼','💡','🚀','⭐','🏆',
  '❤️','💛','💚','💙','💜','🖤','🤍','🎯','🎨','🎵',
  '🚗','✈️','🚂','⛵','🏔️','🌊','🌲','🌸','🍀','☀️',
  '👶','👦','👧','🧑','👨','👩','🧓','👴','👵','👪',
  '💰','📈','🏅','🎉','🎂','🕯️','📅','⏳','🔑','💎',
]
const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ── Date helpers ──────────────────────────────────────────────────────────────

/** fracYear → "YYYY-MM-DD" (UTC) */
function fracYearToDateStr(fy: number): string {
  const d = new Date(fracYearToMs(fy))
  const y = d.getUTCFullYear().toString().padStart(4, '0')
  const mo = String(d.getUTCMonth() + 1).padStart(2, '0')
  const da = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${mo}-${da}`
}

/** fracYear → "HH:MM" (UTC) */
function fracYearToTimeStr(fy: number): string {
  const d = new Date(fracYearToMs(fy))
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}

/** "YYYY-MM-DD" + "HH:MM" → fracYear (UTC) */
function dateTimeToFracYear(dateStr: string, timeStr: string): number {
  if (!dateStr) return 0
  const [y, mo, da] = dateStr.split('-').map(Number)
  const [h, m] = (timeStr || '00:00').split(':').map(Number)
  return msToFracYear(Date.UTC(y, mo - 1, da, h || 0, m || 0))
}

/** fracYear → "1 Jan 1985, 00:00" */
export function fracYearToLabel(fy: number): string {
  const d = new Date(fracYearToMs(fy))
  const da = d.getUTCDate()
  const mo = MONTH_ABBR[d.getUTCMonth()]
  const y = d.getUTCFullYear()
  const h = String(d.getUTCHours()).padStart(2, '0')
  const mi = String(d.getUTCMinutes()).padStart(2, '0')
  return `${da} ${mo} ${y}, ${h}:${mi}`
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TimelineSelector() {
  const {
    timelines,
    selectedTimelineId,
    selectTimeline,
    createTimeline,
    copyTimelineData,
    updateTimeline,
    deleteTimeline,
  } = useTimelineContext()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [targetId, setTargetId] = useState<string | null>(null)

  // Form state
  const [nameValue, setNameValue] = useState('')
  const [emojiValue, setEmojiValue] = useState('')
  const [colorValue, setColorValue] = useState(DEFAULT_COLOR)
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('00:00')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('00:00')
  const [isPublic, setIsPublic] = useState(false)

  // Copy/duplicate state (create mode only)
  const [copySourceId, setCopySourceId] = useState('')
  const [copyFilter, setCopyFilter] = useState<'all' | 'past_current' | 'all_no_events' | 'lanes'>('all')
  const [copyLaneIds, setCopyLaneIds] = useState<Set<string>>(new Set())
  const [sourceLanes, setSourceLanes] = useState<DbLane[]>([])
  const [loadingSourceLanes, setLoadingSourceLanes] = useState(false)
  const [copying, setCopying] = useState(false)

  // Load lanes from source timeline when copy source changes
  useEffect(() => {
    if (!copySourceId) {
      setSourceLanes([])
      return
    }
    let cancelled = false
    setLoadingSourceLanes(true)
    fetchLanes(copySourceId).then(lanes => {
      if (cancelled) return
      setSourceLanes(lanes)
      setCopyLaneIds(new Set(lanes.map(l => l.id)))
      setLoadingSourceLanes(false)
    })
    return () => { cancelled = true }
  }, [copySourceId])

  const currentTimeline = timelines.find(t => t.id === selectedTimelineId)

  function handleCreate() {
    setDialogMode('create')
    setNameValue('')
    setEmojiValue('')
    setColorValue(DEFAULT_COLOR)
    setStartDate('')
    setStartTime('00:00')
    setEndDate('')
    setEndTime('00:00')
    setCopySourceId('')
    setCopyFilter('all')
    setCopyLaneIds(new Set())
    setSourceLanes([])
    setTargetId(null)
    setDialogOpen(true)
  }

  function handleEdit(id: string) {
    const t = timelines.find(tl => tl.id === id)
    if (!t) return
    setDialogMode('edit')
    setNameValue(t.name)
    setEmojiValue(t.emoji ?? '')
    setColorValue(t.color ?? DEFAULT_COLOR)
    if (t.start_year != null) {
      setStartDate(fracYearToDateStr(t.start_year))
      setStartTime(fracYearToTimeStr(t.start_year))
    } else {
      setStartDate('')
      setStartTime('00:00')
    }
    if (t.end_year != null) {
      setEndDate(fracYearToDateStr(t.end_year))
      setEndTime(fracYearToTimeStr(t.end_year))
    } else {
      setEndDate('')
      setEndTime('00:00')
    }
    setIsPublic(t.visibility === 'public')
    setTargetId(id)
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = nameValue.trim()
    if (!name) return

    if (dialogMode === 'create') {
      setCopying(true)
      const newId = await createTimeline(
        name,
        emojiValue.trim() || undefined,
        colorValue !== DEFAULT_COLOR ? colorValue : undefined,
      )
      if (newId && copySourceId) {
        await copyTimelineData(copySourceId, newId, {
          laneIds: copyFilter === 'lanes' ? [...copyLaneIds] : undefined,
          eventFilter: copyFilter === 'past_current' ? 'past_current'
            : copyFilter === 'all_no_events' ? 'none'
            : 'all',
        })
      }
      setCopying(false)
    } else if (targetId) {
      const start_year = startDate ? dateTimeToFracYear(startDate, startTime) : null
      const end_year = endDate ? dateTimeToFracYear(endDate, endTime) : null
      await updateTimeline(targetId, {
        name,
        emoji: emojiValue.trim() || null,
        color: colorValue,
        start_year,
        end_year,
        visibility: isPublic ? 'public' : 'private',
      })
    }
    setDialogOpen(false)
  }

  async function handleDelete(id: string) {
    if (timelines.length <= 1) return
    await deleteTimeline(id)
  }

  function toggleLane(laneId: string) {
    setCopyLaneIds(prev => {
      const next = new Set(prev)
      if (next.has(laneId)) next.delete(laneId)
      else next.add(laneId)
      return next
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="max-w-48 gap-1.5">
            {currentTimeline?.emoji ? (
              <span className="shrink-0">{currentTimeline.emoji}</span>
            ) : currentTimeline?.color ? (
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: currentTimeline.color }}
              />
            ) : null}
            <span className="truncate">{currentTimeline?.name ?? 'Timeline'}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <div className="max-h-[70vh] overflow-y-auto">
            {timelines.map(t => (
              <div key={t.id} className="flex items-center">
                <DropdownMenuItem
                  className="flex-1 gap-2"
                  onClick={() => selectTimeline(t.id)}
                >
                  {t.emoji ? (
                    <span className="shrink-0 text-base leading-none">{t.emoji}</span>
                  ) : t.color ? (
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: t.color }}
                    />
                  ) : null}
                  <div className="flex flex-col min-w-0">
                    <span className={`truncate ${t.id === selectedTimelineId ? 'font-semibold' : ''}`}>
                      {t.name}
                    </span>
                    {(t.start_year != null || t.end_year != null) && (
                      <span className="text-[10px] text-muted-foreground">
                        {t.start_year != null ? Math.floor(t.start_year) : '?'}
                        {' – '}
                        {t.end_year != null ? Math.floor(t.end_year) : '?'}
                      </span>
                    )}
                  </div>
                </DropdownMenuItem>
                <button
                  className="p-1 text-muted-foreground hover:text-foreground"
                  onClick={e => { e.stopPropagation(); handleEdit(t.id) }}
                >
                  <Pencil className="h-3 w-3" />
                </button>
                {timelines.length > 1 && (
                  <button
                    className="p-1 text-muted-foreground hover:text-destructive"
                    onClick={e => { e.stopPropagation(); handleDelete(t.id) }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Timeline...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? 'New Timeline' : 'Edit Timeline'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'create'
                ? 'Enter a name for the new timeline.'
                : 'Update the timeline details.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid gap-4">
            {/* Name row */}
            <div className="grid gap-1.5">
              <Label htmlFor="tlName">Name</Label>
              <Input
                id="tlName"
                value={nameValue}
                onChange={e => setNameValue(e.target.value)}
                placeholder="Timeline name"
                autoFocus
              />
            </div>

            {/* Emoji picker */}
            <div className="grid gap-1.5">
              <Label>Emoji <span className="text-muted-foreground">(optional)</span></Label>
              <div className="rounded-md border border-input p-2">
                <div className="flex flex-wrap gap-1">
                  {EMOJI_OPTIONS.map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setEmojiValue(emojiValue === em ? '' : em)}
                      className={`rounded px-1 py-0.5 text-lg leading-none transition-colors hover:bg-accent ${emojiValue === em ? 'bg-accent ring-2 ring-ring' : ''}`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
                {emojiValue && (
                  <div className="mt-2 flex items-center gap-2 border-t pt-2">
                    <span className="text-sm text-muted-foreground">Selected: <span className="text-lg">{emojiValue}</span></span>
                    <button
                      type="button"
                      onClick={() => setEmojiValue('')}
                      className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" /> Clear
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ── Duplicate from existing timeline (create mode only) ── */}
            {dialogMode === 'create' && (
              <div className="rounded-md border p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Copy className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Label className="text-sm font-medium">Duplicate from existing timeline</Label>
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs text-muted-foreground">Source timeline</Label>
                  <select
                    value={copySourceId}
                    onChange={e => { setCopySourceId(e.target.value); setCopyFilter('all') }}
                    className="h-8 text-sm border rounded-md px-2 bg-background w-full"
                  >
                    <option value="">— none (start fresh) —</option>
                    {timelines.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.emoji ? `${t.emoji} ` : ''}{t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {copySourceId && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">What to copy</Label>
                    <div className="space-y-1.5">
                      {(
                        [
                          { value: 'all', label: 'All lanes & events' },
                          { value: 'past_current', label: 'All lanes · past & ongoing events only' },
                          { value: 'lanes', label: 'Select specific lanes' },
                        ] as const
                      ).map(opt => (
                        <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                          <input
                            type="radio"
                            name="copyFilter"
                            value={opt.value}
                            checked={copyFilter === opt.value}
                            onChange={() => setCopyFilter(opt.value)}
                            className="h-3.5 w-3.5 accent-primary"
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>

                    {copyFilter === 'lanes' && (
                      <div className="mt-2 rounded-md border p-2 space-y-1 max-h-40 overflow-y-auto">
                        {loadingSourceLanes ? (
                          <p className="text-xs text-muted-foreground">Loading lanes…</p>
                        ) : sourceLanes.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No lanes found.</p>
                        ) : (
                          <>
                            <div className="flex gap-2 pb-1 border-b mb-1">
                              <button
                                type="button"
                                onClick={() => setCopyLaneIds(new Set(sourceLanes.map(l => l.id)))}
                                className="text-[11px] text-muted-foreground hover:text-foreground"
                              >
                                All
                              </button>
                              <button
                                type="button"
                                onClick={() => setCopyLaneIds(new Set())}
                                className="text-[11px] text-muted-foreground hover:text-foreground"
                              >
                                None
                              </button>
                            </div>
                            {sourceLanes.map(lane => (
                              <label key={lane.id} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={copyLaneIds.has(lane.id)}
                                  onChange={() => toggleLane(lane.id)}
                                  className="h-3.5 w-3.5 accent-primary"
                                />
                                <span
                                  className="h-2 w-2 rounded-full shrink-0"
                                  style={{ backgroundColor: lane.color }}
                                />
                                {lane.emoji ? `${lane.emoji} ` : ''}{lane.name}
                              </label>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {dialogMode === 'edit' && (
              <>
                {/* Color */}
                <div className="grid gap-1.5">
                  <Label htmlFor="tlColor">Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      id="tlColor"
                      type="color"
                      value={colorValue}
                      onChange={e => setColorValue(e.target.value)}
                      className="h-8 w-12 cursor-pointer rounded border border-input bg-transparent p-0.5"
                    />
                    <span className="text-sm text-muted-foreground font-mono">{colorValue}</span>
                  </div>
                </div>

                {/* Start date/time */}
                <div className="grid gap-1.5">
                  <Label>Start <span className="text-muted-foreground">(optional)</span></Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="time"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      className="w-28"
                      disabled={!startDate}
                    />
                  </div>
                </div>

                {/* End date/time */}
                <div className="grid gap-1.5">
                  <Label>End <span className="text-muted-foreground">(optional)</span></Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="time"
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      className="w-28"
                      disabled={!endDate}
                    />
                  </div>
                </div>

                {/* Visibility */}
                <div className="flex items-center justify-between">
                  <div className="grid gap-0.5">
                    <Label htmlFor="tlVisibility">Public</Label>
                    <p className="text-xs text-muted-foreground">Visible on your public profile</p>
                  </div>
                  <Switch
                    id="tlVisibility"
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                  />
                </div>
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={copying}>
                {copying ? 'Duplicating…' : dialogMode === 'create' ? 'Create' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
