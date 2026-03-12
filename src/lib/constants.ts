// Layout constants
export const BASE_LANE_HEIGHT = 56
export const PERSONA_SUB_ROW_HEIGHT = 44
export const BAR_HEIGHT = 36
export const DOT_SIZE = 24
export const TOTAL_ASSETS_HEIGHT = 128  // height of the Total Assets summary lane
export const HEADER_HEIGHT = 48         // sticky timeline header height in px
export const SIDEBAR_WIDTH = 280        // lane sidebar width in px

// Zoom & year range
export const MIN_PIXELS_PER_YEAR = 3.5
export const MAX_PIXELS_PER_YEAR = 300_000  // dynamic canvas windowing keeps DOM elements safe
export const DEFAULT_PIXELS_PER_YEAR = 80
export const TIMELINE_YEAR_MIN = 1700
export const TIMELINE_YEAR_MAX = 2300

/** Which sub-year unit to display based on zoom level. */
export type ZoomMode = 'year' | 'month' | 'day' | 'hour' | 'minute'
export function getZoomMode(ppy: number): ZoomMode {
  if (ppy >= 2_628_000) return 'minute' // ≥ 5 px/min  (5 × 60 × 24 × 365 ≈ 2,628,000)
  if (ppy >= 43_800)    return 'hour'   // ≥ 5 px/hr   (5 × 24 × 365 = 43,800)
  if (ppy >= 1825)      return 'day'    // ≥ 5 px/day
  if (ppy >= 120)       return 'month'  // ≥ 10 px/month
  return 'year'
}

/** Hour tick interval (in hours) for the header at a given zoom level. */
export function getHourInterval(ppy: number): number {
  if (ppy >= 876_000)  return 1   // ≥ 100 px/hr
  if (ppy >= 262_800)  return 2   // ≥ 30 px/hr
  if (ppy >= 87_600)   return 6   // ≥ 10 px/hr
  return 12
}

/** Minute tick interval (in minutes) for the header at a given zoom level. */
export function getMinuteInterval(ppy: number): number {
  // pxPerMin = ppy / 525_960 (minutes per year)
  if (ppy >= 7_884_000) return 1   // ≥ 15 px/min → 1-min ticks (15px+)
  if (ppy >= 4_207_680) return 5   // ≥  8 px/min → 5-min ticks (40px+)
  return 15                         //  < 8 px/min → 15-min ticks (75px+)
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

// ── Sub-day (hour/minute) helpers ────────────────────────────────────────────

/** Fractional year → milliseconds since Unix epoch (UTC). */
export function fracYearToMs(fy: number): number {
  const year = Math.floor(fy)
  const frac = fy - year
  const startMs = makeUTCDate(year, 0, 1).getTime()
  const endMs = makeUTCDate(year + 1, 0, 1).getTime()
  return startMs + frac * (endMs - startMs)
}

/** Milliseconds since Unix epoch → fractional year (UTC). */
export function msToFracYear(ms: number): number {
  const d = new Date(ms)
  const year = d.getUTCFullYear()
  const startMs = makeUTCDate(year, 0, 1).getTime()
  const endMs = makeUTCDate(year + 1, 0, 1).getTime()
  return year + (ms - startMs) / (endMs - startMs)
}

/** Fractional year → "HH:MM" string (UTC). */
export function fracYearToTimeStr(fy: number): string {
  const d = new Date(fracYearToMs(fy))
  const h = String(d.getUTCHours()).padStart(2, '0')
  const m = String(d.getUTCMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

/** "DD/MM/YYYY" + "HH:MM" → fractional year (UTC). Empty hhmm = midnight. */
export function dmyTimeToFracYear(dmy: string, hhmm: string): number {
  const iso = dmy2iso(dmy)
  if (!iso) return 0
  const [y, mo, d] = iso.split('-').map(Number)
  const [h, mi] = (hhmm || '00:00').split(':').map(Number)
  const ms = makeUTCDate(y, mo - 1, d).getTime() + ((h || 0) * 60 + (mi || 0)) * 60_000
  const startMs = makeUTCDate(y, 0, 1).getTime()
  const endMs = makeUTCDate(y + 1, 0, 1).getTime()
  return y + (ms - startMs) / (endMs - startMs)
}

export function getCurrentYearFraction(): number {
  const now = new Date()
  const year = now.getFullYear()
  const start = new Date(year, 0, 1).getTime()
  const end = new Date(year + 1, 0, 1).getTime()
  return year + (now.getTime() - start) / (end - start)
}


// ── Event link resolution ────────────────────────────────────────────────────

import type { TimelineEvent } from '@/types/timeline'

/** Resolve all dependency links in a set of events (one pass — handles direct links). */
export function resolveEventLinks(events: TimelineEvent[]): TimelineEvent[] {
  const byId = new Map(events.map(e => [e.id, e]))
  const today = dateToFracYear(new Date())

  return events.map(event => {
    const link = event.link
    if (!link) return event

    let anchor: number
    if (link.anchorType === 'today') {
      anchor = today
    } else if (link.linkedEventId) {
      const linked = byId.get(link.linkedEventId)
      if (!linked) return event // linked event not found — use stored times
      anchor = link.linkedAnchor === 'end'
        ? (linked.endYear ?? linked.startYear)
        : linked.startYear
    } else {
      return event
    }

    const startYear = anchor + link.startOffset
    const endYear = link.duration != null
      ? startYear + link.duration
      : event.endYear

    return { ...event, startYear, ...(endYear !== undefined ? { endYear } : {}) }
  })
}

const _MLBL = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
/** Format a fractional year as "15 Mar 2025, 14:30" (UTC). */
export function fracYearToDateLabel(fy: number): string {
  const d = new Date(fracYearToMs(fy))
  const h = String(d.getUTCHours()).padStart(2, '0')
  const m = String(d.getUTCMinutes()).padStart(2, '0')
  return `${d.getUTCDate()} ${_MLBL[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${h}:${m}`
}
