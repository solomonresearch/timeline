/**
 * OpenAI API helpers — text-to-events parsing (GPT-4o-mini) + audio transcription (Whisper).
 * Uses fetch directly (no SDK), matching the pattern in googleCalendar.ts.
 */

import type { ParsedCalendarEvent } from './calendarParser'

const OPENAI_API_URL = 'https://api.openai.com/v1'

export function isOpenAIConfigured(): boolean {
  return !!import.meta.env.VITE_OPENAI_API_KEY
}

function getApiKey(): string {
  return import.meta.env.VITE_OPENAI_API_KEY as string
}

/**
 * Parse natural-language text into structured timeline events using GPT-4o-mini.
 */
export async function parseTextToEvents(
  text: string,
  laneNames: string[],
): Promise<ParsedCalendarEvent[]> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('OpenAI API key not configured')

  const systemPrompt = `You extract life events from text and return them as a JSON array.

Each event object has these fields:
- "title": string — short event title
- "description": string — brief description (can be empty)
- "startYear": number — fractional year (e.g. 2020.5 for July 2020). Use January (x.0) if only a year is mentioned.
- "endYear": number | null — fractional year for end of range events, null for point events
- "category": string — must be one of these lane names: ${JSON.stringify(laneNames)}

Rules:
- Extract every distinct event mentioned in the text
- For date ranges (e.g. "2015 to 2019"), set both startYear and endYear
- For single dates or moments, set endYear to null
- Convert month names to fractional years (Jan=0.0, Feb≈0.083, Mar≈0.167, Apr≈0.25, May≈0.333, Jun≈0.5, Jul≈0.583, Aug≈0.667, Sep≈0.75, Oct≈0.833, Nov≈0.917, Dec≈0.958)
- Choose the most appropriate category from the provided lane names
- Return ONLY the JSON array, no other text`

  const res = await fetch(`${OPENAI_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      temperature: 0.3,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `OpenAI API error: ${res.status}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('No response from OpenAI')

  const parsed = JSON.parse(content)
  // Accept { events: [...] } or direct array
  const events: unknown[] = Array.isArray(parsed) ? parsed : (parsed.events || [])

  return events.map((e: unknown) => {
    const ev = e as Record<string, unknown>
    return {
      title: String(ev.title || ''),
      description: String(ev.description || ''),
      startYear: Number(ev.startYear) || 2000,
      endYear: ev.endYear != null ? Number(ev.endYear) : undefined,
      category: String(ev.category || 'Other Activities'),
    }
  }).filter(e => e.title)
}

/**
 * Transcribe audio using OpenAI Whisper API.
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('OpenAI API key not configured')

  const formData = new FormData()
  // Determine extension from MIME type
  const ext = audioBlob.type.includes('webm') ? 'webm'
    : audioBlob.type.includes('ogg') ? 'ogg'
    : audioBlob.type.includes('mp4') ? 'mp4'
    : 'webm'
  formData.append('file', audioBlob, `recording.${ext}`)
  formData.append('model', 'whisper-1')

  const res = await fetch(`${OPENAI_API_URL}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Whisper API error: ${res.status}`)
  }

  const data = await res.json()
  return data.text || ''
}
