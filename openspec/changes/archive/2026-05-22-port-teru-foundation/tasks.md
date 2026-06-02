## 1. 全域樣式與環境

- [x] 1.1 把 `spec/ui-config/ui-reference/styles.css` 整份 copy 到 `app/assets/css/teru.css`
- [x] 1.2 修改 `nuxt.config.ts`:`css` 陣列加入 `~/assets/css/teru.css`
- [x] 1.3 修改 `nuxt.config.ts`:`app.head.link` 加入 Google Fonts preconnect 與 `https://fonts.googleapis.com/css2?family=Huninn&family=Klee+One:wght@400;600&family=Zen+Maru+Gothic:wght@400;500;700&family=Noto+Sans+TC:wght@400;500;700&family=Yuji+Boku&display=swap`
- [x] 1.4 修改 `nuxt.config.ts`:`app.head.meta` 補 `viewport=width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no`
- [x] 1.5 修改 `app/app.vue`:`<NuxtWelcome />` → `<NuxtPage />`,並把 root `<div>` 改成 `:data-theme`、`:data-font`、`:data-style` 動態綁定(值來自 `useTweaks()`)

## 2. 型別

- [x] 2.1 建立 `app/types/wish.ts`:`Phase = 'setup' | 'praying' | 'complete'`、`WishData { date: Date; location: string }`、`DollPlaced { id: string; slot: number; fromX: number; fromY: number; hung: boolean }`
- [x] 2.2 建立 `app/types/tweaks.ts`:`VisualStyle = 'flat' | 'washi' | 'collage'`、`ThemeColor = 'sunny' | 'sakura' | 'matcha'`、`DollStyle = 'classic' | 'simple' | 'varied'`、`FontStyle = 'round' | 'hand'`、`TweakState`

## 3. Composables

- [x] 3.1 建立 `app/composables/useTweaks.ts`:`useState` reactive `TweakState`,defaults 為 `{ visualStyle: 'flat', themeColor: 'sunny', dollStyle: 'classic', fontStyle: 'round', soundOn: true }`,初始化時讀 `localStorage.teru.themeColor` 套用,提供 `setTweak<K>(k: K, v: TweakState[K])`,watch `themeColor` 寫回 localStorage(僅 client)
- [x] 3.2 建立 `app/composables/useTeruAudio.ts`:port `audio.js` 全部演算法(chime/chimeAt/tok/bloom/pluck),AudioContext lazy 在 `ensureCtx()` 內 init(條件:`import.meta.client && typeof window !== 'undefined'`),`enabled` ref 同步 `useTweaks().soundOn`,所有播放函式 `if (!enabled.value) return`
- [x] 3.3 建立 `app/composables/useWishFlow.ts`:`useState` 包 `phase`、`transition`、`date`、`location`、`dolls`(`DollPlaced[]`),常數 `TOTAL_DOLLS = 25`、`ROPES = 5`、`SLOTS_PER_ROPE = 5`、`ROPE_Y_FRACTIONS`、`SLOT_X_FRACTIONS`、`ROPE_SAG = 14`、`BAND_TOP = 0.20`、`BAND_BOT = 0.80`
- [x] 3.4 在 `useWishFlow` 內實作 `slotToXY(slotIdx, sizeW, sizeH)`:沿用 reference 演算法,含 catenary sag 計算
- [x] 3.5 在 `useWishFlow` 內實作 `goTo(next, payload?)`:`transition = true`,setTimeout 600ms 切 phase,setTimeout 1250ms 收 `transition`,並接受 `{ date?, location? }` payload
- [x] 3.6 在 `useWishFlow` 內實作 `addDoll(tapX, tapY, sizeW, sizeH)`:計算 slot、from offsets、push 新 doll、setTimeout 1100ms 切 `hung`,滿 25 時自動 setTimeout 1400ms 觸發 `goTo('complete')`、鎖第 26 隻
- [x] 3.7 在 `useWishFlow` 內實作 `reset()`:清空 dolls、phase 回 setup、date 回今天、location 沿用 `useState` 內值(地點不主動清,由 setup 畫面決定要不要保留)

## 4. 共用 SVG 元件

- [x] 4.1 建立 `app/components/DollDefs.vue`:`<svg class="svg-defs" aria-hidden="true">` 內含 `headShade` / `bodyShade` radialGradient/linearGradient 與 `washi-edge` filter,sourced from `teru.jsx::DollDefs`
- [x] 4.2 建立 `app/components/TeruDoll.vue`:props `{ index?: number; dollStyle?: DollStyle; visualStyle?: VisualStyle; tieColor?: string; size?: number }`,常數 `DOLL_W = 60`、`DOLL_H = 92`,內含 `VARIED_TIES`、`VARIED_FACES`,渲染 string + hook + shadow + body + tie + head + eyes + cheek + mouth + collage overlay
- [x] 4.3 建立 `app/components/BgClouds.vue`:port `BgClouds` 三朵 SVG 雲(top fractions 12% / 34% / 58%,左側起始 -20% / -30% / -25%),class 與 reference 一致以套用 CSS animation
- [x] 4.4 建立 `app/components/SunIcon.vue`:props `{ size?: number; rays?: number; smile?: boolean }`,內含 `sun-stage` / `sun-rays` SVG / `sun-body` SVG(含 radialGradient `sunGrad`、cheek/eyes/mouth)
- [x] 4.5 建立 `app/components/RainCloud.vue`:props `{ w?: number; color?: string; drops?: number }`,SVG 雲 + 雨滴

## 5. Placeholder 頁面驗證

- [x] 5.1 建立 `app/pages/index.vue`:`useTweaks()`,template 內含 `<BgClouds />`、`<DollDefs />`、置中卡片含 `<TeruDoll :dollStyle :visualStyle />`,以及 3 個小圓 button(sunny/sakura/matcha,內聯 hex 對應 reference)
- [x] 5.2 點擊圓 button 呼叫 `setTweak('themeColor', ...)` 並觀察畫面色調切換生效

## 6. 品質與驗證

- [x] 6.1 跑 `npx eslint . --fix`,無 error
- [x] 6.2 跑 `npm run typelint`(`nuxi typecheck`),無 error
- [x] 6.3 跑 `npm run dev` 在 http://localhost:3000(或 fallback port)看到:1 隻可主題切換的娃娃 + 背景雲漂浮 + 字體已套用 Zen Maru Gothic(SSR 已渲染 stage/placeholder-card/theme-dot/svg-defs/bg-clouds,字體 link 已注入)
- [x] 6.4 點主題 dot 3 次切到 sakura,確認 root `data-theme="sakura"` 且整體色調變化,reload 後仍為 sakura(驗證持久化)
- [x] 6.5 在 devtools console 執行音效或點「測試完成音效」按鈕確認 bloom 響、關閉 soundOn 後無聲
