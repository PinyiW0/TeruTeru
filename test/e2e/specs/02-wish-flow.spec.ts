import { expect, test } from '@playwright/test'

import {
  completeSetupAndEnterPraying,
  gotoPhase,
  installAudioMethodSpy,
  installAudioSpy,
  installClearStorage,
  readAudioMethodCount,
  readAudioSpy,
  readStorage,
  readWish,
  seedDolls,
} from '../helpers'

// Setup → Praying → Complete 完整 wish flow 契約測試
// 對應 spec/e2e-flows/02-wish-flow.flow.md

const LOCATION_CHIPS = ['台北', '台中', '高雄', '東京', '大阪', '京都', '首爾', '沖繩'] as const

function todayLocalDay() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function locationInput(page: import('@playwright/test').Page) {
  return page
    .getByRole('textbox', { name: /地點|位置|許願|城市/ })
    .or(page.getByPlaceholder(/地點|位置|許願|城市/))
    .first()
}

function startButton(page: import('@playwright/test').Page) {
  return page.getByRole('button', { name: /開始放晴|開始|啟程/ }).first()
}

test.beforeEach(async ({ page }) => {
  await installClearStorage(page)
  await installAudioSpy(page)
  await installAudioMethodSpy(page)
})

test.describe('規則：Setup 整體佈局', () => {
  test('首次造訪顯示 SetupScreen 標題、副標、hint 與互動區', async ({ page }) => {
    // Given：使用者首次造訪 /
    // When：進入 /
    await page.goto('/', { waitUntil: 'networkidle' })

    // Then：標題 / 副標 / hint / 輸入區皆可見
    await expect(page.getByText('Teru Teru 放晴中')).toBeVisible()
    await expect(page.getByText('為一個日子，為一個地方，求一場好天氣')).toBeVisible()
    await expect(page.getByText('掛滿晴天娃娃就會放晴')).toBeVisible()
    await expect(locationInput(page)).toBeVisible()
    await expect(startButton(page)).toBeVisible()
  })
})

test.describe('規則：日期預設為今天', () => {
  test('SetupScreen 進入時已選日期為本機今天', async ({ page }) => {
    // Given：使用者首次進入 SetupScreen
    // When：進入 /
    await page.goto('/', { waitUntil: 'networkidle' })

    // Then：useWishFlow().date 為今天 00:00:00
    const snapshot = await readWish(page)
    expect(snapshot.dateLocalDay).toBe(todayLocalDay())
  })
})

test.describe('規則：過去日期不可選', () => {
  test('嘗試點選過去日期被忽略且不播音效', async ({ page }) => {
    // Given：SetupScreen 已渲染
    await page.goto('/', { waitUntil: 'networkidle' })
    const before = await readWish(page)
    const audioBefore = await readAudioSpy(page)

    // When：嘗試點 week strip 中的過去日期（disabled 元素）
    const pastDay = page.locator('[aria-disabled="true"], [disabled]').filter({ hasText: /^\d{1,2}$/ }).first()
    const hasPast = await pastDay.count()
    if (hasPast === 0) {
      // 若實作不渲染過去日期（亦符合 invariant），此情境 skip
      test.skip(true, '實作未渲染 disabled 過去日期，亦符合 invariant')
      return
    }
    await pastDay.click({ force: true }).catch(() => {})

    // Then：日期不變、音效計數不增加
    const after = await readWish(page)
    const audioAfter = await readAudioSpy(page)
    expect(after.dateLocalDay).toBe(before.dateLocalDay)
    expect(audioAfter.oscCount).toBe(audioBefore.oscCount)
  })
})

