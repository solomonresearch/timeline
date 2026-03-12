import { Layers, LayoutList, Users, Link2, Link2Off } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import type { DbPersona } from '@/types/database'
import type { PersonaDisplayMode } from '@/hooks/usePersonas'

interface PersonaToggleProps {
  personas: DbPersona[]
  activePersonaIds: Set<string>
  onToggle: (personaId: string) => void
  alignedPersonaIds: Set<string>
  onToggleAlignment: (personaId: string) => void
  personaDisplayModes: Map<string, PersonaDisplayMode>
  onSetDisplayMode: (personaId: string, mode: PersonaDisplayMode) => void
}

export function PersonaToggle({
  personas,
  activePersonaIds,
  onToggle,
  alignedPersonaIds,
  onToggleAlignment,
  personaDisplayModes,
  onSetDisplayMode,
}: PersonaToggleProps) {
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
      <PopoverContent align="end" className="w-72 p-2">
        <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
          Overlay famous timelines
        </p>
        {personas.map(p => {
          const isActive = activePersonaIds.has(p.id)
          const aligned = alignedPersonaIds.has(p.id)
          const mode = personaDisplayModes.get(p.id) ?? 'separate'
          return (
            <div
              key={p.id}
              className="rounded-md px-2 py-1.5 hover:bg-accent"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.birth_year}–{p.death_year ?? 'present'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isActive && (
                    <>
                      <button
                        onClick={() => onToggleAlignment(p.id)}
                        title={aligned ? 'Showing age-aligned — click for real years' : 'Showing real years — click to age-align'}
                        className={cn(
                          'p-1 rounded transition-colors',
                          aligned
                            ? 'text-primary bg-primary/10 animate-blink-fast hover:bg-primary/20'
                            : 'text-muted-foreground hover:bg-muted',
                        )}
                      >
                        {aligned ? <Link2 className="h-3 w-3" /> : <Link2Off className="h-3 w-3" />}
                      </button>
                      <div className="flex items-center rounded border overflow-hidden">
                        <button
                          onClick={() => onSetDisplayMode(p.id, 'integrated')}
                          title="Blend into my timeline lanes"
                          className={cn(
                            'p-1 transition-colors',
                            mode === 'integrated'
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-muted',
                          )}
                        >
                          <Layers className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => onSetDisplayMode(p.id, 'separate')}
                          title="Show as separate timeline below"
                          className={cn(
                            'p-1 transition-colors',
                            mode === 'separate'
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-muted',
                          )}
                        >
                          <LayoutList className="h-3 w-3" />
                        </button>
                      </div>
                    </>
                  )}
                  <Switch
                    checked={isActive}
                    onCheckedChange={() => onToggle(p.id)}
                  />
                </div>
              </div>
            </div>
          )
        })}
        {personas.length === 0 && (
          <p className="px-2 py-3 text-xs text-muted-foreground text-center">
            No personas available
          </p>
        )}
      </PopoverContent>
    </Popover>
  )
}
