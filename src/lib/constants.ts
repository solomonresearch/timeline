// Layout constants
export const BASE_LANE_HEIGHT = 28
export const PERSONA_SUB_ROW_HEIGHT = 22
export const BAR_HEIGHT = 18
export const DOT_SIZE = 12

// Zoom & year range
export const MIN_PIXELS_PER_YEAR = 0.5
export const MAX_PIXELS_PER_YEAR = 500
export const DEFAULT_PIXELS_PER_YEAR = 80
export const TIMELINE_YEAR_MIN = -1000
export const TIMELINE_YEAR_MAX = 5000

/**
 * Return the label interval (in years) for the header at a given zoom level.
 * At very low zoom (0.5 px/yr) we show every 100 years;
 * at high zoom (40+ px/yr) we show every single year.
 */
export function getYearInterval(pixelsPerYear: number): number {
  if (pixelsPerYear >= 40) return 1
  if (pixelsPerYear >= 15) return 5
  if (pixelsPerYear >= 6) return 10
  if (pixelsPerYear >= 2) return 25
  if (pixelsPerYear >= 1) return 50
  return 100
}

/**
 * Return the grid-line interval (in years) for vertical dashed lines.
 */
export function getGridInterval(pixelsPerYear: number): number {
  if (pixelsPerYear >= 40) return 1
  if (pixelsPerYear >= 15) return 5
  if (pixelsPerYear >= 6) return 10
  if (pixelsPerYear >= 2) return 25
  if (pixelsPerYear >= 1) return 50
  return 100
}

/**
 * Compute the pixel height of a lane given the number of active personas in it.
 */
export function computeLaneHeight(personaCount: number): number {
  if (personaCount === 0) return BASE_LANE_HEIGHT
  return BASE_LANE_HEIGHT + personaCount * PERSONA_SUB_ROW_HEIGHT
}

/** Which sub-year granularity to show based on zoom level. */
export type ZoomMode = 'year' | 'month' | 'day'
export function getZoomMode(ppy: number): ZoomMode {
  if (ppy >= 600) return 'day'
  if (ppy >= 120) return 'month'
  return 'year'
}

/**
 * Create a UTC midnight Date for any year, including negative years.
 * Unlike `new Date(year, m, d)`, this correctly handles years 0–99 and negatives.
 */
export function makeUTCDate(year: number, month: number, day: number): Date {
  const d = new Date(0)
  d.setUTCFullYear(year, month, day)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

/** Convert a Date to a fractional year (e.g. 2024.5 ≈ July 2024). */
export function dateToFracYear(d: Date): number {
  const year = d.getUTCFullYear()
  const start = makeUTCDate(year, 0, 1).getTime()
  const end = makeUTCDate(year + 1, 0, 1).getTime()
  return year + (d.getTime() - start) / (end - start)
}

/** Convert a fractional year (e.g. 2024.5) to a "YYYY-MM-DD" string (UTC). */
export function fracYearToDateStr(fy: number): string {
  const year = Math.floor(fy)
  const frac = fy - year
  const startMs = Date.UTC(year, 0, 1)
  const endMs = Date.UTC(year + 1, 0, 1)
  const d = new Date(startMs + frac * (endMs - startMs))
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Convert a "YYYY-MM-DD" string to a fractional year (UTC). */
export function dateStrToFracYear(s: string): number {
  const [y, m, d] = s.split('-').map(Number)
  const startMs = Date.UTC(y, 0, 1)
  const endMs = Date.UTC(y + 1, 0, 1)
  const dateMs = Date.UTC(y, m - 1, d)
  return y + (dateMs - startMs) / (endMs - startMs)
}

export function getCurrentYearFraction(): number {
  const now = new Date()
  const year = now.getFullYear()
  const start = new Date(year, 0, 1).getTime()
  const end = new Date(year + 1, 0, 1).getTime()
  return year + (now.getTime() - start) / (end - start)
}
