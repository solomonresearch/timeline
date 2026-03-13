import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { AlignedPersonaEvent } from '@/types/database'
import { useSizeConfig } from '@/contexts/UiSizeContext'

interface PersonaEventBarProps {
  event: AlignedPersonaEvent
  yearStart: number
  pixelsPerYear: number
  laneColor: string
  subRowIndex?: number
  currentYear: number
}

const TOOLTIP_MAX_WIDTH = 280
const TOOLTIP_PADDING = 8

export function PersonaEventBar({
  event,
  yearStart,
  pixelsPerYear,
  laneColor,
  subRowIndex,
  currentYear,
}: PersonaEventBarProps) {
  const { sc } = useSizeConfig()
  const { BASE_LANE_HEIGHT, PERSONA_SUB_ROW_HEIGHT, BAR_HEIGHT, DOT_SIZE, EVENT_FONT, EVENT_LINE_HEIGHT } = sc

  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  // Close pinned tooltip on outside click
  useEffect(() => {
    if (!pinned) return
    function handleOutside() {
      setPinned(false)
      setOpen(false)
    }
    document.addEventListener('click', handleOutside)
    return () => document.removeEventListener('click', handleOutside)
  }, [pinned])

  const color = event.color || laneColor
  const left = (event.display_start_year - yearStart) * pixelsPerYear

  const isPast = event.type === 'point'
    ? event.display_start_year < currentYear
    : (event.display_end_year ?? event.display_start_year) < currentYear

  const baseOpacity = 0.4
  const pastOpacity = isPast ? 0.2 : baseOpacity
  const pastFilter = isPast ? 'saturate(0.5)' : undefined

  const verticalOffset = subRowIndex != null
    ? BASE_LANE_HEIGHT + subRowIndex * PERSONA_SUB_ROW_HEIGHT
    : 0

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
      setPinned(false)
      setOpen(false)
    } else {
      setPinned(true)
      setPos({ x: e.clientX, y: e.clientY })
      setOpen(true)
    }
  }

  // Clamp tooltip horizontally so it never leaves the viewport
  const tooltipLeft = Math.min(
    Math.max(pos.x - TOOLTIP_MAX_WIDTH / 2, TOOLTIP_PADDING),
    window.innerWidth - TOOLTIP_MAX_WIDTH - TOOLTIP_PADDING
  )

  const tooltip = open ? createPortal(
    <div
      className="fixed z-50 rounded-md bg-primary px-3 py-1.5 shadow-md pointer-events-auto"
      style={{
        left: tooltipLeft,
        top: pos.y - TOOLTIP_PADDING,
        transform: 'translateY(-100%)',
        maxWidth: TOOLTIP_MAX_WIDTH,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <p className="font-medium text-xs text-primary-foreground">{event.title}</p>
      <p className="text-xs text-primary-foreground opacity-70">{event.persona_name}</p>
      {event.description && (
        <p className="text-xs text-primary-foreground opacity-85 whitespace-normal">{event.description}</p>
      )}
      <p className="text-xs text-primary-foreground opacity-70">
        {event.type === 'point'
          ? <>Year: {event.start_year}{event.display_start_year !== event.start_year && ` (aligned: ${event.display_start_year})`}</>
          : <>{event.start_year}–{event.end_year ?? '?'}{event.display_start_year !== event.start_year && <> (aligned: {event.display_start_year}–{event.display_end_year ?? '?'})</>}</>
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
    const top = verticalOffset + (BASE_LANE_HEIGHT - DOT_SIZE) / 2
    const adjustedTop = subRowIndex != null
      ? verticalOffset + (PERSONA_SUB_ROW_HEIGHT - DOT_SIZE) / 2
      : top
    return (
      <>
        <div
          className="absolute rounded-full border-2 border-dashed border-white/60 cursor-pointer"
          style={{
            left: left - DOT_SIZE / 2,
            top: adjustedTop,
            width: DOT_SIZE,
            height: DOT_SIZE,
            backgroundColor: color,
            opacity: pastOpacity,
            filter: pastFilter,
          }}
          {...pointerHandlers}
        />
        {tooltip}
      </>
    )
  }

  const displayEnd = event.display_end_year ?? event.display_start_year + 1
  const width = (displayEnd - event.display_start_year) * pixelsPerYear
  const barHeight = subRowIndex != null ? Math.round(BAR_HEIGHT * 0.75) : BAR_HEIGHT
  const top = subRowIndex != null
    ? verticalOffset + (PERSONA_SUB_ROW_HEIGHT - barHeight) / 2
    : (BASE_LANE_HEIGHT - BAR_HEIGHT) / 2

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
          opacity: pastOpacity,
          filter: pastFilter,
        }}
        {...pointerHandlers}
      >
        {width > EVENT_FONT * 5 && (
          <span
            className="px-1 text-white/80 font-medium truncate block"
            style={{ fontSize: Math.round(EVENT_FONT * 0.9), lineHeight: `${EVENT_LINE_HEIGHT}px` }}
          >
            {event.title}
          </span>
        )}
      </div>
      {tooltip}
    </>
  )
}
