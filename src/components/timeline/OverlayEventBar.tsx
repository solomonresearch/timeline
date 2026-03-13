import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { OverlayTimelineEvent } from '@/types/database'
import { useSizeConfig } from '@/contexts/UiSizeContext'
import { registerOverlay, unregisterOverlay } from '@/lib/overlayTooltipState'

interface OverlayEventBarProps {
  event: OverlayTimelineEvent
  timelineName: string
  timelineColor?: string | null
  yearStart: number
  pixelsPerYear: number
  laneColor: string
  rowTop: number          // absolute y offset where this sub-row starts (within parent div)
  rowHeight: number       // height of the sub-row for centering
  currentYear: number
}

const TOOLTIP_MAX_WIDTH = 280
const TOOLTIP_PADDING = 8

export function OverlayEventBar({
  event,
  timelineName,
  timelineColor,
  yearStart,
  pixelsPerYear,
  laneColor,
  rowTop,
  rowHeight,
  currentYear,
}: OverlayEventBarProps) {
  const { sc } = useSizeConfig()
  const { BAR_HEIGHT, DOT_SIZE, EVENT_FONT, EVENT_LINE_HEIGHT } = sc

  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  const closeRef = useRef(() => {
    setPinned(false)
    setOpen(false)
  })

  // Close this tooltip on any click (next click anywhere)
  useEffect(() => {
    if (!pinned) return
    function handleOutside() {
      unregisterOverlay(closeRef.current)
      setPinned(false)
      setOpen(false)
    }
    document.addEventListener('click', handleOutside)
    return () => document.removeEventListener('click', handleOutside)
  }, [pinned])

  const color = event.color || laneColor
  const bulletColor = timelineColor || color
  const left = (event.display_start_year - yearStart) * pixelsPerYear

  const isPast = event.type === 'point'
    ? event.display_start_year < currentYear
    : (event.display_end_year ?? event.display_start_year) < currentYear

  const opacity = isPast ? 0.22 : 0.45
  const filter = isPast ? 'saturate(0.5)' : undefined

  function handlePointerEnter(e: React.PointerEvent) {
    if (pinned) return
    setPos({ x: e.clientX, y: e.clientY })
    setOpen(true)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (pinned) return
    setPos({ x: e.clientX, y: e.clientY })
  }

  function handlePointerLeave() {
    if (pinned) return
    setOpen(false)
  }

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (pinned) {
      unregisterOverlay(closeRef.current)
      setPinned(false)
      setOpen(false)
    } else {
      registerOverlay(closeRef.current)
      setPinned(true)
      setPos({ x: e.clientX, y: e.clientY })
      setOpen(true)
    }
  }

  const tooltipLeft = Math.min(
    Math.max(pos.x - TOOLTIP_MAX_WIDTH / 2, TOOLTIP_PADDING),
    window.innerWidth - TOOLTIP_MAX_WIDTH - TOOLTIP_PADDING
  )

  const tooltip = open ? createPortal(
    <div
      className="fixed z-50 rounded-md bg-primary px-3 py-1.5 shadow-md pointer-events-none"
      style={{
        left: tooltipLeft,
        top: pos.y - TOOLTIP_PADDING,
        transform: 'translateY(-100%)',
        maxWidth: TOOLTIP_MAX_WIDTH,
      }}
    >
      <p className="font-medium text-xs text-primary-foreground">{event.title}</p>
      <p className="text-xs text-primary-foreground opacity-70">{timelineName}</p>
      {event.description && (
        <p className="text-xs text-primary-foreground opacity-85 whitespace-normal">{event.description}</p>
      )}
      <p className="text-xs text-primary-foreground opacity-70">
        {timelineName} ·{' '}
        {event.type === 'point'
          ? Math.round(event.start_year)
          : `${Math.round(event.start_year)}–${event.end_year != null ? Math.round(event.end_year) : '?'}`
        }
      </p>
    </div>,
    document.body
  ) : null

  const pointerHandlers = {
    onPointerEnter: handlePointerEnter,
    onPointerMove: handlePointerMove,
    onPointerLeave: handlePointerLeave,
    onClick: handleClick,
  }

  if (event.type === 'point') {
    const top = rowTop + (rowHeight - DOT_SIZE) / 2
    return (
      <>
        <div
          className="absolute rounded-full border-2 border-dashed border-white/60 cursor-pointer"
          style={{
            left: left - DOT_SIZE / 2,
            top,
            width: DOT_SIZE,
            height: DOT_SIZE,
            backgroundColor: color,
            opacity,
            filter,
          }}
          {...pointerHandlers}
        />
        {tooltip}
      </>
    )
  }

  const displayEnd = event.display_end_year ?? event.display_start_year + 1
  const width = (displayEnd - event.display_start_year) * pixelsPerYear
  const barHeight = Math.round(BAR_HEIGHT * 0.75)
  const top = rowTop + (rowHeight - barHeight) / 2

  return (
    <>
      <div
        className="absolute rounded-sm border-2 border-dashed border-white/60 overflow-hidden cursor-pointer"
        style={{
          left,
          top,
          width: Math.max(width, 4),
          height: barHeight,
          backgroundColor: color,
          opacity,
          filter,
        }}
        {...pointerHandlers}
      >
        {width > EVENT_FONT * 5 && (
          <span
            className="px-1 text-white/80 font-medium truncate block"
            style={{ fontSize: Math.round(EVENT_FONT * 0.9), lineHeight: `${EVENT_LINE_HEIGHT}px` }}
          >
            <span className="inline-flex items-center gap-1">
                <span className="inline-block rounded-full shrink-0" style={{ width: 7, height: 7, backgroundColor: bulletColor }} />
                {event.title}
              </span>
          </span>
        )}
      </div>
      {tooltip}
    </>
  )
}
