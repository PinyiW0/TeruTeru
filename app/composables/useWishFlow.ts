import type { DollPlaced, Phase, WishData } from '~/types/wish'
import { todayMidnight } from '~/utils/wishDate'

// 排版常數(直譯自 reference praying.jsx)
export const TOTAL_DOLLS = 25
export const ROPES = 5
export const SLOTS_PER_ROPE = TOTAL_DOLLS / ROPES
export const ROPE_Y_FRACTIONS = [0.92, 0.71, 0.50, 0.29, 0.08] // rope 0 = 底,先填
export const SLOT_X_FRACTIONS = [0.13, 0.32, 0.50, 0.68, 0.87]
export const ROPE_SAG = 14
export const BAND_TOP = 0.20
export const BAND_BOT = 0.80

// 過場時序(直譯自 reference app.jsx::goTo)
const PHASE_SWITCH_MS = 600
const TRANSITION_END_MS = 1250
const FLOAT_TO_HUNG_MS = 1100
const COMPLETE_DELAY_MS = 1400

const LOCATION_STORAGE_KEY = 'teru.location'

function readPersistedLocation(): string {
  if (!import.meta.client)
    return ''
  try {
    return window.localStorage.getItem(LOCATION_STORAGE_KEY) || ''
  }
  catch {
    return ''
  }
}

export function slotToXY(slotIdx: number, sizeW: number, sizeH: number) {
  const rope = Math.floor(slotIdx / SLOTS_PER_ROPE)
  const slotInRope = slotIdx % SLOTS_PER_ROPE
  const bandTop = sizeH * BAND_TOP
  const bandBot = sizeH * BAND_BOT
  const ropeY = bandTop + ROPE_Y_FRACTIONS[rope]! * (bandBot - bandTop)
  const xFrac = SLOT_X_FRACTIONS[slotInRope]!
  const slotX = sizeW * xFrac
  const sagPhase = Math.sin(xFrac * Math.PI)
  const ropeYAtX = ropeY + ROPE_SAG * sagPhase
  return { x: slotX, y: ropeYAtX }
}

export function useWishFlow() {
  const phase = useState<Phase>('teru:phase', () => 'setup')
  const transition = useState<boolean>('teru:transition', () => false)
  const date = useState<Date>('teru:date', () => todayMidnight())
  const location = useState<string>('teru:location', () => readPersistedLocation())
  const dolls = useState<DollPlaced[]>('teru:dolls', () => [])

  if (import.meta.client) {
    // SSR 階段 location initializer 為空字串,client 端首次呼叫時從 localStorage 同步
    if (location.value === '') {
      const persisted = readPersistedLocation()
      if (persisted)
        location.value = persisted
    }
    // 持久化:location 變化時寫回 localStorage
    watch(location, (next) => {
      try {
        window.localStorage.setItem(LOCATION_STORAGE_KEY, next)
      }
      catch {
        // ignore quota / disabled errors
      }
    })
  }

  function goTo(next: Phase, payload?: Partial<WishData>) {
    transition.value = true
    setTimeout(() => {
      if (payload?.date)
        date.value = payload.date
      if (payload?.location !== undefined)
        location.value = payload.location
      phase.value = next
      if (next === 'setup') {
        // 回 setup 時清空娃娃,date 重置為今天(除非 payload 明示)
        dolls.value = []
        if (!payload?.date)
          date.value = todayMidnight()
      }
    }, PHASE_SWITCH_MS)
    setTimeout(() => {
      transition.value = false
    }, TRANSITION_END_MS)
  }

  function addDoll(tapX: number, tapY: number, sizeW: number, sizeH: number) {
    if (phase.value !== 'praying')
      return
    if (dolls.value.length >= TOTAL_DOLLS)
      return

    const nextSlot = dolls.value.length
    const { x: slotX, y: slotY } = slotToXY(nextSlot, sizeW, sizeH)
    const startY = Math.max(tapY, slotY + 100)
    const fromX = tapX - slotX
    const fromY = startY - slotY
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`

    dolls.value = [...dolls.value, { id, slot: nextSlot, fromX, fromY, hung: false }]

    setTimeout(() => {
      dolls.value = dolls.value.map(d => d.id === id ? { ...d, hung: true } : d)
    }, FLOAT_TO_HUNG_MS)

    if (nextSlot + 1 >= TOTAL_DOLLS) {
      setTimeout(goTo, COMPLETE_DELAY_MS, 'complete')
    }
  }

  function reset() {
    phase.value = 'setup'
    transition.value = false
    date.value = todayMidnight()
    dolls.value = []
    // location 不清空(由地點持久化規則處理)
  }

  return {
    phase,
    transition,
    date,
    location,
    dolls,
    TOTAL_DOLLS,
    ROPES,
    SLOTS_PER_ROPE,
    ROPE_Y_FRACTIONS,
    SLOT_X_FRACTIONS,
    ROPE_SAG,
    BAND_TOP,
    BAND_BOT,
    slotToXY,
    goTo,
    addDoll,
    reset,
  }
}
