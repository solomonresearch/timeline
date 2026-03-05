import {
  getGridInterval, getZoomMode, dateToFracYear, makeUTCDate, TIMELINE_YEAR_MIN,
  getHourInterval, getMinuteInterval, fracYearToMs, msToFracYear,
} from '@/lib/constants'

interface YearGridProps {
  yearStart: number
  yearEnd: number
  pixelsPerYear: number
  totalHeight: number
  currentYear: number
  scrollLeft: number
  viewportWidth: number
}

export function YearGrid({ yearStart, yearEnd, pixelsPerYear, totalHeight, currentYear, scrollLeft, viewportWidth }: YearGridProps) {
  const mode = getZoomMode(pixelsPerYear)
  const bufferPx = viewportWidth * 1.5
  const visStart = yearStart + Math.max(0, scrollLeft - bufferPx) / pixelsPerYear
  const visEnd = yearStart + (scrollLeft + viewportWidth + bufferPx) / pixelsPerYear

  const lines: number[] = []

  if (mode === 'year') {
    const interval = getGridInterval(pixelsPerYear)
    const first = Math.ceil(visStart / interval) * interval
    for (let y = first; y <= Math.min(visEnd, yearEnd); y += interval) lines.push(y)
  } else if (mode === 'month') {
    // Month mode — one line per month
    const sy = Math.max(TIMELINE_YEAR_MIN, Math.floor(visStart) - 1)
    const ey = Math.min(yearEnd, Math.ceil(visEnd) + 1)
    for (let y = sy; y <= ey; y++) {
      for (let m = 0; m < 12; m++) {
        const fy = dateToFracYear(makeUTCDate(y, m, 1))
        if (fy >= visStart && fy <= visEnd) lines.push(fy)
      }
    }
  } else if (mode === 'day') {
    // Day mode — daily or weekly lines
    const pxPerDay = pixelsPerYear / 365.25
    const dayStep = pxPerDay < 2 ? 7 : 1
    const sy = Math.max(TIMELINE_YEAR_MIN, Math.floor(visStart) - 1)
    const ey = Math.min(yearEnd, Math.ceil(visEnd) + 1)
    for (let y = sy; y <= ey; y++) {
      for (let m = 0; m < 12; m++) {
        const daysInMonth = makeUTCDate(y, m + 1, 0).getUTCDate()
        for (let d = 1; d <= daysInMonth; d += dayStep) {
          const fy = dateToFracYear(makeUTCDate(y, m, d))
          if (fy >= visStart && fy <= visEnd) lines.push(fy)
        }
      }
    }
  } else if (mode === 'hour') {
    const intervalMs = getHourInterval(pixelsPerYear) * 3_600_000
    const visStartMs = fracYearToMs(visStart)
    const visEndMs = fracYearToMs(Math.min(visEnd, yearEnd))
    const firstMs = Math.ceil(visStartMs / intervalMs) * intervalMs
    for (let ms = firstMs; ms <= visEndMs; ms += intervalMs) {
      lines.push(msToFracYear(ms))
    }
  } else {
    // Minute mode
    const intervalMs = getMinuteInterval(pixelsPerYear) * 60_000
    const visStartMs = fracYearToMs(visStart)
    const visEndMs = fracYearToMs(Math.min(visEnd, yearEnd))
    const firstMs = Math.ceil(visStartMs / intervalMs) * intervalMs
    for (let ms = firstMs; ms <= visEndMs; ms += intervalMs) {
      lines.push(msToFracYear(ms))
    }
  }

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{ width: '100%', height: totalHeight }}
    >
      {lines.map(y => (
        <div
          key={y}
          className="absolute top-0 border-l border-dashed border-border/50"
          style={{ left: (y - yearStart) * pixelsPerYear, height: totalHeight }}
        />
      ))}
      {/* Present-day line */}
      <div
        className="absolute top-0"
        style={{
          left: (currentYear - yearStart) * pixelsPerYear,
          width: 2,
          height: totalHeight,
          backgroundColor: '#ef4444',
        }}
      />
    </div>
  )
}
