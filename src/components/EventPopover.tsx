import { useEffect, useRef } from 'react'
import { Pencil, Trash2, X, ExternalLink, MapPin, Star } from 'lucide-react'
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
      <p className="text-xs text-muted-foreground mb-1">
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
        <p className="text-xs text-muted-foreground mb-1">
          Value: <span className="font-medium text-foreground">{formatValue(event.pointValue)}</span>
        </p>
      )}
      {/* Enrichment fields */}
      {event.metadata?.image_url && (
        <img
          src={event.metadata.image_url}
          alt=""
          className="w-full rounded-md mb-2 max-h-28 object-cover"
          onError={e => (e.currentTarget.style.display = 'none')}
        />
      )}
      {event.location && (
        <p className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
          <MapPin className="h-3 w-3 shrink-0" />
          {event.location}
        </p>
      )}
      {event.rating != null && event.rating > 0 && (
        <div className="flex items-center gap-0.5 mb-1">
          {[1,2,3,4,5].map(n => (
            <Star key={n} className={`h-3 w-3 ${n <= event.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
          ))}
        </div>
      )}
      {event.metadata?.tags && event.metadata.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {event.metadata.tags.map(tag => (
            <span key={tag} className="inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] text-muted-foreground">{tag}</span>
          ))}
        </div>
      )}
      {event.url && (
        <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-primary hover:underline mb-2 truncate"
        >
          <ExternalLink className="h-3 w-3 shrink-0" />
          <span className="truncate">{event.url.replace(/^https?:\/\//, '')}</span>
        </a>
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
