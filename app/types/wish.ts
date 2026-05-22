export type Phase = 'setup' | 'praying' | 'complete'

export interface WishData {
  date: Date
  location: string
}

export interface DollPlaced {
  id: string
  slot: number
  fromX: number
  fromY: number
  hung: boolean
}
