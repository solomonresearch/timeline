import type { ValueDataPoint, ValueProjection } from '@/types/timeline'

/** Linearly interpolate or project the value at any given fractional year. */
export function computeValueAtYear(
  year: number,
  points: ValueDataPoint[],
  projection?: ValueProjection,
): number | null {
  if (!points || points.length === 0) return null

  const sorted = [...points].sort((a, b) => a.year - b.year)

  if (year <= sorted[0].year) return sorted[0].value

  // Linear interpolation between historical points
  for (let i = 0; i < sorted.length - 1; i++) {
    if (year >= sorted[i].year && year <= sorted[i + 1].year) {
      const t = (year - sorted[i].year) / (sorted[i + 1].year - sorted[i].year)
      return sorted[i].value * (1 - t) + sorted[i + 1].value * t
    }
  }

  // Past the last data point — apply projection
  const last = sorted[sorted.length - 1]
  if (!projection) return last.value

  const yearsElapsed = year - last.year
  let value = last.value

  // Compound annual growth
  if (projection.growthPercent) {
    value *= Math.pow(1 + projection.growthPercent / 100, yearsElapsed)
  }

  // Periodic deposits / withdrawals
  for (const dep of projection.deposits ?? []) {
    const from = Math.max(dep.startYear, last.year)
    const to = Math.min(dep.endYear ?? year, year)
    if (to <= from) continue
    const elapsed = to - from
    let periods = 0
    if (dep.frequency === 'monthly') periods = elapsed * 12
    else if (dep.frequency === 'yearly') periods = elapsed
    else if (dep.frequency === 'weekly') periods = elapsed * 52
    value += Math.floor(periods) * dep.amount
  }

  return value
}

/** Generate a dense series of (year, value) pairs suitable for drawing a sparkline. */
export function generateSparklineSeries(
  eventStartYear: number,
  eventEndYear: number,
  points: ValueDataPoint[],
  projection?: ValueProjection,
  sampleCount = 80,
): { year: number; value: number; projected: boolean }[] {
  if (!points || points.length === 0) return []

  const sorted = [...points].sort((a, b) => a.year - b.year)
  const lastHistYear = sorted[sorted.length - 1].year

  const series: { year: number; value: number; projected: boolean }[] = []

  // Add actual historical data points (within event range)
  for (const p of sorted) {
    if (p.year >= eventStartYear - 0.001 && p.year <= eventEndYear + 0.001) {
      series.push({ year: p.year, value: p.value, projected: false })
    }
  }

  // Sample projected zone
  if (projection && lastHistYear < eventEndYear) {
    const step = Math.max((eventEndYear - lastHistYear) / sampleCount, 1 / 365)
    for (let y = lastHistYear; y <= eventEndYear + step * 0.5; y += step) {
      const clamped = Math.min(y, eventEndYear)
      const val = computeValueAtYear(clamped, sorted, projection)
      if (val !== null) series.push({ year: clamped, value: val, projected: true })
    }
  }

  return series.sort((a, b) => a.year - b.year)
}

export function formatValue(v: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(v)
}
