import { useState, useMemo, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { Lane, TimelineEvent } from '@/types/timeline'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  events: TimelineEvent[]
  lanes: Lane[]
  onNavigate: (event: TimelineEvent) => void
}

function formatYears(event: TimelineEvent): string {
  const fmt = (y: number) => y < 0 ? `${Math.abs(Math.round(y))} BC` : String(Math.round(y))
  if (event.type === 'range' && event.endYear != null) {
    return `${fmt(event.startYear)} – ${fmt(event.endYear)}`
  }
  return fmt(event.startYear)
}

export function SearchDialog({ open, onOpenChange, events, lanes, onNavigate }: Props) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (open) setQuery('') }, [open])

  const laneMap = useMemo(() => {
    const m = new Map<string, Lane>()
    for (const lane of lanes) m.set(lane.id, lane)
    return m
  }, [lanes])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return events
      .filter(e =>
        e.title.toLowerCase().includes(q) ||
        (e.description ?? '').toLowerCase().includes(q) ||
        (laneMap.get(e.laneId)?.name ?? '').toLowerCase().includes(q),
      )
      .slice(0, 60)
  }, [query, events, laneMap])

  function handleNavigate(event: TimelineEvent) {
    onNavigate(event)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Search Events</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={inputRef}
              autoFocus
              placeholder="Search by title, description, or lane…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          {query.trim() && (
            <div className="max-h-72 overflow-y-auto rounded-md border divide-y">
              {results.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">No events found</div>
              ) : (
                results.map(event => {
                  const lane = laneMap.get(event.laneId)
                  return (
                    <button
                      key={event.id}
                      className="w-full text-left px-3 py-2.5 hover:bg-accent transition-colors flex items-center gap-3"
                      onClick={() => handleNavigate(event)}
                    >
                      <span
                        className="shrink-0 w-2.5 h-2.5 rounded-full"
                        style={{ background: event.color ?? lane?.color ?? '#3b82f6' }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm truncate">{event.title}</span>
                          <span className="text-xs text-muted-foreground shrink-0">{formatYears(event)}</span>
                        </div>
                        {lane && (
                          <div className="text-xs text-muted-foreground mt-0.5 truncate">{lane.name}</div>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
