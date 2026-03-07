import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Eye, EyeOff, MoreHorizontal, Pencil, Trash2, TrendingUp } from 'lucide-react'
import type { Lane } from '@/types/timeline'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useSizeConfig } from '@/contexts/UiSizeContext'

export interface PersonaSidebarSection {
  personaId: string
  name: string
  initials: string
  birthYear: number
  deathYear?: number | null
  laneNames: string[]
}

interface LaneSidebarProps {
  lanes: Lane[]
  hiddenLanes: Lane[]
  laneHeights: number[]
  lanePersonaLabels: Map<string, { initials: string; name: string }[]>
  laneHasOverlaps: Map<string, boolean>
  expandedLanes: Set<string>
  separatePersonaSections?: PersonaSidebarSection[]
  onToggleExpand: (id: string) => void
  onToggleVisibility: (id: string) => void
  onEditLane: (lane: Lane) => void
  onDeleteLane: (lane: Lane) => void
  totalAssetsHeight?: number
}

export function LaneSidebar({
  lanes,
  hiddenLanes,
  laneHeights,
  lanePersonaLabels,
  laneHasOverlaps,
  expandedLanes,
  separatePersonaSections = [],
  onToggleExpand,
  onToggleVisibility,
  onEditLane,
  onDeleteLane,
  totalAssetsHeight,
}: LaneSidebarProps) {
  const [showHidden, setShowHidden] = useState(false)
  const { sc } = useSizeConfig()
  const { BASE_LANE_HEIGHT, PERSONA_SUB_ROW_HEIGHT, SIDEBAR_WIDTH, HEADER_HEIGHT, SIDEBAR_FONT, ICON_SIZE } = sc

  // Compress sidebar on narrow viewports so more horizontal space goes to the timeline
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth)
  useEffect(() => {
    const update = () => setViewportWidth(window.innerWidth)
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  const W = Math.min(SIDEBAR_WIDTH, Math.max(72, Math.round(viewportWidth * 0.28)))

  const dotSize = Math.round(ICON_SIZE / 3)
  const iconPad = Math.round(ICON_SIZE / 12)

  return (
    <div className="sticky left-0 z-20 bg-background border-r" style={{ minWidth: W, width: W }}>
      {/* header spacer */}
      <div className="border-b bg-background" style={{ height: HEADER_HEIGHT }} />

      {lanes.map((lane, i) => {
        const height = laneHeights[i] ?? BASE_LANE_HEIGHT
        const personaLabels = lanePersonaLabels.get(lane.name) ?? []
        return (
          <div
            key={lane.id}
            className="border-b border-border/30 group"
            style={{ height, paddingLeft: Math.round(W * 0.04), paddingRight: Math.round(W * 0.04) }}
          >
            {/* Main lane label row */}
            <div className="flex items-center" style={{ height: BASE_LANE_HEIGHT, gap: Math.round(ICON_SIZE / 6) }}>
              {laneHasOverlaps.get(lane.id) ? (
                <button
                  onClick={() => onToggleExpand(lane.id)}
                  className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                  style={{ padding: iconPad }}
                  title={expandedLanes.has(lane.id) ? 'Collapse rows' : 'Expand overlapping events'}
                >
                  {expandedLanes.has(lane.id)
                    ? <ChevronDown size={ICON_SIZE} />
                    : <ChevronRight size={ICON_SIZE} />}
                </button>
              ) : (
                <div
                  className="rounded-full shrink-0"
                  style={{ width: dotSize * 2, height: dotSize * 2, backgroundColor: lane.color }}
                />
              )}
              <span
                className="font-medium truncate flex-1"
                style={{ fontSize: SIDEBAR_FONT, opacity: lane.visible ? 1 : 0.4 }}
              >
                {lane.name}
              </span>
              <button
                onClick={() => onToggleVisibility(lane.id)}
                className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ padding: iconPad }}
              >
                {lane.visible ? <Eye size={ICON_SIZE} /> : <EyeOff size={ICON_SIZE} />}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ padding: iconPad }}
                  >
                    <MoreHorizontal size={ICON_SIZE} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" sideOffset={4}>
                  <DropdownMenuItem onClick={() => onEditLane(lane)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Lane
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDeleteLane(lane)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Lane
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Persona sub-row labels */}
            {personaLabels.map((pl, j) => (
              <div
                key={j}
                className="flex items-center text-muted-foreground"
                style={{
                  height: PERSONA_SUB_ROW_HEIGHT,
                  paddingLeft: Math.round(W * 0.08),
                  gap: Math.round(ICON_SIZE / 6),
                }}
              >
                <span
                  className="font-semibold bg-muted rounded shrink-0"
                  style={{ fontSize: Math.round(SIDEBAR_FONT * 0.85), padding: '0 4px' }}
                >
                  {pl.initials}
                </span>
                <span className="truncate" style={{ fontSize: SIDEBAR_FONT }}>
                  {pl.name}
                </span>
              </div>
            ))}
          </div>
        )
      })}

      {/* Total Assets summary row */}
      {totalAssetsHeight != null && totalAssetsHeight > 0 && (
        <div
          className="border-b border-border/30 flex items-center bg-muted/10"
          style={{
            height: totalAssetsHeight,
            paddingLeft: Math.round(W * 0.04),
            paddingRight: Math.round(W * 0.04),
            gap: Math.round(ICON_SIZE / 4),
          }}
        >
          <TrendingUp size={ICON_SIZE} className="shrink-0 text-teal-500" />
          <span className="font-medium truncate flex-1 text-teal-600" style={{ fontSize: SIDEBAR_FONT }}>
            Total Wealth
          </span>
        </div>
      )}

      {/* Separate persona sections */}
      {separatePersonaSections.map(section => (
        <div key={section.personaId}>
          {/* Persona header row */}
          <div
            className="border-t-2 border-border/60 flex items-center bg-muted/40"
            style={{
              height: PERSONA_SUB_ROW_HEIGHT,
              paddingLeft: Math.round(W * 0.04),
              paddingRight: Math.round(W * 0.04),
              gap: Math.round(ICON_SIZE / 6),
            }}
          >
            <span
              className="font-bold bg-muted-foreground/20 rounded shrink-0"
              style={{ fontSize: Math.round(SIDEBAR_FONT * 0.85), padding: '1px 4px' }}
            >
              {section.initials}
            </span>
            <span className="font-semibold text-muted-foreground truncate" style={{ fontSize: SIDEBAR_FONT }}>
              {section.name}
            </span>
            <span
              className="text-muted-foreground/60 shrink-0 hidden xl:inline"
              style={{ fontSize: Math.round(SIDEBAR_FONT * 0.75) }}
            >
              {section.birthYear}–{section.deathYear ?? 'present'}
            </span>
          </div>
          {/* One label row per lane */}
          {section.laneNames.map(laneName => (
            <div
              key={laneName}
              className="border-b border-border/30 flex items-center text-muted-foreground"
              style={{
                height: BASE_LANE_HEIGHT,
                paddingLeft: Math.round(W * 0.08),
                paddingRight: Math.round(W * 0.04),
                gap: Math.round(ICON_SIZE / 4),
              }}
            >
              <span className="truncate" style={{ fontSize: SIDEBAR_FONT }}>{laneName}</span>
            </div>
          ))}
        </div>
      ))}

      {/* Hidden lanes recovery section */}
      {hiddenLanes.length > 0 && (
        <div className="border-t border-border/50">
          <button
            onClick={() => setShowHidden(!showHidden)}
            className="flex items-center w-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            style={{
              gap: Math.round(ICON_SIZE / 6),
              padding: `${Math.round(SIDEBAR_FONT * 0.4)}px ${Math.round(W * 0.04)}px`,
              fontSize: SIDEBAR_FONT,
            }}
          >
            <ChevronRight
              size={ICON_SIZE}
              className="shrink-0 transition-transform"
              style={{ transform: showHidden ? 'rotate(90deg)' : undefined }}
            />
            <EyeOff size={ICON_SIZE} className="shrink-0" />
            <span>Hidden ({hiddenLanes.length})</span>
          </button>
          {showHidden && (
            <div style={{ paddingBottom: Math.round(SIDEBAR_FONT * 0.3) }}>
              {hiddenLanes.map(lane => (
                <div
                  key={lane.id}
                  className="flex items-center group/hidden"
                  style={{
                    gap: Math.round(ICON_SIZE / 6),
                    padding: `${Math.round(SIDEBAR_FONT * 0.25)}px ${Math.round(W * 0.04)}px`,
                  }}
                >
                  <div
                    className="rounded-full shrink-0 opacity-40"
                    style={{ width: dotSize * 2, height: dotSize * 2, backgroundColor: lane.color }}
                  />
                  <span
                    className="text-muted-foreground truncate flex-1"
                    style={{ fontSize: SIDEBAR_FONT }}
                  >
                    {lane.name}
                  </span>
                  <button
                    onClick={() => onToggleVisibility(lane.id)}
                    className="text-muted-foreground hover:text-foreground opacity-0 group-hover/hidden:opacity-100 transition-opacity"
                    style={{ padding: iconPad }}
                  >
                    <Eye size={ICON_SIZE} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
