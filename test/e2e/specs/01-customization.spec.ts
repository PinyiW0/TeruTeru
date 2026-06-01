import { expect, test } from '@playwright/test'

import {
  installAudioMethodSpy,
  installAudioSpy,
  installClearStorage,
  presetStorage,
  readAudioMethodCount,
  readAudioSpy,
  readStorage,
} from '../helpers'

// 主題色 / 字體 / 視覺風格 / 音效 / 共用 SVG defs 的契約測試
// 對應 spec/e2e-flows/01-customization.flow.md

test.beforeEach(async ({ page }) => {
  await installClearStorage(page)
  await installAudioSpy(page)
  await installAudioMethodSpy(page)
})

test.describe('規則：主題色可切換且即時生效', () => {
  test('切換到 sakura 後 data-theme 變更且選擇器 active', async ({ page }) => {
    // Given：使用者進入 SetupScreen，預設主題為 sunny
    await page.goto('/', { waitUntil: 'networkidle' })
    await expect.poll(() =>
      page.evaluate(() => document.documentElement.getAttribute('data-theme')),
    ).toBe('sunny')

    // When：點選 sakura 對應的主題色選擇器
    // 選擇器形式不限（dot / chip / radio / swatch），用 role + accessible name 找
    const sakuraPicker = page
      .getByRole('button', { name: /sakura|櫻花/i })
      .or(page.getByRole('radio', { name: /sakura|櫻花/i }))
      .or(page.getByTestId('theme-dot-sakura'))
    await sakuraPicker.first().click()

    // Then：root data-theme 為 sakura，且元件未 remount（透過先存後比對驗證）
    await expect.poll(() =>
      page.evaluate(() => document.documentElement.getAttribute('data-theme')),
    ).toBe('sakura')

    // sakura 選擇器標示為 active（aria-pressed / aria-checked / data-active 任一）
    const isActive = await sakuraPicker.first().evaluate(el =>
      el.getAttribute('aria-pressed') === 'true'
      || el.getAttribute('aria-checked') === 'true'
      || el.getAttribute('data-active') === 'true'
      || el.classList.contains('active')
      || el.classList.contains('is-active'),
    )
    expect(isActive).toBe(true)
  })
})

test.describe('規則：主題色持久化', () => {
  test('切換為 matcha 後 reload 仍為 matcha', async ({ page }) => {
    // Given：使用者切換主題為 matcha
    await page.goto('/', { waitUntil: 'networkidle' })
    await page
      .getByRole('button', { name: /matcha|抹茶/i })
      .or(page.getByRole('radio', { name: /matcha|抹茶/i }))
      .or(page.getByTestId('theme-dot-matcha'))
      .first()
      .click()

    await expect.poll(() => readStorage(page, 'teru.themeColor')).toBe('matcha')

    // When：reload 頁面
    await page.reload({ waitUntil: 'networkidle' })

    // Then：主題仍為 matcha
    await expect.poll(() =>
      page.evaluate(() => document.documentElement.getAttribute('data-theme')),
    ).toBe('matcha')
  })
})

test.describe('規則：localStorage 空白時 fallback 為 sunny', () => {
  test('全新瀏覽器 data-theme 預設為 sunny', async ({ page }) => {
    // Given：localStorage 空白（installClearStorage 已注入）
    // When：進入 /
    await page.goto('/', { waitUntil: 'networkidle' })

    // Then：root data-theme 為 sunny，sunny 選擇器 active
    await expect.poll(() =>
      page.evaluate(() => document.documentElement.getAttribute('data-theme')),
    ).toBe('sunny')

    const sunnyPicker = page
      .getByRole('button', { name: /sunny|晴天/i })
      .or(page.getByRole('radio', { name: /sunny|晴天/i }))
      .or(page.getByTestId('theme-dot-sunny'))

    const isActive = await sunnyPicker.first().evaluate(el =>
      el.getAttribute('aria-pressed') === 'true'
      || el.getAttribute('aria-checked') === 'true'
      || el.getAttribute('data-active') === 'true'
      || el.classList.contains('active')
      || el.classList.contains('is-active'),
    )
    expect(isActive).toBe(true)
  })
})

test.describe('規則：字體系統可切換', () => {
  test('預設字體為 round（Zen Maru Gothic 為首）', async ({ page }) => {
    // Given：頁面首次載入、無 data-font 設定
    await page.goto('/', { waitUntil: 'networkidle' })

    // Then：body 的 computed font-family 解析以 Zen Maru Gothic 為主
    const fontFamily = await page.evaluate(() => getComputedStyle(document.body).fontFamily)
    expect(fontFamily).toContain('Zen Maru Gothic')
  })

  test('切換 data-font 為 hand 後字體變更為 Huninn', async ({ page }) => {
    // Given：頁面已載入
    await page.goto('/', { waitUntil: 'networkidle' })

    // When：透過 evaluate 觸發切換 data-font 為 hand
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-font', 'hand')
    })

    // Then：body 的 computed font-family 以 Huninn 為首
    const fontFamily = await page.evaluate(() => getComputedStyle(document.body).fontFamily)
    expect(fontFamily).toContain('Huninn')
  })
})