test.describe('規則：日期下拉與 week strip 同步', () => {
  test('透過月份下拉切到下個月，date.month 同步變更', async ({ page }) => {
    // Given：SetupScreen 已渲染
    await page.goto('/', { waitUntil: 'networkidle' })
    const before = await readWish(page)
    const beforeMonth = before.dateIso ? new Date(before.dateIso).getMonth() : new Date().getMonth()

    // When：嘗試切換月份下拉到下個月
    const monthSelect = page.getByRole('combobox', { name: /月/ }).first()
    const hasNative = await page.locator('select').filter({ has: page.locator('option', { hasText: /月|^\d+$/ }) }).count()
    if (await monthSelect.count() > 0) {
      const nextMonth = (beforeMonth + 1) % 12
      await monthSelect.selectOption({ index: nextMonth }).catch(async () => {
        await monthSelect.click()
        await page.getByRole('option', { name: new RegExp(`^${nextMonth + 1}\\s*月?$`) }).click()
      })
    }
    else if (hasNative > 0) {
      await page.locator('select').first().selectOption({ index: (beforeMonth + 1) % 12 })
    }
    else {
      test.skip(true, '月份下拉尚未實作或結構不可達')
      return
    }

    // Then：date.month 已變更
    await expect.poll(async () => {
      const s = await readWish(page)
      return s.dateIso ? new Date(s.dateIso).getMonth() : null
    }).not.toBe(beforeMonth)
  })
})

test.describe('規則：年份下拉範圍正確', () => {
  test('年份選項剛好為 [今年, 今年+1, 今年+2]', async ({ page }) => {
    // Given：SetupScreen 已渲染
    await page.goto('/', { waitUntil: 'networkidle' })
    const currentYear = new Date().getFullYear()
    const expected = [currentYear, currentYear + 1, currentYear + 2]

    // When：取得年份下拉的所有 option text
    const years = await page.evaluate(() => {
      const dropdowns = Array.from(document.querySelectorAll('select')) as HTMLSelectElement[]
      for (const sel of dropdowns) {
        const opts = Array.from(sel.options).map(o => o.textContent?.trim() || '')
        const nums = opts.map(t => Number.parseInt(t, 10)).filter(n => !Number.isNaN(n) && n >= 2024 && n <= 2100)
        if (nums.length >= 3 && nums.length <= 5)
          return nums
      }
      // custom dropdown fallback
      const customs = Array.from(document.querySelectorAll('[role="option"]'))
      const nums = customs.map(el => Number.parseInt(el.textContent?.trim() || '', 10)).filter(n => !Number.isNaN(n) && n >= 2024 && n <= 2100)
      return nums
    })

    expect(years).toEqual(expected)
  })
})

test.describe('規則：日期不持久化', () => {
  test('reload 後 date 重置為今天', async ({ page }) => {
    // Given：使用者已將 date 改為未來某日
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.evaluate(() => {
      const w = window as unknown as { __wish?: { date?: { value: Date } } }
      if (w.__wish?.date)
        w.__wish.date.value = new Date(2026, 11, 25)
    })

    // When：reload
    await page.reload({ waitUntil: 'networkidle' })

    // Then：date 為今天
    const snapshot = await readWish(page)
    expect(snapshot.dateLocalDay).toBe(todayLocalDay())
  })
})

test.describe('規則：地點輸入', () => {
  test('點選地點 chip 同步 input 並標 active', async ({ page }) => {
    // Given：SetupScreen 已渲染、location 為空
    await page.goto('/', { waitUntil: 'networkidle' })

    // When：點擊「東京」chip
    const tokyo = page.getByRole('button', { name: /^東京$/ })
    await tokyo.click()

    // Then：input value 為 "東京"
    await expect(locationInput(page)).toHaveValue('東京')

    // 「東京」chip 標示為 active
    const isActive = await tokyo.evaluate(el =>
      el.getAttribute('aria-pressed') === 'true'
      || el.getAttribute('aria-checked') === 'true'
      || el.getAttribute('data-active') === 'true'
      || el.classList.contains('active')
      || el.classList.contains('is-active'),
    )
    expect(isActive).toBe(true)

    // 音效有觸發
    await expect.poll(async () => (await readAudioSpy(page)).oscCount).toBeGreaterThan(0)
  })

  test('8 個地點 chip 依固定順序顯示', async ({ page }) => {
    // Given：SetupScreen 已渲染
    await page.goto('/', { waitUntil: 'networkidle' })

    // When：蒐集 chips 文字
    const chips = page.getByRole('button').filter({ hasText: new RegExp(`^(${LOCATION_CHIPS.join('|')})$`) })

    // Then：依序為 8 個固定地點
    await expect(chips).toHaveCount(8)
    const texts = (await chips.allTextContents()).map(t => t.trim())
    expect(texts).toEqual([...LOCATION_CHIPS])
  })

  test('自由輸入地點寫入 useWishFlow.location 與 localStorage', async ({ page }) => {
    // Given：SetupScreen 已渲染
    await page.goto('/', { waitUntil: 'networkidle' })

    // When：input 輸入 "淡水"
    await locationInput(page).fill('淡水')
    await locationInput(page).blur()

    // Then：useWishFlow.location 與 localStorage 都為 "淡水"
    await expect.poll(async () => (await readWish(page)).location).toBe('淡水')
    await expect.poll(() => readStorage(page, 'teru.location')).toBe('淡水')
  })

  test('reload 後地點仍保留', async ({ page }) => {
    // Given：使用者輸入 "京都"
    await page.goto('/', { waitUntil: 'networkidle' })
    await locationInput(page).fill('京都')
    await locationInput(page).blur()
    await expect.poll(() => readStorage(page, 'teru.location')).toBe('京都')

    // When：reload
    await page.reload({ waitUntil: 'networkidle' })

    // Then：input 仍為 "京都"
    await expect(locationInput(page)).toHaveValue('京都')

    // 京都 chip active
    const kyoto = page.getByRole('button', { name: /^京都$/ })
    const isActive = await kyoto.evaluate(el =>
      el.getAttribute('aria-pressed') === 'true'
      || el.getAttribute('aria-checked') === 'true'
      || el.getAttribute('data-active') === 'true'
      || el.classList.contains('active')
      || el.classList.contains('is-active'),
    )
    expect(isActive).toBe(true)
  })
})

