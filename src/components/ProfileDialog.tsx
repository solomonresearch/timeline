import { useState, useEffect } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { iso2dmy, dmy2iso, formatDMYInput } from '@/lib/constants'
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
import { Textarea } from '@/components/ui/textarea'

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { profile, updateProfile } = useProfile()
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile && open) {
      setDisplayName(profile.display_name)
      setBio(profile.bio)
      setBirthYear(profile.birth_year != null ? String(profile.birth_year) : '')
      setBirthDate(profile.birth_date ? iso2dmy(profile.birth_date) : '')
    }
  }, [profile, open])

  function handleBirthDateChange(value: string) {
    const formatted = formatDMYInput(value)
    setBirthDate(formatted)
    if (formatted.length === 10) {
      const year = parseInt(formatted.slice(6), 10)
      if (!isNaN(year)) setBirthYear(String(year))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const parsedBirthYear = birthYear.trim() ? parseInt(birthYear.trim(), 10) : null
    await updateProfile({
      display_name: displayName.trim(),
      bio: bio.trim(),
      birth_year: parsedBirthYear && !isNaN(parsedBirthYear) ? parsedBirthYear : null,
      birth_date: birthDate ? dmy2iso(birthDate) || null : null,
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
            <Label htmlFor="profileBirthYear">Birth Year</Label>
            <Input
              id="profileBirthYear"
              type="number"
              value={birthYear}
              onChange={e => setBirthYear(e.target.value)}
              placeholder="e.g. 1990"
            />
            <p className="text-xs text-muted-foreground">Used to align persona comparisons by age</p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="profileBirthDate">Birth Date</Label>
            <Input
              id="profileBirthDate"
              type="text"
              value={birthDate}
              placeholder="DD/MM/YYYY"
              onChange={e => handleBirthDateChange(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="A short bio..."
              rows={3}
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
