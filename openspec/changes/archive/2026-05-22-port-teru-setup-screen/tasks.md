## 1. Utility 與 composable 調整

- [x] 1.1 建立 `app/utils/wishDate.ts`:`formatDateCN(d: Date): string`、`buildDays(today: Date): Date[]`(產出 -3 ~ +60 共 64 天)、`isSameDay(a: Date, b: Date): boolean`、`pad2(n: number): string`、常數 `COMMON_LOCATIONS = ['台北','台中','高雄','東京','大阪','京都','首爾','沖繩']`、`WEEKDAY_LABELS = ['日','一','二','三','四','五','六']`
- [x] 1.2 修改 `app/composables/useWishFlow.ts`:`location` 的 `useState` 初始函式改為:client 端讀 `localStorage.teru.location` fallback `''`、server 端回 `''`;`onMounted` 不適用 — 改在 composable 內 watch `location`(僅 client)寫回 `localStorage`

## 2. SetupScreen 元件

- [x] 2.1 建立 `app/components/SetupScreen.vue` 骨架:script setup + template 區塊定位(header / theme picker / date picker / week strip / location / start CTA / hint)
- [x] 2.2 實作日期選擇 state:`today` (memo)、`days` (memo via buildDays)、`date` (來自 useWishFlow)、`years` / `months` / `dayNums` 計算(含過去日 gate),`setY/setM/setD` 函式呼叫 `pluck(660)`
- [x] 2.3 實作 week strip render:每個 day cell `<div class="day">` 含 `day-w`(週)/`day-d`(日)/`day-m`(月),依日期套 `is-today` / `is-selected` / `is-disabled`,click handler `tapDay(d)` 過去日 early return,正常日 `pluck(720)` + update date
- [x] 2.4 實作 week strip auto-scroll-to-selected:`stripRef` + `dayRefs` Map,`onMounted` + `watch(date)` 內計算 target scrollLeft 並 `scrollTo({ behavior: 'smooth' })`,全部 `if (import.meta.client)` 保護
- [x] 2.5 實作主題 dot picker:`themeDots` 陣列,點擊 `setTweak('themeColor', id)` + `pluck(700)`,套用 `.theme-dot.active` class
- [x] 2.6 實作地點區:`<input class="loc-input">` 雙向綁定 `location`、`<button class="chip">` × 8 (來自 COMMON_LOCATIONS),chip 點擊 `pluck(620)` + 更新 location,`active` class 條件 `location === loc`
- [x] 2.7 實作開始按鈕:`canStart` computed 為 `location.value.trim().length > 0`,disabled 綁 `:disabled="!canStart"`,click handler 播 `tok()` + 呼叫 `goTo('praying', { date, location: location.value.trim() })`

## 3. 頁面整合

- [x] 3.1 修改 `app/pages/index.vue`:移除 foundation 的 placeholder 卡片,改成 `<BgClouds />` + `<DollDefs />` + 依 phase 條件渲染 `<SetupScreen>` / praying placeholder / complete placeholder
- [x] 3.2 praying / complete 的 placeholder 提供「回 setup」debug 按鈕(呼叫 `reset()`)

## 4. 視覺與功能驗證

- [x] 4.1 跑 `npx eslint . --fix` 與 `nuxi typecheck` 無 error
- [x] 4.2 dev server 開瀏覽器看 SetupScreen 正確渲染:主標、副標、3 個 theme dot、年/月/日 select、week strip(today 置中)、地點 input + 8 chips、開始按鈕(預設停用)、底部 hint(SSR 已渲染 setup-title/theme-dot/weekstrip/chip/loc-input/開始放晴/台北/京都/「為一個日子」)
- [x] 4.3 點過去日期 cell 無反應、點未來日期會選中並 scroll、年/月/日 下拉切換 strip 跟隨
- [x] 4.4 輸入地點後按鈕變 enabled,reload 後地點仍記得
- [x] 4.5 切主題 dot 整體色調變,reload 後仍為新主題
- [x] 4.6 按開始 → phase 切到 praying placeholder,「回 setup」debug 按鈕 reset 後地點仍在(因為持久化)、date 回今天
