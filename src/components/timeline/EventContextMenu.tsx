import { useEffect, useRef } from 'react'
import { Move, ArrowRight, ArrowLeft } from 'lucide-react'

interface Props {
  x: number
  y: number
  onMove: () => void
  onExtendForward: () => void
  onExtendBackward: () => void
  onClose: () => void
}

export function EventContextMenu({ x, y, onMove, onExtendForward, onExtendBackward, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onDown)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('mousedown', onDown) }
  }, [onClose])

  const item = (label: string, icon: React.ReactNode, cursor: string, handler: () => void) => (
    <button
      className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent whitespace-nowrap ${cursor}`}
      onMouseDown={e => { e.stopPropagation(); handler() }}
    >
      {icon}{label}
    </button>
  )

  return (
    <div
      ref={ref}
      className="fixed z-[200] min-w-[180px] rounded-md border border-border bg-popover text-popover-foreground shadow-md py-1"
      style={{ left: x, top: y }}
    >
      {item('Move', <Move size={14} />, 'cursor-move', onMove)}
      {item('Extend forward →', <ArrowRight size={14} />, 'cursor-e-resize', onExtendForward)}
      {item('← Extend backward', <ArrowLeft size={14} />, 'cursor-w-resize', onExtendBackward)}
    </div>
  )
}
