import { dirname, resolve } from 'node:path'
// 用 Playwright 把 scripts/icon.html 截成多種尺寸的 PWA / apple-touch icon
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const __dirname = dirname(fileURLToPath(import.meta.url))
const htmlPath = resolve(__dirname, 'icon.html')

// icon.html 內容以 vmin 為單位,可隨 viewport 等比縮放,故一次截出多種尺寸
const targets = [
  { size: 512, file: 'icon-512.png' },
  { size: 192, file: 'icon-192.png' },
  { size: 180, file: 'apple-touch-icon.png' },
]

const browser = await chromium.launch()
for (const { size, file } of targets) {
  const page = await browser.newPage({ viewport: { width: size, height: size } })
  await page.goto(`file://${htmlPath}`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(300)
  const outPath = resolve(__dirname, '../public', file)
  await page.screenshot({ path: outPath })
  await page.close()
  console.log(`✅ ${file} (${size}×${size})`)
}
await browser.close()
