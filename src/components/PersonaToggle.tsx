import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import type { DbPersona } from '@/types/database'

interface PersonaToggleProps {
  personas: DbPersona[]
  activePersonaIds: Set<string>
  onToggle: (personaId: string) => void
}

export function PersonaToggle({ personas, activePersonaIds, onToggle }: PersonaToggleProps) {
  const activeCount = activePersonaIds.size

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Users className="h-4 w-4" />
          Personas
          {activeCount > 0 && (
            <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-2">
        <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
          Overlay famous timelines
        </p>
        {personas.map(p => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-accent"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{p.name}</p>
              <p className="text-xs text-muted-foreground">
                {p.birth_year}–{p.death_year ?? 'present'}
              </p>
            </div>
            <Switch
              checked={activePersonaIds.has(p.id)}
              onCheckedChange={() => onToggle(p.id)}
            />
          </div>
        ))}
        {personas.length === 0 && (
          <p className="px-2 py-3 text-xs text-muted-foreground text-center">
            No personas available
          </p>
        )}
      </PopoverContent>
    </Popover>
  )
}
