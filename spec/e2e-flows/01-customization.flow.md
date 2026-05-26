# Flow: Teru Teru 客製化機制（主題色 / 字體 / 風格 / 音效 / 共用 SVG）

> 對應規格：spec/gherkin-feature/teru-teru-customization.feature
> 涵蓋頁面：/（單頁應用，主要在 SetupScreen 內互動）
> 性質：純前端 UI / 視覺 / 音效系統，無後端 API

## Background
- 使用者首次造訪 `/`，phase 預設為 `setup`，畫面為 SetupScreen
- localStorage 命名空間為 `teru.*`（如 `teru.themeColor`、`teru.location`）
- 音效系統（useTeruAudio）僅於 client 端啟用，AudioContext 採 lazy init

---

## Business Invariants（合約核心）

1. **主題色可切換且即時生效**：使用者能在 SetupScreen 看到並點選代表 sunny / sakura / matcha 的三個選擇器，點擊後整體色調立即反映新主題（不需 reload、不需 remount）
2. **主題色持久化**：使用者切換的主題在 reload 後仍保留
3. **預設主題為 sunny**：localStorage 無資料時，視覺呈現 sunny palette
4. **字體系統可切換**：在 hand / round 兩種字體模式間切換時，標題與內文字體 family 改變
5. **視覺風格可切換**：washi / collage / flat 切換時，TeruDoll 的視覺呈現可被辨識為不同風格（washi 有紙感邊緣 filter、collage 有紙邊裝飾）
6. **音效系統可被關閉**：使用者或程式關閉音效後，互動操作不再產生聲音
7. **音效不在 SSR 環境炸**：頁面 SSR 載入時 import / 呼叫音效函式不 throw
8. **共用 SVG 元件正確掛載**：DollDefs 一次性提供 filter / gradient defs，TeruDoll 在 varied 模式下能呈現多樣化外觀

---

## Flow: 切換主題色立即生效（happy-path）

> 對應 Feature: 主題色系切換機制 → Scenario: 切換 data-theme 即時生效
> 對應 Feature: 主題色切換使用者面向 UI → Scenario: dot 切換立即套用

### 業務脈絡
- 使用者位於 SetupScreen，目前主題為 sunny
- 畫面上能看到三個代表主題色的選擇器（dot picker），對應 sunny / sakura / matcha

### E2E 驗證流程
1. 進入 `/`
2. 確認目前主題對應的選擇器處於 active 狀態（sunny）
3. 觸發切換到 sakura 主題（點選對應主題色的選擇器）
4. 期待：
   - 整體色調反映新主題（例：背景 / 按鈕 / 雲朵等使用 `var(--sun)` 的元素顯色變化）
   - sakura 對應的選擇器標示為 active，其他兩個失去 active
   - root 元素的 `data-theme` 屬性變為 `sakura`
   - 元件不需重新建立（無 unmount / remount，state 保留）

### Verification 策略
- 主要：`document.documentElement.getAttribute('data-theme')` 等於切換後的值
- UI：用 role / class / aria-pressed 找 active 的選擇器（不限定 `.theme-dot.active` class 字面，找「目前選中」的語意即可）
- 視覺：抽樣一個 CSS var 驅動的元素，比較其 computed background-color 切換前後不同

### 不再凍結
- 選擇器形式（dot / chip / swatch / segment button / 文字按鈕皆可）
- 選擇器位置（SetupScreen 任意位置）
- active 標記方式（class / aria-pressed / outline / scale）
- 背景顏色具體 hex 值（只要色調語意對得上 palette）

---

## Flow: 主題色 reload 後持久化（persistence）

> 對應 Feature: 主題色系切換機制 → Scenario: 主題持久化
> 對應 Feature: Setup 畫面 — 主題色切換 → Scenario: Reload 後主題保留

### 業務脈絡
- 使用者已將主題切換為 matcha

### E2E 驗證流程
1. 進入 `/`
2. 切換主題為 matcha
3. Reload 頁面（`page.reload()`）
4. 期待：
   - 主題仍為 matcha（root `data-theme="matcha"`）
   - matcha 對應的選擇器為 active
   - 整體色調為 matcha palette

