import { useState } from 'react'
import { ChevronDown, Plus, Pencil, Trash2, Layers, LayoutList, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { useTimelineContext } from '@/contexts/TimelineContext'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { DbPersona } from '@/types/database'
import type { PersonaDisplayMode } from '@/hooks/usePersonas'

interface TimelinePersonaSelectorProps {
  personas: DbPersona[]
  activePersonaIds: Set<string>
  onTogglePersona: (id: string) => void
  personaDisplayModes: Map<string, PersonaDisplayMode>
  onSetPersonaDisplayMode: (id: string, mode: PersonaDisplayMode) => void
}

export function TimelinePersonaSelector({
  personas,
  activePersonaIds,
  onTogglePersona,
  personaDisplayModes,
  onSetPersonaDisplayMode,
}: TimelinePersonaSelectorProps) {
  const {
    timelines,
    selectedTimelineId,
    selectTimeline,
    createTimeline,
    renameTimeline,
    deleteTimeline,
  } = useTimelineContext()

  const [nameDialogOpen, setNameDialogOpen] = useState(false)
  const [nameDialogMode, setNameDialogMode] = useState<'create' | 'rename'>('create')
  const [nameValue, setNameValue] = useState('')
  const [targetId, setTargetId] = useState<string | null>(null)

  const currentTimeline = timelines.find(t => t.id === selectedTimelineId)
  const activePersonaCount = activePersonaIds.size

  function handleCreate() {
    setNameDialogMode('create')
    setNameValue('')
    setTargetId(null)
    setNameDialogOpen(true)
  }

  function handleRename(id: string, currentName: string, e: React.MouseEvent) {
    e.stopPropagation()
    setNameDialogMode('rename')
    setNameValue(currentName)
    setTargetId(id)
    setNameDialogOpen(true)
  }

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = nameValue.trim()
    if (!name) return
    if (nameDialogMode === 'create') {
      await createTimeline(name)
    } else if (targetId) {
      await renameTimeline(targetId, name)
    }
    setNameDialogOpen(false)
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (timelines.length <= 1) return
    await deleteTimeline(id)
  }

  const buttonLabel = currentTimeline?.name ?? 'Timeline'

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="max-w-52 gap-1">
            <span className="truncate">{buttonLabel}</span>
            {activePersonaCount > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground shrink-0">
                +{activePersonaCount}
              </span>
            )}
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-0">
          {/* ── Timelines ── */}
          <div className="px-3 pt-2 pb-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Timelines</p>
          </div>
          <div className="px-1 pb-1">
            {timelines.map(t => (
              <div
                key={t.id}
                className={cn(
                  'flex items-center rounded-md px-2 py-1 cursor-pointer hover:bg-accent group',
                  t.id === selectedTimelineId && 'bg-accent',
                )}
                onClick={() => selectTimeline(t.id)}
              >
                <span className={cn('flex-1 text-sm truncate', t.id === selectedTimelineId && 'font-semibold')}>
                  {t.name}
                </span>
                <button
                  className="p-0.5 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100"
                  onClick={e => handleRename(t.id, t.name, e)}
                >
                  <Pencil className="h-3 w-3" />
                </button>
                {timelines.length > 1 && (
                  <button
                    className="p-0.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                    onClick={e => handleDelete(t.id, e)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
            <button
              className="flex items-center gap-1.5 w-full rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent"
              onClick={handleCreate}
            >
              <Plus className="h-4 w-4" />
              New Timeline…
            </button>
          </div>

          {/* ── Personas ── */}
          <div className="border-t px-3 pt-2 pb-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Users className="h-3 w-3" />
              Persona Overlays
            </p>
          </div>
          <div className="px-1 pb-2">
            {personas.length === 0 ? (
              <p className="px-2 py-2 text-xs text-muted-foreground text-center">No personas available</p>
            ) : (
              personas.map(p => {
                const isActive = activePersonaIds.has(p.id)
                const mode = personaDisplayModes.get(p.id) ?? 'integrated'
                return (
                  <div key={p.id} className="rounded-md px-2 py-1.5 hover:bg-accent">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.birth_year}–{p.death_year ?? 'present'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isActive && (
                          <div className="flex items-center rounded border overflow-hidden">
                            <button
                              onClick={() => onSetPersonaDisplayMode(p.id, 'integrated')}
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
                              onClick={() => onSetPersonaDisplayMode(p.id, 'separate')}
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
                        )}
                        <Switch checked={isActive} onCheckedChange={() => onTogglePersona(p.id)} />
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Rename / Create dialog */}
      <Dialog open={nameDialogOpen} onOpenChange={setNameDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{nameDialogMode === 'create' ? 'New Timeline' : 'Rename Timeline'}</DialogTitle>
            <DialogDescription>
              {nameDialogMode === 'create'
                ? 'Enter a name for the new timeline.'
                : 'Enter a new name for this timeline.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleNameSubmit} className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="timelineName">Name</Label>
              <Input
                id="timelineName"
                value={nameValue}
                onChange={e => setNameValue(e.target.value)}
                placeholder="Timeline name"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNameDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{nameDialogMode === 'create' ? 'Create' : 'Rename'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
