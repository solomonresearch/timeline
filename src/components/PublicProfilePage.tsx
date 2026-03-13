import { useEffect, useState, useCallback } from 'react'
import {
  fetchPublicProfile,
  fetchTimelines,
  fetchLanes,
  fetchEvents,
  getSharedWithMe,
  getTimelineData,
  mapDbLane,
  mapDbEvent,
} from '@/lib/api'
import type { PublicProfileData, DbTimeline, SharedWithMeItem, DbLane, DbEvent } from '@/types/database'
import type { Lane, TimelineEvent } from '@/types/timeline'
import { TimelineContainer } from '@/components/timeline/TimelineContainer'
import { UiSizeProvider } from '@/contexts/UiSizeContext'
import { SkinProvider } from '@/contexts/SkinContext'
import { TooltipProvider } from '@/components/ui/tooltip'
import { TIMELINE_YEAR_MIN, TIMELINE_YEAR_MAX, DEFAULT_PIXELS_PER_YEAR } from '@/lib/constants'
import { Footer } from '@/components/Footer'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/hooks/useProfile'
import { ProfileDialog } from '@/components/ProfileDialog'
import { Pencil, Lock } from 'lucide-react'

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
  const { user } = useAuth()
  const { profile: myProfile } = useProfile()

  const [state, setState] = useState<LoadState>('loading')
  const [data, setData] = useState<PublicProfileData | null>(null)
  const [pixelsPerYear, setPixelsPerYear] = useState(DEFAULT_PIXELS_PER_YEAR)

  // Own profile: all timelines (public + private)
  const [allTimelines, setAllTimelines] = useState<DbTimeline[]>([])
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)

  // Other user: timelines shared with the logged-in viewer
  const [sharedItems, setSharedItems] = useState<SharedWithMeItem[]>([])

  // Canvas
  const [selectedSharedId, setSelectedSharedId] = useState<string | null>(null)
  const [canvasLanes, setCanvasLanes] = useState<Lane[]>([])
  const [canvasEvents, setCanvasEvents] = useState<TimelineEvent[]>([])
  const [canvasLoading, setCanvasLoading] = useState(false)

  const isOwnProfile = !!user && !!myProfile && myProfile.username === username

  // ── Fetch public profile ─────────────────────────────────────────────────────
  useEffect(() => {
    setState('loading')
    setData(null)
    setAllTimelines([])
    setSharedItems([])
    setSelectedSharedId(null)
    fetchPublicProfile(username).then(result => {
      if (!result) setState('not_found')
      else { setData(result); setState('loaded') }
    })
  }, [username])

  // ── Own profile: fetch all timelines ────────────────────────────────────────
  useEffect(() => {
    if (!isOwnProfile || !user) { setAllTimelines([]); return }
    fetchTimelines(user.id).then(setAllTimelines)
  }, [isOwnProfile, user])

  // ── Other user + logged in: fetch timelines shared with me ───────────────────
  useEffect(() => {
    if (isOwnProfile || !user || state !== 'loaded') { setSharedItems([]); return }
    getSharedWithMe().then(items => {
      setSharedItems(items.filter(i => i.owner.username === username))
    })
  }, [isOwnProfile, user, state, username])

  // ── Timeline list for the selector ──────────────────────────────────────────
  // Own profile: use allTimelines; other: use public timelines from data
  const displayTimelines: Array<{ id: string; name: string; color: string | null; emoji: string | null; visibility?: string }> =
    isOwnProfile ? allTimelines : (data?.timelines ?? [])

  // URL-based selected timeline (1-based index in URL)
  const effectiveIndex = (timelineIndex ?? 1) - 1
  const urlTimeline = displayTimelines.length > 0
    ? displayTimelines[Math.max(0, Math.min(effectiveIndex, displayTimelines.length - 1))]
    : null

  // Active canvas timeline: shared click overrides URL selection
  const activeCanvasId = selectedSharedId ?? urlTimeline?.id ?? null

  // ── Redirect to /username/1 when index missing ───────────────────────────────
  useEffect(() => {
    if (state !== 'loaded') return
    if (timelineIndex != null) return
    // For own profile, wait until allTimelines loads
    if (isOwnProfile && allTimelines.length === 0) return
    const tls = isOwnProfile ? allTimelines : (data?.timelines ?? [])
    if (tls.length > 0) navigate(`/${username}/1`)
  }, [state, data, allTimelines, timelineIndex, username, isOwnProfile])

  // ── Load canvas data when activeCanvasId changes ────────────────────────────
  useEffect(() => {
    if (!activeCanvasId) { setCanvasLanes([]); setCanvasEvents([]); return }

    setCanvasLoading(true)

    if (isOwnProfile && user) {
      // Authenticated: can access both public and private own timelines
      Promise.all([fetchLanes(activeCanvasId), fetchEvents(activeCanvasId)]).then(([lanes, events]) => {
        setCanvasLanes(lanes.map(mapDbLane))
        setCanvasEvents(events.map(mapDbEvent))
        setCanvasLoading(false)
      })
    } else {
      // Other user: try pre-fetched public data first, fall back to getTimelineData (for shared)
      const preloadedLanes = data?.lanes.filter(l => l.timeline_id === activeCanvasId) ?? []
      if (preloadedLanes.length > 0) {
        const preloadedEvents = data!.events.filter(e => e.timeline_id === activeCanvasId)
        setCanvasLanes(preloadedLanes.map(l => mapDbLane({
          ...l, visible: true, is_default: false, visibility: 'public',
        } as DbLane)))
        setCanvasEvents(preloadedEvents.map(e => mapDbEvent({
          ...e, point_value: null, value_points: null, value_projection: null,
          source: null, visibility: 'public', url: null, location: null, rating: null,
          metadata: null, link: null,
        } as DbEvent)))
        setCanvasLoading(false)
      } else {
        // Shared timeline — fetch via RPC (handles share-based access)
        getTimelineData(activeCanvasId).then(result => {
          if (result) {
            setCanvasLanes(result.lanes.map(l => mapDbLane({
              ...l, visible: true, is_default: false, visibility: 'public',
            } as DbLane)))
            setCanvasEvents(result.events.map(e => mapDbEvent({
              ...e, point_value: null, value_points: null, value_projection: null,
              source: null, visibility: 'public', url: null, location: null, rating: null,
              metadata: null, link: null,
            } as DbEvent)))
          }
          setCanvasLoading(false)
        })
      }
    }
  }, [activeCanvasId, isOwnProfile, user, data])

  const handleSelectTimeline = useCallback((_id: string, idx: number) => {
    setSelectedSharedId(null) // clear any shared selection
    navigate(`/${username}/${idx + 1}`)
  }, [username])

  const handleSelectShared = useCallback((id: string) => {
    setSelectedSharedId(id)
  }, [])

  // ── Loading / not-found states ───────────────────────────────────────────────
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

  // Profile display values — prefer live myProfile data for own profile
  const profileName = isOwnProfile
    ? (myProfile?.display_name || `@${username}`)
    : (data.profile.display_name || `@${username}`)
  const profileBio = isOwnProfile ? (myProfile?.bio ?? '') : (data.profile.bio ?? '')
  const profileAvatar = isOwnProfile ? (myProfile?.avatar_url ?? null) : (data.profile.avatar_url ?? null)
  const avatarInitials = profileName.slice(0, 2).toUpperCase()

  return (
    <SkinProvider>
      <UiSizeProvider>
        <TooltipProvider>
          <div className="flex flex-col min-h-screen bg-background">

            {/* ── Profile header ── */}
            <div className="border-b bg-card px-6 py-5 flex items-start gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 shrink-0 rounded-full overflow-hidden border-2 border-border">
                {profileAvatar ? (
                  <img src={profileAvatar} alt={profileName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center text-xl font-semibold text-muted-foreground select-none">
                    {avatarInitials}
                  </div>
                )}
              </div>

              {/* Name + bio */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold truncate">{profileName}</h1>
                  {isOwnProfile && (
                    <button
                      onClick={() => setProfileDialogOpen(true)}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      title="Edit profile"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">@{username}</p>
                {profileBio && (
                  <p className="mt-2 text-sm text-foreground/80 max-w-prose whitespace-pre-line">{profileBio}</p>
                )}
              </div>
            </div>

            {/* ── Timeline selector tabs ── */}
            {displayTimelines.length > 0 && (
              <div className="border-b bg-muted/30 px-6 py-2 flex gap-2 overflow-x-auto">
                {displayTimelines.map((tl, idx) => {
                  const isPrivate = 'visibility' in tl && (tl as DbTimeline).visibility !== 'public'
                  const isActive = tl.id === activeCanvasId && !selectedSharedId
                  return (
                    <button
                      key={tl.id}
                      onClick={() => handleSelectTimeline(tl.id, idx)}
                      className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background border hover:bg-muted'
                      }`}
                    >
                      {tl.emoji ? `${tl.emoji} ` : ''}{tl.name}
                      {isOwnProfile && isPrivate && (
                        <Lock className="h-3 w-3 opacity-60" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* ── Shared with you section (other user only) ── */}
            {!isOwnProfile && sharedItems.length > 0 && (
              <div className="border-b bg-muted/20 px-6 py-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Shared with you
                </p>
                <div className="flex gap-2 flex-wrap">
                  {sharedItems.map(item => {
                    const isActive = item.timeline.id === selectedSharedId
                    return (
                      <button
                        key={item.share_id}
                        onClick={() => handleSelectShared(item.timeline.id)}
                        className={`rounded-full px-3 py-1 text-sm font-medium transition-colors border flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-primary text-primary-foreground border-transparent'
                            : 'bg-background hover:bg-muted'
                        }`}
                        style={!isActive && item.timeline.color ? { borderColor: item.timeline.color } : {}}
                      >
                        {item.timeline.emoji ? `${item.timeline.emoji} ` : ''}{item.timeline.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Empty state ── */}
            {displayTimelines.length === 0 && sharedItems.length === 0 && state === 'loaded' && (
              <div className="flex flex-1 items-center justify-center text-muted-foreground">
                No timelines to show.
              </div>
            )}

            {/* ── Canvas loading ── */}
            {canvasLoading && (
              <div className="flex flex-1 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            )}

            {/* ── Timeline canvas ── */}
            {!canvasLoading && activeCanvasId && canvasLanes.length > 0 && (
              <div className="flex-1 overflow-hidden">
                <TimelineContainer
                  lanes={canvasLanes}
                  events={canvasEvents}
                  yearStart={TIMELINE_YEAR_MIN}
                  yearEnd={TIMELINE_YEAR_MAX}
                  pixelsPerYear={pixelsPerYear}
                  onZoom={setPixelsPerYear}
                  dataYearMin={canvasEvents.length ? Math.min(...canvasEvents.map(e => e.startYear)) - 2 : 1990}
                  dataYearMax={canvasEvents.length ? Math.max(...canvasEvents.map(e => e.endYear ?? e.startYear)) + 2 : 2030}
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
                  overlayEvents={[]}
                  overlayDisplayModes={new Map()}
                  activeOverlayTimelines={[]}
                />
              </div>
            )}

            {/* ── No events empty canvas ── */}
            {!canvasLoading && activeCanvasId && canvasLanes.length === 0 && (
              <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
                {isOwnProfile ? 'This timeline has no lanes yet.' : 'No visible events.'}
              </div>
            )}

            {/* ProfileDialog — own profile only */}
            {isOwnProfile && (
              <ProfileDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} />
            )}

            <Footer />
          </div>
        </TooltipProvider>
      </UiSizeProvider>
    </SkinProvider>
  )
}