### Verification 策略
- `localStorage.getItem('teru.themeColor')` 等於 `"matcha"`
- reload 後 `document.documentElement.getAttribute('data-theme')` 仍為 `matcha`

### 不再凍結
- localStorage key 階層細節（只要透過 useTweaks() 讀取為 matcha 即可）
- reload 觸發時機（手動 reload / 程式呼叫均可）

---

## Flow: localStorage 空白時 fallback 為 sunny（derivation）

> 對應 Feature: 主題色系切換機制 → Scenario: 預設主題 fallback

### 業務脈絡
- 全新瀏覽器、localStorage 空白

### E2E 驗證流程
1. 清空 localStorage（`page.context().clearCookies()` + `localStorage.clear()`）
2. 進入 `/`
3. 期待：
   - root `data-theme` 為 `sunny`
   - sunny 對應的選擇器為 active

### Verification 策略
- DOM 屬性檢查 + 選擇器 active 狀態雙重驗證

### 不再凍結
- 是否在初次造訪時主動寫 localStorage（lazy 或 eager 寫入皆可）

---

## Flow: 字體模式預設為 round（happy-path）

> 對應 Feature: 字體切換機制 → Scenario: round 字體預設套用

### 業務脈絡
- 頁面首次載入、無 `data-font` 設定

### E2E 驗證流程
1. 進入 `/`
2. 期待：body 的 computed `font-family` 解析以 Zen Maru Gothic 為主

### Verification 策略
- `getComputedStyle(document.body).fontFamily` 包含 `Zen Maru Gothic`
- 或：`document.documentElement.getAttribute('data-font')` 為 `round` 或不存在（fallback to round）

### 不再凍結
- fallback chain 後續字體名單
- 是否預先設定 `data-font="round"` 或省略屬性

---

## Flow: 切換為 hand 字體（happy-path）

> 對應 Feature: 字體切換機制 → Scenario: hand 字體切換生效

### 業務脈絡
- 程式或使用者操作將字體切換為 hand

### E2E 驗證流程
1. 進入 `/`
2. 觸發切換 `data-font` 為 `hand`（可透過 evaluate 或 UI 切換器）
3. 期待：
   - body 的 computed `font-family` 以 Huninn 為首
   - 主要標題（SetupScreen 主標、PrayingScreen 標題、CompleteScreen 完成文案）顯示為手寫風

### Verification 策略
- `getComputedStyle(document.body).fontFamily` 包含 `Huninn`
- 對指定標題元素檢查 computed font-family 同樣以手寫字體為主

### 不再凍結
- UI 是否提供使用者面向的字體切換器（目前 spec 不要求，僅要求機制存在）
- fallback chain 細節

---

## Flow: washi 風格套用 SVG filter（happy-path）

> 對應 Feature: 視覺風格切換機制 → Scenario: washi 風格啟用 SVG filter

### 業務脈絡
- root 的 `data-style` 設為 `washi`

### E2E 驗證流程
1. 進入 `/`
2. 設定 `data-style="washi"`
3. 進入 praying 階段或於可見的 TeruDoll 範圍觀察
4. 期待：
   - TeruDoll 的 body / head SVG 套用 `filter: url(#washi-edge)`
   - `<DollDefs />` 已掛在頁面根節點，提供 filter defs

### Verification 策略
- DOM 查詢：`document.querySelector('#washi-edge')` 存在
- 對任一 TeruDoll 內 body/head element 檢查 `getAttribute('filter')` 或 computed style `filter` 含 `url(#washi-edge)`

### 不再凍結
- TeruDoll 顯示位置與 layout
- defs 元件命名（DollDefs / DollFilters 皆可，只要 filter id 一致）

---

## Flow: collage 風格顯示紙邊（happy-path）

> 對應 Feature: 視覺風格切換機制 → Scenario: collage 風格顯示 paper edge
>
> 註：原 flow 寫「進入 / 觀察 TeruDoll」，但業務上 setup 階段沒 TeruDoll 渲染（只有 praying / complete 階段有）。修正為在 praying 階段驗證。

### 業務脈絡
- root 的 `data-style` 設為 `collage`
- 使用者已完成 setup 進入 praying 階段（stage 上已掛上至少一隻娃娃）

