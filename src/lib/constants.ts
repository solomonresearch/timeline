// Layout constants
export const BASE_LANE_HEIGHT = 28
export const PERSONA_SUB_ROW_HEIGHT = 22
export const BAR_HEIGHT = 18
export const DOT_SIZE = 12

// Zoom & year range
export const MIN_PIXELS_PER_YEAR = 0.5
export const MAX_PIXELS_PER_YEAR = 250
export const DEFAULT_PIXELS_PER_YEAR = 80
export const TIMELINE_YEAR_MIN = 0
export const TIMELINE_YEAR_MAX = 2500

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

export function getCurrentYearFraction(): number {
  const now = new Date()
  const year = now.getFullYear()
  const start = new Date(year, 0, 1).getTime()
  const end = new Date(year + 1, 0, 1).getTime()
  return year + (now.getTime() - start) / (end - start)
}

/** Convert a Date to a fractional year value (e.g. 2024.5 ≈ July 2024). */
export function dateToFracYear(d: Date): number {
  const year = d.getFullYear()
  const start = Date.UTC(year, 0, 1)
  const end   = Date.UTC(year + 1, 0, 1)
  return year + (d.getTime() - start) / (end - start)
}
