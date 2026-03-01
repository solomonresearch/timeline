import { supabase } from './supabase'
import type { Lane, TimelineEvent } from '@/types/timeline'
import type {
  DbProfile,
  DbTimeline,
  DbLane,
  DbEvent,
  DbPersona,
  DbPersonaEvent,
} from '@/types/database'

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
  }
}

export function mapDbEvent(row: DbEvent): TimelineEvent {
  return {
    id: row.id,
    laneId: row.lane_id,
    title: row.title,
    description: row.description,
    type: row.type,
    startYear: row.start_year,
    ...(row.end_year != null ? { endYear: row.end_year } : {}),
    ...(row.color != null ? { color: row.color } : {}),
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
  updates: { display_name?: string; bio?: string; birth_year?: number | null },
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

export async function upsertProfile(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId }, { onConflict: 'id' })
  if (error) {
    console.error('upsertProfile error:', error)
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

export async function renameTimeline(timelineId: string, name: string): Promise<boolean> {
  const { error } = await supabase
    .from('timelines')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', timelineId)
  if (error) {
    console.error('renameTimeline error:', error)
    return false
  }
  return true
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
  lane: { name: string; color: string; visible: boolean; order: number },
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
  updates: Partial<{ name: string; color: string; visible: boolean; order: number }>,
): Promise<boolean> {
  const dbUpdates: Record<string, unknown> = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.color !== undefined) dbUpdates.color = updates.color
  if (updates.visible !== undefined) dbUpdates.visible = updates.visible
  if (updates.order !== undefined) dbUpdates.order = updates.order

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
    type: 'range' | 'point'
    start_year: number
    end_year?: number
    color?: string
  },
): Promise<DbEvent | null> {
  const { data, error } = await supabase
    .from('events')
    .insert({
      timeline_id: timelineId,
      lane_id: event.lane_id,
      title: event.title,
      description: event.description,
      type: event.type,
      start_year: event.start_year,
      end_year: event.end_year ?? null,
      color: event.color ?? null,
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
    type: 'range' | 'point'
    start_year: number
    end_year: number | null
    color: string | null
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
