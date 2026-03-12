import { supabase } from './supabase'
import type { Lane, TimelineEvent, ValueProjection } from '@/types/timeline'
import type {
  DbProfile,
  DbTimeline,
  DbLane,
  DbEvent,
  DbPersona,
  DbPersonaEvent,
  PublicProfileData,
} from '@/types/database'
import { dateToFracYear, fracYearToMs } from './constants'

// ── Timestamp ↔ fractional-year conversion ─────────────────────────────────

function dbTimeToFracYear(iso: string): number {
  return dateToFracYear(new Date(iso))
}

export function fracYearToDbTime(fy: number): string {
  return new Date(fracYearToMs(fy)).toISOString()
}

// ============================================================
// Mapping helpers
// ============================================================

export function mapDbLane(row: DbLane): Lane {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    visible: row.visible,
    isDefault: row.is_default,
    order: row.order,
    ...(row.emoji != null ? { emoji: row.emoji } : {}),
    visibility: row.visibility ?? 'public',
  }
}

export function mapDbEvent(row: DbEvent): TimelineEvent {
  // Only use value_projection if it has the new format (startValue field present)
  const proj = row.value_projection as Record<string, unknown> | null
  const validProj = proj != null && 'startValue' in proj ? proj as unknown as ValueProjection : null
  const startYear = dbTimeToFracYear(row.start_time)
  const endYear = row.end_time != null ? dbTimeToFracYear(row.end_time) : undefined
  return {
    id: row.id,
    laneId: row.lane_id,
    title: row.title,
    description: row.description,
    type: endYear !== undefined ? 'range' : 'point',
    startYear,
    ...(endYear !== undefined ? { endYear } : {}),
    ...(row.color != null ? { color: row.color } : {}),
    ...(row.emoji != null ? { emoji: row.emoji } : {}),
    ...(row.point_value != null ? { pointValue: row.point_value } : {}),
    ...(validProj != null ? { valueProjection: validProj } : {}),
    visibility: row.visibility ?? 'public',
  }
}

// ============================================================
// Profiles
// ============================================================

export async function fetchProfile(userId: string): Promise<DbProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) {
    console.error('fetchProfile error:', error)
    return null
  }
  return data
}

export async function updateProfile(
  userId: string,
  updates: { display_name?: string; bio?: string; birth_date?: string | null; username?: string | null; is_public?: boolean },
): Promise<DbProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()
  if (error) {
    console.error('updateProfile error:', error)
    return null
  }
  return data
}

export async function fetchPublicProfile(username: string): Promise<PublicProfileData | null> {
  const { data, error } = await supabase.rpc('get_public_profile', { p_username: username })
  if (error || !data) return null
  return data as PublicProfileData
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const { data } = await supabase.rpc('is_username_available', { p_username: username })
  return data === true
}

export async function upsertProfile(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId }, { onConflict: 'id' })
  if (error) {
    console.error('upsertProfile error:', error)
  }
}

export async function applyPendingProfileData(userId: string): Promise<void> {
  const raw = localStorage.getItem('timeline_pending_profile')
  if (!raw) return

  try {
    const pending = JSON.parse(raw)
    // Discard if older than 30 days
    if (pending.created_at) {
      const age = Date.now() - new Date(pending.created_at).getTime()
      if (age > 30 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem('timeline_pending_profile')
        return
      }
    }

    const updates: { bio?: string; birth_date?: string; username?: string } = {}
    if (pending.bio) updates.bio = pending.bio
    if (pending.birth_date) updates.birth_date = pending.birth_date
    if (pending.username) updates.username = pending.username

    if (Object.keys(updates).length > 0) {
      await updateProfile(userId, updates)
    }
    localStorage.removeItem('timeline_pending_profile')
  } catch {
    localStorage.removeItem('timeline_pending_profile')
  }
}

// ============================================================
// Timelines
// ============================================================

export async function fetchTimelines(userId: string): Promise<DbTimeline[]> {
  const { data, error } = await supabase
    .from('timelines')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) {
    console.error('fetchTimelines error:', error)
    return []
  }
  return data ?? []
}

export async function createTimelineWithDefaults(userId: string, name?: string): Promise<string | null> {
  // Use the RPC to create timeline + default lanes
  const { data, error } = await supabase.rpc('create_default_timeline', {
    p_user_id: userId,
  })
  if (error) {
    console.error('createTimelineWithDefaults error:', error)
    return null
  }
  const timelineId = data as string
  // If a custom name was provided, update it
  if (name && name !== 'My Life') {
    await supabase
      .from('timelines')
      .update({ name })
      .eq('id', timelineId)
  }
  return timelineId
}

