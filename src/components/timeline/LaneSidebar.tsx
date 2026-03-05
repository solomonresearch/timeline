import { useState } from 'react'
import { ChevronDown, ChevronRight, Eye, EyeOff, MoreHorizontal, Pencil, Trash2, TrendingUp } from 'lucide-react'
import type { Lane } from '@/types/timeline'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { BASE_LANE_HEIGHT, PERSONA_SUB_ROW_HEIGHT } from '@/lib/constants'

interface LaneSidebarProps {
  lanes: Lane[]
  hiddenLanes: Lane[]
  laneHeights: number[]
  lanePersonaLabels: Map<string, { initials: string; name: string }[]>
  laneHasOverlaps: Map<string, boolean>
  expandedLanes: Set<string>
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
  onToggleExpand,
  onToggleVisibility,
  onEditLane,
  onDeleteLane,
  totalAssetsHeight,
}: LaneSidebarProps) {
  const [showHidden, setShowHidden] = useState(false)

  return (
    <div className="sticky left-0 z-20 bg-white border-r" style={{ minWidth: 160, width: 160 }}>
      {/* header spacer */}
      <div className="h-6 border-b bg-white" />
      {lanes.map((lane, i) => {
        const height = laneHeights[i] ?? BASE_LANE_HEIGHT
        const personaLabels = lanePersonaLabels.get(lane.name) ?? []
        return (
          <div
            key={lane.id}
            className="border-b border-border/30 px-2 group"
            style={{ height }}
          >
            {/* Main lane label row */}
            <div className="flex items-center gap-1" style={{ height: BASE_LANE_HEIGHT }}>
              {laneHasOverlaps.get(lane.id) ? (
                <button
                  onClick={() => onToggleExpand(lane.id)}
                  className="p-0.5 text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                  title={expandedLanes.has(lane.id) ? 'Collapse rows' : 'Expand overlapping events'}
                >
                  {expandedLanes.has(lane.id)
                    ? <ChevronDown className="h-3 w-3" />
                    : <ChevronRight className="h-3 w-3" />}
                </button>
              ) : (
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: lane.color }} />
              )}
              <span className="text-xs font-medium truncate flex-1" style={{ opacity: lane.visible ? 1 : 0.4 }}>
                {lane.name}
              </span>
              <button
                onClick={() => onToggleVisibility(lane.id)}
                className="p-0.5 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {lane.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-0.5 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" sideOffset={4}>
                  <DropdownMenuItem onClick={() => onEditLane(lane)}>
                    <Pencil className="h-3 w-3 mr-2" />
                    Edit Lane
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDeleteLane(lane)}
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete Lane
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {/* Persona sub-row labels */}
            {personaLabels.map((pl, j) => (
              <div
                key={j}
                className="flex items-center gap-1 pl-3 text-muted-foreground"
                style={{ height: PERSONA_SUB_ROW_HEIGHT }}
              >
                <span className="text-[9px] font-semibold bg-muted rounded px-1">
                  {pl.initials}
                </span>
                <span className="text-[10px] truncate">{pl.name}</span>
              </div>
            ))}
          </div>
        )
      })}

      {/* Total Assets summary row */}
      {totalAssetsHeight != null && totalAssetsHeight > 0 && (
        <div
          className="border-b border-border/30 px-2 flex items-center gap-1.5 bg-muted/10"
          style={{ height: totalAssetsHeight }}
        >
          <TrendingUp className="h-3 w-3 shrink-0 text-teal-500" />
          <span className="text-xs font-medium truncate flex-1 text-teal-600">Total Assets</span>
        </div>
      )}

      {/* Hidden lanes recovery section */}
      {hiddenLanes.length > 0 && (
        <div className="border-t border-border/50">
          <button
            onClick={() => setShowHidden(!showHidden)}
            className="flex items-center gap-1 w-full px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <ChevronRight
              className="h-3 w-3 shrink-0 transition-transform"
              style={{ transform: showHidden ? 'rotate(90deg)' : undefined }}
            />
            <EyeOff className="h-3 w-3 shrink-0" />
            <span>Hidden ({hiddenLanes.length})</span>
          </button>
          {showHidden && (
            <div className="pb-1">
              {hiddenLanes.map(lane => (
                <div
                  key={lane.id}
                  className="flex items-center gap-1 px-2 py-1 group/hidden"
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0 opacity-40"
                    style={{ backgroundColor: lane.color }}
                  />
                  <span className="text-xs text-muted-foreground truncate flex-1">
                    {lane.name}
                  </span>
                  <button
                    onClick={() => onToggleVisibility(lane.id)}
                    className="p-0.5 text-muted-foreground hover:text-foreground opacity-0 group-hover/hidden:opacity-100 transition-opacity"
                  >
                    <Eye className="h-3 w-3" />
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
