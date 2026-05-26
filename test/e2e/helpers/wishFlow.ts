import type { Page } from '@playwright/test'

// 讀取 useWishFlow state 快照（依賴 app 端 expose window.__wish）
export interface WishSnapshot {
  phase: 'setup' | 'praying' | 'complete'
  transition: boolean
  dateIso: string | null
  dateLocalDay: string | null
  location: string
  dollCount: number
}

export async function readWish(page: Page): Promise<WishSnapshot> {
  return page.evaluate(() => {
    const unref = (v: unknown): unknown =>
      v != null && typeof v === 'object' && 'value' in (v as Record<string, unknown>)
        ? (v as { value: unknown }).value
        : v
    const w = (window as unknown as { __wish?: Record<string, unknown> }).__wish
    if (!w) {
      return {
        phase: 'setup' as const,
        transition: false,
        dateIso: null,
        dateLocalDay: null,
        location: '',
        dollCount: 0,
      }
    }
    const date = unref(w.date) as Date | null
    const dolls = unref(w.dolls) as unknown[] | null
    const dateLocalDay = date instanceof Date
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      : null
    return {
      phase: unref(w.phase) as 'setup' | 'praying' | 'complete',
      transition: Boolean(unref(w.transition)),
      dateIso: date instanceof Date ? date.toISOString() : null,
      dateLocalDay,
      location: String(unref(w.location) ?? ''),
      dollCount: Array.isArray(dolls) ? dolls.length : 0,
    }
  })
}

// 直接設定 dolls 陣列至 N 個 hung 娃娃（跳過點擊，用於滿 25 測試）
export async function seedDolls(page: Page, count: number) {
  await page.evaluate((n) => {
    const w = (window as unknown as { __wish?: { dolls?: { value: unknown[] } } }).__wish
    if (!w?.dolls)
      return
    w.dolls.value = Array.from({ length: n }, (_, i) => ({
      id: `seed-${i}`,
      slot: i,
      fromX: 0,
      fromY: 0,
      hung: true,
    }))
  }, count)
}

// 強制觸發 goTo
export async function gotoPhase(page: Page, next: 'setup' | 'praying' | 'complete', payload?: { date?: string, location?: string }) {
  await page.evaluate(({ next, payload }) => {
    const w = (window as unknown as { __wish?: { goTo?: (next: string, payload?: unknown) => void } }).__wish
    const goTo = w?.goTo
    if (typeof goTo !== 'function')
      return
    const p = payload?.date
      ? { ...payload, date: new Date(payload.date) }
      : payload
    goTo(next, p)
  }, { next, payload })
}

const LOCATION_FIELD_REGEX = /地點|位置|許願|城市/
const START_BUTTON_REGEX = /開始放晴|開始|啟程/

// 透過 setup → 點開始按鈕完成 setup → praying 切換（業務路徑）
export async function completeSetupAndEnterPraying(page: Page, location = '台北') {
  const input = page.getByRole('textbox', { name: LOCATION_FIELD_REGEX }).or(page.getByPlaceholder(LOCATION_FIELD_REGEX))
  await input.first().fill(location)
  await page.getByRole('button', { name: START_BUTTON_REGEX }).click()
  // 等到 phase 切換完成且 LoadingScreen 過場結束（transition === false）
  // 否則 z-index:50 的 LoadingScreen 會攔截後續 stage click
  await page.waitForFunction(() => {
    const w = (window as unknown as {
      __wish?: { phase?: { value?: string }, transition?: { value?: boolean } }
    }).__wish
    return w?.phase?.value === 'praying' && w?.transition?.value === false
  }, undefined, { timeout: 4000 })
}