export async function updateTimeline(
  timelineId: string,
  updates: { name?: string; start_year?: number | null; end_year?: number | null; color?: string | null; emoji?: string | null; visibility?: string },
): Promise<boolean> {
  const { error } = await supabase
    .from('timelines')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', timelineId)
  if (error) {
    console.error('updateTimeline error:', error)
    return false
  }
  return true
}

/** @deprecated use updateTimeline */
export async function renameTimeline(timelineId: string, name: string): Promise<boolean> {
  return updateTimeline(timelineId, { name })
}

export async function deleteTimeline(timelineId: string): Promise<boolean> {
  const { error } = await supabase
    .from('timelines')
    .delete()
    .eq('id', timelineId)
  if (error) {
    console.error('deleteTimeline error:', error)
    return false
  }
  return true
}

// ============================================================
// Lanes
// ============================================================

export async function fetchLanes(timelineId: string): Promise<DbLane[]> {
  const { data, error } = await supabase
    .from('lanes')
    .select('*')
    .eq('timeline_id', timelineId)
    .order('order', { ascending: true })
  if (error) {
    console.error('fetchLanes error:', error)
    return []
  }
  return data ?? []
}

export async function insertLane(
  timelineId: string,
  lane: { name: string; color: string; visible: boolean; order: number; emoji?: string; visibility?: string },
): Promise<DbLane | null> {
  const { data, error } = await supabase
    .from('lanes')
    .insert({
      timeline_id: timelineId,
      name: lane.name,
      color: lane.color,
      visible: lane.visible,
      is_default: false,
      order: lane.order,
      emoji: lane.emoji ?? null,
      visibility: lane.visibility ?? 'public',
    })
    .select()
    .single()
  if (error) {
    console.error('insertLane error:', error)
    return null
  }
  return data
}

export async function updateLaneDb(
  laneId: string,
  updates: Partial<{ name: string; color: string; visible: boolean; order: number; emoji: string | null; visibility: string }>,
): Promise<boolean> {
  const dbUpdates: Record<string, unknown> = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.color !== undefined) dbUpdates.color = updates.color
  if (updates.visible !== undefined) dbUpdates.visible = updates.visible
  if (updates.order !== undefined) dbUpdates.order = updates.order
  if ('emoji' in updates) dbUpdates.emoji = updates.emoji ?? null

  const { error } = await supabase
    .from('lanes')
    .update(dbUpdates)
    .eq('id', laneId)
  if (error) {
    console.error('updateLane error:', error)
    return false
  }
  return true
}

export async function deleteLaneDb(laneId: string): Promise<boolean> {
  const { error } = await supabase
    .from('lanes')
    .delete()
    .eq('id', laneId)
  if (error) {
    console.error('deleteLane error:', error)
    return false
  }
  return true
}

// ============================================================
// Events
// ============================================================

export async function fetchEvents(timelineId: string): Promise<DbEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('timeline_id', timelineId)
  if (error) {
    console.error('fetchEvents error:', error)
    return []
  }
  return data ?? []
}

export async function insertEvent(
  timelineId: string,
  event: {
    lane_id: string
    title: string
    description: string
    start_time: string
    end_time?: string | null
    color?: string
    emoji?: string
    point_value?: number
    value_projection?: ValueProjection
    visibility?: string
  },
): Promise<DbEvent | null> {
  const { data, error } = await supabase
    .from('events')
    .insert({
      timeline_id: timelineId,
      lane_id: event.lane_id,
      title: event.title,
      description: event.description,
      start_time: event.start_time,
      end_time: event.end_time ?? null,
      color: event.color ?? null,
      emoji: event.emoji ?? null,
      point_value: event.point_value ?? null,
      visibility: event.visibility ?? 'public',
      ...(event.value_projection != null ? { value_projection: event.value_projection } : {}),
    })
    .select()
    .single()
  if (error) {
    console.error('insertEvent error:', error)
    return null
  }
  return data
}

export async function updateEventDb(
  eventId: string,
  updates: Partial<{
    lane_id: string
    title: string
    description: string
    start_time: string
    end_time: string | null
    color: string | null
    emoji: string | null
    point_value: number | null
    value_projection: ValueProjection | null
    visibility: string
  }>,
): Promise<boolean> {
  const { error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', eventId)
  if (error) {
    console.error('updateEvent error:', error)
    return false
  }
  return true
}

export async function deleteEventDb(eventId: string): Promise<boolean> {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)
  if (error) {
    console.error('deleteEvent error:', error)
    return false
  }
  return true
}

