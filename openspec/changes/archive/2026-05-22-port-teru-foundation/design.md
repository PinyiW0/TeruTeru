## Context

這是 5 個 port-* change 的基礎層。本層只 port「橫向關注點」(CSS、主題、音效、共用 SVG、composable),**不實作任何 screen**。完成驗收標準是:跑 `npm run dev` 看到一隻可主題切換的晴天娃娃 placeholder。

## Goals / Non-Goals

**Goals:**
- 全部 CSS 變數、`data-*` 屬性切換機制建立完成
- 3 個 composable API 介面確定且 unit test 友善(雖然本 change 不寫 test)
- 5 個共用 SVG 元件 1:1 對應 reference 的 `TeruDoll` / `DollDefs` / `BgClouds` / `Sun` / `RainCloud`
- 5 套 Google Fonts 正確載入,`data-font` 切換生效
- AudioContext lazy init 完成,SSR 不炸

**Non-Goals:**
- SetupScreen / PrayingScreen / CompleteScreen / LoadingScreen 元件 — 留待後續 change
- TweaksPanel UI — 留待 port-teru-tweaks-dev-panel
- 主題色 dot picker UI(SetupScreen 才有) — 但 placeholder 會做最小版用來驗證主題切換
- 完整流程體驗 — 本層 placeholder 僅 prove wiring

## Decisions

### 1. CSS 直接整份 port,不切片

直接把 `spec/ui-config/ui-reference/styles.css` copy 進 `app/assets/css/teru.css`,作為 unscoped 真理庫,後續 change 不再修改它。元件用 scoped style 補 Nuxt-specific 細節(transition class 等)。

**理由**:reference styles.css 已 660 行且彼此互相關聯(`data-theme + data-style + data-font` 的笛卡爾積),切片會破壞語意完整性。整份載入後續可逐步重構。

### 2. `useTweaks` 持久化只持 `themeColor`

預設值:`{ visualStyle: 'flat', themeColor: 'sunny', dollStyle: 'classic', fontStyle: 'round', soundOn: true }`。`themeColor` 寫到 `localStorage.teru.themeColor`,讀取時 fallback 預設;其他四個僅 in-memory。

**理由**:跟 design.md 已決定的持久化策略一致(see port-teru-foundation/specs/teru-teru-customization)。

### 3. `useTeruAudio` lazy init + SSR safe

模組 top-level 不 instantiate AudioContext。`ensureCtx()` 函式內檢查 `import.meta.client && typeof window !== 'undefined'`,首次呼叫 `pluck/chime/tok/bloom` 任一才建立 ctx;若 `ctx.state === 'suspended'` 立即 `resume()`。`setEnabled(false)` 後所有播放函式 early return。

**理由**:iOS Safari + Chrome autoplay policy 都要求 user gesture;SSR 環境沒有 `window`。

### 4. `useWishFlow` API 在本 change 完整定義,但後續 change 才接 UI

完整暴露:`phase, transition, date, location, dolls, addDoll(tapX, tapY, stageW, stageH), goTo(next, payload?), reset(), TOTAL_DOLLS`。本 change 的 placeholder `pages/index.vue` 只示範 `phase = 'setup'` 並 render 一隻 doll,不真的 wire 進切換。

**理由**:把 API contract 先穩,後續 change 就只是塞 UI,不會回頭改 composable。

### 5. SVG 元件 1:1 直譯,內部不抽象

`TeruDoll.vue` 內含三種臉(dot/line/happy)、兩種 body path(simple/classic+varied)、varied 變化邏輯(`VARIED_TIES`、`VARIED_FACES`),全部寫死在元件內,不抽出 helper。

**理由**:reference 寫死,且這些常數本來就是視覺設計決策、不會被別處使用。抽 helper 反而散落。

### 6. `app.vue` 用 provide/inject 提供 tweaks 給 root,避免 prop drilling

`app.vue` 內呼叫 `useTweaks()`,把 reactive `tweaks` provide 出去,並用 `useHead` 或在 template 上動態綁 `data-*` 屬性到 root `<div>`。後續 element 用 `useTweaks()` 直接拿 state(因為 composable 內部用 `useState` 已是全域共享,實質不需 provide,但 provide 讓 dev 工具看得更清楚)。

**Alternatives:**
- 純 useState(其實已 work) — 最簡單,但缺 explicit dependency graph
- Pinia store — 過重

**決定**:純 `useState` composable,**不**加 provide/inject(reasoning:Nuxt useState 已是 SSR-safe 全域 ref,provide 是多餘的)。

### 7. Placeholder pages/index.vue 內容

最小可驗證內容:
- root `<div>` 已套 `data-theme/font/style`(由 app.vue 處理)
- 顯示 `<BgClouds />`
- 顯示 `<DollDefs />`(一次掛在 root)
- 顯示一張卡片,內含一隻 `<TeruDoll :dollStyle="tweaks.dollStyle" :visualStyle="tweaks.visualStyle" />`
- 顯示 3 個小 dot button(sunny/sakura/matcha)點擊切換主題,驗證 data-theme 套用

驗收:打開瀏覽器看到一隻娃娃 + 點 dot 整個畫面顏色變,即 foundation 通過。

## Risks / Trade-offs

- **[Risk] 整份 teru.css 載入後與 NuxtUI 4 預設樣式相衝突(reset / button base styles)** → Mitigation:teru.css 用較高選擇器特異性(`.setup-title`、`[data-theme="sakura"] .x`),NuxtUI 衝突僅可能在 UButton 等;本 change placeholder 不用 NuxtUI 元件,先觀察
- **[Risk] Google Fonts 載入失敗或慢** → Mitigation:reference fallback chain 已包含 PingFang TC / sans-serif,接受 FOUT
- **[Risk] AudioContext 在 useTeruAudio 模組層被 import 時意外觸發** → Mitigation:所有 audio API 包進 function 內、嚴格不在 top-level 寫 `new AudioContext`
- **[Risk] reference 的 DOLL_W=60 / DOLL_H=92 是 React UMD 環境的 SVG 內座標,Vue scoped 不影響** → Mitigation:viewBox 用 `0 0 60 92` 一致,size prop 控制外層 width/height
- **[Trade-off] CSS 全份 port 而非重寫,可能帶進 reference 的 dev-time 不潔程式碼** → 接受,後續 change 視需要 refactor

## Open Questions

無 — 本 change 範圍清楚,reference 完備。