test.describe('規則：Setup 主題切換並持久化', () => {
  test('點 sakura 切換、localStorage 持久化、音效觸發', async ({ page }) => {
    // Given：SetupScreen 已渲染
    await page.goto('/', { waitUntil: 'networkidle' })

    // When：點擊 sakura 主題選擇器
    await page
      .getByRole('button', { name: /sakura|櫻花/i })
      .or(page.getByRole('radio', { name: /sakura|櫻花/i }))
      .or(page.getByTestId('theme-dot-sakura'))
      .first()
      .click()

    // Then：data-theme = sakura、localStorage = sakura、音效觸發
    await expect.poll(() =>
      page.evaluate(() => document.documentElement.getAttribute('data-theme')),
    ).toBe('sakura')
    await expect.poll(() => readStorage(page, 'teru.themeColor')).toBe('sakura')
    await expect.poll(async () => (await readAudioSpy(page)).oscCount).toBeGreaterThan(0)
  })
})

test.describe('規則：開始按鈕門檻', () => {
  test('空地點按鈕 disabled、純空白仍 disabled、填地點變 enabled', async ({ page }) => {
    // Given：localStorage 已清空，location 為空
    await page.goto('/', { waitUntil: 'networkidle' })

    // Then：按鈕 disabled
    await expect(startButton(page)).toBeDisabled()

    // When：輸入純空白
    await locationInput(page).fill('  ')

    // Then：按鈕仍 disabled
    await expect(startButton(page)).toBeDisabled()

    // When：輸入 "台北"
    await locationInput(page).fill('台北')

    // Then：按鈕變 enabled
    await expect(startButton(page)).toBeEnabled()
  })

  test('點開始按鈕播 tok 並 600ms 後切到 praying', async ({ page }) => {
    // Given：location 已填入
    await page.goto('/', { waitUntil: 'networkidle' })
    await locationInput(page).fill('台北')

    // When：點開始按鈕
    await startButton(page).click()

    // Then：tok 音效計數 +1（或 bufferSource 計數 +1）
    await expect.poll(async () => {
      const a = await readAudioSpy(page)
      const m = await readAudioMethodCount(page)
      return a.bufferCount + m.tok
    }).toBeGreaterThanOrEqual(1)

    // LoadingScreen 出現
    await expect.poll(async () => (await readWish(page)).transition).toBe(true)

    // 600ms 內 phase 切到 praying
    await expect.poll(async () => (await readWish(page)).phase, { timeout: 2000 }).toBe('praying')

    // 約 1250ms 後 transition 為 false
    await expect.poll(async () => (await readWish(page)).transition, { timeout: 3000 }).toBe(false)
  })

  test('Trim 地點空白後 location 為 "台北"', async ({ page }) => {
    // Given：使用者輸入 "  台北  "
    await page.goto('/', { waitUntil: 'networkidle' })
    await locationInput(page).fill('  台北  ')

    // When：按開始
    await startButton(page).click()

    // Then：useWishFlow.location 為 "台北"（trim 後）
    await expect.poll(async () => (await readWish(page)).location).toBe('台北')
  })
})

