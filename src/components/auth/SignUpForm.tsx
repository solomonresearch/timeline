import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface SignUpFormProps {
  onSwitchToSignIn: () => void
  onSignUpSuccess: () => void
}

export function SignUpForm({ onSwitchToSignIn, onSignUpSuccess }: SignUpFormProps) {
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [bio, setBio] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const currentYear = new Date().getFullYear()

  function handleBirthDateChange(value: string) {
    setBirthDate(value)
    if (value) {
      const year = new Date(value).getFullYear()
      if (!isNaN(year)) {
        setBirthYear(String(year))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    const parsedYear = parseInt(birthYear.trim(), 10)
    if (isNaN(parsedYear) || parsedYear < 1900 || parsedYear > currentYear) {
      setError(`Birth year must be between 1900 and ${currentYear}`)
      return
    }

    if (!bio.trim()) {
      setError('Please tell us about yourself')
      return
    }

    setSubmitting(true)
    const { error } = await signUp(email, password)
    if (error) {
      setError(error)
      setSubmitting(false)
    } else {
      localStorage.setItem(
        'timeline_pending_profile',
        JSON.stringify({
          birth_year: parsedYear,
          birth_date: birthDate || null,
          bio: bio.trim(),
          email,
          created_at: new Date().toISOString(),
        }),
      )
      onSignUpSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signupBirthYear">Birth Year <span className="text-red-500">*</span></Label>
        <Input
          id="signupBirthYear"
          type="number"
          placeholder="e.g. 1990"
          value={birthYear}
          onChange={e => setBirthYear(e.target.value)}
          required
          min={1900}
          max={currentYear}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signupBirthDate">Birth Date <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Input
          id="signupBirthDate"
          type="date"
          value={birthDate}
          onChange={e => handleBirthDateChange(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signupBio">About You <span className="text-red-500">*</span></Label>
        <Textarea
          id="signupBio"
          placeholder="Tell us about yourself..."
          value={bio}
          onChange={e => setBio(e.target.value)}
          rows={3}
          required
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Creating account...' : 'Sign Up'}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <button type="button" className="hover:underline" onClick={onSwitchToSignIn}>
          Sign in
        </button>
      </p>
    </form>
  )
}
