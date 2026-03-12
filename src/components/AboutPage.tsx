import { Footer } from '@/components/Footer'

function navigate(path: string) {
  window.history.pushState(null, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="text-xl font-bold hover:opacity-80 transition-opacity"
        >
          LifeSaga
        </button>
        <button
          onClick={() => navigate('/')}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-10 space-y-12">

        {/* About */}
        <section className="space-y-4">
          <h1 className="text-3xl font-bold">About LifeSaga</h1>
          <p className="text-muted-foreground leading-relaxed">
            LifeSaga is a personal life timeline tool that lets you visualize your entire life — past, present, and future — on a single horizontal canvas. Organize events across swim lanes like Locations, Work, Education, Relationships, Health, and more. Drag, zoom, and scroll through decades in seconds.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Beyond recording the past, LifeSaga is built for planning ahead. Add future events — job changes, moves, purchases — and attach value projections to track the financial impact of your decisions over time. See how a career change, a boat, or a business venture affects your long-term picture.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Overlay historical personas (Einstein, Marie Curie, da Vinci and others) age-aligned to your own life to gain perspective. Import from Google Calendar or upload an ICS file to populate your timeline instantly.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            LifeSaga is a personal project built with React, TypeScript, and Supabase. It is currently in early development.
          </p>
        </section>

        <hr className="border-border" />

        {/* Terms & Conditions */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Terms & Conditions</h2>
          <p className="text-xs text-muted-foreground italic">Draft — last updated March 2026</p>

          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <div>
              <h3 className="font-semibold text-foreground mb-1">1. Acceptance of Terms</h3>
              <p>By accessing or using LifeSaga ("the Service"), you agree to be bound by these Terms & Conditions. If you do not agree, please do not use the Service.</p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-1">2. Use of the Service</h3>
              <p>LifeSaga is provided for personal, non-commercial use. You are responsible for all content you create and store. You may not use the Service for any unlawful purpose or in a way that could harm other users.</p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-1">3. Data & Privacy</h3>
              <p>Your data is stored securely using Supabase (PostgreSQL with Row-Level Security). Only you can see your private timelines. Public timelines are visible to anyone with the link. We do not sell your data. We may use anonymised aggregate data to improve the Service.</p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-1">4. Account Responsibility</h3>
              <p>You are responsible for maintaining the security of your account credentials. Notify us immediately if you suspect unauthorised access. We are not liable for losses resulting from unauthorised use of your account.</p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-1">5. Intellectual Property</h3>
              <p>The LifeSaga application code and design are proprietary. Content you create remains yours. You grant LifeSaga a limited licence to store and display your content solely to provide the Service to you.</p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-1">6. Disclaimer of Warranties</h3>
              <p>The Service is provided "as is" without warranties of any kind. We do not guarantee uptime, data durability, or fitness for a particular purpose. Financial projections shown in the app are illustrative only and not financial advice.</p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-1">7. Limitation of Liability</h3>
              <p>To the fullest extent permitted by law, LifeSaga and its operators shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service.</p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-1">8. Changes to Terms</h3>
              <p>We may update these terms from time to time. Continued use of the Service after changes constitutes acceptance of the revised terms.</p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-1">9. Governing Law</h3>
              <p>These terms are governed by the laws of Germany. Any disputes shall be subject to the exclusive jurisdiction of the courts of Germany.</p>
            </div>
          </div>
        </section>

        <hr className="border-border" />

        {/* Contact */}
        <section className="space-y-2">
          <h2 className="text-2xl font-semibold">Contact</h2>
          <p className="text-sm text-muted-foreground">
            Questions, feedback, or issues? Reach us at{' '}
            <a href="mailto:hello@lifesaga.app" className="underline text-foreground hover:opacity-70">
              hello@lifesaga.app
            </a>
          </p>
        </section>

      </div>

      <Footer />
    </div>
  )
}
