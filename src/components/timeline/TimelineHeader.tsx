import {
  getYearInterval, getZoomMode, dateToFracYear, makeUTCDate, TIMELINE_YEAR_MIN,
  getHourInterval, getMinuteInterval, fracYearToMs, msToFracYear,
} from '@/lib/constants'

const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

interface TimelineHeaderProps {
  yearStart: number
  yearEnd: number
  pixelsPerYear: number
  currentYear: number
  scrollLeft: number
  viewportWidth: number
}

export function TimelineHeader({ yearStart, yearEnd, pixelsPerYear, currentYear, scrollLeft, viewportWidth }: TimelineHeaderProps) {
  const mode = getZoomMode(pixelsPerYear)
  const bufferPx = viewportWidth * 2
  const visStart = yearStart + Math.max(0, scrollLeft - bufferPx) / pixelsPerYear
  const visEnd = yearStart + (scrollLeft + viewportWidth + bufferPx) / pixelsPerYear
  const currentYearLeft = (currentYear - yearStart) * pixelsPerYear

  const ticks: { key: number; left: number; label: string; major: boolean }[] = []

  if (mode === 'year') {
    const interval = getYearInterval(pixelsPerYear)
    const first = Math.ceil(visStart / interval) * interval
    for (let y = first; y <= Math.min(visEnd, yearEnd); y += interval) {
      ticks.push({ key: y, left: (y - yearStart) * pixelsPerYear, label: String(y), major: true })
    }
  } else if (mode === 'month') {
    // Month mode — generate from Date objects to avoid float drift
    const pxPerMonth = pixelsPerYear / 12
    const showAllMonths = pxPerMonth >= 20 // collapse to quarterly below 20px/month
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
        ticks.push({ key: y * 100 + m, left, label, major })
      }
    }
  } else if (mode === 'day') {
    // Day mode — month boundaries (major) + day ticks
    const pxPerDay = pixelsPerYear / 365.25
    const dayStep = pxPerDay < 3 ? 10 : pxPerDay < 6 ? 7 : pxPerDay < 10 ? 5 : 1
    const sy = Math.max(TIMELINE_YEAR_MIN, Math.floor(visStart) - 1)
    const ey = Math.min(yearEnd, Math.ceil(visEnd) + 1)
    for (let y = sy; y <= ey; y++) {
      for (let m = 0; m < 12; m++) {
        // Month boundary — major tick
        const fy0 = dateToFracYear(makeUTCDate(y, m, 1))
        if (fy0 >= visStart && fy0 <= visEnd) {
          const left = (fy0 - yearStart) * pixelsPerYear
          const label = m === 0 ? String(y) : MONTH_ABBR[m]
          ticks.push({ key: y * 1000 + m * 10, left, label, major: true })
        }
        // Day ticks (skip day 1, already covered by month boundary)
        const daysInMonth = makeUTCDate(y, m + 1, 0).getUTCDate()
        for (let d = 1 + dayStep; d <= daysInMonth; d += dayStep) {
          const fy = dateToFracYear(makeUTCDate(y, m, d))
          if (fy < visStart || fy > visEnd) continue
          const left = (fy - yearStart) * pixelsPerYear
          ticks.push({ key: y * 100000 + m * 1000 + d, left, label: String(d), major: false })
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
      ticks.push({ key: ms, left, label, major })
    }
  } else {
    // Minute mode
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
      ticks.push({ key: ms, left, label, major })
    }
  }

  return (
    <div
      className="sticky top-0 z-10 h-6 bg-white border-b"
      style={{ width: '100%' }}
    >
      {ticks.map(({ key, left, label, major }) => (
        <div
          key={key}
          className="absolute top-0 h-full text-[10px] text-muted-foreground select-none"
          style={{ left }}
        >
          <div className={`absolute bottom-0 w-px bg-border ${major ? 'h-3' : 'h-1.5'}`} />
          <span className={`absolute -translate-x-1/2 top-0.5 whitespace-nowrap ${major ? 'font-semibold' : ''}`}>
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
      </div>
    </div>
  )
}
