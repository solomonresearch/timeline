// Layout constants
export const BASE_LANE_HEIGHT = 28
export const PERSONA_SUB_ROW_HEIGHT = 22
export const BAR_HEIGHT = 18
export const DOT_SIZE = 12
export const TOTAL_ASSETS_HEIGHT = 64  // height of the Total Assets summary lane

// Zoom & year range
export const MIN_PIXELS_PER_YEAR = 0.5
export const MAX_PIXELS_PER_YEAR = 10000
export const DEFAULT_PIXELS_PER_YEAR = 80
export const TIMELINE_YEAR_MIN = -1000
export const TIMELINE_YEAR_MAX = 5000

/** Which sub-year unit to display based on zoom level. */
export type ZoomMode = 'year' | 'month' | 'day'
export function getZoomMode(ppy: number): ZoomMode {
  if (ppy >= 1825) return 'day'   // ≥ 5 px/day
  if (ppy >= 120)  return 'month' // ≥ 10 px/month
  return 'year'
}

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
  const startMs = makeUTCDate(y, 0, 1).getTime()
  const endMs = makeUTCDate(y + 1, 0, 1).getTime()
  const dateMs = makeUTCDate(y, m - 1, d).getTime()
  return y + (dateMs - startMs) / (endMs - startMs)
}

// ── DD/MM/YYYY helpers ────────────────────────────────────────────────────────

/** "2024-03-15" → "15/03/2024" */
export function iso2dmy(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return ''
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`
}

/** "15/03/2024" → "2024-03-15" */
export function dmy2iso(dmy: string): string {
  if (!dmy) return ''
  const [d, m, y] = dmy.split('/')
  if (!d || !m || !y) return ''
  return `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

/** Fractional year → "15/03/2024" */
export function fracYearToDMY(fy: number): string {
  return iso2dmy(fracYearToDateStr(fy))
}

/** "15/03/2024" → fractional year */
export function dmyToFracYear(dmy: string): number {
  return dateStrToFracYear(dmy2iso(dmy))
}

/** Auto-format typed digits into DD/MM/YYYY as user types */
export function formatDMYInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

export function getCurrentYearFraction(): number {
  const now = new Date()
  const year = now.getFullYear()
  const start = new Date(year, 0, 1).getTime()
  const end = new Date(year + 1, 0, 1).getTime()
  return year + (now.getTime() - start) / (end - start)
}
