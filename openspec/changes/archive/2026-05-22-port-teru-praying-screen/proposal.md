## Why

Setup 已完工(設日期、地點、主題、按開始可切 phase)。**praying 是流程的核心互動**:使用者點任意處、娃娃從點擊位置漂浮到繩上、5 條繩共 25 個 slot 由下往上填,滿 25 後切到 complete。本 change 把它從 reference port 完。

第三個 port-* change(剩下 complete-screen、tweaks-dev-panel)。

## What Changes

- 新增 `PrayingScreen.vue`:點擊互動、5 條繩 SVG、25 個 doll 渲染、漂浮動畫、頂部 meta、底部 hint、返回鈕
- 修改 `pages/index.vue`:`phase === 'praying'` 從 placeholder 換成 `<PrayingScreen />`,complete 仍保留 placeholder
- 已在 foundation 完成的 `useWishFlow.addDoll` 與 `slotToXY` 不需動,本 change 只接 UI

## Capabilities

### New Capabilities
<!-- 無新 capability -->

### Modified Capabilities
- `teru-teru-wish`: 加上 **praying 階段**的 4 個 ADDED requirements:點任意處掛娃娃(排除 chrome)、5 ropes × 5 slots 從底繩開始填、第 25 次後 1400ms 自動切 complete、滿 25 鎖第 26 隻。同時為頂部 meta 區、底部 hint、返回鈕等 UI 元素留下契約。

## Impact

- **新增**:`app/components/PrayingScreen.vue`(包含 5 條繩 SVG path 計算、ResizeObserver、tap handler、doll 渲染與動畫 class 切換)
- **修改**:`app/pages/index.vue` 條件渲染從 placeholder 換成 PrayingScreen
- **不影響**:foundation 與 setup-screen 既有檔案
- **依賴**:`useWishFlow`(addDoll / slotToXY / dolls / goTo)、`TeruDoll` 元件、teru.css 的 `.pray-*` / `.clothesline-svg` / `.doll.floating-in` / `.doll.hung` style
- **後續 change 依賴**:complete-screen 將依賴 phase 切換到 complete(本 change 觸發)
