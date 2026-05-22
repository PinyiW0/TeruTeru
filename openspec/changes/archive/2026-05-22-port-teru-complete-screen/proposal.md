## Why

設了願、掛滿 25 隻娃娃了 — 接下來最重要的就是「儀式感結尾」:CompleteScreen 的「雲離場 → 太陽顯現 → 文字浮現 → 重新祈禱」三段動畫。同時補上前三個 change 都欠的 **LoadingScreen 過場 curtain**,讓 setup ↔ praying ↔ complete 之間的切換有 reference 的視覺一致性。

第 4 個 port-* change(最後是 tweaks-dev-panel)。本 change 完工後,**整個流程可從頭跑到尾不見 placeholder**。

## What Changes

- 新增 `CompleteScreen.vue`:三 phase 動畫(clouded → clearing → done)、Sun + 離場 RainCloud × 5、文字 + 「重新祈禱」按鈕
- 新增 `LoadingScreen.vue`:左右雲 curtain + 中央小 Sun + "Loading ... Sunshine" tagline
- 修改 `pages/index.vue`:`phase === 'complete'` 從 placeholder 換成 `<CompleteScreen />`,並在頂層條件渲染 `<LoadingScreen v-if="transition" />`
- **FIX bug**:reference 文案寫死「20 隻晴天娃娃」與實際 TOTAL_DOLLS=25 不一致,改成讀常數動態渲染「{TOTAL_DOLLS} 隻晴天娃娃,已經掛滿」

## Capabilities

### New Capabilities
<!-- 無 -->

### Modified Capabilities
- `teru-teru-wish`: 加上 CompleteScreen 的 4 個 ADDED requirements:三 phase 動畫時序、達成文案、重新祈禱、LoadingScreen 過場 curtain

## Impact

- **新增**:
  - `app/components/CompleteScreen.vue`
  - `app/components/LoadingScreen.vue`
- **修改**:
  - `app/pages/index.vue`:`phase === 'complete'` 渲染 CompleteScreen、頂層加 `<LoadingScreen v-if="transition" />` z-index 蓋最上
- **不影響**:setup-screen、praying-screen 既有檔案;`useWishFlow.goTo` 已寫好 600ms/1250ms 切換時序,本 change 只負責視覺呈現
- **依賴**:foundation 已提供的 `SunIcon` / `RainCloud` 元件、`useTeruAudio.bloom`、`useWishFlow.goTo + reset`、teru.css 中的 `.complete-*` / `.loader-*` style、`formatDateCN`
- **後續 change 依賴**:tweaks-dev-panel 不受影響(獨立)
- **Bug fix**:CompleteScreen 顯示「{TOTAL_DOLLS} 隻晴天娃娃」(reference 寫死 20 是 bug)
