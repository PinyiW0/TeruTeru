## ADDED Requirements

### Requirement: 主題色系切換機制

系統 SHALL 透過 root 節點的 `data-theme` 屬性切換主題色,支援 3 種值:`sunny`(預設)、`sakura`、`matcha`,且切換 MUST 透過更新 CSS 變數(`--sun`、`--accent`、`--rope` 等)即時反映於整個畫面,不需重新 mount 任何元件。

#### Scenario: 切換 data-theme 即時生效

- **WHEN** 程式更新 root `data-theme` 由 "sunny" 變為 "sakura"
- **THEN** 所有使用 `var(--sun)` 等變數的元素立即顯示新色
- **AND** 元件不需重新建立

#### Scenario: 主題持久化

- **WHEN** 程式呼叫 `useTweaks().setTweak('themeColor', 'matcha')`
- **THEN** `localStorage.teru.themeColor` 為 `"matcha"`
- **AND** reload 後 `useTweaks().themeColor.value === 'matcha'`

#### Scenario: 預設主題 fallback

- **WHEN** localStorage 為空白或 themeColor 鍵不存在
- **THEN** `useTweaks().themeColor.value === 'sunny'`

### Requirement: 字體切換機制

系統 SHALL 載入 5 套 Google Fonts(Huninn / Klee One / Zen Maru Gothic / Noto Sans TC / Yuji Boku),並透過 root `data-font` 屬性切換 `--font` CSS 變數,支援 2 種值:`round`(預設,= Zen Maru Gothic)、`hand`(= Huninn / Klee One / Yuji Boku 為主)。

#### Scenario: round 字體預設套用

- **WHEN** 頁面首次載入且未指定 `data-font`
- **THEN** body 元素 `font-family` resolve 為 "Zen Maru Gothic"

#### Scenario: hand 字體切換生效

- **WHEN** root `data-font="hand"`
- **THEN** body 元素 `font-family` resolve 為 "Huninn" 為首的 fallback chain
- **AND** `.setup-title`、`.pray-title`、`.complete-title` 等以 `var(--font-hand)` 為主的元素顯示手寫風格

### Requirement: 視覺風格切換機制

系統 SHALL 透過 root `data-style` 屬性切換視覺風格,支援 3 種值:`flat`(預設)、`washi`、`collage`,且 `washi` MUST 透過 SVG filter (`feTurbulence` + `feDisplacementMap`)為娃娃邊緣加上不規則紙感。

#### Scenario: washi 風格啟用 SVG filter

- **WHEN** root `data-style="washi"`
- **AND** `TeruDoll` 元件被渲染
- **THEN** doll 的 body 與 head SVG 套用 `url(#washi-edge)` filter
- **AND** filter defs 由 `DollDefs` 元件一次性提供於頁面

#### Scenario: collage 風格顯示 paper edge

- **WHEN** root `data-style="collage"`
- **THEN** `TeruDoll` 額外渲染一個 dashed circle 模擬紙邊

### Requirement: 音效系統 lazy init 與 setEnabled

系統 SHALL 透過 `useTeruAudio()` composable 提供 `pluck(freq)`、`chime(freq)`、`chimeAt(idx)`、`tok()`、`bloom()`、`setEnabled(bool)` API,AudioContext MUST 在首次音效播放呼叫時才建立(非模組層),且僅在 client 端;`setEnabled(false)` 後所有播放呼叫 MUST 立即 return,不消耗任何 audio resource。

#### Scenario: 模組載入不建立 AudioContext

- **WHEN** `useTeruAudio()` 被呼叫但無任何播放函式被觸發
- **THEN** 全域 `AudioContext` 實例計數 = 0

#### Scenario: 首次 pluck 才 init AudioContext

- **WHEN** 程式首次呼叫 `useTeruAudio().pluck(440)`
- **THEN** 一個 AudioContext 被建立
- **AND** 若其 state 為 `suspended` 則立即 `resume()`

#### Scenario: SSR 環境不炸

- **WHEN** `useTeruAudio()` 於 SSR 環境(無 `window`)被 import
- **THEN** 不 throw error
- **AND** 任何播放函式呼叫亦 noop(因為 `import.meta.client` 為 false)

#### Scenario: 關閉音效

- **WHEN** `useTeruAudio().setEnabled(false)` 後使用者點擊任何觸發音效的操作
- **THEN** 不發出任何聲音
- **AND** 不建立新的 oscillator 或 buffer source

### Requirement: 共用 SVG 元件

系統 SHALL 提供 5 個共用 SVG 元件,每個 MUST 1:1 對應 ui-reference 的同名 React 元件,並支援指定的 props:

- `TeruDoll`: props `{ index?, dollStyle?, visualStyle?, tieColor?, size? }`,3 種 dollStyle + 3 種 visualStyle 切換,`varied` 模式下依 index 輪替 6 種臉與 6 種領帶色
- `DollDefs`: 無 props,提供 `headShade` / `bodyShade` gradient 與 `washi-edge` filter
- `BgClouds`: 無 props,3 朵 SVG 雲背景漂浮(CSS animation)
- `SunIcon`: props `{ size?, rays?, smile? }`,含旋轉光芒與笑臉
- `RainCloud`: props `{ w?, color?, drops? }`

#### Scenario: TeruDoll varied 模式輪替

- **WHEN** 渲染 6 個 `<TeruDoll>`,`dollStyle="varied"`,index 從 0 到 5
- **THEN** 每隻 doll 顯示不同的 tieColor(來自 6 色預設清單)
- **AND** 每隻 doll 顯示不同的臉(來自 6 套預設表情)

#### Scenario: DollDefs 僅渲染一次

- **WHEN** `<DollDefs />` 被掛在 `pages/index.vue` 根節點
- **THEN** 整頁的 SVG filter 與 gradient defs 皆可被 `TeruDoll` 透過 `url(#...)` 引用