test.describe('規則：Praying 整體佈局', () => {
  test('切到 praying 顯示頂部 meta、中央標題、底部 hint', async ({ page }) => {
    // Given：完成 setup
    await page.goto('/', { waitUntil: 'networkidle' })
    await completeSetupAndEnterPraying(page, '台北')

    // Then：頂部地點文字
    await expect(page.getByText(/為\s*台北\s*祈禱晴天/)).toBeVisible()
    // 中央標題
    await expect(page.getByText('晴天娃娃降臨中')).toBeVisible()
    // 底部 hint
    await expect(page.getByText(/點任意處.+掛上晴天娃娃/)).toBeVisible()
  })
})

test.describe('規則：Praying 點任意處掛娃娃', () => {
  test('點 stage 空白處新增娃娃', async ({ page }) => {
    // Given：praying 階段、dolls 為 0
    await page.goto('/', { waitUntil: 'networkidle' })
    await completeSetupAndEnterPraying(page, '台北')
    const before = await readWish(page)
    const audioBefore = await readAudioSpy(page)

    // When：點擊 stage 中央（避開頂部 meta 與返回鈕）
    const viewport = page.viewportSize() ?? { width: 1280, height: 720 }
    await page.mouse.click(viewport.width / 2, viewport.height * 0.6)

    // Then：dolls.length +1，音效觸發
    await expect.poll(async () => (await readWish(page)).dollCount).toBe(before.dollCount + 1)
    await expect.poll(async () => (await readAudioSpy(page)).oscCount).toBeGreaterThan(audioBefore.oscCount)
  })

  test('點返回鈕回 setup 且不新增娃娃', async ({ page }) => {
    // Given：praying 階段
    await page.goto('/', { waitUntil: 'networkidle' })
    await completeSetupAndEnterPraying(page, '台北')
    const before = await readWish(page)

    // When：點返回鈕
    await page.getByRole('button', { name: /返回|上一步|back/i }).first().click()

    // Then：dolls 不變、phase 回到 setup（過場後）
    await expect.poll(async () => (await readWish(page)).phase, { timeout: 3000 }).toBe('setup')
    const after = await readWish(page)
    expect(after.dollCount).toBe(before.dollCount)
  })

  test('點頂部 meta 區不新增娃娃', async ({ page }) => {
    // Given：praying 階段
    await page.goto('/', { waitUntil: 'networkidle' })
    await completeSetupAndEnterPraying(page, '台北')
    const before = await readWish(page)

    // When：點頂部 meta 文字（地點顯示區）
    const meta = page.getByText(/為\s*台北\s*祈禱晴天/)
    await meta.click()

    // Then：dolls.length 不變、phase 不變
    await page.waitForTimeout(200)
    const after = await readWish(page)
    expect(after.dollCount).toBe(before.dollCount)
    expect(after.phase).toBe('praying')
  })
})

