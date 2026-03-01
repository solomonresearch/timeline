import { useState, useEffect } from 'react'
import { useProfile } from '@/hooks/useProfile'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { profile, updateProfile } = useProfile()
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile && open) {
      setDisplayName(profile.display_name)
      setBio(profile.bio)
    }
  }, [profile, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await updateProfile({
      display_name: displayName.trim(),
      bio: bio.trim(),
    })
    setSaving(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Update your display name and bio.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="A short bio..."
              rows={3}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
