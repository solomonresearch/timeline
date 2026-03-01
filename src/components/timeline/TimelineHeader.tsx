import { getYearInterval } from '@/lib/constants'

interface TimelineHeaderProps {
  yearStart: number
  yearEnd: number
  pixelsPerYear: number
  currentYear: number
}

export function TimelineHeader({ yearStart, yearEnd, pixelsPerYear, currentYear }: TimelineHeaderProps) {
  const interval = getYearInterval(pixelsPerYear)
  const firstYear = Math.ceil(yearStart / interval) * interval
  const years: number[] = []
  for (let y = firstYear; y <= yearEnd; y += interval) {
    years.push(y)
  }

  const currentYearLeft = (currentYear - yearStart) * pixelsPerYear

  return (
    <div className="sticky top-0 z-10 h-6 bg-white border-b" style={{ width: (yearEnd - yearStart) * pixelsPerYear }}>
      {years.map(year => (
        <div
          key={year}
          className="absolute top-0 h-full text-[10px] text-muted-foreground select-none"
          style={{ left: (year - yearStart) * pixelsPerYear }}
        >
          <div className="absolute bottom-0 w-px h-2 bg-border" />
          <span className="absolute -translate-x-1/2 top-0.5">{year}</span>
        </div>
      ))}
      {/* Present-day marker */}
      <div
        className="absolute top-0 pointer-events-none"
        style={{ left: currentYearLeft }}
      >
        <div className="absolute top-0 w-0.5 h-full" style={{ backgroundColor: '#ef4444', left: -1 }} />
        <div
          className="absolute"
          style={{
            bottom: -4,
            left: -4,
            width: 0,
            height: 0,
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderTop: '4px solid #ef4444',
          }}
        />
      </div>
    </div>
  )
}
