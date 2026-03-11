import { useEffect, useState } from 'react'
import { fetchPublicProfile } from '@/lib/api'
import type { PublicProfileData } from '@/types/database'
import type { Lane, TimelineEvent } from '@/types/timeline'
import { mapDbLane, mapDbEvent } from '@/lib/api'
import type { DbLane, DbEvent } from '@/types/database'
import { TimelineContainer } from '@/components/timeline/TimelineContainer'
import { UiSizeProvider } from '@/contexts/UiSizeContext'
import { SkinProvider } from '@/contexts/SkinContext'
import { TooltipProvider } from '@/components/ui/tooltip'
import { TIMELINE_YEAR_MIN, TIMELINE_YEAR_MAX, DEFAULT_PIXELS_PER_YEAR } from '@/lib/constants'

interface PublicProfilePageProps {
  username: string
  timelineIndex?: number
}

type LoadState = 'loading' | 'not_found' | 'loaded'

function navigate(path: string) {
  window.history.pushState(null, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function PublicProfilePage({ username, timelineIndex }: PublicProfilePageProps) {
  const [state, setState] = useState<LoadState>('loading')
  const [data, setData] = useState<PublicProfileData | null>(null)
  const [selectedTimelineId, setSelectedTimelineId] = useState<string | null>(null)
  const [pixelsPerYear, setPixelsPerYear] = useState(DEFAULT_PIXELS_PER_YEAR)

  // Fetch profile only when username changes
  useEffect(() => {
    setState('loading')
    setData(null)
    fetchPublicProfile(username).then(result => {
      if (!result) {
        setState('not_found')
      } else {
        setData(result)
        setState('loaded')
      }
    })
  }, [username])

  // Select the right timeline whenever data loads or the URL index changes
  useEffect(() => {
    if (!data) return
    // If no index in URL, canonicalize to /username/1 so direct links always work
    if (timelineIndex == null && data.timelines.length > 0) {
      navigate(`/${username}/1`)
      return
    }
    const idx = timelineIndex != null ? timelineIndex - 1 : 0
    const clamped = Math.max(0, Math.min(idx, data.timelines.length - 1))
    setSelectedTimelineId(data.timelines[clamped]?.id ?? null)
  }, [data, timelineIndex, username])

  function handleSelectTimeline(_timelineId: string, index: number) {
    // Only update the URL — the effect above will handle selectedTimelineId
    navigate(`/${username}/${index + 1}`)
  }

  if (state === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (state === 'not_found' || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-center px-4">
        <p className="text-lg text-muted-foreground">This profile is private or does not exist.</p>
        <button
          className="mt-2 text-sm text-primary underline underline-offset-2"
          onClick={() => { window.history.pushState(null, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')) }}
        >
          Go home
        </button>
      </div>
    )
  }

  const { profile, timelines, lanes, events } = data

  const selectedTimeline = timelines.find(t => t.id === selectedTimelineId)
  const timelineLanes: Lane[] = lanes
    .filter(l => l.timeline_id === selectedTimelineId)
    .map(l => mapDbLane({ ...l, visible: true, is_default: false, visibility: 'public' } as DbLane))
  const timelineEvents: TimelineEvent[] = events
    .filter(e => e.timeline_id === selectedTimelineId)
    .map(e => mapDbEvent({ ...e, point_value: null, value_points: null, value_projection: null, source: null, visibility: 'public' } as DbEvent))

  const timelineMeta = selectedTimeline?.start_year != null && selectedTimeline?.end_year != null
    ? { startYear: selectedTimeline.start_year, endYear: selectedTimeline.end_year, color: selectedTimeline.color ?? '#3b82f6' }
    : undefined

  return (
    <SkinProvider>
      <UiSizeProvider>
        <TooltipProvider>
          <div className="flex flex-col min-h-screen bg-background">
            {/* Profile header */}
            <div className="border-b bg-card px-6 py-5 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold truncate">
                  {profile.display_name || `@${profile.username}`}
                </h1>
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
                {profile.bio && (
                  <p className="mt-2 text-sm text-foreground/80 max-w-prose">{profile.bio}</p>
                )}
              </div>
            </div>

            {/* Timeline selector */}
            {timelines.length > 1 && (
              <div className="border-b bg-muted/30 px-6 py-2 flex gap-2 overflow-x-auto">
                {timelines.map((tl, idx) => (
                  <button
                    key={tl.id}
                    onClick={() => handleSelectTimeline(tl.id, idx)}
                    className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                      tl.id === selectedTimelineId
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background border hover:bg-muted'
                    }`}
                  >
                    {tl.emoji ? `${tl.emoji} ` : ''}{tl.name}
                  </button>
                ))}
              </div>
            )}

            {/* Empty state */}
            {timelines.length === 0 && (
              <div className="flex flex-1 items-center justify-center text-muted-foreground">
                No public timelines yet.
              </div>
            )}

            {/* Timeline canvas */}
            {selectedTimeline && (
              <div className="flex-1 overflow-hidden">
                <TimelineContainer
                  lanes={timelineLanes}
                  events={timelineEvents}
                  yearStart={TIMELINE_YEAR_MIN}
                  yearEnd={TIMELINE_YEAR_MAX}
                  pixelsPerYear={pixelsPerYear}
                  onZoom={setPixelsPerYear}
                  dataYearMin={timelineEvents.length ? Math.min(...timelineEvents.map(e => e.startYear)) - 2 : 1990}
                  dataYearMax={timelineEvents.length ? Math.max(...timelineEvents.map(e => e.endYear ?? e.startYear)) + 2 : 2030}
                  onToggleVisibility={() => {}}
                  onMoveLane={() => {}}
                  onEditLane={() => {}}
                  onDeleteLane={() => {}}
                  onEventClick={() => {}}
                  onLaneClick={() => {}}
                  onLaneDragRange={() => {}}
                  onEventDrop={() => {}}
                  personaEvents={[]}
                  personas={[]}
                  personaDisplayModes={new Map()}
                  scrollToTodayRef={{ current: null }}
                  scrollToEventRef={{ current: null }}
                  timelineMeta={timelineMeta}
                  overlayEvents={[]}
                  overlayDisplayModes={new Map()}
                  activeOverlayTimelines={[]}
                />
              </div>
            )}
          </div>
        </TooltipProvider>
      </UiSizeProvider>
    </SkinProvider>
  )
}
