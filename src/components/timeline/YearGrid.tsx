interface YearGridProps {
  yearStart: number
  yearEnd: number
  pixelsPerYear: number
  totalHeight: number
}

export function YearGrid({ yearStart, yearEnd, pixelsPerYear, totalHeight }: YearGridProps) {
  const years: number[] = []
  for (let y = yearStart; y <= yearEnd; y++) {
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
    </div>
  )
}
