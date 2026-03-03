import { getGridInterval, getZoomMode, dateToFracYear } from '@/lib/constants'

interface YearGridProps {
  yearStart: number
  yearEnd: number
  pixelsPerYear: number
  totalHeight: number
  currentYear: number
  scrollLeft: number
  viewportWidth: number
}

export function YearGrid({
  yearStart,
  yearEnd,
  pixelsPerYear,
  totalHeight,
  currentYear,
  scrollLeft,
  viewportWidth,
}: YearGridProps) {
  const mode = getZoomMode(pixelsPerYear)
  const bufferPx = viewportWidth * 1.5
  const visStart = yearStart + Math.max(0, scrollLeft - bufferPx) / pixelsPerYear
  const visEnd   = yearStart + (scrollLeft + viewportWidth + bufferPx) / pixelsPerYear

  const lines: number[] = []

  if (mode === 'year') {
    const interval = getGridInterval(pixelsPerYear)
    const first = Math.ceil(visStart / interval) * interval
    for (let y = first; y <= Math.min(visEnd, yearEnd); y += interval) lines.push(y)
  } else {
    // Generate month or day lines from Date objects to avoid float drift
    const sy = Math.max(0, Math.floor(visStart) - 1)
    const ey = Math.min(yearEnd, Math.ceil(visEnd) + 1)

    if (mode === 'month') {
      for (let y = sy; y <= ey; y++) {
        for (let m = 0; m < 12; m++) {
          const fy = dateToFracYear(new Date(y, m, 1))
          if (fy >= visStart && fy <= visEnd) lines.push(fy)
        }
      }
    } else {
      // day mode
      let d = new Date(sy, 0, 1)
      while (d.getFullYear() <= ey) {
        const fy = dateToFracYear(d)
        if (fy >= visStart && fy <= visEnd) lines.push(fy)
        d.setDate(d.getDate() + 1)
      }
    }
  }

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{ width: (yearEnd - yearStart) * pixelsPerYear, height: totalHeight }}
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
