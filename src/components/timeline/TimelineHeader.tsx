import { getYearInterval, getZoomMode, dateToFracYear } from '@/lib/constants'

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
  } else {
    // Month mode — generate from Date objects to avoid float drift
    const pxPerMonth = pixelsPerYear / 12
    const showAllMonths = pxPerMonth >= 20 // collapse to quarterly below 20px/month
    const sy = Math.max(0, Math.floor(visStart) - 1)
    const ey = Math.min(yearEnd, Math.ceil(visEnd) + 1)
    for (let y = sy; y <= ey; y++) {
      for (let m = 0; m < 12; m++) {
        if (!showAllMonths && m % 3 !== 0) continue
        const fy = dateToFracYear(new Date(y, m, 1))
        if (fy < visStart || fy > visEnd) continue
        const left = (fy - yearStart) * pixelsPerYear
        const major = m === 0
        const label = major ? String(y) : showAllMonths ? MONTH_ABBR[m] : `Q${Math.floor(m / 3) + 1}`
        ticks.push({ key: y * 100 + m, left, label, major })
      }
    }
  }

  return (
    <div
      className="sticky top-0 z-10 h-6 bg-white border-b"
      style={{ width: (yearEnd - yearStart) * pixelsPerYear }}
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
