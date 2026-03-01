import { Eye, EyeOff, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { Lane } from '@/types/timeline'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

interface LaneSidebarProps {
  lanes: Lane[]
  onToggleVisibility: (id: string) => void
  onEditLane: (lane: Lane) => void
  onDeleteLane: (lane: Lane) => void
}

const LANE_HEIGHT = 28

export function LaneSidebar({ lanes, onToggleVisibility, onEditLane, onDeleteLane }: LaneSidebarProps) {
  return (
    <div className="sticky left-0 z-20 bg-white border-r" style={{ minWidth: 160, width: 160 }}>
      {/* header spacer */}
      <div className="h-6 border-b bg-white" />
      {lanes.map(lane => (
        <div
          key={lane.id}
          className="flex items-center gap-1 border-b border-border/30 px-2 group"
          style={{ height: LANE_HEIGHT }}
        >
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: lane.color }} />
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
      ))}
    </div>
  )
}