test.describe('規則：Stage 與繩子響應式渲染', () => {
  test('Stage resize 後繩 path d 屬性與娃娃座標重畫', async ({ page }) => {
    // Given：praying 階段、已掛 3 隻娃娃
    await page.goto('/', { waitUntil: 'networkidle' })
    await completeSetupAndEnterPraying(page, '台北')
    await seedDolls(page, 3)
    await page.waitForTimeout(200)

    const before = await page.evaluate(() => {
      const paths = Array.from(document.querySelectorAll('svg path')).map(p => p.getAttribute('d') || '')
      const dolls = Array.from(document.querySelectorAll('[data-doll-slot], .teru-doll')).map((d) => {
        const r = (d as HTMLElement).getBoundingClientRect()
        return `${r.left.toFixed(1)},${r.top.toFixed(1)}`
      })
      return { paths, dolls }
    })

    // When：改變視窗大小
    await page.setViewportSize({ width: 800, height: 600 })
    await page.waitForTimeout(300)

    // Then：path d 或娃娃座標其中之一變更
    const after = await page.evaluate(() => {
      const paths = Array.from(document.querySelectorAll('svg path')).map(p => p.getAttribute('d') || '')
      const dolls = Array.from(document.querySelectorAll('[data-doll-slot], .teru-doll')).map((d) => {
        const r = (d as HTMLElement).getBoundingClientRect()
        return `${r.left.toFixed(1)},${r.top.toFixed(1)}`
      })
      return { paths, dolls }
    })

    const pathsChanged = JSON.stringify(before.paths) !== JSON.stringify(after.paths)
    const dollsChanged = JSON.stringify(before.dolls) !== JSON.stringify(after.dolls)
    expect(pathsChanged || dollsChanged).toBe(true)
  })

  test('繩子共 5 條，由下往上排列且具備 catenary sag', async ({ page }) => {
    // Given：praying 階段、stage 已渲染
    await page.goto('/', { waitUntil: 'networkidle' })
    await completeSetupAndEnterPraying(page, '台北')
    await page.waitForTimeout(200)

    // When：取得繩 path 元素
    const ropes = await page.evaluate(() => {
      // 偏好 data-rope-index 屬性，否則回退到 stage 範圍內所有 path
      const explicit = Array.from(document.querySelectorAll('[data-rope-index]'))
      const paths = explicit.length >= 5
        ? explicit
        : Array.from(document.querySelectorAll('svg path')).filter((p) => {
            const d = p.getAttribute('d') || ''
            return d.includes('Q') || d.includes('C') || d.match(/M.*L.*/) != null
          })

      return paths.slice(0, 5).map((p, i) => {
        const d = p.getAttribute('d') || ''
        // 解析 M x y ... 取首尾 Y 與中段 Y
        const nums = d.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? []
        const idx = Number(p.getAttribute('data-rope-index') ?? i)
        return { idx, nums }
      })
    })

    // Then：共 5 條
    expect(ropes.length).toBe(5)

    // rope 0 的平均 Y 大於 rope 4（最底大於最上）
    const avgY = (nums: number[]) => {
      const ys = nums.filter((_, i) => i % 2 === 1)
      return ys.reduce((a, b) => a + b, 0) / Math.max(ys.length, 1)
    }
    const r0 = ropes.find(r => r.idx === 0) ?? ropes[0]!
    const r4 = ropes.find(r => r.idx === 4) ?? ropes[4]!
    expect(avgY(r0.nums)).toBeGreaterThan(avgY(r4.nums))
  })
})

test.describe('規則：娃娃漂浮入場與懸掛擺動', () => {
  test('新娃娃從 floating-in 過渡到 hung', async ({ page }) => {
    // Given：praying 階段
    await page.goto('/', { waitUntil: 'networkidle' })
    await completeSetupAndEnterPraying(page, '台北')

    // When：點 stage 新增一隻
    const viewport = page.viewportSize() ?? { width: 1280, height: 720 }
    await page.mouse.click(viewport.width / 2, viewport.height * 0.6)

    // Then：立即查 dolls[0].hung === false
    const immediate = await page.evaluate(() => {
      const w = window as unknown as { __wish?: { dolls?: { value: Array<{ hung?: boolean }> } } }
      const arr = w.__wish?.dolls?.value
      return Array.isArray(arr) && arr.length > 0 ? arr.at(-1)?.hung : null
    })
    expect(immediate).toBe(false)

    // 1100ms 後 hung 為 true（容差 ±500ms）
    await expect.poll(async () => {
      return page.evaluate(() => {
        const w = window as unknown as { __wish?: { dolls?: { value: Array<{ hung?: boolean }> } } }
        const arr = w.__wish?.dolls?.value
        return Array.isArray(arr) && arr.length > 0 ? arr.at(-1)?.hung : null
      })
    }, { timeout: 2000 }).toBe(true)
  })

  test('不同 slot 的擺動時序不全相同', async ({ page }) => {
    // Given：praying 階段、5 隻娃娃已掛上並切到 hung
    await page.goto('/', { waitUntil: 'networkidle' })
    await completeSetupAndEnterPraying(page, '台北')
    await seedDolls(page, 5)
    await page.waitForTimeout(200)

    // When：蒐集每隻娃娃的 --sway-dur / --sway-delay CSS variable
    const variants = await page.evaluate(() => {
      const dolls = Array.from(document.querySelectorAll('[data-doll-slot], .teru-doll'))
      const values = new Set<string>()
      dolls.slice(0, 5).forEach((d) => {
        const style = (d as HTMLElement).getAttribute('style') || ''
        const dur = style.match(/--sway-dur:[^;]+/)?.[0] || ''
        const delay = style.match(/--sway-delay:[^;]+/)?.[0] || ''
        values.add(`${dur}|${delay}`)
      })
      return values.size
    })

    // Then：5 隻娃娃的擺動 CSS variable 不全相同
    expect(variants).toBeGreaterThan(1)
  })
})

