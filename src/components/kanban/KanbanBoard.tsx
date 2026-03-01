import { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard, type KanbanCardData } from './KanbanCard'
import {
  fetchKanbanCards,
  createKanbanCard,
  updateKanbanCard,
  deleteKanbanCard,
} from '@/lib/api'
import { supabase } from '@/lib/supabase'

const STATUSES = ['todo', 'in_progress', 'done'] as const
type Status = (typeof STATUSES)[number]

const STATUS_LABELS: Record<Status, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
}

const customCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args)
  if (pointerCollisions.length > 0) return pointerCollisions
  return rectIntersection(args)
}

export function KanbanBoard() {
  const [cards, setCards] = useState<KanbanCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCard, setActiveCard] = useState<KanbanCardData | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newCard, setNewCard] = useState({ title: '', description: '', status: 'todo' as Status })
  const [editCard, setEditCard] = useState<KanbanCardData | null>(null)
  const [editFields, setEditFields] = useState({ title: '', description: '' })
  const [filters, setFilters] = useState<Record<Status, string>>({
    todo: '',
    in_progress: '',
    done: '',
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const loadCards = useCallback(async () => {
    const data = await fetchKanbanCards()
    setCards(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadCards()
  }, [loadCards])

  // Real-time sync
  useEffect(() => {
    const channel = supabase
      .channel('kanban-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kanban_cards' },
        () => { loadCards() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [loadCards])

  const getColumnCards = useCallback(
    (status: Status) => cards.filter(c => c.status === status),
    [cards]
  )

  const handleDragStart = (event: DragStartEvent) => {
    const card = cards.find(c => c.id === event.active.id)
    if (card) setActiveCard(card)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const draggedCard = cards.find(c => c.id === activeId)
    if (!draggedCard) return

    let targetStatus: Status
    if (STATUSES.includes(overId as Status)) {
      targetStatus = overId as Status
    } else {
      const overCard = cards.find(c => c.id === overId)
      if (!overCard) return
      targetStatus = overCard.status
    }

    if (draggedCard.status === targetStatus) return

    setCards(prev =>
      prev.map(c => c.id === activeId ? { ...c, status: targetStatus } : c)
    )
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveCard(null)
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    const card = cards.find(c => c.id === activeId)
    if (!card) return

    let targetStatus: Status = card.status
    if (STATUSES.includes(overId as Status)) {
      targetStatus = overId as Status
    } else {
      const overCard = cards.find(c => c.id === overId)
      if (overCard) targetStatus = overCard.status
    }

    const columnCards = cards.filter(c => c.status === targetStatus)
    const oldIndex = columnCards.findIndex(c => c.id === activeId)
    const newIndex = columnCards.findIndex(c => c.id === overId)

    let reordered = columnCards
    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      reordered = arrayMove(columnCards, oldIndex, newIndex)
    }

    setCards(prev => {
      const others = prev.filter(c => c.status !== targetStatus)
      const updated = reordered.map((c, i) => ({
        ...c,
        status: targetStatus,
        position: i,
      }))
      return [...others, ...updated]
    })

    const ok = await updateKanbanCard(activeId, {
      status: targetStatus,
      position: reordered.findIndex(c => c.id === activeId),
    })

    if (!ok) loadCards()
  }

  const handleCreateCard = async () => {
    if (!newCard.title.trim()) return

    const created = await createKanbanCard({
      title: newCard.title.trim(),
      description: newCard.description.trim() || null,
      status: newCard.status,
    })

    if (created) {
      setNewCard({ title: '', description: '', status: 'todo' })
      setIsDialogOpen(false)
      loadCards()
    }
  }

  const handleDeleteCard = async (cardId: string) => {
    setCards(prev => prev.filter(c => c.id !== cardId))
    const ok = await deleteKanbanCard(cardId)
    if (!ok) loadCards()
  }

  const openEditDialog = (card: KanbanCardData) => {
    setEditCard(card)
    setEditFields({ title: card.title, description: card.description || '' })
  }

  const saveEdit = async () => {
    if (!editCard || !editFields.title.trim()) return

    const updates = {
      title: editFields.title.trim(),
      description: editFields.description.trim() || null,
    }

    setCards(prev =>
      prev.map(c => c.id === editCard.id ? { ...c, ...updates } : c)
    )
    setEditCard(null)

    const ok = await updateKanbanCard(editCard.id, updates)
    if (!ok) loadCards()
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Kanban Board</h2>
            <p className="text-xs text-muted-foreground">Manage your tasks</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                New Card
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>New Card</DialogTitle>
                <DialogDescription>Add a new task to the Kanban board.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Title *
                  </label>
                  <Input
                    placeholder="Enter title"
                    value={newCard.title}
                    onChange={(e) => setNewCard(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Description
                  </label>
                  <Textarea
                    placeholder="Optional description"
                    value={newCard.description}
                    onChange={(e) => setNewCard(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Column
                  </label>
                  <select
                    className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-300"
                    value={newCard.status}
                    onChange={(e) => setNewCard(prev => ({ ...prev, status: e.target.value as Status }))}
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleCreateCard} className="flex-1">
                    Create
                  </Button>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={customCollisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STATUSES.map(status => (
              <KanbanColumn
                key={status}
                status={status}
                cards={getColumnCards(status)}
                filter={filters[status]}
                onFilterChange={(val) => setFilters(prev => ({ ...prev, [status]: val }))}
                onDeleteCard={handleDeleteCard}
                onEditCard={openEditDialog}
              />
            ))}
          </div>

          <DragOverlay>
            {activeCard ? <KanbanCard card={activeCard} overlay /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editCard} onOpenChange={(open) => { if (!open) setEditCard(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Card</DialogTitle>
            <DialogDescription>Modify the card title or description.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Title *
              </label>
              <Input
                placeholder="Enter title"
                value={editFields.title}
                onChange={(e) => setEditFields(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Description
              </label>
              <Textarea
                placeholder="Optional description"
                value={editFields.description}
                onChange={(e) => setEditFields(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={saveEdit} disabled={!editFields.title.trim()} className="flex-1">
                Save
              </Button>
              <Button variant="outline" onClick={() => setEditCard(null)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
