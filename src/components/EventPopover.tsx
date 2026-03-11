import { useEffect, useRef } from 'react'
import { Pencil, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TimelineEvent } from '@/types/timeline'
import { fracYearToDMY, fracYearToTimeStr } from '@/lib/constants'
import { formatValue } from '@/lib/valueCompute'

interface EventPopoverProps {
  event: TimelineEvent
  anchorEl: HTMLElement
  anchorX: number
  anchorY: number
  laneName: string
  laneEmoji?: string
  onEdit: (event: TimelineEvent) => void
  onDelete: (event: TimelineEvent) => void
  onClose: () => void
}

export function EventPopover({ event, anchorEl, anchorX, anchorY, laneName, laneEmoji, onEdit, onDelete, onClose }: EventPopoverProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node) && !anchorEl.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [anchorEl, onClose])

  const left = Math.min(anchorX, window.innerWidth - 272)
  const top = anchorY + 8

  return (
    <div
      ref={ref}
      className="fixed z-50 w-64 rounded-md border bg-popover p-3 text-popover-foreground shadow-md"
      style={{ left, top }}
    >
      <div className="flex items-start justify-between mb-1">
        <h4 className="text-sm font-semibold">
          {event.emoji && <span className="mr-1">{event.emoji}</span>}
          {event.title}
        </h4>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="text-xs text-muted-foreground mb-1">{laneEmoji && <span className="mr-1">{laneEmoji}</span>}{laneName}</p>
      {event.description && <p className="text-xs mb-1">{event.description}</p>}
      <p className={`text-xs text-muted-foreground ${event.pointValue == null ? 'mb-3' : 'mb-1'}`}>
        {event.type === 'point'
          ? (() => { const t = fracYearToTimeStr(event.startYear); return t !== '00:00' ? `${fracYearToDMY(event.startYear)} ${t}` : fracYearToDMY(event.startYear) })()
          : (() => {
              const st = fracYearToTimeStr(event.startYear)
              const et = event.endYear != null ? fracYearToTimeStr(event.endYear) : null
              const startStr = st !== '00:00' ? `${fracYearToDMY(event.startYear)} ${st}` : fracYearToDMY(event.startYear)
              const endStr = event.endYear != null ? (et !== '00:00' ? `${fracYearToDMY(event.endYear)} ${et}` : fracYearToDMY(event.endYear)) : 'ongoing'
              return `${startStr} — ${endStr}`
            })()}
      </p>
      {event.pointValue != null && (
        <p className="text-xs text-muted-foreground mb-3">
          Value: <span className="font-medium text-foreground">{formatValue(event.pointValue)}</span>
        </p>
      )}
      <div className="flex gap-1">
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onEdit(event)}>
          <Pencil className="h-3 w-3 mr-1" /> Edit
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => onDelete(event)}>
          <Trash2 className="h-3 w-3 mr-1" /> Delete
        </Button>
      </div>
    </div>
  )
}