// ============================================================
// Personas
// ============================================================

export async function fetchPersonas(): Promise<DbPersona[]> {
  const { data, error } = await supabase
    .from('personas')
    .select('*')
    .order('birth_year', { ascending: true })
  if (error) {
    console.error('fetchPersonas error:', error)
    return []
  }
  return data ?? []
}

export async function fetchPersonaEvents(personaIds: string[]): Promise<DbPersonaEvent[]> {
  if (personaIds.length === 0) return []
  const { data, error } = await supabase
    .from('persona_events')
    .select('*')
    .in('persona_id', personaIds)
  if (error) {
    console.error('fetchPersonaEvents error:', error)
    return []
  }
  return data ?? []
}

// ============================================================
// Kanban
// ============================================================

export interface KanbanCardRow {
  id: string
  title: string
  description: string | null
  status: 'todo' | 'in_progress' | 'done'
  position: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export async function fetchKanbanCards(): Promise<KanbanCardRow[]> {
  const { data, error } = await supabase
    .from('kanban_cards')
    .select('*')
    .eq('archived', false)
    .order('position', { ascending: true })
  if (error) {
    console.error('fetchKanbanCards error:', error)
    return []
  }
  return (data ?? []) as KanbanCardRow[]
}

export async function createKanbanCard(card: {
  title: string
  description: string | null
  status: string
}): Promise<KanbanCardRow | null> {
  // Get next position for the target column
  const { data: existing } = await supabase
    .from('kanban_cards')
    .select('position')
    .eq('status', card.status)
    .eq('archived', false)
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0

  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('kanban_cards')
    .insert({
      title: card.title,
      description: card.description,
      status: card.status,
      position: nextPosition,
      created_by: user?.id ?? null,
    })
    .select()
    .single()

  if (error) {
    console.error('createKanbanCard error:', error)
    return null
  }
  return data as KanbanCardRow
}

export async function updateKanbanCard(
  cardId: string,
  updates: Partial<{ title: string; description: string | null; status: string; position: number }>,
): Promise<boolean> {
  const { error } = await supabase
    .from('kanban_cards')
    .update(updates)
    .eq('id', cardId)
  if (error) {
    console.error('updateKanbanCard error:', error)
    return false
  }
  return true
}

export async function deleteKanbanCard(cardId: string): Promise<boolean> {
  const { error } = await supabase
    .from('kanban_cards')
    .update({ archived: true })
    .eq('id', cardId)
  if (error) {
    console.error('deleteKanbanCard error:', error)
    return false
  }
  return true
}

// ============================================================
// Demo timeline import
// ============================================================

export async function applyDemoTimeline(
  timelineId: string,
  lanes: import('@/types/timeline').Lane[],
  events: import('@/types/timeline').TimelineEvent[],
): Promise<void> {
  // Delete existing lanes for this timeline (cascade events via explicit delete)
  const { data: existingLanes } = await supabase
    .from('lanes')
    .select('id')
    .eq('timeline_id', timelineId)
  if (existingLanes && existingLanes.length > 0) {
    const ids = existingLanes.map((l: { id: string }) => l.id)
    await supabase.from('events').delete().in('lane_id', ids)
    await supabase.from('lanes').delete().eq('timeline_id', timelineId)
  }

  // Insert demo lanes, build ID mapping
  const idMap = new Map<string, string>()
  for (const lane of lanes) {
    const { data } = await supabase
      .from('lanes')
      .insert({
        timeline_id: timelineId,
        name: lane.name,
        color: lane.color,
        visible: lane.visible,
        is_default: false,
        order: lane.order,
        emoji: lane.emoji ?? null,
        visibility: 'public',
      })
      .select('id')
      .single()
    if (data) idMap.set(lane.id, (data as { id: string }).id)
  }

  // Insert demo events
  for (const event of events) {
    const realLaneId = idMap.get(event.laneId)
    if (!realLaneId) continue
    await supabase.from('events').insert({
      timeline_id: timelineId,
      lane_id: realLaneId,
      title: event.title,
      description: event.description,
      start_time: fracYearToDbTime(event.startYear),
      end_time: event.endYear != null ? fracYearToDbTime(event.endYear) : null,
      color: event.color ?? null,
      emoji: event.emoji ?? null,
      visibility: 'public',
    })
  }
}
