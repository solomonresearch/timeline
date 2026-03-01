import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Trash2 } from 'lucide-react'

export interface KanbanCardData {
  id: string
  title: string
  description: string | null
  status: 'todo' | 'in_progress' | 'done'
  position: number
  created_by: string | null
  created_at: string
  updated_at: string
}

interface KanbanCardProps {
  card: KanbanCardData
  compact?: boolean
  overlay?: boolean
  onDelete?: (id: string) => void
  onEdit?: (card: KanbanCardData) => void
}

export function KanbanCard({ card, compact, overlay, onDelete, onEdit }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  if (overlay) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg rotate-2 opacity-90">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-sm font-medium text-gray-900 truncate">{card.title}</span>
        </div>
      </div>
    )
  }

  if (compact) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`group rounded-lg border border-gray-100 bg-white px-3 py-2 transition-shadow hover:shadow-sm ${
          isDragging ? 'opacity-40' : ''
        }`}
      >
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="touch-none text-gray-300 hover:text-gray-500 shrink-0 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
          <span className="text-sm text-gray-400 line-through truncate flex-1">
            {card.title}
          </span>
          {onEdit && (
            <button
              onClick={() => onEdit(card)}
              className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-blue-500 transition-opacity shrink-0"
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(card.id)}
              className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity shrink-0"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="touch-none mt-0.5 text-gray-300 hover:text-gray-500 shrink-0 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{card.title}</p>
          {card.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{card.description}</p>
          )}
          <div className="flex items-center justify-end mt-2">
            <div className="flex items-center gap-1.5">
              {onEdit && (
                <button
                  onClick={() => onEdit(card)}
                  className="text-gray-300 hover:text-blue-500 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(card.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
