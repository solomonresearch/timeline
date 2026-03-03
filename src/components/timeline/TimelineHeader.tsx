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

export function TimelineHeader({
  yearStart,
  yearEnd,
  pixelsPerYear,
  currentYear,
  scrollLeft,
  viewportWidth,
}: TimelineHeaderProps) {
  const mode = getZoomMode(pixelsPerYear)
  const totalWidth = (yearEnd - yearStart) * pixelsPerYear
  const currentYearLeft = (currentYear - yearStart) * pixelsPerYear

  // Render ticks only within the visible viewport + a 2× buffer on each side
  // to avoid any pop-in during scrolling.
  const bufferPx = viewportWidth * 2
  const visStart = yearStart + Math.max(0, scrollLeft - bufferPx) / pixelsPerYear
  const visEnd   = yearStart + (scrollLeft + viewportWidth + bufferPx) / pixelsPerYear

  // ── YEAR MODE ──────────────────────────────────────────────────────────────
  if (mode === 'year') {
    const interval = getYearInterval(pixelsPerYear)
    const first = Math.ceil(visStart / interval) * interval
    const ticks: number[] = []
    for (let y = first; y <= Math.min(visEnd, yearEnd); y += interval) ticks.push(y)

    return (
      <div className="sticky top-0 z-10 h-6 bg-white border-b select-none" style={{ width: totalWidth }}>
        {ticks.map(year => (
          <div
            key={year}
            className="absolute top-0 h-full text-[10px] text-muted-foreground"
            style={{ left: (year - yearStart) * pixelsPerYear }}
          >
            <div className="absolute bottom-0 w-px h-2 bg-border" />
            <span className="absolute -translate-x-1/2 top-0.5">{year}</span>
          </div>
        ))}
        <PresentMarker left={currentYearLeft} />
      </div>
    )
  }

  // ── MONTH MODE ─────────────────────────────────────────────────────────────
  if (mode === 'month') {
    const pxPerMonth = pixelsPerYear / 12
    // Show every month when wide enough, otherwise quarterly
    const step = pxPerMonth >= 25 ? 1 : 3

    const ticks: { key: string; left: number; label: string; major: boolean }[] = []
    const sy = Math.max(0, Math.floor(visStart) - 1)
    const ey = Math.min(yearEnd, Math.ceil(visEnd) + 1)
    for (let y = sy; y <= ey; y++) {
      for (let m = 0; m < 12; m += step) {
        const fy = dateToFracYear(new Date(y, m, 1))
        if (fy < visStart - 1 / 12 || fy > visEnd + 1 / 12) continue
        const major = m === 0
        ticks.push({
          key: `${y}-${m}`,
          left: (fy - yearStart) * pixelsPerYear,
          label: major ? String(y) : MONTH_ABBR[m],
          major,
        })
      }
    }

    return (
      <div className="sticky top-0 z-10 h-6 bg-white border-b select-none" style={{ width: totalWidth }}>
        {ticks.map(({ key, left, label, major }) => (
          <div key={key} className="absolute top-0 h-full text-muted-foreground" style={{ left }}>
            <div className={`absolute bottom-0 w-px bg-border ${major ? 'h-3' : 'h-1.5'}`} />
            <span className={`absolute -translate-x-1/2 top-0.5 ${
              major ? 'text-[10px] font-semibold text-foreground' : 'text-[9px]'
            }`}>
              {label}
            </span>
          </div>
        ))}
        <PresentMarker left={currentYearLeft} />
      </div>
    )
  }

  // ── DAY MODE ───────────────────────────────────────────────────────────────
  const pxPerDay = pixelsPerYear / 365.25
  const dayStep = pxPerDay >= 12 ? 1 : 7

  const ticks: { key: string; left: number; label: string; kind: 'year' | 'month' | 'day' }[] = []
  const sy = Math.max(0, Math.floor(visStart) - 1)
  const ey = Math.min(yearEnd, Math.ceil(visEnd) + 1)
  let d = new Date(sy, 0, 1)
  while (d.getFullYear() <= ey) {
    const fy = dateToFracYear(d)
    if (fy >= visStart - 7 / 365 && fy <= visEnd + 7 / 365) {
      const isYear  = d.getMonth() === 0 && d.getDate() === 1
      const isMonth = d.getDate() === 1
      ticks.push({
        key: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`,
        left: (fy - yearStart) * pixelsPerYear,
        label: isYear ? String(d.getFullYear()) : isMonth ? MONTH_ABBR[d.getMonth()] : String(d.getDate()),
        kind: isYear ? 'year' : isMonth ? 'month' : 'day',
      })
    }
    d.setDate(d.getDate() + dayStep)
  }

  return (
    <div className="sticky top-0 z-10 h-6 bg-white border-b select-none" style={{ width: totalWidth }}>
      {ticks.map(({ key, left, label, kind }) => (
        <div key={key} className="absolute top-0 h-full text-muted-foreground" style={{ left }}>
          <div className={`absolute bottom-0 w-px bg-border ${
            kind === 'year' ? 'h-3' : kind === 'month' ? 'h-2' : 'h-1'
          }`} />
          <span className={`absolute -translate-x-1/2 top-0.5 ${
            kind === 'year'  ? 'text-[10px] font-semibold text-foreground' :
            kind === 'month' ? 'text-[9px] font-medium' : 'text-[8px]'
          }`}>
            {label}
          </span>
        </div>
      ))}
      <PresentMarker left={currentYearLeft} />
    </div>
  )
}

function PresentMarker({ left }: { left: number }) {
  return (
    <div className="absolute top-0 pointer-events-none" style={{ left }}>
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
  )
}
