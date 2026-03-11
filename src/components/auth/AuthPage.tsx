import { useState } from 'react'
import { SignInForm } from './SignInForm'
import { SignUpForm } from './SignUpForm'
import { ForgotPasswordForm } from './ForgotPasswordForm'
import { CheckEmailMessage } from './CheckEmailMessage'
import { DemoTimelineProvider } from '@/contexts/DemoTimelineContext'
import { DemoTimelineView } from '@/components/DemoTimelineView'
import { SkinProvider } from '@/contexts/SkinContext'

type AuthMode = 'sign-in' | 'sign-up' | 'forgot-password' | 'check-email'

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('sign-in')

  function handleSignUpWithTimeline() {
    localStorage.setItem('timeline_import_demo', '1')
    setMode('sign-up')
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Compact auth strip */}
      <div className="shrink-0 border-b shadow-sm bg-background">
        <div className="flex items-start gap-6 px-6 py-3 max-w-5xl mx-auto">
          {/* Brand */}
          <div className="pt-1 shrink-0">
            <div className="text-2xl font-bold">LifeSaga</div>
            <div className="text-xs text-muted-foreground mt-0.5">Your life, visualized</div>
          </div>
          {/* Divider */}
          <div className="w-px self-stretch bg-border mx-2" />
          {/* Auth form */}
          <div className="flex-1 max-w-sm min-w-0 overflow-y-auto max-h-40">
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
      </div>

      {/* Demo timeline fills remaining space */}
      <div className="flex-1 overflow-hidden">
        <SkinProvider>
          <DemoTimelineProvider>
            <DemoTimelineView onSignUpWithTimeline={handleSignUpWithTimeline} />
          </DemoTimelineProvider>
        </SkinProvider>
      </div>
    </div>
  )
}
