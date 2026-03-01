import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CheckEmailMessageProps {
  onBackToSignIn: () => void
}

export function CheckEmailMessage({ onBackToSignIn }: CheckEmailMessageProps) {
  return (
    <div className="space-y-4 text-center">
      <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="text-lg font-medium">Check your email</h3>
      <p className="text-sm text-muted-foreground">
        We've sent you a link. Please check your inbox and follow the instructions.
      </p>
      <Button variant="outline" className="w-full" onClick={onBackToSignIn}>
        Back to sign in
      </Button>
    </div>
  )
}
