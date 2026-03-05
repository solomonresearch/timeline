import type { ValueProjection, ValueGrowthPeriod, ValueDeposit } from '@/types/timeline'

const DT = 1 / 12 // monthly steps for accuracy

function depositPPY(dep: ValueDeposit): number {
  switch (dep.frequency) {
    case 'daily':    return 365
    case 'weekly':   return 52
    case 'monthly':  return 12
    case 'quarterly': return 4
    case 'yearly':   return 1
    case 'custom': {
      const interval = dep.customInterval ?? 1
      const unitPPY = dep.customUnit === 'day' ? 365
        : dep.customUnit === 'week' ? 52
        : dep.customUnit === 'month' ? 12
        : dep.customUnit === 'quarter' ? 4
        : 1
      return unitPPY / Math.max(1, interval)
    }
    default: return 12
  }
}

function growthAt(
  year: number,
  periods: ValueGrowthPeriod[],
): { rate: number; applyOnNegative: boolean } | null {
  for (const p of periods) {
    if (year >= p.startYear - 1e-9 && year <= p.endYear + 1e-9) {
      return { rate: p.growthPercent, applyOnNegative: p.applyOnNegative }
    }
  }
  return null
}

/** Compute value at a given fractional year by stepping monthly from startYear. */
export function computeValueAtYear(
  targetYear: number,
  startYear: number,
  projection: ValueProjection,
): number {
  if (targetYear <= startYear) return projection.startValue

  const spots = [...(projection.spotChanges ?? [])].sort((a, b) => a.year - b.year)
  let spotIdx = 0
  let value = projection.startValue
  let t = startYear

  while (t < targetYear - 1e-9) {
    const step = Math.min(DT, targetYear - t)
    const tEnd = t + step

    // Spot changes in [t, tEnd)
    while (spotIdx < spots.length && spots[spotIdx].year < tEnd) {
      if (spots[spotIdx].year >= t) value += spots[spotIdx].amount
      spotIdx++
    }

    // Recurring deposits overlapping [t, tEnd)
    for (const dep of projection.deposits ?? []) {
      const dEnd = dep.endYear ?? targetYear
      if (dep.startYear >= tEnd || dEnd <= t) continue
      const overlap = Math.min(tEnd, dEnd) - Math.max(t, dep.startYear)
      const ppy = depositPPY(dep)
      value += dep.amount * ppy * overlap
    }

    // Compound growth for this step
    const g = growthAt(t + step * 0.5, projection.growthPeriods ?? [])
    if (g && g.rate !== 0 && (value >= 0 || g.applyOnNegative)) {
      value *= Math.pow(1 + g.rate / 100, step)
    }

    t = tEnd
  }

  // Spot changes exactly at targetYear
  while (spotIdx < spots.length && spots[spotIdx].year <= targetYear) {
    value += spots[spotIdx].amount
    spotIdx++
  }

  return value
}

/** Generate a dense series suitable for drawing a sparkline. Points after currentYear are marked projected. */
export function generateSparklineSeries(
  startYear: number,
  endYear: number,
  projection: ValueProjection,
  currentYear: number,
  numSamples = 80,
): { year: number; value: number; projected: boolean }[] {
  if (endYear <= startYear) return []
  const result: { year: number; value: number; projected: boolean }[] = []
  for (let i = 0; i <= numSamples; i++) {
    const year = startYear + (i / numSamples) * (endYear - startYear)
    result.push({
      year,
      value: computeValueAtYear(year, startYear, projection),
      projected: year > currentYear,
    })
  }
  return result
}

export function formatValue(v: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(v)
}
