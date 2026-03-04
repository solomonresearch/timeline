export interface Lane {
  id: string
  name: string
  color: string
  visible: boolean
  isDefault: boolean
  order: number
}

export interface ValueDataPoint {
  year: number   // fractional year
  value: number
}

export interface ValueDeposit {
  id: string
  label?: string
  amount: number                               // negative = withdrawal
  frequency: 'monthly' | 'yearly' | 'weekly'
  startYear: number
  endYear?: number                             // undefined = open-ended
}

export interface ValueProjection {
  growthPercent: number                        // annual % (compound), 0 = no growth
  deposits: ValueDeposit[]
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
  valuePoints?: ValueDataPoint[]
  valueProjection?: ValueProjection
}
