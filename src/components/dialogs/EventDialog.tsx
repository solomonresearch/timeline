import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Plus, X, Smile, Link2, ChevronDown, ChevronUp, Star, Upload, ImageIcon } from 'lucide-react'
import { uploadEventImage } from '@/lib/imageUpload'
import type {
  Lane,
  TimelineEvent,
  EventLink,
  EventMetadata,
  ValueDeposit,
  ValueProjection,
  ValueSpotChange,
  ValueGrowthPeriod,
} from '@/types/timeline'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { fracYearToDMY, dmyToFracYear, formatDMYInput, fracYearToTimeStr, dmyTimeToFracYear, dateToFracYear } from '@/lib/constants'

const EMOJIS = [
  '👶','🎓','💼','🏠','❤️','💍','🤝','🏆','🎯','🌍',
  '✈️','🏖️','⛰️','🚗','🚂','🚢','🏡','🌆','🌄','🌊',
  '📚','✏️','🔬','💡','🖥️','📊','📱','🎵','🎮','🎨',
  '🏋️','🚴','⚽','🏊','🎉','🎁','🎂','🎭','🎬','🏅',
  '💰','💳','🏦','📈','📉','💎','🔑','📌','🌟','⭐',
  '☀️','🌙','❄️','🔥','🌈','⚡','🌱','🌳','🐶','🐱',
  '😊','🙏','👋','💪','🦁','🐸','🐦','🌺','🍕','🎪',
]

interface EventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lanes: Lane[]
  events?: TimelineEvent[]
  editingEvent?: TimelineEvent | null
  onSave: (data: Omit<TimelineEvent, 'id'>) => void
  defaultLaneId?: string
  defaultStartYear?: number
  defaultEndYear?: number
  userId?: string | null
}

interface DraftSpotChange { id: string; dateStr: string; amountStr: string; label: string }
interface DraftGrowthPeriod {
  id: string; startDateStr: string; endDateStr: string
  rateStr: string; applyOnNegative: boolean; wholeEvent: boolean
}
interface DraftDeposit {
  id: string; label: string; amount: string
  frequency: 'monthly' | 'yearly' | 'weekly' | 'daily' | 'quarterly' | 'custom'
  customIntervalStr: string; customUnit: 'day' | 'week' | 'month' | 'quarter' | 'year'
  annualGrowthStr: string
  wholeEvent: boolean; startDateStr: string; endDateStr: string
}

function newSpotChange(): DraftSpotChange {
  return { id: crypto.randomUUID(), dateStr: '', amountStr: '', label: '' }
}
function newGrowthPeriod(): DraftGrowthPeriod {
  return { id: crypto.randomUUID(), startDateStr: '', endDateStr: '', rateStr: '', applyOnNegative: false, wholeEvent: false }
}
function newDeposit(): DraftDeposit {
  return { id: crypto.randomUUID(), label: '', amount: '', frequency: 'monthly', customIntervalStr: '1', customUnit: 'month', annualGrowthStr: '', wholeEvent: false, startDateStr: '', endDateStr: '' }
}

