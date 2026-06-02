## ADDED Requirements

### Requirement: Praying 畫面 — 整體佈局

系統 SHALL 於 phase 為 `praying` 時顯示 PrayingScreen,PrayingScreen MUST 包含:頂部區(返回鈕 + 日期 meta + 「為 X 祈禱晴天」)、標題「晴天娃娃降臨中」、繩子與娃娃舞台(stage)、底部 hint「點任意處 · 掛上晴天娃娃」。

#### Scenario: 切到 praying 顯示 PrayingScreen

- **WHEN** `useWishFlow().phase` 變為 `'praying'`
- **THEN** 畫面顯示 PrayingScreen
- **AND** 頂部顯示來自 setup 的日期(`formatDateCN` 格式)與「為 {location} 祈禱晴天」
- **AND** 中央顯示標題「晴天娃娃降臨中」
- **AND** 底部顯示 hint「點任意處 · 掛上晴天娃娃」

### Requirement: Praying 畫面 — 點任意處掛娃娃(排除 chrome)

系統 SHALL 接受 stage 上任意位置的點擊,但點擊頂部區域(`.pray-top`)或返回鈕(`.pray-back`)時 MUST 不新增娃娃,僅執行該元素的原本功能(返回鈕回 setup、頂部 meta 無動作)。

#### Scenario: 點 stage 空白處新增娃娃

- **WHEN** 使用者點擊 stage 上不在頂部與返回鈕的位置
- **THEN** 新增一隻娃娃至下一個 slot
- **AND** 娃娃從點擊位置漂浮到 slot 位置(`floating-in` class)
- **AND** 播放 `chimeAt(nextSlot)` 音效

#### Scenario: 點返回鈕不新增娃娃

- **WHEN** 使用者點擊返回鈕(`.pray-back`)
- **THEN** 不新增任何娃娃
- **AND** 觸發 `goTo('setup')`,phase 回到 setup

#### Scenario: 點頂部 meta 區不新增娃娃

- **WHEN** 使用者點擊頂部 meta 區(`.pray-top` 內,但非返回鈕)
- **THEN** 不新增任何娃娃
- **AND** 不執行任何切換

### Requirement: Praying 畫面 — Stage 與繩子響應式渲染

系統 SHALL 透過 `ResizeObserver` 追蹤 stage 元素尺寸,5 條繩子(SVG path)的座標 MUST 依 stage 寬高即時重算,繩子 MUST 呈 catenary sag(中間下垂)曲線,且每條繩兩端 MUST 有圖釘視覺(`.rope` deep + light 雙圓)。繩子佈局 MUST 沿用 foundation 提供的 `slotToXY` 常數(`ROPE_Y_FRACTIONS` / `BAND_TOP` / `BAND_BOT` / `ROPE_SAG`)。

#### Scenario: Stage 尺寸變動繩子跟著重畫

- **WHEN** 瀏覽器視窗 resize 或裝置 rotate
- **THEN** stage 的 reactive `size` 更新
- **AND** 5 條繩 SVG path 重新計算
- **AND** 已掛娃娃的 left/top 也以新尺寸重算(透過 `slotToXY`)

#### Scenario: 繩子順序由下往上 0 → 4

- **WHEN** PrayingScreen 首次渲染、stage 已有尺寸
- **THEN** rope 0 在最底部(Y fraction 0.92)、rope 4 在最上方(Y fraction 0.08)
- **AND** 5 條繩 path 的中段點(midX, midY)比兩端低 14px(`ROPE_SAG`)

### Requirement: Praying 畫面 — 漂浮入場與懸掛擺動

系統 SHALL 為每隻新增的娃娃套用 `floating-in` class,該娃娃 MUST 從 `(fromX, fromY)` offset 漂浮到 slot 位置(動畫約 1.1 秒),漂浮結束 MUST 切換為 `hung` class,後續永久輕微擺動,各娃娃的擺動週期(`--sway-dur`)與起始相位(`--sway-delay`)MUST 錯開以避免整排同步。

#### Scenario: 新娃娃從漂浮切到懸掛

- **WHEN** 使用者點擊 stage,新增第 N 隻娃娃
- **THEN** 娃娃元素套上 `doll floating-in` class
- **AND** 1100ms 後切換為 `doll hung` class
- **AND** CSS 變數 `--from-x`、`--from-y`、`--sway-dur`、`--sway-delay` 已設定

#### Scenario: 不同 slot 擺動時序不同

- **WHEN** stage 上已有 5 隻以上 `hung` 娃娃
- **THEN** 每隻娃娃的 `--sway-dur` 與 `--sway-delay` 計算結果不全相同
- **AND** 觀察可看出非完全同步的擺動節奏

### Requirement: Praying 畫面 — 滿 25 自動切換、鎖第 26 隻

系統 SHALL 在第 25 次點擊後 1400ms 自動透過 `useWishFlow.goTo('complete')` 切換到 complete phase。在第 25 隻後與切換前的這段過渡時間內,任何後續 tap MUST 不再新增娃娃(由 `useWishFlow.addDoll` 內的長度檢查保證,UI 不需另做檢查)。

#### Scenario: 第 25 次點擊後自動切 complete

- **WHEN** 使用者完成第 25 次點擊
- **THEN** `useWishFlow.dolls.value.length === 25`
- **AND** 1400ms 後 `phase` 變為 `'complete'`(經 transition 過場後)

#### Scenario: 滿 25 後再點不增加

- **WHEN** 已掛滿 25 隻,使用者於 1400ms 過渡時間內再點 stage
- **THEN** `dolls.value.length` 仍為 25
- **AND** 不重複觸發 `goTo('complete')`