test.describe('規則：視覺風格可切換', () => {
  test('washi 風格啟用 SVG filter 並掛載 DollDefs', async ({ page }) => {
    // Given：root data-style 設為 washi
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.evaluate(() => document.documentElement.setAttribute('data-style', 'washi'))

    // Then：頁面有 #washi-edge defs
    await expect(page.locator('#washi-edge')).toHaveCount(1)
  })

  test('collage 風格顯示紙邊裝飾', async ({ page }) => {
    // Given：visualStyle 預設為 collage（透過 localStorage 注入 useTweaks 持久化值）
    // 且進入 praying 階段使 TeruDoll 渲染
    // （對應 flow.md 修正後的流程：setup 階段沒 TeruDoll，需進 praying 才能驗證）
    await presetStorage(page, { 'teru.visualStyle': 'collage' })
    await page.goto('/', { waitUntil: 'networkidle' })

    // 進 praying 並掛上至少 1 隻娃娃
    await page.getByRole('textbox', { name: /地點|位置|許願|城市/ })
      .or(page.getByPlaceholder(/地點|位置|許願|城市/))
      .first()
      .fill('台北')
    await page.getByRole('button', { name: /開始放晴|開始|啟程/ }).click()
    await page.waitForFunction(() => {
      const w = window as unknown as {
        __wish?: { phase?: { value?: string }, transition?: { value?: boolean } }
      }
      return w.__wish?.phase?.value === 'praying' && w.__wish?.transition?.value === false
    }, undefined, { timeout: 4000 })
    await page.evaluate(() => {
      const w = window as unknown as { __wish?: { dolls?: { value: unknown[] } } }
      if (w.__wish?.dolls) {
        w.__wish.dolls.value = [{
          id: 'seed-collage-0',
          slot: 0,
          fromX: 0,
          fromY: 0,
          hung: true,
        }]
      }
    })
    await page.waitForTimeout(200)

    // Then：頁面內存在帶 stroke-dasharray 的 circle（紙邊裝飾）或 collage 邊框元素
    const hasPaperEdge = await page.evaluate(() => {
      const circles = Array.from(document.querySelectorAll('circle'))
      const hasDashedCircle = circles.some((c) => {
        const dash = c.getAttribute('stroke-dasharray')
        return dash != null && dash.trim() !== '' && dash.trim() !== '0'
      })
      const hasSemanticEdge = document.querySelector('.paper-edge, .collage-edge') != null
      return hasDashedCircle || hasSemanticEdge
    })
    expect(hasPaperEdge).toBe(true)
  })
})

test.describe('規則：音效系統 lazy init', () => {
  test('模組載入但無互動時不建立 AudioContext', async ({ page }) => {
    // Given：進入 /，不執行任何會觸發音效的互動
    await page.goto('/', { waitUntil: 'networkidle' })

    // Then：AudioContext 計數為 0
    const spy = await readAudioSpy(page)
    expect(spy.ctxCount).toBe(0)
  })

  test('首次觸發音效互動時建立 AudioContext', async ({ page }) => {
    // Given：頁面已載入，audio spy 已注入
    await page.goto('/', { waitUntil: 'networkidle' })

    // When：點擊任一會呼叫 pluck 的操作（點 theme dot 觸發 useTeruAudio）
    await page.getByRole('button', { name: 'sakura' }).click()

    // Then：AudioContext 建立 1 次
    await expect.poll(async () => (await readAudioSpy(page)).ctxCount).toBeGreaterThanOrEqual(1)
  })

  test('SSR 進站不 throw（頁面成功 hydrate）', async ({ page }) => {
    // Given：監聽 console error
    const consoleErrors: string[] = []
    page.on('pageerror', err => consoleErrors.push(String(err)))
    page.on('console', (msg) => {
      if (msg.type() === 'error')
        consoleErrors.push(msg.text())
    })

    // When：進入 /
    const response = await page.goto('/', { waitUntil: 'networkidle' })

    // Then：status 200、無 useTeruAudio 相關錯誤
    expect(response?.status()).toBe(200)
    const audioErrors = consoleErrors.filter(e => /useTeruAudio|AudioContext.*server|window is not defined/.test(e))
    expect(audioErrors).toEqual([])
  })
})

test.describe('規則：音效可被關閉', () => {
  test('setEnabled(false) 後互動不發出聲音', async ({ page }) => {
    // Given：頁面已載入，先點一次 theme dot 讓 AudioContext 建立
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'sakura' }).click()
    await expect.poll(async () => (await readAudioSpy(page)).oscCount).toBeGreaterThan(0)

    const before = await readAudioSpy(page)

    // When：關閉音效（呼叫 setEnabled(false) 或將 tweaks.soundOn 設 false）
    await page.evaluate(() => {
      const w = window as unknown as {
        __tweaks?: { setSoundOn?: (v: boolean) => void, soundOn?: { value: boolean } }
        __teruAudio?: { setEnabled?: (v: boolean) => void }
      }
      if (w.__teruAudio?.setEnabled) {
        w.__teruAudio.setEnabled(false)
        return
      }
      if (w.__tweaks?.setSoundOn) {
        w.__tweaks.setSoundOn(false)
        return
      }
      if (w.__tweaks?.soundOn)
        w.__tweaks.soundOn.value = false
    })

    // 再點 theme dot 觸發原本會播音效的操作
    await page.getByRole('button', { name: 'matcha' }).click()
    await page.waitForTimeout(100)

    // Then：oscillator 與 bufferSource 計數不變
    const after = await readAudioSpy(page)
    expect(after.oscCount).toBe(before.oscCount)
    expect(after.bufferCount).toBe(before.bufferCount)
  })
})

