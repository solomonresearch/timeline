export interface Lane {
  id: string
  name: string
  color: string
  visible: boolean
  isDefault: boolean
  order: number
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
  frequency: 'monthly' | 'yearly' | 'weekly'
  startYear: number
  endYear?: number             // undefined = open-ended
}

export interface ValueProjection {
  startValue: number
  spotChanges: ValueSpotChange[]
  growthPeriods: ValueGrowthPeriod[]
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
  valueProjection?: ValueProjection
}
