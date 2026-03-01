import { getGridInterval } from '@/lib/constants'

interface YearGridProps {
  yearStart: number
  yearEnd: number
  pixelsPerYear: number
  totalHeight: number
  currentYear: number
}

export function YearGrid({ yearStart, yearEnd, pixelsPerYear, totalHeight, currentYear }: YearGridProps) {
  const interval = getGridInterval(pixelsPerYear)
  const firstYear = Math.ceil(yearStart / interval) * interval
  const years: number[] = []
  for (let y = firstYear; y <= yearEnd; y += interval) {
    years.push(y)
  }

  return (
    <div className="pointer-events-none absolute inset-0" style={{ width: (yearEnd - yearStart) * pixelsPerYear, height: totalHeight }}>
      {years.map(year => (
        <div
          key={year}
          className="absolute top-0 border-l border-dashed border-border/50"
          style={{
            left: (year - yearStart) * pixelsPerYear,
            height: totalHeight,
          }}
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
