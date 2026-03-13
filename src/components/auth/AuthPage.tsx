import { useState } from 'react'
import { SignInForm } from './SignInForm'
import { SignUpForm } from './SignUpForm'
import { ForgotPasswordForm } from './ForgotPasswordForm'
import { CheckEmailMessage } from './CheckEmailMessage'
import { DemoTimelineProvider } from '@/contexts/DemoTimelineContext'
import { DemoTimelineView } from '@/components/DemoTimelineView'
import { SkinProvider } from '@/contexts/SkinContext'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/Footer'

type AuthMode = 'sign-in' | 'sign-up' | 'forgot-password' | 'check-email'

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('sign-in')
  const [authOpen, setAuthOpen] = useState(false)
  const [fromDemo, setFromDemo] = useState(false)

  function handleSignUpWithTimeline() {
    localStorage.setItem('timeline_import_demo', '1')
    setFromDemo(true)
    setMode('sign-up')
    // Defer opening to let the dropdown finish closing before the popover opens
    setTimeout(() => setAuthOpen(true), 50)
  }

  const modeLabel: Record<AuthMode, string> = {
    'sign-in': 'Sign In',
    'sign-up': 'Create Account',
    'forgot-password': 'Reset Password',
    'check-email': 'Check Email',
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Top header bar */}
      <div className="shrink-0 border-b shadow-sm bg-background px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand + tagline */}
        <div className="shrink-0">
          <div className="text-xl font-bold leading-tight">TimeLANE</div>
          <div className="text-xs text-muted-foreground italic">The operating system for your life</div>
        </div>

        {/* Short description — hidden on small screens */}
        <p className="hidden sm:block text-sm text-muted-foreground text-center flex-1 max-w-md leading-snug">
          Visualize your entire life across timelines and lanes —<br />from past memories to future plans.
        </p>

        {/* Auth popover anchored top-right */}
        <Popover open={authOpen} onOpenChange={setAuthOpen}>
          <PopoverTrigger asChild>
            <Button size="sm">{modeLabel[mode]}</Button>
          </PopoverTrigger>
          <PopoverContent align="end" sideOffset={8} className="w-80 p-4 max-h-[85vh] overflow-y-auto">
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
                fromDemo={fromDemo}
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
          </PopoverContent>
        </Popover>
      </div>

      {/* Demo timeline fills remaining space */}
      <div className="flex-1 overflow-hidden">
        <SkinProvider>
          <DemoTimelineProvider>
            <DemoTimelineView onSignUpWithTimeline={handleSignUpWithTimeline} />
          </DemoTimelineProvider>
        </SkinProvider>
      </div>
      <Footer />
    </div>
  )
}
