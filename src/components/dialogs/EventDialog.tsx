import { useState, useEffect } from 'react'
import type { Lane, TimelineEvent } from '@/types/timeline'
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

  useEffect(() => {
    if (editingEvent) {
      setLaneId(editingEvent.laneId)
      setTitle(editingEvent.title)
      setDescription(editingEvent.description)
      setType(editingEvent.type)
      setStartDate(fracYearToDateStr(editingEvent.startYear))
      setEndDate(editingEvent.endYear != null ? fracYearToDateStr(editingEvent.endYear) : '')
      setColor(editingEvent.color ?? '')
    } else {
      setLaneId(defaultLaneId ?? lanes[0]?.id ?? '')
      setTitle('')
      setDescription('')
      setType(defaultEndYear != null ? 'range' : defaultStartYear != null ? 'point' : 'range')
      setStartDate(defaultStartYear != null ? fracYearToDateStr(defaultStartYear) : '')
      setEndDate(defaultEndYear != null ? fracYearToDateStr(defaultEndYear) : '')
      setColor('')
    }
  }, [editingEvent, open, lanes, defaultLaneId, defaultStartYear, defaultEndYear])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !laneId || !startDate) return

    const data: Omit<TimelineEvent, 'id'> = {
      laneId,
      title: title.trim(),
      description: description.trim(),
      type,
      startYear: dateStrToFracYear(startDate),
      ...(type === 'range' && endDate ? { endYear: dateStrToFracYear(endDate) } : {}),
      ...(color ? { color } : {}),
    }
    onSave(data)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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
              <SelectTrigger id="lane">
                <SelectValue placeholder="Select lane" />
              </SelectTrigger>
              <SelectContent>
                {lanes.map(l => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
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
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
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
              <Input
                id="start"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                required
              />
            </div>
            {type === 'range' && (
              <div className="grid gap-1.5">
                <Label htmlFor="end">End Date</Label>
                <Input
                  id="end"
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
            )}
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
