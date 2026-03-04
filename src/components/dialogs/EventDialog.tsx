import { useState, useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import type { Lane, TimelineEvent, ValueDataPoint, ValueDeposit, ValueProjection } from '@/types/timeline'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { fracYearToDateStr, dateStrToFracYear } from '@/lib/constants'

interface EventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lanes: Lane[]
  editingEvent?: TimelineEvent | null
  onSave: (data: Omit<TimelineEvent, 'id'>) => void
  defaultLaneId?: string
  defaultStartYear?: number
  defaultEndYear?: number
}

interface DraftPoint { dateStr: string; valueStr: string }
interface DraftDeposit {
  id: string; label: string; amount: string
  frequency: 'monthly' | 'yearly' | 'weekly'
  startDateStr: string; endDateStr: string
}

function newDeposit(): DraftDeposit {
  return { id: crypto.randomUUID(), label: '', amount: '', frequency: 'monthly', startDateStr: '', endDateStr: '' }
}

export function EventDialog({
  open,
  onOpenChange,
  lanes,
  editingEvent,
  onSave,
  defaultLaneId,
  defaultStartYear,
  defaultEndYear,
}: EventDialogProps) {
  const [laneId, setLaneId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'range' | 'point'>('range')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [color, setColor] = useState('')

  // Value tracking
  const [valueEnabled, setValueEnabled] = useState(false)
  const [valuePoints, setValuePoints] = useState<DraftPoint[]>([])
  const [growthPercent, setGrowthPercent] = useState('')
  const [deposits, setDeposits] = useState<DraftDeposit[]>([])

  useEffect(() => {
    if (editingEvent) {
      setLaneId(editingEvent.laneId)
      setTitle(editingEvent.title)
      setDescription(editingEvent.description)
      setType(editingEvent.type)
      setStartDate(fracYearToDateStr(editingEvent.startYear))
      setEndDate(editingEvent.endYear != null ? fracYearToDateStr(editingEvent.endYear) : '')
      setColor(editingEvent.color ?? '')

      const pts = editingEvent.valuePoints ?? []
      const proj = editingEvent.valueProjection
      setValueEnabled(pts.length > 0 || !!proj)
      setValuePoints(pts.map(p => ({ dateStr: fracYearToDateStr(p.year), valueStr: String(p.value) })))
      setGrowthPercent(proj?.growthPercent ? String(proj.growthPercent) : '')
      setDeposits(proj?.deposits?.map(d => ({
        id: d.id,
        label: d.label ?? '',
        amount: String(d.amount),
        frequency: d.frequency,
        startDateStr: fracYearToDateStr(d.startYear),
        endDateStr: d.endYear != null ? fracYearToDateStr(d.endYear) : '',
      })) ?? [])
    } else {
      setLaneId(defaultLaneId ?? lanes[0]?.id ?? '')
      setTitle('')
      setDescription('')
      setType(defaultEndYear != null ? 'range' : defaultStartYear != null ? 'point' : 'range')
      setStartDate(defaultStartYear != null ? fracYearToDateStr(defaultStartYear) : '')
      setEndDate(defaultEndYear != null ? fracYearToDateStr(defaultEndYear) : '')
      setColor('')
      setValueEnabled(false)
      setValuePoints([])
      setGrowthPercent('')
      setDeposits([])
    }
  }, [editingEvent, open, lanes, defaultLaneId, defaultStartYear, defaultEndYear])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !laneId || !startDate) return

    // Build value fields
    let valuePointsOut: ValueDataPoint[] | undefined
    let valueProjectionOut: ValueProjection | undefined

    if (valueEnabled && type === 'range') {
      const pts = valuePoints
        .filter(p => p.dateStr !== '' && p.valueStr !== '')
        .map(p => ({ year: dateStrToFracYear(p.dateStr), value: Number(p.valueStr) }))
        .filter(p => !isNaN(p.value) && !isNaN(p.year))
      if (pts.length > 0) {
        valuePointsOut = pts.sort((a, b) => a.year - b.year)
        const deps: ValueDeposit[] = deposits
          .filter(d => d.startDateStr && d.amount && !isNaN(Number(d.amount)))
          .map(d => ({
            id: d.id,
            ...(d.label.trim() ? { label: d.label.trim() } : {}),
            amount: Number(d.amount),
            frequency: d.frequency,
            startYear: dateStrToFracYear(d.startDateStr),
            ...(d.endDateStr ? { endYear: dateStrToFracYear(d.endDateStr) } : {}),
          }))
        if (Number(growthPercent) || deps.length > 0) {
          valueProjectionOut = { growthPercent: Number(growthPercent) || 0, deposits: deps }
        }
      }
    }

    const data: Omit<TimelineEvent, 'id'> = {
      laneId,
      title: title.trim(),
      description: description.trim(),
      type,
      startYear: dateStrToFracYear(startDate),
      ...(type === 'range' && endDate ? { endYear: dateStrToFracYear(endDate) } : {}),
      ...(color ? { color } : {}),
      ...(valuePointsOut ? { valuePoints: valuePointsOut } : { valuePoints: [] }),
      valueProjection: valueProjectionOut,
    }
    onSave(data)
    onOpenChange(false)
  }

  function addPoint() { setValuePoints(p => [...p, { dateStr: '', valueStr: '' }]) }
  function removePoint(i: number) { setValuePoints(p => p.filter((_, j) => j !== i)) }
  function updatePoint(i: number, field: keyof DraftPoint, val: string) {
    setValuePoints(p => p.map((pt, j) => j === i ? { ...pt, [field]: val } : pt))
  }

  function addDeposit() { setDeposits(d => [...d, newDeposit()]) }
  function removeDeposit(i: number) { setDeposits(d => d.filter((_, j) => j !== i)) }
  function updateDeposit(i: number, field: keyof DraftDeposit, val: string) {
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
                {lanes.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
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
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={v => setType(v as 'range' | 'point')}>
                <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="range">Range</SelectItem>
                  <SelectItem value="point">Point</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="color">Color (optional)</Label>
              <Input id="color" type="color" value={color || '#3b82f6'} onChange={e => setColor(e.target.value)} className="h-9 p-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="start">{type === 'range' ? 'Start Date' : 'Date'}</Label>
              <Input id="start" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
            {type === 'range' && (
              <div className="grid gap-1.5">
                <Label htmlFor="end">End Date</Label>
                <Input id="end" type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            )}
          </div>

          {/* ── Value tracking (range events only) ── */}
          {type === 'range' && (
            <div className="rounded-md border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Value tracking</Label>
                <Switch checked={valueEnabled} onCheckedChange={setValueEnabled} />
              </div>

              {valueEnabled && (
                <>
                  {/* Historical data points */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Historical data points</Label>
                    {valuePoints.map((pt, i) => (
                      <div key={i} className="flex gap-1.5 items-center">
                        <Input
                          type="date" value={pt.dateStr}
                          onChange={e => updatePoint(i, 'dateStr', e.target.value)}
                          className="flex-1 h-7 text-xs"
                        />
                        <Input
                          type="number" value={pt.valueStr} placeholder="Value"
                          onChange={e => updatePoint(i, 'valueStr', e.target.value)}
                          className="flex-1 h-7 text-xs"
                        />
                        <button type="button" onClick={() => removePoint(i)} className="text-muted-foreground hover:text-destructive shrink-0">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addPoint} className="h-7 text-xs">
                      <Plus className="h-3 w-3 mr-1" /> Add data point
                    </Button>
                  </div>

                  {/* Future projection */}
                  <div className="space-y-1.5 pt-1 border-t">
                    <Label className="text-xs text-muted-foreground">Future projection</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs shrink-0">Annual growth</span>
                      <Input
                        type="number" step="0.1" value={growthPercent} placeholder="0"
                        onChange={e => setGrowthPercent(e.target.value)}
                        className="w-20 h-7 text-xs"
                      />
                      <span className="text-xs">%</span>
                    </div>

                    {/* Recurring deposits / withdrawals */}
                    {deposits.length > 0 && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Recurring changes</Label>
                        {deposits.map((dep, i) => (
                          <div key={dep.id} className="grid gap-1">
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
                              <select
                                value={dep.frequency}
                                onChange={e => updateDeposit(i, 'frequency', e.target.value)}
                                className="h-7 text-xs border rounded-md px-1 bg-background"
                              >
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                                <option value="weekly">Weekly</option>
                              </select>
                              <button type="button" onClick={() => removeDeposit(i)} className="text-muted-foreground hover:text-destructive shrink-0">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="flex gap-1 items-center pl-1">
                              <span className="text-[10px] text-muted-foreground w-8">From</span>
                              <Input
                                type="date" value={dep.startDateStr}
                                onChange={e => updateDeposit(i, 'startDateStr', e.target.value)}
                                className="flex-1 h-7 text-xs"
                              />
                              <span className="text-[10px] text-muted-foreground w-4">To</span>
                              <Input
                                type="date" value={dep.endDateStr} placeholder="open"
                                onChange={e => updateDeposit(i, 'endDateStr', e.target.value)}
                                className="flex-1 h-7 text-xs"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <Button type="button" variant="outline" size="sm" onClick={addDeposit} className="h-7 text-xs">
                      <Plus className="h-3 w-3 mr-1" /> Add recurring change
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{editingEvent ? 'Save Changes' : 'Add Event'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
