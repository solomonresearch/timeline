import { useState } from 'react'
import { SignInForm } from './SignInForm'
import { SignUpForm } from './SignUpForm'
import { ForgotPasswordForm } from './ForgotPasswordForm'
import { CheckEmailMessage } from './CheckEmailMessage'

type AuthMode = 'sign-in' | 'sign-up' | 'forgot-password' | 'check-email'

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('sign-in')

  const titles: Record<AuthMode, string> = {
    'sign-in': 'Sign In',
    'sign-up': 'Create Account',
    'forgot-password': 'Reset Password',
    'check-email': 'Check Email',
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Life Timeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">{titles[mode]}</p>
        </div>
        {mode === 'sign-in' && (
          <SignInForm
            onSwitchToSignUp={() => setMode('sign-up')}
            onSwitchToForgotPassword={() => setMode('forgot-password')}
          />
        )}
        {mode === 'sign-up' && (
          <SignUpForm
            onSwitchToSignIn={() => setMode('sign-in')}
            onSignUpSuccess={() => setMode('check-email')}
          />
        )}
        {mode === 'forgot-password' && (
          <ForgotPasswordForm
            onSwitchToSignIn={() => setMode('sign-in')}
            onResetSuccess={() => setMode('check-email')}
          />
        )}
        {mode === 'check-email' && (
          <CheckEmailMessage onBackToSignIn={() => setMode('sign-in')} />
        )}
      </div>
    </div>
  )
}
