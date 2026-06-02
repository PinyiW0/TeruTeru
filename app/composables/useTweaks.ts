import type { DollStyle, FontStyle, ThemeColor, TweakState, VisualStyle } from '~/types/tweaks'

const KEYS = {
  themeColor: 'teru.themeColor',
  dollStyle: 'teru.dollStyle',
  visualStyle: 'teru.visualStyle',
  fontStyle: 'teru.fontStyle',
  soundOn: 'teru.soundOn',
} as const

const VALID_THEMES: ThemeColor[] = ['sunny', 'sakura', 'matcha']
const VALID_DOLL_STYLES: DollStyle[] = ['classic', 'simple', 'varied']
const VALID_VISUAL_STYLES: VisualStyle[] = ['flat', 'washi', 'collage']
const VALID_FONT_STYLES: FontStyle[] = ['round', 'hand']

const DEFAULT_STATE: TweakState = {
  visualStyle: 'flat',
  themeColor: 'sunny',
  dollStyle: 'classic',
  fontStyle: 'round',
  soundOn: true,
}

function safeGet(key: string): string | null {
  if (!import.meta.client)
    return null
  try {
    return window.localStorage.getItem(key)
  }
  catch {
    return null
  }
}

function readPersisted(): TweakState {
  if (!import.meta.client)
    return { ...DEFAULT_STATE }
  const theme = safeGet(KEYS.themeColor)
  const doll = safeGet(KEYS.dollStyle)
  const visual = safeGet(KEYS.visualStyle)
  const font = safeGet(KEYS.fontStyle)
  const sound = safeGet(KEYS.soundOn)
  return {
    themeColor: theme && (VALID_THEMES as string[]).includes(theme) ? (theme as ThemeColor) : DEFAULT_STATE.themeColor,
    dollStyle: doll && (VALID_DOLL_STYLES as string[]).includes(doll) ? (doll as DollStyle) : DEFAULT_STATE.dollStyle,
    visualStyle: visual && (VALID_VISUAL_STYLES as string[]).includes(visual) ? (visual as VisualStyle) : DEFAULT_STATE.visualStyle,
    fontStyle: font && (VALID_FONT_STYLES as string[]).includes(font) ? (font as FontStyle) : DEFAULT_STATE.fontStyle,
    soundOn: sound === null ? DEFAULT_STATE.soundOn : sound === 'true',
  }
}

export function useTweaks() {
  const state = useState<TweakState>('teru:tweaks', () => ({ ...DEFAULT_STATE }))

  if (import.meta.client) {
    // SSR initial 為 default;client 端首次呼叫時從 localStorage 同步
    const persisted = readPersisted()
    let changed = false
    for (const k of Object.keys(persisted) as Array<keyof TweakState>) {
      if (state.value[k] !== persisted[k])
        changed = true
    }
    if (changed)
      state.value = { ...state.value, ...persisted }

    // 持久化:每個 field 變化時寫回 localStorage
    function persist(key: string, value: string) {
      try {
        window.localStorage.setItem(key, value)
      }
      catch {
        // localStorage unavailable (private mode, quota, etc.)
      }
    }
    watch(() => state.value.themeColor, next => persist(KEYS.themeColor, next))
    watch(() => state.value.dollStyle, next => persist(KEYS.dollStyle, next))
    watch(() => state.value.visualStyle, next => persist(KEYS.visualStyle, next))
    watch(() => state.value.fontStyle, next => persist(KEYS.fontStyle, next))
    watch(() => state.value.soundOn, next => persist(KEYS.soundOn, String(next)))
  }

  function setTweak<K extends keyof TweakState>(key: K, value: TweakState[K]) {
    state.value = { ...state.value, [key]: value }
  }

  function setSoundOn(value: boolean) {
    setTweak('soundOn', value)
  }

  return {
    tweaks: state,
    setTweak,
    setSoundOn,
  }
}
