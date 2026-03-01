interface TimelineHeaderProps {
  yearStart: number
  yearEnd: number
  pixelsPerYear: number
}

export function TimelineHeader({ yearStart, yearEnd, pixelsPerYear }: TimelineHeaderProps) {
  const years: number[] = []
  for (let y = yearStart; y <= yearEnd; y++) {
    years.push(y)
  }

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
    </div>
  )
}