### E2E 驗證流程
1. 進入 `/`
2. 設定 `data-style="collage"`
3. 完成 setup → 進入 praying，並掛上至少一隻娃娃
4. 觀察 TeruDoll
5. 期待：TeruDoll 額外渲染 dashed circle 模擬紙邊

### Verification 策略
- DOM 查詢：TeruDoll 範圍內存在 `<circle>` 元素且其 stroke-dasharray 非空 / 非 0
- 或：含有具語意的 class（如 `.paper-edge`、`.collage-edge`）的元素存在

### 不再凍結
- circle 的具體 stroke-dasharray 值與顏色
- 是否再加其他裝飾元素（額外裝飾不違反 invariant）
- 進入 praying 的方式（透過正常 setup 流程或 evaluate 強制設定 phase）

---

## Flow: 音效系統 lazy init — 模組載入不建 AudioContext（derivation）

> 對應 Feature: 音效系統 lazy init 與 setEnabled → Scenario: 模組載入不建立 AudioContext

### 業務脈絡
- 僅呼叫 `useTeruAudio()`，未觸發任何播放

### E2E 驗證流程
1. 進入 `/`，但不執行任何會觸發音效的互動
2. 期待：全域 AudioContext 實例計數為 0

### Verification 策略
- 在 page context 注入 spy 包裝 `window.AudioContext`（記錄 new 的次數）
- 或：直接於頁面 evaluate 一段檢查 `window.__teru_audio_ctx_count__`（若實作暴露）
- fallback：透過 useTeruAudio 內部可觀察的計數欄位

### 不再凍結
- AudioContext 建立時機的具體實作（首次 pluck / 任何播放函式皆可）
- 是否預先建立其他非 AudioContext 資源（buffer cache 等不在意）

---

## Flow: 首次播放音效時 init AudioContext（happy-path）

> 對應 Feature: 音效系統 lazy init 與 setEnabled → Scenario: 首次 pluck 才 init AudioContext

### 業務脈絡
- `useTeruAudio()` 已被呼叫，但尚未播放任何音效

### E2E 驗證流程
1. 進入 `/`
2. 觸發任一會呼叫 `pluck()` 的使用者操作（如點選地點 chip，會播 pluck(620)）
3. 期待：
   - 一個 AudioContext 被建立（計數為 1）
   - 若初始 state 為 suspended 則立即 resume

### Verification 策略
- 使用 spy 攔截 `window.AudioContext` 的 constructor，驗證被呼叫 1 次
- 或：檢查暴露的計數欄位

### 不再凍結
- 哪個操作是「首次播放」的觸發點（chip / dot / start button 任一皆可）

---

## Flow: SSR 環境不炸（edge-case）

> 對應 Feature: 音效系統 lazy init 與 setEnabled → Scenario: SSR 環境不炸

### 性質
SSR 階段驗證。E2E 通常已是 client-side hydrated，但需確保初次 server-render 不 throw。

### E2E 驗證流程
1. 進入 `/`
2. 期待：頁面成功 hydrate（無 server-side error overlay）
3. 補充：檢查 Nuxt server log 無 useTeruAudio 相關 throw

### Verification 策略
- `page.goto('/')` 成功（status 200，無 error overlay）
- console error / Nuxt error 中無音效模組相關 stack trace

### 不再凍結
- useTeruAudio 內部 SSR guard 實作方式（`import.meta.client` 檢查 / `process.client` / window typeof check 皆可）

---

## Flow: 關閉音效（condition）

> 對應 Feature: 音效系統 lazy init 與 setEnabled → Scenario: 關閉音效

### 業務脈絡
- 程式或使用者呼叫 `useTeruAudio().setEnabled(false)`

### E2E 驗證流程
1. 進入 `/`
2. 呼叫 `setEnabled(false)`（透過 evaluate）
3. 觸發任一原本會播音效的操作（如點 chip）
4. 期待：
   - 不發出聲音
   - 不建立新的 oscillator 或 buffer source

### Verification 策略
- spy `AudioContext.prototype.createOscillator` 與 `createBufferSource`，斷言關閉後呼叫次數為 0
- 或：檢查暴露的播放計數欄位（每次成功播放 +1）

