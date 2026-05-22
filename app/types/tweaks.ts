export type VisualStyle = 'flat' | 'washi' | 'collage'
export type ThemeColor = 'sunny' | 'sakura' | 'matcha'
export type DollStyle = 'classic' | 'simple' | 'varied'
export type FontStyle = 'round' | 'hand'

export interface TweakState {
  visualStyle: VisualStyle
  themeColor: ThemeColor
  dollStyle: DollStyle
  fontStyle: FontStyle
  soundOn: boolean
}
