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
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { DbPersona } from '@/types/database'
import type { PersonaDisplayMode } from '@/hooks/usePersonas'
import { fracYearToMs, msToFracYear } from '@/lib/constants'

const DEFAULT_COLOR = '#3b82f6'

function fracYearToDateStr(fy: number): string {
  const d = new Date(fracYearToMs(fy))
  return `${d.getUTCFullYear().toString().padStart(4, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}
function fracYearToTimeStr(fy: number): string {
  const d = new Date(fracYearToMs(fy))
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}
function dateTimeToFracYear(dateStr: string, timeStr: string): number {
  if (!dateStr) return 0
  const [y, mo, da] = dateStr.split('-').map(Number)
  const [h, m] = (timeStr || '00:00').split(':').map(Number)
  return msToFracYear(Date.UTC(y, mo - 1, da, h || 0, m || 0))
}

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
    updateTimeline,
    deleteTimeline,
  } = useTimelineContext()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [targetId, setTargetId] = useState<string | null>(null)
  const [nameValue, setNameValue] = useState('')
  const [emojiValue, setEmojiValue] = useState('')
  const [colorValue, setColorValue] = useState(DEFAULT_COLOR)
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('00:00')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('00:00')

  const currentTimeline = timelines.find(t => t.id === selectedTimelineId)
  const activePersonaCount = activePersonaIds.size

  function handleCreate() {
    setDialogMode('create')
    setNameValue('')
    setEmojiValue('')
    setColorValue(DEFAULT_COLOR)
    setStartDate(''); setStartTime('00:00')
    setEndDate(''); setEndTime('00:00')
    setTargetId(null)
    setDialogOpen(true)
  }

  function handleEdit(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    const t = timelines.find(tl => tl.id === id)
    if (!t) return
    setDialogMode('edit')
    setNameValue(t.name)
    setEmojiValue(t.emoji ?? '')
    setColorValue(t.color ?? DEFAULT_COLOR)
    if (t.start_year != null) { setStartDate(fracYearToDateStr(t.start_year)); setStartTime(fracYearToTimeStr(t.start_year)) }
    else { setStartDate(''); setStartTime('00:00') }
    if (t.end_year != null) { setEndDate(fracYearToDateStr(t.end_year)); setEndTime(fracYearToTimeStr(t.end_year)) }
    else { setEndDate(''); setEndTime('00:00') }
    setTargetId(id)
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = nameValue.trim()
    if (!name) return
    if (dialogMode === 'create') {
      await createTimeline(name)
    } else if (targetId) {
      await updateTimeline(targetId, {
        name,
        emoji: emojiValue.trim() || null,
        color: colorValue,
        start_year: startDate ? dateTimeToFracYear(startDate, startTime) : null,
        end_year: endDate ? dateTimeToFracYear(endDate, endTime) : null,
      })
    }
    setDialogOpen(false)
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
                  onClick={e => handleEdit(t.id, e)}
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

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogMode === 'create' ? 'New Timeline' : 'Edit Timeline'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            {/* Name + Emoji */}
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="tpName">Name</Label>
                <Input id="tpName" value={nameValue} onChange={e => setNameValue(e.target.value)} placeholder="Timeline name" autoFocus />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="tpEmoji">Emoji</Label>
                <Input
                  id="tpEmoji"
                  value={emojiValue}
                  onChange={e => {
                    const segs = [...new Intl.Segmenter().segment(e.target.value)]
                    setEmojiValue(segs.length > 0 ? segs[0].segment : '')
                  }}
                  placeholder="🌍"
                  className="w-16 text-center text-lg"
                  maxLength={4}
                />
              </div>
            </div>

            {/* Color */}
            <div className="grid gap-1.5">
              <Label htmlFor="tpColor">Color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="tpColor"
                  type="color"
                  value={colorValue}
                  onChange={e => setColorValue(e.target.value)}
                  className="h-8 w-12 cursor-pointer rounded border border-input bg-transparent p-0.5"
                />
                <span className="text-sm text-muted-foreground font-mono">{colorValue}</span>
              </div>
            </div>

            {/* Start date/time */}
            <div className="grid gap-1.5">
              <Label>Start <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <div className="flex gap-2">
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="flex-1" />
                <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-28" disabled={!startDate} />
              </div>
            </div>

            {/* End date/time */}
            <div className="grid gap-1.5">
              <Label>End <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <div className="flex gap-2">
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="flex-1" />
                <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-28" disabled={!endDate} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{dialogMode === 'create' ? 'Create' : 'Save'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
