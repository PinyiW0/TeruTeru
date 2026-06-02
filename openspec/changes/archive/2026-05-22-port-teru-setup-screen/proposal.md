## Why

Foundation 已落地(主題切換、SVG 元件、composables 都能跑)。下一步把 reference 三 screen 中的第一個 — **Setup** — 完整實作出來,讓使用者可以選日期、選地點、選主題,然後按「開始放晴」進入下一階段(praying 尚未實作,本 change 只負責「能正確 emit start payload 並切到 praying phase」,praying 畫面占位即可)。

第二個 port-* change(第一個是 foundation,接下來還有 praying/complete/tweaks-dev-panel)。

## What Changes

- 新增 `SetupScreen.vue` 元件(完整,1:1 port `spec/ui-config/ui-reference/setup.jsx`)
- 新增 utility:`formatDateCN(date)`、`buildDays(today)`、`isSameDay(a, b)`、`COMMON_LOCATIONS` 常數、`WEEKDAY_LABELS` 常數,放在 `app/utils/wishDate.ts`
- 修改 `app/pages/index.vue`:移除 foundation 的 placeholder,改成依 `useWishFlow().phase` 渲染 `<SetupScreen>`(其他 phase 暫顯示 placeholder「praying 尚未實作」)
- 把「地點」持久化加進 `useWishFlow`:用 `useState` 初始化時讀 `localStorage.teru.location`,watch 寫回(僅 client)
- SetupScreen 內呼叫 `useTeruAudio` 播 pluck/tok 對應動作
- SetupScreen 的「開始放晴」按鈕呼叫 `useWishFlow().goTo('praying', { date, location })`

## Capabilities

### New Capabilities
- `teru-teru-wish`: 使用者建立一筆許願:選擇未來日期 + 地點 + 主題色,按「開始放晴」進入點擊掛娃娃流程。完成過 25 隻後切換到放晴畫面。本 change 只實作流程的 Setup 階段(進入 praying 後續 change 才接)。

### Modified Capabilities
- `teru-teru-customization`: 主題色切換新增使用者面向的 UI 入口(setup 畫面的 theme dot picker),從原本「只有 root data-theme 機制」升級為「使用者可在 setup 畫面點 dot 切換」

## Impact

- **新增**:
  - `app/components/SetupScreen.vue`
  - `app/utils/wishDate.ts`(formatDateCN / buildDays / isSameDay / COMMON_LOCATIONS / WEEKDAY_LABELS)
- **修改**:
  - `app/pages/index.vue`:placeholder 替換成 phase-aware 路由
  - `app/composables/useWishFlow.ts`:location 加 localStorage 持久化(初始 + watch)
- **不影響**:foundation 既有 composable API、SVG 元件、teru.css(直接使用既有 `.setup-*` 等 class)
- **依賴**:NuxtUI 的 `<UInput>`(地點輸入)?或直接用原生 `<input>` + reference 的 `.loc-input` style?— design 內決定
- **後續 change 依賴**:praying-screen 將依賴本 change 完成的 `phase = 'praying'` 切換
