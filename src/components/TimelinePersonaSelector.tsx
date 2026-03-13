import { useState, useEffect, useCallback } from 'react'
import { ChevronDown, Plus, Pencil, Trash2, Layers, LayoutList, Users, Link2, Link2Off, Star, Copy, UserPlus, X, Globe, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { useTimelineContext } from '@/contexts/TimelineContext'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { DbPersona, DbLane, DbTimelineShare, SharedWithMeItem } from '@/types/database'
import type { PersonaDisplayMode } from '@/hooks/usePersonas'
import type { OverlayDisplayMode } from '@/hooks/useTimelineOverlays'
import type { ExternalOverlayInfo } from '@/hooks/useExternalOverlays'
import { fracYearToMs, msToFracYear } from '@/lib/constants'
import { fetchLanes, getTimelineShares, addTimelineShare, removeTimelineShare, lookupUserByUsername, fetchPublicProfile } from '@/lib/api'

const DEFAULT_COLOR = '#3b82f6'

function fracYearToDateStr(fy: number): string {
  const d = new Date(fracYearToMs(fy))
  return `${d.getUTCFullYear().toString().padStart(4, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}
function fracYearToTimeStr(fy: number): string {
  const d = new Date(fracYearToMs(fy))
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}
function dateTimeToFracYear(dateStr: string, timeStr: string): number {
  if (!dateStr) return 0
  const [y, mo, da] = dateStr.split('-').map(Number)
  const [h, m] = (timeStr || '00:00').split(':').map(Number)
  return msToFracYear(Date.UTC(y, mo - 1, da, h || 0, m || 0))
}

interface TimelinePersonaSelectorProps {
  personas: DbPersona[]
  activePersonaIds: Set<string>
  onTogglePersona: (id: string) => void
  alignedPersonaIds: Set<string>
  onTogglePersonaAlignment: (id: string) => void
  personaDisplayModes: Map<string, PersonaDisplayMode>
  onSetPersonaDisplayMode: (id: string, mode: PersonaDisplayMode) => void
  activeOverlayIds: Set<string>
  onToggleOverlay: (id: string) => void
  overlayAlignedIds: Set<string>
  onToggleOverlayAlignment: (id: string) => void
  overlayDisplayModes: Map<string, OverlayDisplayMode>
  onSetOverlayDisplayMode: (id: string, mode: OverlayDisplayMode) => void
  // External (other users') overlay props
  externalStored?: ExternalOverlayInfo[]
  externalActiveIds?: Set<string>
  externalAlignedIds?: Set<string>
  externalDisplayModes?: Map<string, OverlayDisplayMode>
  onAddExternal?: (info: ExternalOverlayInfo) => void
  onRemoveExternal?: (timelineId: string) => void
  onToggleExternalActive?: (timelineId: string) => void
  onToggleExternalAlignment?: (timelineId: string) => void
  onSetExternalDisplayMode?: (timelineId: string, mode: OverlayDisplayMode) => void
  mainStartYear?: number | null
  sharedWithMe?: SharedWithMeItem[]
  requestCreate?: boolean
  onRequestCreateHandled?: () => void
}

export function TimelinePersonaSelector({
  personas,
  activePersonaIds,
  onTogglePersona,
  alignedPersonaIds,
  onTogglePersonaAlignment,
  personaDisplayModes,
  onSetPersonaDisplayMode,
  activeOverlayIds,
  onToggleOverlay,
  overlayAlignedIds,
  onToggleOverlayAlignment,
  overlayDisplayModes,
  onSetOverlayDisplayMode,
  externalStored = [],
  externalActiveIds = new Set(),
  externalAlignedIds = new Set(),
  externalDisplayModes = new Map(),
  onAddExternal,
  onRemoveExternal,
  onToggleExternalActive,
  onToggleExternalAlignment,
  onSetExternalDisplayMode,
  mainStartYear,
  sharedWithMe = [],
  requestCreate,
  onRequestCreateHandled,
}: TimelinePersonaSelectorProps) {
  const {
    timelines,
    selectedTimelineId,
    selectTimeline,
    createTimeline,
    copyTimelineData,
    updateTimeline,
    deleteTimeline,
    refreshTimeline,
  } = useTimelineContext()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [targetId, setTargetId] = useState<string | null>(null)
  const [nameValue, setNameValue] = useState('')
  const [emojiValue, setEmojiValue] = useState('')
  const [colorValue, setColorValue] = useState(DEFAULT_COLOR)
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('00:00')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('00:00')

  // Sentinel values for "start fresh" options in the source selector
  const COPY_DEFAULTS = '_defaults_'  // create with default lanes
  const COPY_EMPTY    = '_empty_'     // create empty (no lanes)

  type CopyMode = 'all' | 'all_no_events' | 'past_current' | 'lanes'
  type LaneEvtFilter = 'all' | 'past_current' | 'none'

  // copySourceId: COPY_DEFAULTS | COPY_EMPTY | <real timeline id>
  const [copySourceId, setCopySourceId] = useState(COPY_DEFAULTS)
  const [copyMode, setCopyMode] = useState<CopyMode>('all')
  const [copyLaneIds, setCopyLaneIds] = useState<Set<string>>(new Set())
  const [perLaneFilter, setPerLaneFilter] = useState<Record<string, LaneEvtFilter>>({})
  const [sourceLanes, setSourceLanes] = useState<DbLane[]>([])
  const [loadingSourceLanes, setLoadingSourceLanes] = useState(false)
  const [copying, setCopying] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Sharing state (edit mode only)
  const [shares, setShares] = useState<DbTimelineShare[]>([])
  const [shareInput, setShareInput] = useState('')
  const [shareSearching, setShareSearching] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)

  // Users / external overlay search state
  const [userSearchInput, setUserSearchInput] = useState('')
  const [userSearching, setUserSearching] = useState(false)
  const [userSearchError, setUserSearchError] = useState<string | null>(null)
  const [userSearchResults, setUserSearchResults] = useState<ExternalOverlayInfo[]>([])
  const [userSearchAccess, setUserSearchAccess] = useState<Map<string, 'public' | 'shared' | 'both'>>(new Map())

  const handleUserSearch = useCallback(async () => {
    const username = userSearchInput.trim().toLowerCase()
    if (!username) return
    setUserSearching(true)
    setUserSearchError(null)
    setUserSearchResults([])
    setUserSearchAccess(new Map())

    const profile = await fetchPublicProfile(username)
    const publicIds = new Set<string>()
    const publicResults: ExternalOverlayInfo[] = profile
      ? profile.timelines.map(t => {
          publicIds.add(t.id)
          return { username: profile.profile.username, timelineId: t.id, timelineName: t.name, displayName: profile.profile.display_name || profile.profile.username, startYear: t.start_year ?? null }
        })
      : []

    const sharedIds = new Set<string>()
    const sharedResults: ExternalOverlayInfo[] = sharedWithMe
      .filter(item => (item.owner.username ?? '').toLowerCase() === username)
      .map(item => {
        sharedIds.add(item.timeline.id)
        return { username: item.owner.username ?? '', timelineId: item.timeline.id, timelineName: item.timeline.name, displayName: item.owner.display_name || item.owner.username || '', startYear: item.timeline.start_year ?? null }
      })

    const seen = new Set<string>()
    const results: ExternalOverlayInfo[] = []
    for (const r of [...publicResults, ...sharedResults]) {
      if (!seen.has(r.timelineId)) { seen.add(r.timelineId); results.push(r) }
    }

    const access = new Map<string, 'public' | 'shared' | 'both'>()
    for (const id of seen) {
      if (publicIds.has(id) && sharedIds.has(id)) access.set(id, 'both')
      else if (publicIds.has(id)) access.set(id, 'public')
      else access.set(id, 'shared')
    }

    if (results.length === 0) {
      setUserSearchError(profile
        ? `@${username} has no public timelines and hasn't shared any with you`
        : `No profile found for @${username}`)
    } else {
      setUserSearchResults(results)
      setUserSearchAccess(access)
    }
    setUserSearching(false)
  }, [userSearchInput, sharedWithMe])

  const isRealSource = (id: string) => id !== COPY_DEFAULTS && id !== COPY_EMPTY

  useEffect(() => {
    if (!isRealSource(copySourceId)) {
      setSourceLanes([])
      // Clear auto-filled dates when switching away from a real source
      setStartDate(''); setStartTime('00:00')
      setEndDate(''); setEndTime('00:00')
      return
    }
    // Auto-fill dates from source timeline
    const src = timelines.find(t => t.id === copySourceId)
    if (src?.start_year != null) {
      setStartDate(fracYearToDateStr(src.start_year))
      setStartTime(fracYearToTimeStr(src.start_year))
    } else { setStartDate(''); setStartTime('00:00') }
    if (src?.end_year != null) {
      setEndDate(fracYearToDateStr(src.end_year))
      setEndTime(fracYearToTimeStr(src.end_year))
    } else { setEndDate(''); setEndTime('00:00') }

    let cancelled = false
    setLoadingSourceLanes(true)
    fetchLanes(copySourceId).then(lanes => {
      if (cancelled) return
      setSourceLanes(lanes)
      setCopyLaneIds(new Set(lanes.map(l => l.id)))
      setPerLaneFilter(Object.fromEntries(lanes.map(l => [l.id, 'all' as LaneEvtFilter])))
      setLoadingSourceLanes(false)
    })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copySourceId])

  const currentTimeline = timelines.find(t => t.id === selectedTimelineId)
  const otherTimelines = timelines.filter(t => t.id !== selectedTimelineId)
  const activePersonaCount = activePersonaIds.size
  const activeOverlayCount = activeOverlayIds.size

  function toggleLane(laneId: string) {
    setCopyLaneIds(prev => {
      const next = new Set(prev)
      if (next.has(laneId)) next.delete(laneId)
      else next.add(laneId)
      return next
    })
  }

  function handleCreate() {
    setDialogMode('create')
    setNameValue('')
    setEmojiValue('')
    setColorValue(DEFAULT_COLOR)
    setStartDate(''); setStartTime('00:00')
    setEndDate(''); setEndTime('00:00')
    setCopySourceId(COPY_DEFAULTS)
    setCopyMode('all')
    setCopyLaneIds(new Set())
    setPerLaneFilter({})
    setSourceLanes([])
    setTargetId(null)
    setDialogOpen(true)
  }

  // Open create dialog when triggered externally (e.g. from the + toolbar button)
  useEffect(() => {
    if (requestCreate) {
      handleCreate()
      onRequestCreateHandled?.()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestCreate])

  function handleEdit(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    const t = timelines.find(tl => tl.id === id)
    if (!t) return
    setDialogMode('edit')
    setNameValue(t.name)
    setEmojiValue(t.emoji ?? '')
    setColorValue(t.color ?? DEFAULT_COLOR)
    if (t.start_year != null) { setStartDate(fracYearToDateStr(t.start_year)); setStartTime(fracYearToTimeStr(t.start_year)) }
    else { setStartDate(''); setStartTime('00:00') }
    if (t.end_year != null) { setEndDate(fracYearToDateStr(t.end_year)); setEndTime(fracYearToTimeStr(t.end_year)) }
    else { setEndDate(''); setEndTime('00:00') }
    setIsPublic(t.visibility === 'public')
    setTargetId(id)
    setShares([])
    setShareInput('')
    setShareError(null)
    getTimelineShares(id).then(setShares)
    setDialogOpen(true)
  }

  async function handleAddShare() {
    const username = shareInput.trim().toLowerCase()
    if (!username || !targetId) return
    setShareSearching(true)
    setShareError(null)
    const user = await lookupUserByUsername(username)
    if (!user) { setShareError(`No user found: @${username}`); setShareSearching(false); return }
    if (shares.find(s => s.user_id === user.id)) { setShareError('Already shared with this user'); setShareSearching(false); return }
    const ok = await addTimelineShare(targetId, user.id)
    if (ok) {
      setShares(prev => [...prev, { share_id: '', user_id: user.id, username: user.username, display_name: user.display_name }])
      setShareInput('')
    } else {
      setShareError('Could not add share. Try again.')
    }
    setShareSearching(false)
  }

  async function handleRemoveShare(shareId: string, userId: string) {
    if (shareId) await removeTimelineShare(shareId)
    setShares(prev => prev.filter(s => s.user_id !== userId))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = nameValue.trim()
    if (!name) return
    if (dialogMode === 'create') {
      setCopying(true)
      const emoji = emojiValue.trim() || undefined
      const color = colorValue !== DEFAULT_COLOR ? colorValue : undefined
      // Only use default lanes when explicitly chosen; copying always starts empty
      const withDefaultLanes = copySourceId === COPY_DEFAULTS
      const newId = await createTimeline(name, emoji, color, withDefaultLanes)
      if (newId) {
        // Save dates if provided
        if (startDate || endDate) {
          await updateTimeline(newId, {
            start_year: startDate ? dateTimeToFracYear(startDate, startTime) : null,
            end_year: endDate ? dateTimeToFracYear(endDate, endTime) : null,
          })
        }
        // Copy lanes/events from source timeline (if a real one was selected)
        if (isRealSource(copySourceId)) {
          const isLaneMode = copyMode === 'lanes'
          await copyTimelineData(copySourceId, newId, {
            laneIds: isLaneMode ? [...copyLaneIds] : undefined,
            eventFilter: copyMode === 'all' ? 'all'
              : copyMode === 'all_no_events' ? 'none'
              : copyMode === 'past_current' ? 'past_current'
              : 'all',
            perLaneEventFilter: isLaneMode ? perLaneFilter : undefined,
          })
          refreshTimeline()
        }
      }
      setCopying(false)
    } else if (targetId) {
      await updateTimeline(targetId, {
        name,
        emoji: emojiValue.trim() || null,
        color: colorValue,
        start_year: startDate ? dateTimeToFracYear(startDate, startTime) : null,
        end_year: endDate ? dateTimeToFracYear(endDate, endTime) : null,
        visibility: isPublic ? 'public' : 'private',
      })
    }
    setDialogOpen(false)
  }

  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (timelines.length <= 1) return
    setDeleteConfirmId(id)
  }

  async function confirmDelete() {
    if (!deleteConfirmId) return
    await deleteTimeline(deleteConfirmId)
    setDeleteConfirmId(null)
  }

  const buttonLabel = currentTimeline?.name ?? 'Timeline'

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="max-w-52 gap-1">
            <span className="truncate">{buttonLabel}</span>
            {(activePersonaCount + activeOverlayCount + externalActiveIds.size) > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground shrink-0">
                +{activePersonaCount + activeOverlayCount + externalActiveIds.size}
              </span>
            )}
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-0 max-h-[85vh] overflow-y-auto">
          {/* ── Timelines ── */}
          <div className="px-3 pt-2 pb-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Timelines</p>
          </div>
          <div className="px-1 pb-1">
            {/* Main (selected) timeline */}
            {currentTimeline && (
              <div
                className="flex items-center rounded-md px-2 py-1 cursor-pointer hover:bg-accent group bg-accent"
                onClick={() => selectTimeline(currentTimeline.id)}
              >
                <Star className="h-3 w-3 shrink-0 text-primary mr-1.5" />
                {currentTimeline.emoji && (
                  <span className="text-base leading-none mr-1 shrink-0">{currentTimeline.emoji}</span>
                )}
                <span className="flex-1 text-sm font-semibold truncate">{currentTimeline.name}</span>
                <button
                  className="p-0.5 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100"
                  onClick={e => handleEdit(currentTimeline.id, e)}
                >
                  <Pencil className="h-3 w-3" />
                </button>
                {timelines.length > 1 && (
                  <button
                    className="p-0.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                    onClick={e => handleDelete(currentTimeline.id, e)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}

            {/* Other timelines — switchable as overlays */}
            {otherTimelines.map(t => {
              const isActive = activeOverlayIds.has(t.id)
              const aligned = overlayAlignedIds.has(t.id)
              const mode = overlayDisplayModes.get(t.id) ?? 'integrated'
              return (
                <div key={t.id} className="rounded-md px-2 py-1.5 hover:bg-accent group">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className="min-w-0 flex-1 cursor-pointer flex items-center gap-1"
                      onClick={() => selectTimeline(t.id)}
                    >
                      {t.emoji && <span className="text-base leading-none shrink-0">{t.emoji}</span>}
                      <p className="text-sm truncate">{t.name}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isActive && (
                        <>
                          <button
                            onClick={() => onToggleOverlayAlignment(t.id)}
                            title={aligned ? 'Start-year aligned — click for real years' : 'Real years — click to align start years'}
                            className={cn(
                              'p-1 rounded transition-colors',
                              aligned
                                ? 'text-primary bg-primary/10 animate-blink-fast hover:bg-primary/20'
                                : 'text-muted-foreground hover:bg-muted',
                            )}
                          >
                            {aligned ? <Link2 className="h-3 w-3" /> : <Link2Off className="h-3 w-3" />}
                          </button>
                          <div className="flex items-center rounded border overflow-hidden">
                            <button
                              onClick={() => onSetOverlayDisplayMode(t.id, 'integrated')}
                              title="Blend into timeline lanes"
                              className={cn(
                                'p-1 transition-colors',
                                mode === 'integrated'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'text-muted-foreground hover:bg-muted',
                              )}
                            >
                              <Layers className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => onSetOverlayDisplayMode(t.id, 'separate')}
                              title="Show as separate section below"
                              className={cn(
                                'p-1 transition-colors',
                                mode === 'separate'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'text-muted-foreground hover:bg-muted',
                              )}
                            >
                              <LayoutList className="h-3 w-3" />
                            </button>
                          </div>
                        </>
                      )}
                      <div className="flex items-center gap-1">
                        <button
                          className="p-0.5 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100"
                          onClick={e => handleEdit(t.id, e)}
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        {timelines.length > 1 && (
                          <button
                            className="p-0.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                            onClick={e => handleDelete(t.id, e)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                        <Switch checked={isActive} onCheckedChange={() => onToggleOverlay(t.id)} />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            <button
              className="flex items-center gap-1.5 w-full rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent"
              onClick={handleCreate}
            >
              <Plus className="h-4 w-4" />
              New Timeline…
            </button>
          </div>

          {/* ── Users (external overlays) ── */}
          <div className="border-t px-3 pt-2 pb-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Globe className="h-3 w-3" />
              Users
              {externalActiveIds.size > 0 && (
                <span className="ml-auto rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">{externalActiveIds.size}</span>
              )}
            </p>
          </div>
          <div className="px-1 pb-1">
            {/* Shared with you */}
            {sharedWithMe.length > 0 && (
              <div className="px-2 pb-1 space-y-0.5">
                <p className="text-[10px] font-medium text-muted-foreground mb-1">Shared with you</p>
                {sharedWithMe.map(item => {
                  const alreadyAdded = !!externalStored.find(s => s.timelineId === item.timeline.id)
                  return (
                    <div key={item.timeline.id} className="flex items-center justify-between gap-2 rounded px-1 py-1 hover:bg-accent">
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{item.timeline.emoji ? `${item.timeline.emoji} ` : ''}{item.timeline.name}</p>
                        <p className="text-[10px] text-muted-foreground">from @{item.owner.username || item.owner.display_name}</p>
                      </div>
                      <Button size="sm" variant={alreadyAdded ? 'secondary' : 'default'} className="h-6 text-[10px] px-2 shrink-0" disabled={alreadyAdded}
                        onClick={() => { if (!alreadyAdded) onAddExternal?.({ username: item.owner.username ?? '', timelineId: item.timeline.id, timelineName: item.timeline.name, displayName: item.owner.display_name || item.owner.username || '', startYear: item.timeline.start_year ?? null }) }}>
                        {alreadyAdded ? 'Added' : 'Add'}
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Added external overlays */}
            {externalStored.length > 0 && (
              <div className="px-2 pb-1 space-y-0.5">
                {(sharedWithMe.length > 0) && <div className="border-t my-1" />}
                <p className="text-[10px] font-medium text-muted-foreground mb-1">Added timelines</p>
                {externalStored.map(info => {
                  const isActive = externalActiveIds.has(info.timelineId)
                  const aligned = externalAlignedIds.has(info.timelineId)
                  const mode = externalDisplayModes.get(info.timelineId) ?? 'separate'
                  const canAlign = info.startYear != null && mainStartYear != null
                  return (
                    <div key={info.timelineId} className="rounded-md px-1 py-1.5 hover:bg-accent">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{info.displayName}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{info.timelineName}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {isActive && (
                            <>
                              {canAlign && (
                                <button onClick={() => onToggleExternalAlignment?.(info.timelineId)}
                                  title={aligned ? 'Start-year aligned' : 'Real years'}
                                  className={cn('p-1 rounded transition-colors', aligned ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted-foreground hover:bg-muted')}>
                                  {aligned ? <Link2 className="h-3 w-3" /> : <Link2Off className="h-3 w-3" />}
                                </button>
                              )}
                              <div className="flex items-center rounded border overflow-hidden">
                                <button onClick={() => onSetExternalDisplayMode?.(info.timelineId, 'integrated')} title="Blend into my lanes"
                                  className={cn('p-1 transition-colors', mode === 'integrated' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}>
                                  <Layers className="h-3 w-3" />
                                </button>
                                <button onClick={() => onSetExternalDisplayMode?.(info.timelineId, 'separate')} title="Show as separate section"
                                  className={cn('p-1 transition-colors', mode === 'separate' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}>
                                  <LayoutList className="h-3 w-3" />
                                </button>
                              </div>
                            </>
                          )}
                          <Switch checked={isActive} onCheckedChange={() => onToggleExternalActive?.(info.timelineId)} />
                          <button onClick={() => onRemoveExternal?.(info.timelineId)}
                            className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors" title="Remove">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Search for user timelines */}
            <div className={cn('px-2 py-1.5 space-y-1.5', (sharedWithMe.length > 0 || externalStored.length > 0) && 'border-t mt-1 pt-2')}>
              <p className="text-[10px] font-medium text-muted-foreground">Find timelines by username</p>
              <div className="flex gap-1.5">
                <Input
                  value={userSearchInput}
                  onChange={e => { setUserSearchInput(e.target.value); setUserSearchError(null); setUserSearchResults([]) }}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleUserSearch())}
                  placeholder="username"
                  className="h-7 text-xs flex-1"
                />
                <Button type="button" size="sm" className="h-7 px-2 shrink-0" onClick={handleUserSearch} disabled={userSearching || !userSearchInput.trim()}>
                  <Search className="h-3.5 w-3.5" />
                </Button>
              </div>
              {userSearching && <p className="text-[10px] text-muted-foreground">Searching…</p>}
              {userSearchError && <p className="text-[10px] text-destructive">{userSearchError}</p>}
              {userSearchResults.length > 0 && (
                <div className="space-y-0.5">
                  {userSearchResults.map(r => {
                    const alreadyAdded = !!externalStored.find(s => s.timelineId === r.timelineId)
                    const access = userSearchAccess.get(r.timelineId)
                    const accessLabel = access === 'both' ? 'public · shared' : access === 'shared' ? 'shared with you' : 'public'
                    return (
                      <div key={r.timelineId} className="flex items-center justify-between gap-2 rounded px-1 py-1 hover:bg-accent">
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{r.timelineName}</p>
                          <p className="text-[10px] text-muted-foreground">@{r.username} · {accessLabel}</p>
                        </div>
                        <Button size="sm" variant={alreadyAdded ? 'secondary' : 'default'} className="h-6 text-[10px] px-2 shrink-0" disabled={alreadyAdded}
                          onClick={() => { if (!alreadyAdded) onAddExternal?.(r) }}>
                          {alreadyAdded ? 'Added' : 'Add'}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Personas ── */}
          <div className="border-t px-3 pt-2 pb-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Users className="h-3 w-3" />
              Persona Overlays
            </p>
          </div>
          <div className="px-1 pb-2">
            {personas.length === 0 ? (
              <p className="px-2 py-2 text-xs text-muted-foreground text-center">No personas available</p>
            ) : (
              personas.map(p => {
                const isActive = activePersonaIds.has(p.id)
                const aligned = alignedPersonaIds.has(p.id)
                const mode = personaDisplayModes.get(p.id) ?? 'separate'
                return (
                  <div key={p.id} className="rounded-md px-2 py-1.5 hover:bg-accent">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.birth_year}–{p.death_year ?? 'present'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isActive && (
                          <>
                            <button
                              onClick={() => onTogglePersonaAlignment(p.id)}
                              title={aligned ? 'Showing age-aligned — click for real years' : 'Showing real years — click to age-align'}
                              className={cn(
                                'p-1 rounded transition-colors',
                                aligned
                                  ? 'text-primary bg-primary/10 animate-blink-fast hover:bg-primary/20'
                                  : 'text-muted-foreground hover:bg-muted',
                              )}
                            >
                              {aligned ? <Link2 className="h-3 w-3" /> : <Link2Off className="h-3 w-3" />}
                            </button>
                            <div className="flex items-center rounded border overflow-hidden">
                              <button
                                onClick={() => onSetPersonaDisplayMode(p.id, 'integrated')}
                                title="Blend into my timeline lanes"
                                className={cn(
                                  'p-1 transition-colors',
                                  mode === 'integrated'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-muted',
                                )}
                              >
                                <Layers className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => onSetPersonaDisplayMode(p.id, 'separate')}
                                title="Show as separate timeline below"
                                className={cn(
                                  'p-1 transition-colors',
                                  mode === 'separate'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-muted',
                                )}
                              >
                                <LayoutList className="h-3 w-3" />
                              </button>
                            </div>
                          </>
                        )}
                        <Switch checked={isActive} onCheckedChange={() => onTogglePersona(p.id)} />
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={open => { if (!open) setDeleteConfirmId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete timeline?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{timelines.find(t => t.id === deleteConfirmId)?.name}" and all its lanes and events. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogMode === 'create' ? 'New Timeline' : 'Edit Timeline'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            {/* Name + Color */}
            <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
              <div className="grid gap-1.5">
                <Label htmlFor="tpName">Name</Label>
                <Input id="tpName" value={nameValue} onChange={e => setNameValue(e.target.value)} placeholder="Timeline name" autoFocus />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="tpColor">Color</Label>
                <input
                  id="tpColor"
                  type="color"
                  value={colorValue}
                  onChange={e => setColorValue(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent p-0.5"
                />
              </div>
            </div>

            {/* Start + End date/time — always shown */}
            <div className="grid gap-1.5">
              <Label>Start <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <div className="flex gap-2">
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="flex-1" />
                <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-28" disabled={!startDate} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>End <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <div className="flex gap-2">
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="flex-1" />
                <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-28" disabled={!endDate} />
              </div>
            </div>

            {/* ── Start / duplicate section (create mode only) ── */}
            {dialogMode === 'create' && (
              <div className="rounded-md border p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Copy className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Label className="text-sm font-medium">Start from</Label>
                </div>
                <select
                  value={copySourceId}
                  onChange={e => { setCopySourceId(e.target.value); setCopyMode('all') }}
                  className="h-8 text-sm border rounded-md px-2 bg-background w-full"
                >
                  <option value={COPY_DEFAULTS}>— start fresh (default lanes) —</option>
                  <option value={COPY_EMPTY}>— start fresh (empty) —</option>
                  {timelines.length > 0 && <option disabled>────────────</option>}
                  {timelines.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.emoji ? `${t.emoji} ` : ''}{t.name}
                    </option>
                  ))}
                </select>

                {isRealSource(copySourceId) && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">What to copy</Label>
                    <div className="space-y-1.5">
                      {([
                        { value: 'all',           label: 'All lanes & events' },
                        { value: 'past_current',  label: 'All lanes · past & ongoing events only' },
                        { value: 'all_no_events', label: 'All lanes (no events)' },
                        { value: 'lanes',         label: 'Select specific lanes…' },
                      ] as const).map(opt => (
                        <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                          <input
                            type="radio" name="copyMode" value={opt.value}
                            checked={copyMode === opt.value}
                            onChange={() => setCopyMode(opt.value)}
                            className="h-3.5 w-3.5 accent-primary"
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>

                    {copyMode === 'lanes' && (
                      <div className="rounded-md border p-2 space-y-1.5 max-h-48 overflow-y-auto">
                        {loadingSourceLanes ? (
                          <p className="text-xs text-muted-foreground">Loading…</p>
                        ) : sourceLanes.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No lanes found.</p>
                        ) : (
                          <>
                            <div className="flex gap-3 pb-1.5 border-b">
                              <button type="button" onClick={() => setCopyLaneIds(new Set(sourceLanes.map(l => l.id)))} className="text-[11px] text-muted-foreground hover:text-foreground">Select all</button>
                              <button type="button" onClick={() => setCopyLaneIds(new Set())} className="text-[11px] text-muted-foreground hover:text-foreground">None</button>
                            </div>
                            {sourceLanes.map(lane => (
                              <div key={lane.id} className="space-y-1">
                                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={copyLaneIds.has(lane.id)}
                                    onChange={() => toggleLane(lane.id)}
                                    className="h-3.5 w-3.5 accent-primary"
                                  />
                                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: lane.color }} />
                                  <span className="flex-1 truncate">{lane.emoji ? `${lane.emoji} ` : ''}{lane.name}</span>
                                </label>
                                {copyLaneIds.has(lane.id) && (
                                  <div className="ml-6 flex items-center gap-1.5">
                                    <span className="text-[11px] text-muted-foreground">Events:</span>
                                    {(['all', 'past_current', 'none'] as LaneEvtFilter[]).map(f => (
                                      <button
                                        key={f}
                                        type="button"
                                        onClick={() => setPerLaneFilter(prev => ({ ...prev, [lane.id]: f }))}
                                        className={`text-[11px] px-1.5 py-0.5 rounded border transition-colors ${(perLaneFilter[lane.id] ?? 'all') === f ? 'bg-primary text-primary-foreground border-primary' : 'border-input text-muted-foreground hover:text-foreground'}`}
                                      >
                                        {f === 'all' ? 'All' : f === 'past_current' ? 'Past & ongoing' : 'None'}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Visibility + sharing — edit mode only */}
            {dialogMode === 'edit' && (
              <>
                <div className="flex items-center justify-between">
                  <div className="grid gap-0.5">
                    <Label>Public</Label>
                    <p className="text-xs text-muted-foreground">Visible on your public profile</p>
                  </div>
                  <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                </div>

                {/* Share with specific people */}
                <div className="rounded-md border p-3 space-y-3">
                  <div>
                    <p className="text-sm font-medium">Share with people</p>
                    <p className="text-xs text-muted-foreground">Give specific users access regardless of public setting</p>
                  </div>
                  <div className="flex gap-1.5">
                    <Input
                      value={shareInput}
                      onChange={e => { setShareInput(e.target.value); setShareError(null) }}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddShare())}
                      placeholder="username"
                      className="h-8 text-xs flex-1"
                    />
                    <Button type="button" size="sm" className="h-8 px-2 shrink-0" onClick={handleAddShare} disabled={shareSearching || !shareInput.trim()}>
                      <UserPlus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {shareError && <p className="text-xs text-destructive">{shareError}</p>}
                  {shares.length > 0 && (
                    <div className="space-y-1">
                      {shares.map(s => (
                        <div key={s.user_id} className="flex items-center justify-between gap-2 rounded px-2 py-1 bg-muted/40">
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">{s.display_name || s.username}</p>
                            {s.username && <p className="text-[10px] text-muted-foreground">@{s.username}</p>}
                          </div>
                          <button type="button" onClick={() => handleRemoveShare(s.share_id, s.user_id)} className="text-muted-foreground hover:text-destructive shrink-0">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={copying}>
                {copying ? 'Duplicating…' : dialogMode === 'create' ? 'Create' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