export function EventDialog({
  open,
  onOpenChange,
  lanes,
  events = [],
  editingEvent,
  onSave,
  defaultLaneId,
  defaultStartYear,
  defaultEndYear,
  userId,
}: EventDialogProps) {
  const [laneId, setLaneId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [color, setColor] = useState('')
  const [emoji, setEmoji] = useState('')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [pointValueStr, setPointValueStr] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  // Value tracking (range events)
  const [visibility, setVisibility] = useState('public')

  const [valueEnabled, setValueEnabled] = useState(false)
  const [startValue, setStartValue] = useState('')
  const [spotChanges, setSpotChanges] = useState<DraftSpotChange[]>([])
  const [growthPeriods, setGrowthPeriods] = useState<DraftGrowthPeriod[]>([])
  const [deposits, setDeposits] = useState<DraftDeposit[]>([])

  // Enrichment fields
  const [url, setUrl] = useState('')
  const [location, setLocation] = useState('')
  const [rating, setRating] = useState<number>(0)
  const [imageUrl, setImageUrl] = useState('')
  const [tags, setTags] = useState('')       // comma-separated
  const [source, setSource] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [imageDragOver, setImageDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    if (userId) {
      setImageUploading(true)
      const url = await uploadEventImage(userId, file)
      setImageUploading(false)
      if (url) setImageUrl(url)
    } else {
      // Offline/demo: create object URL as temporary preview
      setImageUrl(URL.createObjectURL(file))
    }
  }, [userId])

  // Dependency link state
  const [linkEnabled, setLinkEnabled] = useState(false)
  const [linkAnchorType, setLinkAnchorType] = useState<'today' | 'event'>('today')
  const [linkEventId, setLinkEventId] = useState('')
  const [linkEventAnchor, setLinkEventAnchor] = useState<'start' | 'end'>('start')
  const [linkStartOffsetStr, setLinkStartOffsetStr] = useState('0')
  const [linkDurationStr, setLinkDurationStr] = useState('')
  const [linkOnDelete, setLinkOnDelete] = useState<'freeze' | 'delete'>('freeze')

  useEffect(() => {
    if (editingEvent) {
      setLaneId(editingEvent.laneId)
      setTitle(editingEvent.title)
      setDescription(editingEvent.description)
      setStartDate(fracYearToDMY(editingEvent.startYear))
      setEndDate(editingEvent.endYear != null ? fracYearToDMY(editingEvent.endYear) : '')
      setColor(editingEvent.color ?? '')
      setEmoji(editingEvent.emoji ?? '')
      setPointValueStr(editingEvent.pointValue != null ? String(editingEvent.pointValue) : '')
      setVisibility(editingEvent.visibility ?? 'public')
      const st = fracYearToTimeStr(editingEvent.startYear)
      setStartTime(st === '00:00' ? '' : st)
      const et = editingEvent.endYear != null ? fracYearToTimeStr(editingEvent.endYear) : ''
      setEndTime(et === '00:00' ? '' : et)

      const proj = editingEvent.valueProjection
      setValueEnabled(!!proj)
      if (proj) {
        setStartValue(proj.startValue != null ? String(proj.startValue) : '')
        setSpotChanges((proj.spotChanges ?? []).map(s => ({
          id: s.id,
          dateStr: fracYearToDMY(s.year),
          amountStr: String(s.amount),
          label: s.label ?? '',
        })))
        setGrowthPeriods((proj.growthPeriods ?? []).map(g => ({
          id: g.id,
          startDateStr: fracYearToDMY(g.startYear),
          endDateStr: fracYearToDMY(g.endYear),
          rateStr: String(g.growthPercent),
          applyOnNegative: g.applyOnNegative,
          wholeEvent: false,
        })))
        setDeposits((proj.deposits ?? []).map(d => ({
          id: d.id,
          label: d.label ?? '',
          amount: String(d.amount),
          frequency: d.frequency,
          customIntervalStr: String(d.customInterval ?? 1),
          customUnit: d.customUnit ?? 'month',
          annualGrowthStr: d.annualGrowthPercent != null ? String(d.annualGrowthPercent) : '',
          wholeEvent: false,
          startDateStr: fracYearToDMY(d.startYear),
          endDateStr: d.endYear != null ? fracYearToDMY(d.endYear) : '',
        })))
      } else {
        setStartValue('')
        setSpotChanges([])
        setGrowthPeriods([])
        setDeposits([])
      }
      // Enrichment
      setUrl(editingEvent.url ?? '')
      setLocation(editingEvent.location ?? '')
      setRating(editingEvent.rating ?? 0)
      setSource(editingEvent.source ?? '')
      const meta = editingEvent.metadata
      setImageUrl(meta?.image_url ?? '')
      setTags(meta?.tags ? meta.tags.join(', ') : '')
      setShowDetails(
        !!(editingEvent.url || editingEvent.location || editingEvent.rating || editingEvent.source || meta?.image_url || meta?.tags?.length)
      )
      // Link
      const lnk = editingEvent.link
      setLinkEnabled(!!lnk)
      setLinkAnchorType(lnk?.anchorType ?? 'today')
      setLinkEventId(lnk?.linkedEventId ?? '')
      setLinkEventAnchor(lnk?.linkedAnchor ?? 'start')
      setLinkStartOffsetStr(lnk ? String(lnk.startOffset) : '0')
      setLinkDurationStr(lnk?.duration != null ? String(lnk.duration) : '')
      setLinkOnDelete(lnk?.onDelete ?? 'freeze')
    } else {
      setLaneId(defaultLaneId ?? lanes[0]?.id ?? '')
      setTitle('')
      setDescription('')
      setStartDate(defaultStartYear != null ? fracYearToDMY(defaultStartYear) : '')
      setEndDate(defaultEndYear != null ? fracYearToDMY(defaultEndYear) : '')
      setColor('')
      setEmoji('')
      setPointValueStr('')
      setStartTime('')
      setEndTime('')
      setVisibility('public')
      setValueEnabled(false)
      setStartValue('')
      setSpotChanges([])
      setGrowthPeriods([])
      setDeposits([])
      setLinkEnabled(false)
      setLinkAnchorType('today')
      setLinkEventId('')
      setLinkEventAnchor('start')
      setLinkStartOffsetStr('0')
      setLinkDurationStr('')
      setLinkOnDelete('freeze')
      setUrl('')
      setLocation('')
      setRating(0)
      setImageUrl('')
      setTags('')
      setSource('')
      setShowDetails(false)
    }
  }, [editingEvent, open, lanes, defaultLaneId, defaultStartYear, defaultEndYear])

  // Compute resolved dates from the dependency link for preview
  const computedLink = useMemo(() => {
    if (!linkEnabled) return null
    const offset = parseFloat(linkStartOffsetStr) || 0
    let anchor: number | null = null
    if (linkAnchorType === 'today') {
      anchor = dateToFracYear(new Date())
    } else if (linkEventId) {
      const linked = events.find(e => e.id === linkEventId)
      if (linked) anchor = linkEventAnchor === 'end' ? (linked.endYear ?? linked.startYear) : linked.startYear
    }
    if (anchor === null) return null
    const startYear = anchor + offset
    const dur = parseFloat(linkDurationStr)
    const endYear = !isNaN(dur) && dur > 0 ? startYear + dur : undefined
    return { startYear, endYear }
  }, [linkEnabled, linkAnchorType, linkEventId, linkEventAnchor, linkStartOffsetStr, linkDurationStr, events])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // When link is active, start date isn't required (computed); otherwise validate
    if (!title.trim() || !laneId) return
    if (!linkEnabled && !startDate) return

    const isRange = !!endDate.trim()
    let valueProjectionOut: ValueProjection | undefined

    if (valueEnabled && isRange) {
      const evStart = dmyTimeToFracYear(startDate, startTime)
      const evEnd = endDate ? dmyTimeToFracYear(endDate, endTime) : evStart + 100

      const spots: ValueSpotChange[] = spotChanges
        .filter(s => s.dateStr && s.amountStr && !isNaN(Number(s.amountStr)))
        .map(s => ({
          id: s.id,
          year: dmyToFracYear(s.dateStr),
          amount: Number(s.amountStr),
          ...(s.label.trim() ? { label: s.label.trim() } : {}),
        }))
        .filter(s => !isNaN(s.year) && s.year >= evStart - 0.001 && s.year <= evEnd + 0.001)

      const periods: ValueGrowthPeriod[] = growthPeriods
        .filter(g => g.rateStr && !isNaN(Number(g.rateStr)))
        .map(g => ({
          id: g.id,
          startYear: g.wholeEvent ? evStart : dmyToFracYear(g.startDateStr),
          endYear: g.wholeEvent ? evEnd : dmyToFracYear(g.endDateStr),
          growthPercent: Number(g.rateStr),
          applyOnNegative: g.applyOnNegative,
        }))
        .filter(p => !isNaN(p.startYear) && !isNaN(p.endYear))

      const deps: ValueDeposit[] = deposits
        .filter(d => d.amount && !isNaN(Number(d.amount)) && (d.wholeEvent || d.startDateStr))
        .map(d => ({
          id: d.id,
          ...(d.label.trim() ? { label: d.label.trim() } : {}),
          amount: Number(d.amount),
          frequency: d.frequency,
          ...(d.frequency === 'custom' ? {
            customInterval: Number(d.customIntervalStr) || 1,
            customUnit: d.customUnit,
          } : {}),
          ...(d.annualGrowthStr && !isNaN(Number(d.annualGrowthStr)) && Number(d.annualGrowthStr) !== 0
            ? { annualGrowthPercent: Number(d.annualGrowthStr) } : {}),
          startYear: d.wholeEvent ? evStart : dmyToFracYear(d.startDateStr),
          ...(d.wholeEvent ? { endYear: evEnd } : d.endDateStr ? { endYear: dmyToFracYear(d.endDateStr) } : {}),
        }))
        .filter(d => !isNaN(d.startYear) && d.startYear >= evStart - 0.001)

      valueProjectionOut = {
        startValue: Number(startValue) || 0,
        spotChanges: spots,
        growthPeriods: periods,
        deposits: deps,
      }
    }

    const pv = !isRange && pointValueStr && !isNaN(Number(pointValueStr))
      ? Number(pointValueStr) : undefined

    // Resolve start/end from link or from date fields
    const resolvedStart = computedLink?.startYear ?? dmyTimeToFracYear(startDate, startTime)
    const resolvedEnd = computedLink?.endYear != null
      ? computedLink.endYear
      : isRange ? dmyTimeToFracYear(endDate, endTime) : undefined

    // Build link object
    let linkOut: EventLink | undefined
    if (linkEnabled) {
      const startOffset = parseFloat(linkStartOffsetStr) || 0
      const dur = parseFloat(linkDurationStr)
      linkOut = {
        anchorType: linkAnchorType,
        ...(linkAnchorType === 'event' ? {
          linkedEventId: linkEventId,
          linkedAnchor: linkEventAnchor,
          onDelete: linkOnDelete,
        } : {}),
        startOffset,
        ...(!isNaN(dur) && dur > 0 ? { duration: dur } : {}),
      }
    }

    // Build metadata
    const parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean)
    const metaOut: EventMetadata | undefined = (imageUrl.trim() || parsedTags.length)
      ? {
          ...(imageUrl.trim() ? { image_url: imageUrl.trim() } : {}),
          ...(parsedTags.length ? { tags: parsedTags } : {}),
        }
      : undefined

    const data: Omit<TimelineEvent, 'id'> = {
      laneId,
      title: title.trim(),
      description: description.trim(),
      type: resolvedEnd !== undefined ? 'range' : 'point',
      startYear: resolvedStart,
      ...(resolvedEnd !== undefined ? { endYear: resolvedEnd } : {}),
      ...(color ? { color } : {}),
      ...(emoji ? { emoji } : {}),
      ...(pv != null ? { pointValue: pv } : {}),
      ...(valueProjectionOut ? { valueProjection: valueProjectionOut } : {}),
      visibility,
      ...(linkOut ? { link: linkOut } : {}),
      ...(url.trim() ? { url: url.trim() } : {}),
      ...(location.trim() ? { location: location.trim() } : {}),
      ...(rating > 0 ? { rating } : {}),
      ...(source.trim() ? { source: source.trim() } : {}),
      ...(metaOut ? { metadata: metaOut } : {}),
    }
    onSave(data)
    onOpenChange(false)
  }

  // Spot changes CRUD
  function addSpotChange() { setSpotChanges(s => [...s, newSpotChange()]) }
  function removeSpotChange(i: number) { setSpotChanges(s => s.filter((_, j) => j !== i)) }
  function updateSpotChange(i: number, field: keyof DraftSpotChange, val: string) {
    setSpotChanges(s => s.map((sc, j) => j === i ? { ...sc, [field]: val } : sc))
  }

  // Growth periods CRUD
  function addGrowthPeriod() { setGrowthPeriods(g => [...g, newGrowthPeriod()]) }
  function removeGrowthPeriod(i: number) { setGrowthPeriods(g => g.filter((_, j) => j !== i)) }
  function updateGrowthPeriod(i: number, field: keyof DraftGrowthPeriod, val: string | boolean) {
    setGrowthPeriods(g => g.map((gp, j) => j === i ? { ...gp, [field]: val } : gp))
  }

  // Deposits CRUD
  function addDeposit() { setDeposits(d => [...d, newDeposit()]) }
  function removeDeposit(i: number) { setDeposits(d => d.filter((_, j) => j !== i)) }
  function updateDeposit(i: number, field: keyof DraftDeposit, val: string | boolean) {
    setDeposits(d => d.map((dep, j) => j === i ? { ...dep, [field]: val } : dep))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingEvent ? 'Edit Event' : 'Add Event'}</DialogTitle>
          <DialogDescription>
            {editingEvent ? 'Modify the event details below.' : 'Fill in the details for the new event.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="lane">Lane</Label>
            <Select value={laneId} onValueChange={setLaneId}>
              <SelectTrigger id="lane"><SelectValue placeholder="Select lane" /></SelectTrigger>
              <SelectContent>
                {lanes.map(l => <SelectItem key={l.id} value={l.id}>{l.emoji ? `${l.emoji} ${l.name}` : l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="desc">Description</Label>
            <Input id="desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Color</Label>
              <Input type="color" value={color || '#3b82f6'} onChange={e => setColor(e.target.value)} className="h-9 p-1" />
            </div>
            <div className="grid gap-1.5">
              <Label>Emoji</Label>
              <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="h-9 w-full border rounded-md flex items-center justify-center text-lg hover:bg-muted/50 transition-colors"
                    title="Pick emoji"
                  >
                    {emoji || <Smile className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-60 p-2" align="start">
                  <div className="grid grid-cols-10 gap-0.5">
                    {emoji && (
                      <button
                        type="button"
                        className="h-6 w-6 text-xs text-muted-foreground hover:bg-muted rounded flex items-center justify-center"
                        title="Clear emoji"
                        onClick={() => { setEmoji(''); setEmojiOpen(false) }}
                      >
                        ×
                      </button>
                    )}
                    {EMOJIS.map(em => (
                      <button
                        key={em}
                        type="button"
                        className="h-6 w-6 text-base hover:bg-muted rounded flex items-center justify-center leading-none"
                        onClick={() => { setEmoji(em); setEmojiOpen(false) }}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="start">Start Date</Label>
              <Input
                id="start" type="text"
                value={linkEnabled && computedLink ? fracYearToDMY(computedLink.startYear) : startDate}
                placeholder={linkEnabled ? '(computed)' : 'DD/MM/YYYY'}
                onChange={e => !linkEnabled && setStartDate(formatDMYInput(e.target.value))}
                disabled={linkEnabled}
                required={!linkEnabled}
                className={linkEnabled ? 'opacity-60' : ''}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="end">End Date <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                id="end" type="text"
                value={linkEnabled && computedLink?.endYear != null ? fracYearToDMY(computedLink.endYear) : endDate}
                placeholder={linkEnabled && computedLink?.endYear != null ? '(computed)' : 'DD/MM/YYYY'}
                onChange={e => !linkEnabled && setEndDate(formatDMYInput(e.target.value))}
                disabled={linkEnabled && computedLink?.endYear != null}
                className={linkEnabled && computedLink?.endYear != null ? 'opacity-60' : ''}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="starttime" className="text-xs text-muted-foreground">Start Time (optional)</Label>
              <Input id="starttime" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="h-8 text-xs" />
            </div>
            {endDate.trim() ? (
              <div className="grid gap-1.5">
                <Label htmlFor="endtime" className="text-xs text-muted-foreground">End Time (optional)</Label>
                <Input id="endtime" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="h-8 text-xs" />
              </div>
            ) : (
              <div className="grid gap-1.5">
                <Label htmlFor="pointval" className="text-xs text-muted-foreground">Point Value (optional)</Label>
                <Input id="pointval" type="number" value={pointValueStr} placeholder="e.g. 50000" onChange={e => setPointValueStr(e.target.value)} className="h-8 text-xs" />
              </div>
            )}
          </div>

          {/* ── More details (collapsible) ── */}
          <div className="rounded-md border">
            <button
              type="button"
              onClick={() => setShowDetails(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium hover:bg-muted/40 transition-colors rounded-md"
            >
              <span className="flex items-center gap-2">
                More details
                {(url || location || rating > 0 || imageUrl || tags || source) && (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" title="Has values" />
                )}
              </span>
              {showDetails ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {showDetails && (
              <div className="px-3 pb-3 space-y-3 border-t pt-3">
                {/* URL */}
                <div className="grid gap-1.5">
                  <Label htmlFor="ev-url" className="text-xs">URL <span className="text-muted-foreground font-normal">(link to article, post, activity…)</span></Label>
                  <Input id="ev-url" type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" className="h-8 text-xs" />
                </div>
                {/* Location */}
                <div className="grid gap-1.5">
                  <Label htmlFor="ev-location" className="text-xs">Location</Label>
                  <Input id="ev-location" value={location} onChange={e => setLocation(e.target.value)} placeholder="City, venue, address…" className="h-8 text-xs" />
                </div>
                {/* Rating */}
                <div className="grid gap-1.5">
                  <Label className="text-xs">Rating</Label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(rating === n ? 0 : n)}
                        className="p-0.5 rounded hover:scale-110 transition-transform"
                        title={`${n} star${n > 1 ? 's' : ''}`}
                      >
                        <Star className={`h-5 w-5 ${n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                      </button>
                    ))}
                    {rating > 0 && (
                      <button type="button" onClick={() => setRating(0)} className="ml-1 text-[10px] text-muted-foreground hover:text-foreground">clear</button>
                    )}
                  </div>
                </div>
                {/* Image upload */}
                <div className="grid gap-1.5">
                  <Label className="text-xs">Image <span className="text-muted-foreground font-normal">(photo, poster, map…)</span></Label>
                  {imageUrl ? (
                    <div className="relative rounded-md overflow-hidden">
                      <img
                        src={imageUrl}
                        alt="preview"
                        className="w-full max-h-32 object-cover"
                        onError={e => (e.currentTarget.style.display = 'none')}
                      />
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 rounded-full p-0.5 transition-colors"
                        title="Remove image"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`border-2 border-dashed rounded-md px-3 py-4 text-center transition-colors cursor-pointer ${imageDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-muted-foreground/60'}`}
                      onDragOver={e => { e.preventDefault(); setImageDragOver(true) }}
                      onDragLeave={() => setImageDragOver(false)}
                      onDrop={e => {
                        e.preventDefault()
                        setImageDragOver(false)
                        const file = e.dataTransfer.files[0]
                        if (file) handleImageFile(file)
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {imageUploading ? (
                        <p className="text-xs text-muted-foreground">Uploading…</p>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 pointer-events-none">
                          <div className="flex gap-2 text-muted-foreground">
                            <Upload className="h-4 w-4" />
                            <ImageIcon className="h-4 w-4" />
                          </div>
                          <p className="text-xs text-muted-foreground">Drag & drop or click to upload</p>
                          <p className="text-[10px] text-muted-foreground/60">Large images are compressed automatically</p>
                        </div>
                      )}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) handleImageFile(file)
                      e.target.value = ''
                    }}
                  />
                  <Input
                    type="url"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="Or paste image URL…"
                    className="h-8 text-xs"
                  />
                </div>
                {/* Tags */}
                <div className="grid gap-1.5">
                  <Label htmlFor="ev-tags" className="text-xs">Tags <span className="text-muted-foreground font-normal">(comma-separated)</span></Label>
                  <Input id="ev-tags" value={tags} onChange={e => setTags(e.target.value)} placeholder="travel, work, family…" className="h-8 text-xs" />
                  {tags && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                        <span key={tag} className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                {/* Source */}
                <div className="grid gap-1.5">
                  <Label htmlFor="ev-source" className="text-xs">Source <span className="text-muted-foreground font-normal">(import provenance)</span></Label>
                  <Input id="ev-source" value={source} onChange={e => setSource(e.target.value)} placeholder="strava, outlook, netflix, manual…" className="h-8 text-xs" />
                </div>
              </div>
            )}
          </div>

          {/* ── Value tracking (events with end date) ── */}
          {endDate.trim() && (
            <div className="rounded-md border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Value tracking</Label>
                <Switch checked={valueEnabled} onCheckedChange={setValueEnabled} />
              </div>

              {valueEnabled && (
                <>
                  {/* Starting value */}
                  <div className="flex items-center gap-2">
                    <Label className="text-xs shrink-0 text-muted-foreground">Starting value</Label>
                    <Input
                      type="number" value={startValue} placeholder="0"
                      onChange={e => setStartValue(e.target.value)}
                      className="w-36 h-7 text-xs"
                    />
                  </div>

                  {/* Spot changes */}
                  <div className="space-y-1.5 pt-1 border-t">
                    <Label className="text-xs text-muted-foreground">Spot changes (one-time, within event range)</Label>
                    {spotChanges.map((sc, i) => (
                      <div key={sc.id} className="flex gap-1.5 items-center">
                        <Input
                          type="text" value={sc.dateStr} placeholder="DD/MM/YYYY"
                          onChange={e => updateSpotChange(i, 'dateStr', formatDMYInput(e.target.value))}
                          className="w-28 h-7 text-xs"
                        />
                        <Input
                          type="number" value={sc.amountStr} placeholder="Amount (+/-)"
                          onChange={e => updateSpotChange(i, 'amountStr', e.target.value)}
                          className="flex-1 h-7 text-xs"
                        />
                        <Input
                          value={sc.label} placeholder="Label (opt)"
                          onChange={e => updateSpotChange(i, 'label', e.target.value)}
                          className="flex-1 h-7 text-xs"
                        />
                        <button type="button" onClick={() => removeSpotChange(i)} className="text-muted-foreground hover:text-destructive shrink-0">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addSpotChange} className="h-7 text-xs">
                      <Plus className="h-3 w-3 mr-1" /> Add spot change
                    </Button>
                  </div>

                  {/* Growth periods */}
                  <div className="space-y-1.5 pt-1 border-t">
                    <Label className="text-xs text-muted-foreground">Annual growth periods</Label>
                    {growthPeriods.map((gp, i) => (
                      <div key={gp.id} className="rounded border p-2 space-y-1.5">
                        <div className="flex gap-1 items-center">
                          <label className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0 cursor-pointer select-none">
                            <input
                              type="checkbox" checked={gp.wholeEvent}
                              onChange={e => updateGrowthPeriod(i, 'wholeEvent', e.target.checked)}
                              className="h-3 w-3"
                            />
                            Whole event
                          </label>
                          <Input
                            type="text"
                            value={gp.wholeEvent ? startDate : gp.startDateStr}
                            placeholder="DD/MM/YYYY"
                            disabled={gp.wholeEvent}
                            onChange={e => updateGrowthPeriod(i, 'startDateStr', formatDMYInput(e.target.value))}
                            className="flex-1 h-7 text-xs"
                          />
                          <span className="text-[10px] text-muted-foreground shrink-0">→</span>
                          <Input
                            type="text"
                            value={gp.wholeEvent ? endDate : gp.endDateStr}
                            placeholder="DD/MM/YYYY"
                            disabled={gp.wholeEvent}
                            onChange={e => updateGrowthPeriod(i, 'endDateStr', formatDMYInput(e.target.value))}
                            className="flex-1 h-7 text-xs"
                          />
                          <Input
                            type="number" step="0.1" value={gp.rateStr} placeholder="Rate"
                            onChange={e => updateGrowthPeriod(i, 'rateStr', e.target.value)}
                            className="w-16 h-7 text-xs"
                          />
                          <span className="text-[10px] shrink-0">%</span>
                          <button type="button" onClick={() => removeGrowthPeriod(i)} className="text-muted-foreground hover:text-destructive shrink-0">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <label className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer select-none">
                          <input
                            type="checkbox" checked={gp.applyOnNegative}
                            onChange={e => updateGrowthPeriod(i, 'applyOnNegative', e.target.checked)}
                            className="h-3 w-3"
                          />
                          Apply growth on negative balance
                        </label>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addGrowthPeriod} className="h-7 text-xs">
                      <Plus className="h-3 w-3 mr-1" /> Add growth period
                    </Button>
                  </div>

                  {/* Recurring changes */}
                  <div className="space-y-1.5 pt-1 border-t">
                    <Label className="text-xs text-muted-foreground">Recurring changes (within event range)</Label>
                    {deposits.map((dep, i) => (
                      <div key={dep.id} className="rounded border p-2 space-y-1.5">
                        <div className="flex gap-1 items-center">
                          <Input
                            value={dep.label} placeholder="Label (opt)"
                            onChange={e => updateDeposit(i, 'label', e.target.value)}
                            className="flex-1 h-7 text-xs"
                          />
                          <Input
                            type="number" value={dep.amount} placeholder="Amount (+/-)"
                            onChange={e => updateDeposit(i, 'amount', e.target.value)}
                            className="w-28 h-7 text-xs"
                          />
                          <button type="button" onClick={() => removeDeposit(i)} className="text-muted-foreground hover:text-destructive shrink-0">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex gap-1 items-center flex-wrap">
                          <select
                            value={dep.frequency}
                            onChange={e => updateDeposit(i, 'frequency', e.target.value)}
                            className="h-7 text-xs border rounded-md px-1 bg-background"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="yearly">Yearly</option>
                            <option value="custom">Each X…</option>
                          </select>
                          {dep.frequency === 'custom' && (
                            <>
                              <Input
                                type="number" min="1" value={dep.customIntervalStr} placeholder="1"
                                onChange={e => updateDeposit(i, 'customIntervalStr', e.target.value)}
                                className="w-14 h-7 text-xs"
                              />
                              <select
                                value={dep.customUnit}
                                onChange={e => updateDeposit(i, 'customUnit', e.target.value)}
                                className="h-7 text-xs border rounded-md px-1 bg-background"
                              >
                                <option value="day">day(s)</option>
                                <option value="week">week(s)</option>
                                <option value="month">month(s)</option>
                                <option value="quarter">quarter(s)</option>
                                <option value="year">year(s)</option>
                              </select>
                            </>
                          )}
                          <span className="text-[10px] text-muted-foreground shrink-0">grows</span>
                          <Input
                            type="number" step="0.1" value={dep.annualGrowthStr} placeholder="0"
                            onChange={e => updateDeposit(i, 'annualGrowthStr', e.target.value)}
                            className="w-16 h-7 text-xs"
                          />
                          <span className="text-[10px] text-muted-foreground shrink-0">%/yr</span>
                        </div>
                        <div className="flex gap-1 items-center">
                          <label className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0 cursor-pointer select-none">
                            <input
                              type="checkbox" checked={dep.wholeEvent}
                              onChange={e => updateDeposit(i, 'wholeEvent', e.target.checked)}
                              className="h-3 w-3"
                            />
                            Whole event
                          </label>
                          <Input
                            type="text"
                            value={dep.wholeEvent ? startDate : dep.startDateStr}
                            placeholder="From DD/MM/YYYY"
                            disabled={dep.wholeEvent}
                            onChange={e => updateDeposit(i, 'startDateStr', formatDMYInput(e.target.value))}
                            className="flex-1 h-7 text-xs"
                          />
                          <Input
                            type="text"
                            value={dep.wholeEvent ? endDate : dep.endDateStr}
                            placeholder="To DD/MM/YYYY"
                            disabled={dep.wholeEvent}
                            onChange={e => updateDeposit(i, 'endDateStr', formatDMYInput(e.target.value))}
                            className="flex-1 h-7 text-xs"
                          />
                        </div>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addDeposit} className="h-7 text-xs">
                      <Plus className="h-3 w-3 mr-1" /> Add recurring change
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Dependency link ── */}
          <div className="rounded-md border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Dependency</Label>
              </div>
              <Switch checked={linkEnabled} onCheckedChange={setLinkEnabled} />
            </div>

            {linkEnabled && (
              <div className="space-y-3">
                {/* Anchor type */}
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground shrink-0 w-20">Anchor to</Label>
                  <select
                    value={linkAnchorType}
                    onChange={e => setLinkAnchorType(e.target.value as 'today' | 'event')}
                    className="h-7 text-xs border rounded-md px-1 bg-background flex-1"
                  >
                    <option value="today">Today's date</option>
                    <option value="event">Another event</option>
                  </select>
                </div>

                {/* Event picker + anchor point */}
                {linkAnchorType === 'event' && (
                  <>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground shrink-0 w-20">Event</Label>
                      <select
                        value={linkEventId}
                        onChange={e => setLinkEventId(e.target.value)}
                        className="h-7 text-xs border rounded-md px-1 bg-background flex-1 min-w-0"
                      >
                        <option value="">— select event —</option>
                        {events
                          .filter(e => e.id !== editingEvent?.id)
                          .map(e => {
                            const lane = lanes.find(l => l.id === e.laneId)
                            return (
                              <option key={e.id} value={e.id}>
                                {lane ? `[${lane.name}] ` : ''}{e.emoji ? `${e.emoji} ` : ''}{e.title}
                              </option>
                            )
                          })}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground shrink-0 w-20">Anchor at</Label>
                      <select
                        value={linkEventAnchor}
                        onChange={e => setLinkEventAnchor(e.target.value as 'start' | 'end')}
                        className="h-7 text-xs border rounded-md px-1 bg-background"
                      >
                        <option value="start">Start of event</option>
                        <option value="end">End of event</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Start offset */}
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground shrink-0 w-20">Start offset</Label>
                  <Input
                    type="number" step="0.01" value={linkStartOffsetStr}
                    onChange={e => setLinkStartOffsetStr(e.target.value)}
                    className="w-24 h-7 text-xs"
                    placeholder="0"
                  />
                  <span className="text-xs text-muted-foreground">years (− before, + after)</span>
                </div>

                {/* Duration */}
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground shrink-0 w-20">Duration</Label>
                  <Input
                    type="number" step="0.01" min="0" value={linkDurationStr}
                    onChange={e => setLinkDurationStr(e.target.value)}
                    className="w-24 h-7 text-xs"
                    placeholder="optional"
                  />
                  <span className="text-xs text-muted-foreground">years (sets end date)</span>
                </div>

                {/* Computed preview */}
                {computedLink ? (
                  <div className="rounded bg-muted/50 px-2 py-1.5 text-xs text-muted-foreground space-y-0.5">
                    <div>Start → <span className="text-foreground font-medium">{fracYearToDMY(computedLink.startYear)}</span></div>
                    {computedLink.endYear != null && (
                      <div>End → <span className="text-foreground font-medium">{fracYearToDMY(computedLink.endYear)}</span></div>
                    )}
                  </div>
                ) : linkAnchorType === 'event' && !linkEventId ? (
                  <p className="text-xs text-muted-foreground italic">Select an event to preview computed dates.</p>
                ) : null}

                {/* On delete behaviour (not shown for today anchor) */}
                {linkAnchorType === 'event' && (
                  <div className="space-y-1 pt-1 border-t">
                    <Label className="text-xs text-muted-foreground">If linked event is deleted</Label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setLinkOnDelete('freeze')}
                        className={`flex-1 h-7 rounded-md border text-xs transition-colors ${linkOnDelete === 'freeze' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted/50'}`}
                      >
                        Freeze dates
                      </button>
                      <button
                        type="button"
                        onClick={() => setLinkOnDelete('delete')}
                        className={`flex-1 h-7 rounded-md border text-xs transition-colors ${linkOnDelete === 'delete' ? 'bg-destructive text-destructive-foreground border-destructive' : 'bg-background hover:bg-muted/50'}`}
                      >
                        Delete this event too
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Public event</p>
              <p className="text-xs text-muted-foreground">Visible on your public profile</p>
            </div>
            <Switch checked={visibility === 'public'} onCheckedChange={v => setVisibility(v ? 'public' : 'secret')} />
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{editingEvent ? 'Save Changes' : 'Add Event'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