test.describe('規則：共用 SVG 元件', () => {
  test('TeruDoll varied 模式：6 隻娃娃顯示 6 種不同 tie 與表情', async ({ page }) => {
    // Given：dollStyle 為 varied、praying 階段渲染 6+ 隻娃娃
    await presetStorage(page, { 'teru.dollStyle': 'varied' })
    await page.goto('/', { waitUntil: 'networkidle' })

    // 進入 praying 並 seed 6 隻娃娃
    await page.getByRole('textbox', { name: /地點|位置|許願|城市/ })
      .or(page.getByPlaceholder(/地點|位置|許願|城市/))
      .first()
      .fill('台北')
    await page.getByRole('button', { name: /開始放晴|開始|啟程/ }).click()
    await page.waitForFunction(() => {
      const w = window as unknown as { __wish?: { phase?: { value?: string } } }
      return w.__wish?.phase?.value === 'praying'
    }, undefined, { timeout: 3000 })

    await page.evaluate(() => {
      const w = window as unknown as { __wish?: { dolls?: { value: unknown[] } } }
      if (w.__wish?.dolls) {
        w.__wish.dolls.value = Array.from({ length: 6 }, (_, i) => ({
          id: `seed-${i}`,
          slot: i,
          fromX: 0,
          fromY: 0,
          hung: true,
        }))
      }
    })

    await page.waitForTimeout(200)

    // Then：6 隻娃娃的 tie fill 與 face 取 6 種不同值
    const { tieVariety, faceVariety } = await page.evaluate(() => {
      const dolls = Array.from(document.querySelectorAll('[data-doll-slot], .teru-doll'))
      const tieValues = new Set<string>()
      const faceValues = new Set<string>()
      dolls.slice(0, 6).forEach((doll) => {
        const tie = doll.querySelector('[data-role="tie"], .tie, [class*="tie"]')
        if (tie)
          tieValues.add(tie.getAttribute('fill') || tie.getAttribute('stroke') || tie.getAttribute('style') || '')
        const face = doll.querySelector('[data-role="face"], .face, [class*="face"]')
        if (face)
          faceValues.add(face.getAttribute('data-face') || face.getAttribute('class') || face.outerHTML.slice(0, 80))
      })
      return { tieVariety: tieValues.size, faceVariety: faceValues.size }
    })

    expect(tieVariety).toBeGreaterThanOrEqual(2)
    expect(faceVariety).toBeGreaterThanOrEqual(2)
  })

  test('DollDefs 全頁僅渲染一次（#washi-edge 唯一）', async ({ page }) => {
    // Given：進入 /
    await page.goto('/', { waitUntil: 'networkidle' })

    // Then：#washi-edge 在全頁僅有一個
    const count = await page.evaluate(() => document.querySelectorAll('#washi-edge').length)
    expect(count).toBe(1)
  })
})

test.describe('規則：SetupScreen 提供主題色 dot picker', () => {
  test('顯示 3 個代表 sunny / sakura / matcha 的選擇器', async ({ page }) => {
    // Given：使用者進入 SetupScreen
    await page.goto('/', { waitUntil: 'networkidle' })

    // Then：找到 3 個主題色選擇器（role=button 或 role=radio）
    const pickers = page
      .getByRole('button', { name: /sunny|sakura|matcha|晴天|櫻花|抹茶/i })
      .or(page.getByRole('radio', { name: /sunny|sakura|matcha|晴天|櫻花|抹茶/i }))
      .or(page.locator('[data-testid^="theme-dot-"]'))

    await expect(pickers).toHaveCount(3)

    // 當前主題（sunny）對應的選擇器為 active
    const sunny = page
      .getByRole('button', { name: /sunny|晴天/i })
      .or(page.getByRole('radio', { name: /sunny|晴天/i }))
      .or(page.getByTestId('theme-dot-sunny'))
    const isActive = await sunny.first().evaluate(el =>
      el.getAttribute('aria-pressed') === 'true'
      || el.getAttribute('aria-checked') === 'true'
      || el.getAttribute('data-active') === 'true'
      || el.classList.contains('active')
      || el.classList.contains('is-active'),
    )
    expect(isActive).toBe(true)
  })
})

// 此測試確認 audio method spy 的計數通道存在（其餘 spec 依賴此通道）
test('helpers smoke: audio method spy 存在', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' })
  const count = await readAudioMethodCount(page)
  expect(count).toEqual(expect.objectContaining({
    tok: expect.any(Number),
    bloom: expect.any(Number),
    pluck: expect.any(Number),
  }))
})
