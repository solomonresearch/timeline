export interface DbProfile {
  id: string
  display_name: string
  bio: string
  birth_date: string | null
  end_date: string | null
  username: string | null
  is_public: boolean
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface DbTimeline {
  id: string
  user_id: string
  name: string
  start_year: number | null
  end_year: number | null
  color: string | null
  emoji: string | null
  visibility: string
  created_at: string
  updated_at: string
}

export interface DbLane {
  id: string
  timeline_id: string
  name: string
  color: string
  visible: boolean
  is_default: boolean
  order: number
  emoji: string | null
  visibility: string
}

export interface DbEvent {
  id: string
  lane_id: string
  timeline_id: string
  title: string
  description: string
  start_time: string        // timestamptz ISO string
  end_time: string | null   // null = point event
  color: string | null
  emoji: string | null
  point_value: number | null
  value_points: unknown[] | null
  value_projection: unknown | null
  source: string | null
  visibility: string
  link: unknown | null
  // Enrichment fields (added in migration 016)
  url: string | null
  location: string | null
  rating: number | null
  metadata: unknown | null  // { image_url?, tags?, external_id?, source_data? }
}

export interface PublicProfileData {
  profile: {
    username: string
    display_name: string
    bio: string
    avatar_url: string | null
  }
  timelines: Array<{
    id: string
    name: string
    color: string | null
    emoji: string | null
    start_year: number | null
    end_year: number | null
    created_at: string
  }>
  lanes: Array<{
    id: string
    timeline_id: string
    name: string
    color: string
    emoji: string | null
    order: number
  }>
  events: Array<{
    id: string
    lane_id: string
    timeline_id: string
    title: string
    description: string
    start_time: string
    end_time: string | null
    color: string | null
    emoji: string | null
  }>
}

export interface DbPersona {
  id: string
  name: string
  bio: string
  birth_year: number
  death_year: number | null
}

export interface DbTimelineShare {
  share_id: string
  user_id: string
  username: string | null
  display_name: string
}

export interface SharedWithMeItem {
  share_id: string
  timeline: {
    id: string
    name: string
    color: string | null
    emoji: string | null
    start_year: number | null
    end_year: number | null
    created_at: string
  }
  owner: {
    username: string | null
    display_name: string
  }
}

export interface DbPersonaEvent {
  id: string
  persona_id: string
  lane_name: string
  title: string
  description: string
  type: 'range' | 'point'
  start_year: number
  end_year: number | null
  color: string | null
}

export interface AlignedPersonaEvent extends DbPersonaEvent {
  display_start_year: number
  display_end_year: number | null
  persona_name: string
}

export interface OverlayTimelineEvent {
  id: string
  timeline_id: string
  lane_name: string
  title: string
  description: string
  type: 'range' | 'point'
  start_year: number
  end_year: number | null
  color: string | null
  display_start_year: number
  display_end_year: number | null
}
