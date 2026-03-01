import { useState } from 'react'
import { ChevronDown, Plus, Pencil, Trash2 } from 'lucide-react'
import { useTimelineContext } from '@/contexts/TimelineContext'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

export function TimelineSelector() {
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

  function handleCreate() {
    setNameDialogMode('create')
    setNameValue('')
    setTargetId(null)
    setNameDialogOpen(true)
  }

  function handleRename(id: string, currentName: string) {
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

  async function handleDelete(id: string) {
    if (timelines.length <= 1) return
    await deleteTimeline(id)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="max-w-48 gap-1">
            <span className="truncate">{currentTimeline?.name ?? 'Timeline'}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {timelines.map(t => (
            <div key={t.id} className="flex items-center">
              <DropdownMenuItem
                className="flex-1"
                onClick={() => selectTimeline(t.id)}
              >
                <span className={t.id === selectedTimelineId ? 'font-semibold' : ''}>
                  {t.name}
                </span>
              </DropdownMenuItem>
              <button
                className="p-1 text-muted-foreground hover:text-foreground"
                onClick={e => { e.stopPropagation(); handleRename(t.id, t.name) }}
              >
                <Pencil className="h-3 w-3" />
              </button>
              {timelines.length > 1 && (
                <button
                  className="p-1 text-muted-foreground hover:text-destructive"
                  onClick={e => { e.stopPropagation(); handleDelete(t.id) }}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Timeline...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={nameDialogOpen} onOpenChange={setNameDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {nameDialogMode === 'create' ? 'New Timeline' : 'Rename Timeline'}
            </DialogTitle>
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
              <Button type="button" variant="outline" onClick={() => setNameDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {nameDialogMode === 'create' ? 'Create' : 'Rename'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
