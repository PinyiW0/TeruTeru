import type { Page } from '@playwright/test'

// no-op：Playwright 預設每個 test 用 fresh browser context，localStorage / sessionStorage 已是空
// 保留 API 相容性。注意：若改用 addInitScript 清空，reload 後會再次清空，破壞 persistence 測試。
export async function installClearStorage(_page: Page) {
  // intentionally empty
}

// 預設 localStorage 值（如預先寫入主題色 / 地點），於 navigation 前注入
export async function presetStorage(page: Page, entries: Record<string, string>) {
  await page.addInitScript((data) => {
    try {
      for (const [k, v] of Object.entries(data)) {
        window.localStorage.setItem(k, v)
      }
    }
    catch {
      // ignore
    }
  }, entries)
}

export async function readStorage(page: Page, key: string): Promise<string | null> {
  return page.evaluate(k => window.localStorage.getItem(k), key)
}
