import { type RefObject } from 'react'
import {
  getYearInterval, getZoomMode, dateToFracYear, makeUTCDate, TIMELINE_YEAR_MIN,
  getHourInterval, getMinuteInterval, fracYearToMs, msToFracYear,
} from '@/lib/constants'
import { useSizeConfig } from '@/contexts/UiSizeContext'

const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

interface LifeSpan {
  birthYear: number
  endYear: number | null
}

interface TimelineHeaderProps {
  yearStart: number
  yearEnd: number
  pixelsPerYear: number
  currentYear: number
  scrollLeft: number
  viewportWidth: number
  cursorRef?: RefObject<HTMLDivElement | null>
  lifeSpan?: LifeSpan
}

export function TimelineHeader({ yearStart, yearEnd, pixelsPerYear, currentYear, scrollLeft, viewportWidth, cursorRef, lifeSpan }: TimelineHeaderProps) {
  const { sc } = useSizeConfig()
  const mode = getZoomMode(pixelsPerYear)
  const bufferPx = viewportWidth * 2
  const visStart = yearStart + Math.max(0, scrollLeft - bufferPx) / pixelsPerYear
  const visEnd = yearStart + (scrollLeft + viewportWidth + bufferPx) / pixelsPerYear
  const currentYearLeft = (currentYear - yearStart) * pixelsPerYear

  const ticks: { key: number; left: number; label: string; major: boolean; year: number }[] = []

  if (mode === 'year') {
    const interval = getYearInterval(pixelsPerYear)
    const first = Math.ceil(visStart / interval) * interval
    for (let y = first; y <= Math.min(visEnd, yearEnd); y += interval) {
      ticks.push({ key: y, left: (y - yearStart) * pixelsPerYear, label: String(y), major: true, year: y })
    }
  } else if (mode === 'month') {
    const pxPerMonth = pixelsPerYear / 12
    const showAllMonths = pxPerMonth >= 20
    const sy = Math.max(TIMELINE_YEAR_MIN, Math.floor(visStart) - 1)
    const ey = Math.min(yearEnd, Math.ceil(visEnd) + 1)
    for (let y = sy; y <= ey; y++) {
      for (let m = 0; m < 12; m++) {
        if (!showAllMonths && m % 3 !== 0) continue
        const fy = dateToFracYear(makeUTCDate(y, m, 1))
        if (fy < visStart || fy > visEnd) continue
        const left = (fy - yearStart) * pixelsPerYear
        const major = m === 0
        const label = major ? String(y) : showAllMonths ? MONTH_ABBR[m] : `Q${Math.floor(m / 3) + 1}`
        ticks.push({ key: y * 100 + m, left, label, major, year: y })
      }
    }
  } else if (mode === 'day') {
    const pxPerDay = pixelsPerYear / 365.25
    const dayStep = pxPerDay < 3 ? 10 : pxPerDay < 6 ? 7 : pxPerDay < 10 ? 5 : 1
    const sy = Math.max(TIMELINE_YEAR_MIN, Math.floor(visStart) - 1)
    const ey = Math.min(yearEnd, Math.ceil(visEnd) + 1)
    for (let y = sy; y <= ey; y++) {
      for (let m = 0; m < 12; m++) {
        const fy0 = dateToFracYear(makeUTCDate(y, m, 1))
        if (fy0 >= visStart && fy0 <= visEnd) {
          const left = (fy0 - yearStart) * pixelsPerYear
          const label = m === 0 ? String(y) : MONTH_ABBR[m]
          ticks.push({ key: y * 1000 + m * 10, left, label, major: true, year: y })
        }
        const daysInMonth = makeUTCDate(y, m + 1, 0).getUTCDate()
        for (let d = 1 + dayStep; d <= daysInMonth; d += dayStep) {
          const fy = dateToFracYear(makeUTCDate(y, m, d))
          if (fy < visStart || fy > visEnd) continue
          const left = (fy - yearStart) * pixelsPerYear
          ticks.push({ key: y * 100000 + m * 1000 + d, left, label: String(d), major: false, year: y })
        }
      }
    }
  } else if (mode === 'hour') {
    const intervalH = getHourInterval(pixelsPerYear)
    const intervalMs = intervalH * 3_600_000
    const visStartMs = fracYearToMs(visStart)
    const visEndMs = fracYearToMs(Math.min(visEnd, yearEnd))
    const firstMs = Math.ceil(visStartMs / intervalMs) * intervalMs
    for (let ms = firstMs; ms <= visEndMs; ms += intervalMs) {
      const fy = msToFracYear(ms)
      const left = (fy - yearStart) * pixelsPerYear
      const d = new Date(ms)
      const h = d.getUTCHours()
      const major = h === 0
      const label = major
        ? `${d.getUTCDate()} ${MONTH_ABBR[d.getUTCMonth()]}`
        : `${String(h).padStart(2, '0')}:00`
      ticks.push({ key: ms, left, label, major, year: d.getUTCFullYear() })
    }
  } else {
    const intervalM = getMinuteInterval(pixelsPerYear)
    const intervalMs = intervalM * 60_000
    const visStartMs = fracYearToMs(visStart)
    const visEndMs = fracYearToMs(Math.min(visEnd, yearEnd))
    const firstMs = Math.ceil(visStartMs / intervalMs) * intervalMs
    for (let ms = firstMs; ms <= visEndMs; ms += intervalMs) {
      const fy = msToFracYear(ms)
      const left = (fy - yearStart) * pixelsPerYear
      const d = new Date(ms)
      const h = d.getUTCHours()
      const m = d.getUTCMinutes()
      const major = h === 0 && m === 0
      const label = major
        ? `${d.getUTCDate()} ${MONTH_ABBR[d.getUTCMonth()]}`
        : `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      ticks.push({ key: ms, left, label, major, year: d.getUTCFullYear() })
    }
  }

  const filtered: typeof ticks = []
  for (const tick of ticks) {
    if (filtered.length === 0) { filtered.push(tick); continue }
    const prev = filtered[filtered.length - 1]
    if (tick.left - prev.left >= sc.MIN_TICK_PX) {
      filtered.push(tick)
    } else if (tick.major && !prev.major) {
      filtered[filtered.length - 1] = tick
    }
  }

  // If no tick already shows the year as its label (e.g. the Jan boundary is off-screen),
  // append the year to the first major tick so the user always has year context.
  if (mode !== 'year' && filtered.length > 0) {
    const yearShown = filtered.some(t => t.label === String(t.year))
    if (!yearShown) {
      const firstMajorIdx = filtered.findIndex(t => t.major)
      const idx = firstMajorIdx >= 0 ? firstMajorIdx : 0
      const t = filtered[idx]
      filtered[idx] = { ...t, label: `${t.label} ${t.year}` }
    }
  }

  const majorTickH = Math.round(sc.HEADER_HEIGHT / 2)
  const minorTickH = Math.round(sc.HEADER_HEIGHT / 4)

  return (
    <div
      className="sticky top-0 z-10 bg-background border-b"
      style={{ width: '100%', height: sc.HEADER_HEIGHT }}
    >
      {/* Life span overlay */}
      {lifeSpan && (() => {
        const birthPx = (lifeSpan.birthYear - yearStart) * pixelsPerYear
        const LIFE_COLOR = 'rgba(59,130,246,'
        if (lifeSpan.endYear != null) {
          const endPx = (lifeSpan.endYear - yearStart) * pixelsPerYear
          return (
            <div className="absolute top-0 bottom-0 pointer-events-none" style={{
              left: Math.max(0, birthPx),
              width: Math.max(0, endPx - Math.max(0, birthPx)),
              backgroundColor: LIFE_COLOR + '0.13)',
            }} />
          )
        } else {
          const solidPx = (lifeSpan.birthYear + 85 - yearStart) * pixelsPerYear
          const fadePx  = (lifeSpan.birthYear + 100 - yearStart) * pixelsPerYear
          const left = Math.max(0, birthPx)
          const width = Math.max(0, fadePx - left)
          const solidStop = Math.max(0, solidPx - left)
          return (
            <div className="absolute top-0 bottom-0 pointer-events-none" style={{
              left,
              width,
              background: `linear-gradient(to right, ${LIFE_COLOR}0.13) 0px, ${LIFE_COLOR}0.13) ${solidStop}px, ${LIFE_COLOR}0) ${width}px)`,
            }} />
          )
        }
      })()}

      {filtered.map(({ key, left, label, major }) => (
        <div
          key={key}
          className="absolute top-0 h-full text-muted-foreground select-none"
          style={{ left, fontSize: sc.TICK_FONT }}
        >
          <div
            className="absolute bottom-0 w-px bg-border"
            style={{ height: major ? majorTickH : minorTickH }}
          />
          <span
            className={`absolute -translate-x-1/2 whitespace-nowrap ${major ? 'font-semibold' : ''}`}
            style={{ top: Math.round(sc.HEADER_HEIGHT * 0.08) }}
          >
            {label}
          </span>
        </div>
      ))}
      {/* Present-day marker */}
      <div className="absolute top-0 pointer-events-none" style={{ left: currentYearLeft }}>
        <div className="absolute top-0 w-0.5 h-full" style={{ backgroundColor: '#ef4444', left: -1 }} />
        <div
          className="absolute"
          style={{
            bottom: -4, left: -4,
            width: 0, height: 0,
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderTop: '4px solid #ef4444',
          }}
        />
        <span
          className="absolute whitespace-nowrap select-none font-medium"
          style={{
            top: Math.round(sc.HEADER_HEIGHT * 0.08),
            left: 0,
            transform: 'translateX(-50%)',
            fontSize: sc.TICK_FONT,
            padding: '1px 4px',
            borderRadius: 3,
            background: 'rgba(239,68,68,0.85)',
            color: '#fff',
            zIndex: 15,
          }}
        >
          {(() => { const d = new Date(fracYearToMs(currentYear)); return `${d.getUTCDate()} ${MONTH_ABBR[d.getUTCMonth()]} ${d.getUTCFullYear()}` })()}
        </span>
      </div>
      {/* Cursor position marker — positioned in viewport space (left updated via ref) */}
      {cursorRef && (
        <div
          ref={cursorRef}
          className="absolute top-0 h-full pointer-events-none"
          style={{ display: 'none', left: 0 }}
        >
          <div className="absolute top-0 h-full" style={{ left: -0.5, borderLeft: '1px dashed #9ca3af' }} />
        </div>
      )}
    </div>
  )
}
