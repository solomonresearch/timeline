import { useState, useEffect } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { isUsernameAvailable } from '@/lib/api'
import { iso2dmy, dmy2iso, formatDMYInput } from '@/lib/constants'

const USERNAME_RE = /^[a-z0-9_]{3,32}$/
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
  const [birthDate, setBirthDate] = useState('')
  const [username, setUsername] = useState('')
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [usernameOk, setUsernameOk] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile && open) {
      setDisplayName(profile.display_name)
      setBio(profile.bio)
      setBirthDate(profile.birth_date ? iso2dmy(profile.birth_date) : '')
      setUsername(profile.username ?? '')
      setUsernameError(null)
      setUsernameOk(false)
    }
  }, [profile, open])

  async function handleUsernameBlur() {
    const val = username.trim().toLowerCase()
    setUsernameOk(false)
    if (!val) return
    if (!USERNAME_RE.test(val)) {
      setUsernameError('3–32 chars, lowercase letters, numbers, underscores only')
      return
    }
    // Skip availability check if unchanged
    if (val === profile?.username) {
      setUsernameError(null)
      setUsernameOk(true)
      return
    }
    const available = await isUsernameAvailable(val)
    if (available) {
      setUsernameError(null)
      setUsernameOk(true)
    } else {
      setUsernameError('Username is already taken')
    }
  }

  function handleBirthDateChange(value: string) {
    setBirthDate(formatDMYInput(value))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const trimmedUsername = username.trim().toLowerCase() || null
    await updateProfile({
      display_name: displayName.trim(),
      bio: bio.trim(),
      birth_date: birthDate ? dmy2iso(birthDate) || null : null,
      username: trimmedUsername,
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
            <Label htmlFor="profileUsername">Username</Label>
            <Input
              id="profileUsername"
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value.toLowerCase()); setUsernameError(null); setUsernameOk(false) }}
              onBlur={handleUsernameBlur}
              placeholder="e.g. johndoe"
            />
            {usernameError
              ? <p className="text-xs text-red-600">{usernameError}</p>
              : usernameOk
                ? <p className="text-xs text-green-600">Your public page: /{username}</p>
                : <p className="text-xs text-muted-foreground">Public page URL: /{username || '…'}</p>
            }
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="profileBirthDate">Birth Date <span className="text-red-500">*</span></Label>
            <Input
              id="profileBirthDate"
              type="text"
              value={birthDate}
              placeholder="DD/MM/YYYY"
              onChange={e => handleBirthDateChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Used to align persona comparisons by age</p>
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
