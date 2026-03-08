/**
 * Google Calendar API helpers — GIS script loader, OAuth token, calendar & event fetching.
 */

export interface GoogleCalendar {
  id: string
  summary: string
  backgroundColor: string
  primary?: boolean
}

export interface GoogleCalEvent {
  id: string
  calendarId: string
  calendarName: string
  title: string
  description: string
  startYear: number
  endYear?: number
}

/** Convert a Date to fractional year (e.g. 2020.5 = July 2020) */
function dateToFractionalYear(d: Date): number {
  const year = d.getFullYear()
  const start = new Date(year, 0, 1).getTime()
  const end = new Date(year + 1, 0, 1).getTime()
  return year + (d.getTime() - start) / (end - start)
}

// ── GIS Script Loader ──

let gisPromise: Promise<void> | null = null

export function loadGis(): Promise<void> {
  if (gisPromise) return gisPromise
  gisPromise = new Promise<void>((resolve, reject) => {
    if (typeof google !== 'undefined' && google.accounts?.oauth2) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      gisPromise = null
      reject(new Error('Failed to load Google Identity Services'))
    }
    document.head.appendChild(script)
  })
  return gisPromise
}

// ── OAuth Token Request ──

export function requestCalendarToken(
  clientId: string,
): Promise<{ access_token: string; expires_in: number }> {
  return new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/calendar.readonly',
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error))
          return
        }
        resolve({ access_token: response.access_token, expires_in: response.expires_in })
      },
      error_callback: (error) => {
        reject(new Error(error.message || 'OAuth error'))
      },
    })
    client.requestAccessToken()
  })
}

// ── Calendar List ──

export async function fetchCalendarList(token: string): Promise<GoogleCalendar[]> {
  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader',
    { headers: { Authorization: `Bearer ${token}` } },
  )
  if (!res.ok) throw new Error(`Calendar list failed: ${res.status}`)
  const data = await res.json()
  return (data.items || []).map((item: Record<string, unknown>) => ({
    id: item.id as string,
    summary: (item.summary || item.id) as string,
    backgroundColor: (item.backgroundColor || '#4285f4') as string,
    primary: item.primary === true,
  }))
}

// ── Calendar Events (paginated) ──

export async function fetchCalendarEvents(
  token: string,
  calendarId: string,
  calendarName: string,
  onProgress?: (count: number) => void,
): Promise<GoogleCalEvent[]> {
  const events: GoogleCalEvent[] = []
  let pageToken: string | undefined

  do {
    const params = new URLSearchParams({
      singleEvents: 'true',
      maxResults: '2500',
      timeMin: '1900-01-01T00:00:00Z',
      timeMax: '2100-01-01T00:00:00Z',
      orderBy: 'startTime',
    })
    if (pageToken) params.set('pageToken', pageToken)

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (!res.ok) throw new Error(`Events fetch failed: ${res.status}`)
    const data = await res.json()

    for (const item of data.items || []) {
      const title = item.summary
      if (!title) continue

      const startStr: string | undefined = item.start?.dateTime || item.start?.date
      const endStr: string | undefined = item.end?.dateTime || item.end?.date
      if (!startStr) continue

      const startDate = new Date(startStr)
      if (isNaN(startDate.getTime())) continue

      const startYear = dateToFractionalYear(startDate)
      let endYear: number | undefined

      if (endStr) {
        const endDate = new Date(endStr)
        if (!isNaN(endDate.getTime())) {
          const ey = dateToFractionalYear(endDate)
          // Only treat as range if > 30 days
          if (ey - startYear > 30 / 365) {
            endYear = ey
          }
        }
      }

      events.push({
        id: item.id || `${calendarId}-${events.length}`,
        calendarId,
        calendarName,
        title,
        description: item.description || '',
        startYear,
        endYear,
      })
    }

    onProgress?.(events.length)
    pageToken = data.nextPageToken
  } while (pageToken)

  return events
}