### 不再凍結
- setEnabled 的暴露介面（store / composable 任一）
- 視覺上是否提供使用者面向的音效開關（spec 不強制 UI 提供）

---

## Flow: TeruDoll varied 模式輪替顯示（happy-path）

> 對應 Feature: 共用 SVG 元件 → Scenario: TeruDoll varied 模式輪替

### 業務脈絡
- `dollStyle` 為 `varied`，渲染 6 個 TeruDoll（index 0–5）

### E2E 驗證流程
1. 進入有 varied TeruDoll 渲染的畫面（例：praying 階段掛上 6 隻以上娃娃）
2. 觀察 6 隻娃娃
3. 期待：
   - 6 隻娃娃顯示 6 種不同的 tieColor
   - 6 隻娃娃顯示 6 種不同的臉（從 6 套預設表情中各取一）

### Verification 策略
- DOM 查詢：6 個 TeruDoll 範圍內，tie 元素的 fill / stroke 屬性蒐集起來去重後為 6 個不同值
- 臉部：對應的 face element / class 蒐集去重為 6 個不同值
- 不檢查具體 hex / 表情名稱字面，只檢查多樣性

### 不再凍結
- 6 套色與表情的具體選擇與排列順序（只要每個 index 對應穩定即可）

---

## Flow: DollDefs 全頁僅渲染一次（derivation）

> 對應 Feature: 共用 SVG 元件 → Scenario: DollDefs 僅渲染一次

### 業務脈絡
- pages/index.vue 根節點掛 `<DollDefs />`

### E2E 驗證流程
1. 進入 `/`
2. 期待：頁面內 DollDefs 提供的 filter / gradient defs 在全頁僅出現一次

### Verification 策略
- `document.querySelectorAll('#washi-edge').length === 1`
- 同樣對其他關鍵 defs id（如 `tie-gradient` 之類，依實作）檢查唯一性
- 若有多個同 id 將造成 url(#...) 引用混亂——這正是 invariant 要保護的點

### 不再凍結
- DollDefs 元件命名與檔案位置
- 內部具體 defs 數量（只要每個 id 唯一）

---

## Flow: SetupScreen 顯示三個主題色選擇器（happy-path）

> 對應 Feature: 主題色切換使用者面向 UI → Scenario: SetupScreen 提供 dot picker

### 業務脈絡
- 使用者進入 SetupScreen

### E2E 驗證流程
1. 進入 `/`
2. 期待：
   - 畫面顯示 3 個代表 sunny / sakura / matcha 的主題色選擇器
   - 當前主題對應的選擇器標示為 active
   - 三個選擇器在視覺上能對應到三種色調（sunny=藍灰、sakura=粉、matcha=綠）

### Verification 策略
- 找到 3 個選擇器元素（role=button 或 role=radio 任一，至少 3 個位於主題切換區域）
- 對每個選擇器，檢查其 inline style / computed background-color 落在預期色相範圍（藍 / 粉 / 綠各一）
- 選擇器具體 hex `#B8DEF0` / `#FFD3DE` / `#C7DDB5` 為 reference，不強制斷言字面

### 不再凍結
- 選擇器形式（dot / chip / radio / swatch）
- active 標記方式
- 是否有額外的文字標籤（「晴天」「櫻花」「抹茶」等）

---

## Mock 假設
- 無後端 API mock 需求（純前端應用）
- 音效系統 spy：需要在 page context 注入 AudioContext / Oscillator 監聽 hook
- localStorage：每個 flow 開始前清空，或於 `page.addInitScript` 注入預設值

## Testid 索引（fallback only）

本 flow 預期幾乎不需 testid，主要透過：
- `document.documentElement` 的 `data-theme` / `data-font` / `data-style` attribute
- localStorage `teru.themeColor` / `teru.font` / `teru.style`
- DOM 查詢 SVG defs / filter（透過 id）
- 音效 spy

若必須使用 testid（消歧用），建議：
- `theme-picker`（主題色選擇區容器）
- `theme-dot-{value}`（單一選擇器，value 為 `sunny` / `sakura` / `matcha`）