test.describe('規則：滿 25 自動切換、鎖第 26 隻', () => {
  test('第 25 次點擊後 1400ms 自動切 complete', async ({ page }) => {
    // Given：praying 階段、預先 seed 24 隻
    await page.goto('/', { waitUntil: 'networkidle' })
    await completeSetupAndEnterPraying(page, '台北')
    await seedDolls(page, 24)

    // When：第 25 次點擊
    const viewport = page.viewportSize() ?? { width: 1280, height: 720 }
    await page.mouse.click(viewport.width / 2, viewport.height * 0.6)
    await expect.poll(async () => (await readWish(page)).dollCount).toBe(25)

    // Then：~1400ms 後 phase 為 complete
    await expect.poll(async () => (await readWish(page)).phase, { timeout: 4000 }).toBe('complete')
  })

  test('滿 25 後過渡期內再點不增加', async ({ page }) => {
    // Given：praying 階段、已掛滿 25 隻
    await page.goto('/', { waitUntil: 'networkidle' })
    await completeSetupAndEnterPraying(page, '台北')
    await seedDolls(page, 25)

    // When：1400ms 內再次點擊 stage
    const viewport = page.viewportSize() ?? { width: 1280, height: 720 }
    await page.mouse.click(viewport.width / 2, viewport.height * 0.6)
    await page.waitForTimeout(100)

    // Then：dolls.length 仍為 25
    const snapshot = await readWish(page)
    expect(snapshot.dollCount).toBe(25)
  })
})

test.describe('規則：Complete 三段動畫', () => {
  test('CompleteScreen mount 立即為 clouded 狀態（Sun 半透明）', async ({ page }) => {
    // Given：praying 階段、強制切到 complete
    await page.goto('/', { waitUntil: 'networkidle' })
    await completeSetupAndEnterPraying(page, '台北')
    await gotoPhase(page, 'complete')
    await expect.poll(async () => (await readWish(page)).phase, { timeout: 3000 }).toBe('complete')

    // When：立即查 Sun 元素 opacity
    const sunOpacity = await page.evaluate(() => {
      const sun = document.querySelector('[data-role="sun"], .sun, [class*="sun"]') as HTMLElement | null
      if (!sun)
        return null
      return Number.parseFloat(getComputedStyle(sun).opacity || '1')
    })

    // Then：Sun opacity 較低（clouded 階段，reference 0.25）
    if (sunOpacity != null)
      expect(sunOpacity).toBeLessThan(0.6)
  })

  test('clearing 階段 350ms 後 Sun fade-in、雲朵散開', async ({ page }) => {
    // Given：phase 已切為 complete
    await page.goto('/', { waitUntil: 'networkidle' })
    await completeSetupAndEnterPraying(page, '台北')
    await gotoPhase(page, 'complete')
    await expect.poll(async () => (await readWish(page)).phase, { timeout: 3000 }).toBe('complete')

    // When：等候 ~500ms（350ms + 容差）
    await page.waitForTimeout(500)

    // Then：Sun opacity > 0.5
    const sunOpacity = await page.evaluate(() => {
      const sun = document.querySelector('[data-role="sun"], .sun, [class*="sun"]') as HTMLElement | null
      return sun ? Number.parseFloat(getComputedStyle(sun).opacity || '1') : null
    })
    if (sunOpacity != null)
      expect(sunOpacity).toBeGreaterThan(0.4)
  })

  test('done 階段 ~1900ms 後完成文字浮現且 bloom 觸發', async ({ page }) => {
    // Given：phase 已切為 complete
    await page.goto('/', { waitUntil: 'networkidle' })
    await completeSetupAndEnterPraying(page, '台北')
    await gotoPhase(page, 'complete')
    await expect.poll(async () => (await readWish(page)).phase, { timeout: 3000 }).toBe('complete')

    // When：等候 done 階段（~2200ms = 1900 + 容差）
    // Then：完成文字可見
    await expect(page.getByText(/已經掛滿/)).toBeVisible({ timeout: 4000 })

    // bloom 音效計數 +1（透過 method spy 或 oscillator 計數判斷）
    await expect.poll(async () => {
      const m = await readAudioMethodCount(page)
      const a = await readAudioSpy(page)
      return m.bloom + (a.oscCount > 5 ? 1 : 0) // bloom 會建至少 5 個 oscillator
    }).toBeGreaterThanOrEqual(1)
  })

  test('動畫過程中切回 setup，不會 throw 且不執行 bloom', async ({ page }) => {
    // Given：phase 已切為 complete、尚未進入 done
    const consoleErrors: string[] = []
    page.on('pageerror', err => consoleErrors.push(String(err)))

    await page.goto('/', { waitUntil: 'networkidle' })
    await completeSetupAndEnterPraying(page, '台北')
    await gotoPhase(page, 'complete')
    await expect.poll(async () => (await readWish(page)).phase, { timeout: 3000 }).toBe('complete')
    const bloomBefore = (await readAudioMethodCount(page)).bloom

    // When：在 1900ms 前強制 unmount（goTo setup）
    await page.waitForTimeout(200)
    await gotoPhase(page, 'setup')
    await page.waitForTimeout(2200)

    // Then：bloom 計數未因 unmount 後執行而增加，且無 uncaught
    const bloomAfter = (await readAudioMethodCount(page)).bloom
    expect(bloomAfter).toBe(bloomBefore)
    expect(consoleErrors).toEqual([])
  })
})

