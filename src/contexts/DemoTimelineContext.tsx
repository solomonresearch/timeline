import { TimelineContext } from '@/contexts/TimelineContext'
import { useDemoTimeline } from '@/hooks/useDemoTimeline'

export function DemoTimelineProvider({ children }: { children: React.ReactNode }) {
  const demo = useDemoTimeline()
  return (
    <TimelineContext.Provider value={demo}>
      {children}
    </TimelineContext.Provider>
  )
}
