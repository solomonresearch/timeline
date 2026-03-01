import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ForgotPasswordFormProps {
  onSwitchToSignIn: () => void
  onResetSuccess: () => void
}

export function ForgotPasswordForm({ onSwitchToSignIn, onResetSuccess }: ForgotPasswordFormProps) {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await resetPassword(email)
    if (error) {
      setError(error)
      setSubmitting(false)
    } else {
      onResetSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Enter your email and we'll send you a link to reset your password.
      </p>
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
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Sending...' : 'Send Reset Link'}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <button type="button" className="hover:underline" onClick={onSwitchToSignIn}>
          Back to sign in
        </button>
      </p>
    </form>
  )
}
