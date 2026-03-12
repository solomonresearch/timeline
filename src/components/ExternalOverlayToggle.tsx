import { useState, useCallback } from 'react'
import { Globe, Layers, LayoutList, Link2, Link2Off, X, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { fetchPublicProfile } from '@/lib/api'
import type { PublicProfileData } from '@/types/database'
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
}

export function ExternalOverlayToggle({
  stored, activeIds, alignedIds, displayModes,
  onAdd, onRemove, onToggleActive, onToggleAlignment, onSetDisplayMode,
  mainStartYear,
}: Props) {
  const [searchInput, setSearchInput] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<PublicProfileData | null | 'notfound'>(null)
  const [searchedUsername, setSearchedUsername] = useState('')

  const handleSearch = useCallback(async () => {
    const username = searchInput.trim().toLowerCase()
    if (!username) return
    setSearching(true)
    setSearchResult(null)
    setSearchedUsername(username)
    const result = await fetchPublicProfile(username)
    setSearchResult(result ?? 'notfound')
    setSearching(false)
  }, [searchInput])

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
        <p className="text-xs font-medium text-muted-foreground">Overlay another user's timeline</p>

        {/* Search */}
        <div className="flex gap-1.5">
          <Input
            value={searchInput}
            onChange={e => { setSearchInput(e.target.value); setSearchResult(null) }}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="username"
            className="h-8 text-xs"
          />
          <Button size="sm" className="h-8 px-2 shrink-0" onClick={handleSearch} disabled={searching || !searchInput.trim()}>
            <Search className="h-3.5 w-3.5" />
          </Button>
        </div>

        {searching && <p className="text-xs text-muted-foreground">Searching…</p>}
        {searchResult === 'notfound' && (
          <p className="text-xs text-muted-foreground">No public profile found for @{searchedUsername}.</p>
        )}
        {searchResult && searchResult !== 'notfound' && (
          <div className="rounded-md border p-2 space-y-1.5">
            <p className="text-xs font-medium">
              {searchResult.profile.display_name || `@${searchResult.profile.username}`}
            </p>
            {searchResult.timelines.length === 0 && (
              <p className="text-xs text-muted-foreground">No public timelines.</p>
            )}
            {searchResult.timelines.map(tl => {
              const alreadyAdded = !!stored.find(s => s.timelineId === tl.id)
              return (
                <div key={tl.id} className="flex items-center justify-between gap-2">
                  <span className="text-xs truncate flex-1">{tl.emoji ? `${tl.emoji} ` : ''}{tl.name}</span>
                  <Button
                    size="sm"
                    variant={alreadyAdded ? 'secondary' : 'default'}
                    className="h-6 text-[10px] px-2 shrink-0"
                    disabled={alreadyAdded}
                    onClick={() => {
                      if (alreadyAdded) return
                      onAdd({
                        username: searchedUsername,
                        timelineId: tl.id,
                        timelineName: tl.name,
                        displayName: (searchResult as PublicProfileData).profile.display_name || searchedUsername,
                        startYear: tl.start_year ?? null,
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

        {/* Active/added overlays */}
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
      </PopoverContent>
    </Popover>
  )
}
