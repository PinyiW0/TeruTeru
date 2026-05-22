import type { ThemeColor, TweakState } from '~/types/tweaks'

const STORAGE_KEY = 'teru.themeColor'
const VALID_THEMES: ThemeColor[] = ['sunny', 'sakura', 'matcha']

const DEFAULT_STATE: TweakState = {
  visualStyle: 'flat',
  themeColor: 'sunny',
  dollStyle: 'classic',
  fontStyle: 'round',
  soundOn: true,
}

function readPersistedTheme(): ThemeColor {
  if (!import.meta.client)
    return DEFAULT_STATE.themeColor
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored && (VALID_THEMES as string[]).includes(stored)) {
      return stored as ThemeColor
    }
  }
  catch {
    // localStorage unavailable (private mode, quota, etc.)
  }
  return DEFAULT_STATE.themeColor
}

export function useTweaks() {
  const state = useState<TweakState>('teru:tweaks', () => ({
    ...DEFAULT_STATE,
    themeColor: readPersistedTheme(),
  }))

  // 持久化:themeColor 變化時寫回 localStorage(僅 client)
  if (import.meta.client) {
    watch(() => state.value.themeColor, (next) => {
      try {
        window.localStorage.setItem(STORAGE_KEY, next)
      }
      catch {
        // ignore quota / disabled errors
      }
    })
  }

  function setTweak<K extends keyof TweakState>(key: K, value: TweakState[K]) {
    state.value = { ...state.value, [key]: value }
  }

  return {
    tweaks: state,
    setTweak,
  }
}
