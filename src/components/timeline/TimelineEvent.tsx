import { useState, useMemo, useRef } from 'react'
import type { TimelineEvent as TEvent } from '@/types/timeline'
import { computeValueAtYear, generateSparklineSeries, formatValue } from '@/lib/valueCompute'
import { useSizeConfig } from '@/contexts/UiSizeContext'
import { EventContextMenu } from './EventContextMenu'

export interface TimelineEventProps {
  event: TEvent
  yearStart: number
  pixelsPerYear: number
  laneColor: string
  onClick: (event: TEvent, element: HTMLElement, clientX: number, clientY: number) => void
  currentYear: number
  topOffset?: number
  scrollLeft?: number
  // drag-drop
  isDragging?: boolean
  onMoveStart?: (event: TEvent, clientX: number, clientY: number, origin: 'longpress' | 'contextmenu') => void
  onExtendStart?: (event: TEvent, direction: 'forward' | 'backward', clientX: number) => void
}

interface TooltipState { clientX: number; clientY: number; value: number }

export function TimelineEventBar({
  event, yearStart, pixelsPerYear, laneColor, onClick, currentYear, topOffset = 0, scrollLeft = 0,
  isDragging, onMoveStart, onExtendStart,
}: TimelineEventProps) {
  const { sc } = useSizeConfig()
  const { BASE_LANE_HEIGHT, BAR_HEIGHT, DOT_SIZE, EVENT_FONT, EVENT_LINE_HEIGHT } = sc
  const color = event.color || laneColor
  const left = (event.startYear - yearStart) * pixelsPerYear

  const isPast = event.type === 'point'
    ? event.startYear < currentYear
    : (event.endYear ?? event.startYear) < currentYear

  const pastStyle = isPast ? { opacity: 0.35, filter: 'saturate(0.5)' } : undefined
  const draggingStyle: React.CSSProperties | undefined = isDragging ? { opacity: 0.25, pointerEvents: 'none' } : undefined

  const hasValue = !!event.valueProjection
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null)
  const [isGrabbing, setIsGrabbing] = useState(false)

  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const modeRef = useRef<'idle' | 'pending' | 'grabbed'>('idle')
  const downPosRef = useRef({ x: 0, y: 0 })

  // Build sparkline series
  const sparklineSeries = useMemo(() => {
    if (!hasValue || event.type !== 'range' || !event.valueProjection) return []
    const endY = event.endYear ?? currentYear
    return generateSparklineSeries(event.startYear, endY, event.valueProjection, currentYear)
  }, [hasValue, event.startYear, event.endYear, event.valueProjection, event.type, currentYear])

  function clearHold() {
    if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null }
  }

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.button !== 0 || !onMoveStart) return
    e.stopPropagation()
    e.preventDefault()
    modeRef.current = 'pending'
    downPosRef.current = { x: e.clientX, y: e.clientY }
    setIsGrabbing(true)
    holdTimerRef.current = setTimeout(() => {
      modeRef.current = 'grabbed'
      setIsGrabbing(false)
      onMoveStart(event, downPosRef.current.x, downPosRef.current.y, 'longpress')
    }, 1000)
  }

  function handleMouseUp(e: React.MouseEvent<HTMLDivElement>) {
    if (modeRef.current === 'pending') {
      clearHold()
      modeRef.current = 'idle'
      setIsGrabbing(false)
      onClick(event, e.currentTarget, e.clientX, e.clientY)
    }
  }

  function handleMouseLeave() {
    if (modeRef.current === 'pending') {
      clearHold()
      modeRef.current = 'idle'
      setIsGrabbing(false)
    }
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setCtxMenu({ x: e.clientX, y: e.clientY })
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!hasValue || !event.valueProjection) return
    const rect = e.currentTarget.getBoundingClientRect()
    const relX = e.clientX - rect.left
    const hoverYear = event.startYear + relX / pixelsPerYear
    const val = computeValueAtYear(hoverYear, event.startYear, event.valueProjection)
    setTooltip({ clientX: e.clientX, clientY: e.clientY, value: val })
  }

  const grabRing = isGrabbing ? 'ring-2 ring-primary scale-105' : ''

  // shared interaction props for every event element
  const interactionProps = onMoveStart ? {
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseLeave,
    onContextMenu: handleContextMenu,
  } : {
    onClick: (e: React.MouseEvent<HTMLDivElement>) => onClick(event, e.currentTarget, e.clientX, e.clientY),
    onContextMenu: handleContextMenu,
  }

  const contextMenu = ctxMenu ? (
    <EventContextMenu
      x={ctxMenu.x} y={ctxMenu.y}
      onClose={() => setCtxMenu(null)}
      onMove={() => {
        const pos = ctxMenu; setCtxMenu(null)
        onMoveStart?.(event, pos.x, pos.y, 'contextmenu')
      }}
      onExtendForward={() => {
        const pos = ctxMenu; setCtxMenu(null)
        onExtendStart?.(event, 'forward', pos.x)
      }}
      onExtendBackward={() => {
        const pos = ctxMenu; setCtxMenu(null)
        onExtendStart?.(event, 'backward', pos.x)
      }}
    />
  ) : null

  if (event.type === 'point') {
    const top = (BASE_LANE_HEIGHT - DOT_SIZE) / 2 + topOffset
    const hasPointValue = event.pointValue != null

    if (event.emoji) {
      return (
        <>
          <div
            className={`absolute flex items-center justify-center cursor-pointer hover:scale-110 transition-transform select-none ${grabRing}`}
            style={{ left: left - DOT_SIZE / 2, top, width: DOT_SIZE, height: DOT_SIZE, fontSize: DOT_SIZE - 2, lineHeight: 1, ...pastStyle, ...draggingStyle }}
            {...interactionProps}
            onMouseEnter={hasPointValue ? e => setTooltip({ clientX: e.clientX, clientY: e.clientY, value: event.pointValue! }) : undefined}
            onMouseMove={hasPointValue ? e => setTooltip({ clientX: e.clientX, clientY: e.clientY, value: event.pointValue! }) : undefined}
          >
            {event.emoji}
          </div>
          {tooltip && <ValueTooltip title={event.title} tooltip={tooltip} />}
          {contextMenu}
        </>
      )
    }

    return (
      <>
        <div
          className={`absolute rounded-full cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-black/20 transition-all select-none ${grabRing}`}
          style={{ left: left - DOT_SIZE / 2, top, width: DOT_SIZE, height: DOT_SIZE, backgroundColor: color, ...pastStyle, ...draggingStyle }}
          {...interactionProps}
          onMouseEnter={hasPointValue ? e => setTooltip({ clientX: e.clientX, clientY: e.clientY, value: event.pointValue! }) : undefined}
          onMouseMove={hasPointValue ? e => setTooltip({ clientX: e.clientX, clientY: e.clientY, value: event.pointValue! }) : undefined}
          onMouseLeave={() => { handleMouseLeave(); if (hasPointValue) setTooltip(null) }}
        />
        {tooltip && <ValueTooltip title={event.title} tooltip={tooltip} />}
        {contextMenu}
      </>
    )
  }

  const width = ((event.endYear ?? event.startYear + 1) - event.startYear) * pixelsPerYear
  const top = (BASE_LANE_HEIGHT - BAR_HEIGHT) / 2 + topOffset
  const textLeft = Math.max(4, scrollLeft - left + sc.SIDEBAR_WIDTH + 4)

  // Sparkline geometry
  let sparklinePath: string | null = null
  let projectionPath: string | null = null
  if (sparklineSeries.length >= 2) {
    const values = sparklineSeries.map(p => p.value)
    const minV = Math.min(...values)
    const maxV = Math.max(...values)
    const range = maxV - minV || 1
    const pad = 2
    const chartH = BAR_HEIGHT - pad * 2
    const toXY = (p: { year: number; value: number }) => {
      const x = (p.year - event.startYear) * pixelsPerYear
      const y = pad + chartH - chartH * (p.value - minV) / range
      return `${x.toFixed(1)},${y.toFixed(1)}`
    }
    const splitIdx = sparklineSeries.findIndex(p => p.projected)
    const histPts = splitIdx >= 0 ? sparklineSeries.slice(0, splitIdx + 1) : sparklineSeries
    const projPts = splitIdx >= 0 ? sparklineSeries.slice(splitIdx) : []
    if (histPts.length >= 2) sparklinePath = histPts.map(toXY).join(' ')
    if (projPts.length >= 2) projectionPath = projPts.map(toXY).join(' ')
  }

  const label = event.emoji ? `${event.emoji} ${event.title}` : event.title

  return (
    <>
      <div
        className={`absolute rounded-sm cursor-pointer hover:brightness-110 transition-all overflow-hidden select-none ${grabRing}`}
        style={{ left, top, width: Math.max(width, 4), height: BAR_HEIGHT, backgroundColor: color, ...pastStyle, ...draggingStyle }}
        title={event.title}
        {...interactionProps}
        onMouseMove={hasValue ? handleMouseMove : undefined}
        onMouseLeave={() => { handleMouseLeave(); if (hasValue) setTooltip(null) }}
      >
        {sparklineSeries.length >= 2 && (
          <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%', overflow: 'hidden' }} preserveAspectRatio="none">
            {sparklinePath && <polyline points={sparklinePath} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth={1.5} strokeLinejoin="round" />}
            {projectionPath && <polyline points={projectionPath} fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth={1.5} strokeDasharray="3 2" strokeLinejoin="round" />}
          </svg>
        )}
        {width > EVENT_FONT * 2 && (
          <span className="absolute text-white font-medium whitespace-nowrap drop-shadow-[0_0_2px_rgba(0,0,0,0.6)]" style={{ left: textLeft, fontSize: EVENT_FONT, lineHeight: `${EVENT_LINE_HEIGHT}px` }}>
            {label}
          </span>
        )}
      </div>
      {tooltip && <ValueTooltip title={event.title} tooltip={tooltip} />}
      {contextMenu}
    </>
  )
}

function ValueTooltip({ title, tooltip }: { title: string; tooltip: TooltipState }) {
  return (
    <div className="fixed z-50 pointer-events-none rounded bg-black/80 text-white text-xs px-2 py-1 whitespace-nowrap" style={{ left: tooltip.clientX + 14, top: tooltip.clientY - 36 }}>
      <span className="opacity-70">{title}: </span>
      <span className="font-semibold">{formatValue(tooltip.value)}</span>
    </div>
  )
}
