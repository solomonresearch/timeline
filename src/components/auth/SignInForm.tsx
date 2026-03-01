import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SignInFormProps {
  onSwitchToSignUp: () => void
  onSwitchToForgotPassword: () => void
}

export function SignInForm({ onSwitchToSignUp, onSwitchToForgotPassword }: SignInFormProps) {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await signIn(email, password)
    if (error) {
      setError(error)
      setSubmitting(false)
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
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Signing in...' : 'Sign In'}
      </Button>
      <div className="flex items-center justify-between text-sm">
        <button type="button" className="text-muted-foreground hover:underline" onClick={onSwitchToForgotPassword}>
          Forgot password?
        </button>
        <button type="button" className="text-muted-foreground hover:underline" onClick={onSwitchToSignUp}>
          Create account
        </button>
      </div>
    </form>
  )
}