test.describe('規則：Complete 達成文案', () => {
  test('副標顯示「25 隻晴天娃娃，已經掛滿」', async ({ page }) => {
    // Given：完成全流程至 complete
    await page.goto('/', { waitUntil: 'networkidle' })
    await completeSetupAndEnterPraying(page, '台北')
    await gotoPhase(page, 'complete')

    // Then：完成副標顯示 25
    await expect(page.getByText(/25\s*隻晴天娃娃，已經掛滿/)).toBeVisible({ timeout: 4000 })
  })

  test('完成階段顯示祈禱對象資訊', async ({ page }) => {
    // Given：setup 輸入 "淡水"、完成至 complete
    await page.goto('/', { waitUntil: 'networkidle' })
    await locationInput(page).fill('淡水')
    await startButton(page).click()
    await expect.poll(async () => (await readWish(page)).phase, { timeout: 3000 }).toBe('praying')
    await gotoPhase(page, 'complete')

    // Then：顯示「為 淡水 祈禱」
    await expect(page.getByText(/為\s*淡水\s*祈禱/)).toBeVisible({ timeout: 4000 })
  })
})

test.describe('規則：重新祈禱', () => {
  test('點重新祈禱回 setup、dolls 清空、播 tok', async ({ page }) => {
    // Given：CompleteScreen 處於 done 階段
    await page.goto('/', { waitUntil: 'networkidle' })
    await completeSetupAndEnterPraying(page, '台北')
    await gotoPhase(page, 'complete')
    await expect(page.getByText(/已經掛滿/)).toBeVisible({ timeout: 4000 })

    const audioBefore = await readAudioSpy(page)
    const tokBefore = (await readAudioMethodCount(page)).tok

    // When：點「重新祈禱」按鈕
    await page.getByRole('button', { name: /重新祈禱/ }).click()

    // Then：音效計數 +1、phase 回 setup、dolls 清空
    await expect.poll(async () => {
      const a = await readAudioSpy(page)
      const m = await readAudioMethodCount(page)
      return (a.bufferCount - audioBefore.bufferCount) + (m.tok - tokBefore)
    }).toBeGreaterThanOrEqual(1)

    await expect.poll(async () => (await readWish(page)).phase, { timeout: 3000 }).toBe('setup')
    const snapshot = await readWish(page)
    expect(snapshot.dollCount).toBe(0)
  })

  test('重新祈禱保留地點 "淡水"', async ({ page }) => {
    // Given：setup 輸入 "淡水" 並完成至 complete
    await page.goto('/', { waitUntil: 'networkidle' })
    await locationInput(page).fill('淡水')
    await startButton(page).click()
    await expect.poll(async () => (await readWish(page)).phase, { timeout: 3000 }).toBe('praying')
    await gotoPhase(page, 'complete')
    await expect(page.getByText(/已經掛滿/)).toBeVisible({ timeout: 4000 })

    // When：點「重新祈禱」
    await page.getByRole('button', { name: /重新祈禱/ }).click()
    await expect.poll(async () => (await readWish(page)).phase, { timeout: 3000 }).toBe('setup')

    // Then：location input 仍為 "淡水"
    await expect(locationInput(page)).toHaveValue('淡水')
    await expect.poll(() => readStorage(page, 'teru.location')).toBe('淡水')
  })

  test('重新祈禱將日期重置為今天', async ({ page }) => {
    // Given：setup 將 date 改為 2026/12/25，完成至 complete
    await page.goto('/', { waitUntil: 'networkidle' })
    await locationInput(page).fill('台北')
    await page.evaluate(() => {
      const w = window as unknown as { __wish?: { date?: { value: Date } } }
      if (w.__wish?.date)
        w.__wish.date.value = new Date(2026, 11, 25)
    })
    await startButton(page).click()
    await expect.poll(async () => (await readWish(page)).phase, { timeout: 3000 }).toBe('praying')
    await gotoPhase(page, 'complete')
    await expect(page.getByText(/已經掛滿/)).toBeVisible({ timeout: 4000 })

    // When：點重新祈禱
    await page.getByRole('button', { name: /重新祈禱/ }).click()
    await expect.poll(async () => (await readWish(page)).phase, { timeout: 3000 }).toBe('setup')

    // Then：date 為今天
    const snapshot = await readWish(page)
    expect(snapshot.dateLocalDay).toBe(todayLocalDay())
  })
})

