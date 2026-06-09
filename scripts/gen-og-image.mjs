import { dirname, resolve } from 'node:path'
// 用 Playwright 把 scripts/og-image.html 截成 1200×630 的 public/og-image.png
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const __dirname = dirname(fileURLToPath(import.meta.url))
const htmlPath = resolve(__dirname, 'og-image.html')
const outPath = resolve(__dirname, '../public/og-image.png')

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await page.goto(`file://${htmlPath}`)
await page.waitForLoadState('networkidle')
await page.waitForTimeout(600) // 等字體載入
await page.screenshot({ path: outPath })
await browser.close()
console.log(`✅ OG 圖已產生：${outPath}`)
