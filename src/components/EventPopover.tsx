import { useEffect, useRef } from 'react'
import { Pencil, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TimelineEvent } from '@/types/timeline'
import { fracYearToDMY } from '@/lib/constants'

interface EventPopoverProps {
  event: TimelineEvent
  anchorEl: HTMLElement
  anchorX: number
  anchorY: number
  laneName: string
  onEdit: (event: TimelineEvent) => void
  onDelete: (event: TimelineEvent) => void
  onClose: () => void
}

export function EventPopover({ event, anchorEl, anchorX, anchorY, laneName, onEdit, onDelete, onClose }: EventPopoverProps) {
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
        <h4 className="text-sm font-semibold">{event.title}</h4>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="text-xs text-muted-foreground mb-1">{laneName}</p>
      {event.description && <p className="text-xs mb-2">{event.description}</p>}
      <p className="text-xs text-muted-foreground mb-3">
        {event.type === 'point'
          ? fracYearToDMY(event.startYear)
          : `${fracYearToDMY(event.startYear)} — ${event.endYear != null ? fracYearToDMY(event.endYear) : 'ongoing'}`}
      </p>
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