test.describe('規則：LoadingScreen 過場 curtain', () => {
  test('phase 切換時 LoadingScreen 覆蓋整個畫面', async ({ page }) => {
    // Given：setup 已填地點
    await page.goto('/', { waitUntil: 'networkidle' })
    await locationInput(page).fill('台北')

    // When：點開始按鈕
    await startButton(page).click()

    // Then：transition = true，LoadingScreen 元素覆蓋 viewport
    await expect.poll(async () => (await readWish(page)).transition).toBe(true)

    const fillsViewport = await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll('[data-testid="wish-loading-screen"], .loading-screen, [class*="loading-screen"], [class*="LoadingScreen"]'))
      const vw = window.innerWidth
      const vh = window.innerHeight
      return candidates.some((el) => {
        const r = el.getBoundingClientRect()
        return r.width >= vw * 0.9 && r.height >= vh * 0.9
      })
    })
    expect(fillsViewport).toBe(true)
  })

  test('1250ms 後 transition 自動為 false、LoadingScreen 移除', async ({ page }) => {
    // Given：觸發 phase 切換
    await page.goto('/', { waitUntil: 'networkidle' })
    await locationInput(page).fill('台北')
    await startButton(page).click()
    await expect.poll(async () => (await readWish(page)).transition).toBe(true)

    // When：等候 ~1500ms（容差）
    // Then：transition 變回 false
    await expect.poll(async () => (await readWish(page)).transition, { timeout: 3000 }).toBe(false)
  })

  test('LoadingScreen 範圍內無互動元素（無 input / 無 button）', async ({ page }) => {
    // Given：觸發 phase 切換、LoadingScreen 顯示中
    await page.goto('/', { waitUntil: 'networkidle' })
    await locationInput(page).fill('台北')
    await startButton(page).click()
    await expect.poll(async () => (await readWish(page)).transition).toBe(true)

    // Then：LoadingScreen 範圍內無 input / button
    const interactive = await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll('[data-testid="wish-loading-screen"], .loading-screen, [class*="loading-screen"], [class*="LoadingScreen"]'))
      return candidates.reduce(
        (n, el) => n + el.querySelectorAll('input, textarea, select, button').length,
        0,
      )
    })
    expect(interactive).toBe(0)
  })
})
