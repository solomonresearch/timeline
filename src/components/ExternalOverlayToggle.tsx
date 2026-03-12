import { useState } from 'react'
import { Globe, X as XIcon, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { fetchPublicProfile } from '@/lib/api'
import type { SharedWithMeItem } from '@/types/database'

export interface ExternalOverlayInfo {
  username: string
  timelineId: string
  timelineName: string
  displayName: string
  startYear: number | null
}

interface ExternalOverlayToggleProps {
  sharedWithMe?: SharedWithMeItem[]
  userId?: string | null
}

const STORED_KEY = 'timeline_external_overlays'

function loadStored(): ExternalOverlayInfo[] {
  try {
    const raw = localStorage.getItem(STORED_KEY)
    if (raw) return JSON.parse(raw) as ExternalOverlayInfo[]
  } catch { /* ignore */ }
  return []
}

function saveStored(items: ExternalOverlayInfo[]) {
  localStorage.setItem(STORED_KEY, JSON.stringify(items))
}

export function ExternalOverlayToggle({ sharedWithMe = [], userId }: ExternalOverlayToggleProps) {
  const [open, setOpen] = useState(false)
  const [stored, setStored] = useState<ExternalOverlayInfo[]>(loadStored)
  const [searchInput, setSearchInput] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<ExternalOverlayInfo[]>([])

  function onAdd(info: ExternalOverlayInfo) {
    setStored(prev => {
      const next = [...prev, info]
      saveStored(next)
      return next
    })
  }

  function onRemove(timelineId: string) {
    setStored(prev => {
      const next = prev.filter(s => s.timelineId !== timelineId)
      saveStored(next)
      return next
    })
  }

  async function handleSearch() {
    const username = searchInput.trim().toLowerCase()
    if (!username) return
    setSearching(true)
    setSearchError(null)
    setSearchResults([])
    const profile = await fetchPublicProfile(username)
    if (!profile) {
      setSearchError(`No public profile found for @${username}`)
      setSearching(false)
      return
    }
    const results: ExternalOverlayInfo[] = profile.timelines
      .filter(_t => !userId || profile.profile.username !== null)
      .map(t => ({
        username: profile.profile.username,
        timelineId: t.id,
        timelineName: t.name,
        displayName: profile.profile.display_name || profile.profile.username,
        startYear: t.start_year ?? null,
      }))
    if (results.length === 0) {
      setSearchError(`@${username} has no public timelines`)
    } else {
      setSearchResults(results)
    }
    setSearching(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Globe className="h-3.5 w-3.5" />
          {stored.length > 0 && (
            <span className="text-xs font-medium">{stored.length}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3 space-y-3">
        <div>
          <p className="text-sm font-medium">Browse timelines</p>
          <p className="text-xs text-muted-foreground">Overlay another user's timeline on yours</p>
        </div>

        {/* Active overlays */}
        {stored.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Active overlays</p>
            {stored.map(s => (
              <div key={s.timelineId} className="flex items-center justify-between gap-2 rounded px-2 py-1 bg-muted/40">
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{s.timelineName}</p>
                  <p className="text-[10px] text-muted-foreground">@{s.username}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(s.timelineId)}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

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

        {sharedWithMe.length > 0 && <div className="border-t" />}

        {/* Search section */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Find public timelines</p>
          <p className="text-[10px] text-muted-foreground">Search by username to find public timelines</p>
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
                      onClick={() => {
                        if (alreadyAdded) return
                        onAdd(r)
                      }}
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
