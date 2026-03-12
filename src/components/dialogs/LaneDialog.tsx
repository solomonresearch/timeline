import { useState, useEffect } from 'react'
import { Smile, X } from 'lucide-react'
import type { Lane } from '@/types/timeline'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const LANE_EMOJIS = [
  '📍','💼','✈️','❤️','👨‍👩‍👧','❤️‍🔥','🎓','🎯','💰','🚗','📦','🏆',
  '🏠','🌍','🎵','🏋️','📚','🔬','💡','🖥️','🎨','🌱','🌊','⛰️',
  '🏖️','🚢','🚂','🐶','☀️','🌙','🎂','🎉','💪','🦁','🌺','⭐',
]

interface LaneDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingLane?: Lane | null
  onSave: (data: { name: string; color: string; visible: boolean; emoji?: string }) => void
}

export function LaneDialog({ open, onOpenChange, editingLane, onSave }: LaneDialogProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#3b82f6')
  const [emoji, setEmoji] = useState('')
  const [emojiOpen, setEmojiOpen] = useState(false)

  useEffect(() => {
    if (editingLane) {
      setName(editingLane.name)
      setColor(editingLane.color)
      setEmoji(editingLane.emoji ?? '')
    } else {
      setName('')
      setColor('#3b82f6')
      setEmoji('')
    }
  }, [editingLane, open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), color, visible: true, emoji: emoji || undefined })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{editingLane ? 'Edit Lane' : 'Add Lane'}</DialogTitle>
          <DialogDescription>
            {editingLane ? 'Modify the lane name, emoji, and color.' : 'Create a new swim lane.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="lane-name">Name</Label>
            <Input id="lane-name" value={name} onChange={e => setName(e.target.value)} placeholder="Lane name" />
          </div>
          <div className="grid gap-1.5">
            <Label>Emoji (optional)</Label>
            <div className="flex items-center gap-2">
              <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="h-9 w-9 flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent text-lg"
                  >
                    {emoji || <Smile className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                  <div className="grid grid-cols-6 gap-1">
                    {LANE_EMOJIS.map(e => (
                      <button
                        key={e}
                        type="button"
                        className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted text-lg"
                        onClick={() => { setEmoji(e); setEmojiOpen(false) }}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              {emoji && (
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setEmoji('')}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <span className="text-sm text-muted-foreground">{emoji ? emoji : 'No emoji'}</span>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="lane-color">Color</Label>
            <Input id="lane-color" type="color" value={color} onChange={e => setColor(e.target.value)} className="h-9 w-16 p-1" />
          </div>
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{editingLane ? 'Save Changes' : 'Add Lane'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
