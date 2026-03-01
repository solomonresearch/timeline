export interface Lane {
  id: string
  name: string
  color: string
  visible: boolean
  isDefault: boolean
  order: number
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
}
