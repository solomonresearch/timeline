import { Plus, Layers, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/UserMenu'
import { TimelineSelector } from '@/components/TimelineSelector'
import { PersonaToggle } from '@/components/PersonaToggle'
import type { DbPersona } from '@/types/database'

interface ToolbarProps {
  pixelsPerYear: number
  onPixelsPerYearChange: (v: number) => void
  onAddEvent: () => void
  onAddLane: () => void
  personas: DbPersona[]
  activePersonaIds: Set<string>
  onTogglePersona: (id: string) => void
}

export function Toolbar({
  pixelsPerYear,
  onPixelsPerYearChange,
  onAddEvent,
  onAddLane,
  personas,
  activePersonaIds,
  onTogglePersona,
}: ToolbarProps) {
  return (
    <div className="flex items-center justify-between border-b bg-white px-4 py-2">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold">Life Timeline</h1>
        <TimelineSelector />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-md border px-2 py-1">
          <ZoomOut className="h-4 w-4 text-muted-foreground" />
          <input
            type="range"
            min={40}
            max={200}
            value={pixelsPerYear}
            onChange={e => onPixelsPerYearChange(Number(e.target.value))}
            className="h-1 w-24 cursor-pointer accent-primary"
          />
          <ZoomIn className="h-4 w-4 text-muted-foreground" />
        </div>
        <Button variant="outline" size="sm" onClick={onAddLane}>
          <Layers className="h-4 w-4 mr-1" />
          Add Lane
        </Button>
        <Button size="sm" onClick={onAddEvent}>
          <Plus className="h-4 w-4 mr-1" />
          Add Event
        </Button>
        <PersonaToggle
          personas={personas}
          activePersonaIds={activePersonaIds}
          onToggle={onTogglePersona}
        />
        <UserMenu />
      </div>
    </div>
  )
}
