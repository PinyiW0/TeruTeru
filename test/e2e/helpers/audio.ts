import type { Page } from '@playwright/test'

// 注入 AudioContext spy：必須在 page.goto 前呼叫
// 暴露 window.__audioSpy = { ctxCount, oscCount, bufferCount }
export async function installAudioSpy(page: Page) {
  await page.addInitScript(() => {
    const spy = { ctxCount: 0, oscCount: 0, bufferCount: 0 }
    ;(window as unknown as { __audioSpy: typeof spy }).__audioSpy = spy

    const w = window as unknown as {
      AudioContext?: typeof AudioContext
      webkitAudioContext?: typeof AudioContext
    }
    const OrigAC = w.AudioContext || w.webkitAudioContext
    if (!OrigAC)
      return

    const Wrapped = new Proxy(OrigAC, {
      construct(Target, args) {
        spy.ctxCount++
        const ctx = new Target(...(args as [AudioContextOptions?]))
        const origOsc = ctx.createOscillator.bind(ctx)
        ctx.createOscillator = () => {
          spy.oscCount++
          return origOsc()
        }
        const origBuf = ctx.createBufferSource.bind(ctx)
        ctx.createBufferSource = () => {
          spy.bufferCount++
          return origBuf()
        }
        return ctx
      },
    })
    w.AudioContext = Wrapped
    w.webkitAudioContext = Wrapped
  })
}

export interface AudioSpy { ctxCount: number, oscCount: number, bufferCount: number }

export async function readAudioSpy(page: Page): Promise<AudioSpy> {
  return page.evaluate(() => (window as unknown as { __audioSpy: AudioSpy }).__audioSpy)
}

// 安裝對 useTeruAudio 方法的 spy（依賴 app 端 expose window.__teruAudio）
// poll 直到 expose 後 patch tok / bloom / pluck / chime / chimeAt
export async function installAudioMethodSpy(page: Page) {
  await page.addInitScript(() => {
    const counts = { tok: 0, bloom: 0, pluck: 0, chime: 0, chimeAt: 0 }
    ;(window as unknown as { __audioMethodCount: typeof counts }).__audioMethodCount = counts

    const tryPatch = () => {
      const w = window as unknown as { __teruAudio?: Record<string, (...args: unknown[]) => unknown> }
      const audio = w.__teruAudio
      if (!audio)
        return false
      const keys = ['tok', 'bloom', 'pluck', 'chime', 'chimeAt'] as const
      for (const key of keys) {
        const orig = audio[key]
        if (typeof orig === 'function') {
          audio[key] = (...args: unknown[]) => {
            counts[key]++
            return orig.apply(audio, args)
          }
        }
      }
      return true
    }
    const loop = () => {
      if (!tryPatch())
        setTimeout(loop, 30)
    }
    loop()
  })
}

export interface AudioMethodCount { tok: number, bloom: number, pluck: number, chime: number, chimeAt: number }

export async function readAudioMethodCount(page: Page): Promise<AudioMethodCount> {
  return page.evaluate(() =>
    (window as unknown as { __audioMethodCount: AudioMethodCount }).__audioMethodCount,
  )
}
