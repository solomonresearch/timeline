export interface Lane {
  id: string
  name: string
  color: string
  visible: boolean
  isDefault: boolean
  order: number
  emoji?: string
  visibility?: string
}

export interface ValueSpotChange {
  id: string
  year: number        // fractional year (past or future)
  amount: number      // positive = add, negative = remove
  label?: string
}

export interface ValueGrowthPeriod {
  id: string
  startYear: number
  endYear: number
  growthPercent: number        // annual % compound
  applyOnNegative: boolean     // whether growth applies when balance < 0
}

export interface ValueDeposit {
  id: string
  label?: string
  amount: number               // negative = withdrawal
  frequency: 'monthly' | 'yearly' | 'weekly' | 'daily' | 'quarterly' | 'custom'
  customInterval?: number      // used when frequency === 'custom'
  customUnit?: 'day' | 'week' | 'month' | 'quarter' | 'year'
  annualGrowthPercent?: number // optional compound annual growth applied to the recurring amount
  startYear: number
  endYear?: number             // undefined = open-ended
}

export interface ValueProjection {
  startValue: number
  spotChanges: ValueSpotChange[]
  growthPeriods: ValueGrowthPeriod[]
  deposits: ValueDeposit[]
}

export interface EventLink {
  anchorType: 'event' | 'today'
  linkedEventId?: string        // when anchorType === 'event'
  linkedAnchor?: 'start' | 'end'  // which time of linked event to anchor to
  startOffset: number           // fractional years offset from anchor (negative = before)
  duration?: number             // if set, endYear = startYear + duration
  onDelete?: 'freeze' | 'delete' // only relevant when anchorType === 'event'
}

export interface EventMetadata {
  image_url?: string
  tags?: string[]
  external_id?: string
  source_data?: unknown
}

export interface TimelineEvent {
  id: string
  laneId: string
  title: string
  description: string
  type: 'range' | 'point'
  startYear: number
  endYear?: number
  color?: string
  emoji?: string
  pointValue?: number
  valueProjection?: ValueProjection
  visibility?: string
  link?: EventLink
  // Enrichment fields
  url?: string
  location?: string
  rating?: number       // 1–5
  source?: string       // import provenance: "strava" | "outlook" | "netflix" | "instagram" | "manual" | …
  metadata?: EventMetadata
}
