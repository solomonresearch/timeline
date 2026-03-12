import { useState, useCallback } from 'react'
import { Globe, Layers, LayoutList, Link2, Link2Off, X, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { fetchPublicProfile } from '@/lib/api'
import type { SharedWithMeItem } from '@/types/database'
import type { ExternalOverlayInfo } from '@/hooks/useExternalOverlays'
import type { OverlayDisplayMode } from '@/hooks/useTimelineOverlays'

interface Props {
  stored: ExternalOverlayInfo[]
  activeIds: Set<string>
  alignedIds: Set<string>
  displayModes: Map<string, OverlayDisplayMode>
  onAdd: (info: ExternalOverlayInfo) => void
  onRemove: (timelineId: string) => void
  onToggleActive: (timelineId: string) => void
  onToggleAlignment: (timelineId: string) => void
  onSetDisplayMode: (timelineId: string, mode: OverlayDisplayMode) => void
  mainStartYear?: number | null
  sharedWithMe?: SharedWithMeItem[]
}

export function ExternalOverlayToggle({
  stored, activeIds, alignedIds, displayModes,
  onAdd, onRemove, onToggleActive, onToggleAlignment, onSetDisplayMode,
  mainStartYear,
  sharedWithMe = [],
}: Props) {
  const [searchInput, setSearchInput] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<ExternalOverlayInfo[]>([])

  const handleSearch = useCallback(async () => {
    const username = searchInput.trim().toLowerCase()
    if (!username) return
    setSearching(true)
    setSearchError(null)
    setSearchResults([])

    // Public timelines for this user
    const profile = await fetchPublicProfile(username)
    const publicResults: ExternalOverlayInfo[] = profile
      ? profile.timelines.map(t => ({
          username: profile.profile.username,
          timelineId: t.id,
          timelineName: t.name,
          displayName: profile.profile.display_name || profile.profile.username,
          startYear: t.start_year ?? null,
        }))
      : []

    // Timelines this user has shared with me (already in sharedWithMe prop)
    const sharedResults: ExternalOverlayInfo[] = sharedWithMe
      .filter(item => (item.owner.username ?? '').toLowerCase() === username)
      .map(item => ({
        username: item.owner.username ?? '',
        timelineId: item.timeline.id,
        timelineName: item.timeline.name,
        displayName: item.owner.display_name || item.owner.username || '',
        startYear: item.timeline.start_year ?? null,
      }))

    // Merge, deduplicate by timelineId (public takes precedence)
    const seen = new Set<string>()
    const results: ExternalOverlayInfo[] = []
    for (const r of [...publicResults, ...sharedResults]) {
      if (!seen.has(r.timelineId)) { seen.add(r.timelineId); results.push(r) }
    }

    if (results.length === 0) {
      setSearchError(profile
        ? `@${username} has no public timelines and hasn't shared any with you`
        : `No profile found for @${username} and no timelines shared with you by that user`)
    } else {
      setSearchResults(results)
    }
    setSearching(false)
  }, [searchInput, sharedWithMe])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Globe className="h-4 w-4" />
          Users
          {activeIds.size > 0 && (
            <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
              {activeIds.size}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-3 space-y-3">
        <div>
          <p className="text-sm font-medium">Browse timelines</p>
          <p className="text-xs text-muted-foreground">Overlay another user's timeline on yours</p>
        </div>

        {/* Shared with you */}
        {sharedWithMe.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Shared with you</p>
            {sharedWithMe.map(item => {
              const alreadyAdded = !!stored.find(s => s.timelineId === item.timeline.id)
              return (
                <div key={item.timeline.id} className="flex items-center justify-between gap-2 rounded px-1 py-1 hover:bg-accent">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{item.timeline.emoji ? `${item.timeline.emoji} ` : ''}{item.timeline.name}</p>
                    <p className="text-[10px] text-muted-foreground">from @{item.owner.username || item.owner.display_name}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={alreadyAdded ? 'secondary' : 'default'}
                    className="h-6 text-[10px] px-2 shrink-0"
                    disabled={alreadyAdded}
                    onClick={() => {
                      if (alreadyAdded) return
                      onAdd({
                        username: item.owner.username ?? '',
                        timelineId: item.timeline.id,
                        timelineName: item.timeline.name,
                        displayName: item.owner.display_name || item.owner.username || '',
                        startYear: item.timeline.start_year ?? null,
                      })
                    }}
                  >
                    {alreadyAdded ? 'Added' : 'Add'}
                  </Button>
                </div>
              )
            })}
          </div>
        )}

        {/* Added/active overlays with controls */}
        {stored.length > 0 && (
          <div className="space-y-0.5 border-t pt-2">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Added timelines</p>
            {stored.map(info => {
              const isActive = activeIds.has(info.timelineId)
              const aligned = alignedIds.has(info.timelineId)
              const mode = displayModes.get(info.timelineId) ?? 'separate'
              const canAlign = info.startYear != null && mainStartYear != null
              return (
                <div key={info.timelineId} className="rounded-md px-2 py-1.5 hover:bg-accent">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{info.displayName}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{info.timelineName}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {isActive && (
                        <>
                          {canAlign && (
                            <button
                              onClick={() => onToggleAlignment(info.timelineId)}
                              title={aligned ? 'Start-year aligned — click for real years' : 'Real years — click to align by start year'}
                              className={cn('p-1 rounded transition-colors', aligned ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted-foreground hover:bg-muted')}
                            >
                              {aligned ? <Link2 className="h-3 w-3" /> : <Link2Off className="h-3 w-3" />}
                            </button>
                          )}
                          <div className="flex items-center rounded border overflow-hidden">
                            <button
                              onClick={() => onSetDisplayMode(info.timelineId, 'integrated')}
                              title="Blend into my lanes"
                              className={cn('p-1 transition-colors', mode === 'integrated' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}
                            >
                              <Layers className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => onSetDisplayMode(info.timelineId, 'separate')}
                              title="Show as separate section below"
                              className={cn('p-1 transition-colors', mode === 'separate' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}
                            >
                              <LayoutList className="h-3 w-3" />
                            </button>
                          </div>
                        </>
                      )}
                      <Switch checked={isActive} onCheckedChange={() => onToggleActive(info.timelineId)} />
                      <button
                        onClick={() => onRemove(info.timelineId)}
                        className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors"
                        title="Remove"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Search for public timelines */}
        <div className={cn('space-y-2', (sharedWithMe.length > 0 || stored.length > 0) && 'border-t pt-3')}>
          <p className="text-xs font-medium text-muted-foreground">Find timelines public or shared with you</p>
          <div className="flex gap-1.5">
            <Input
              value={searchInput}
              onChange={e => { setSearchInput(e.target.value); setSearchError(null); setSearchResults([]) }}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
              placeholder="username"
              className="h-8 text-xs flex-1"
            />
            <Button
              type="button"
              size="sm"
              className="h-8 px-2 shrink-0"
              onClick={handleSearch}
              disabled={searching || !searchInput.trim()}
            >
              <Search className="h-3.5 w-3.5" />
            </Button>
          </div>
          {searching && <p className="text-xs text-muted-foreground">Searching…</p>}
          {searchError && <p className="text-xs text-destructive">{searchError}</p>}
          {searchResults.length > 0 && (
            <div className="space-y-1">
              {searchResults.map(r => {
                const alreadyAdded = !!stored.find(s => s.timelineId === r.timelineId)
                return (
                  <div key={r.timelineId} className="flex items-center justify-between gap-2 rounded px-1 py-1 hover:bg-accent">
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{r.timelineName}</p>
                      <p className="text-[10px] text-muted-foreground">@{r.username}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={alreadyAdded ? 'secondary' : 'default'}
                      className="h-6 text-[10px] px-2 shrink-0"
                      disabled={alreadyAdded}
                      onClick={() => { if (!alreadyAdded) onAdd(r) }}
                    >
                      {alreadyAdded ? 'Added' : 'Add'}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
