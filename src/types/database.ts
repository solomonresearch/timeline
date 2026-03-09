export interface DbProfile {
  id: string
  display_name: string
  bio: string
  birth_year: number | null
  birth_date: string | null
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
}

export interface DbEvent {
  id: string
  lane_id: string
  timeline_id: string
  title: string
  description: string
  type: 'range' | 'point'
  start_year: number
  end_year: number | null
  color: string | null
  emoji: string | null
  point_value: number | null
  value_points: unknown[] | null
  value_projection: unknown | null
}

export interface DbPersona {
  id: string
  name: string
  bio: string
  birth_year: number
  death_year: number | null
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
}
