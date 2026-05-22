## ADDED Requirements

### Requirement: Complete 畫面 — 三段動畫時序

系統 SHALL 於 phase 為 `complete` 時顯示 CompleteScreen,並於 mount 後以三段內部 animPhase 推進:`clouded`(初始)→ `clearing`(mount 後 350ms 切換)→ `done`(mount 後 1900ms 切換,並於切換時呼叫 `bloom()`)。各段對 Sun、離場雲、文字的 opacity / transform 變化 MUST 與 reference 一致。

#### Scenario: clouded 初始狀態

- **WHEN** CompleteScreen 剛 mount
- **THEN** Sun 顯示 opacity 0.25、scale 0.85
- **AND** 5 朵雲位於中央(`fromX/fromY` 起始座標)
- **AND** 完成文字尚未浮現(opacity 0)

#### Scenario: clearing 階段(350ms 後)

- **WHEN** mount 後約 350ms
- **THEN** animPhase 切換為 `clearing`
- **AND** Sun 開始 fade-in 並 scale 至 1.0
- **AND** 5 朵雲飛向四角(動畫透過 CSS animation + animation-delay 錯開,各延遲 0/80/160/240/320ms)

#### Scenario: done 階段(1900ms 後)

- **WHEN** mount 後約 1900ms
- **THEN** animPhase 切換為 `done`
- **AND** Sun 完全亮(opacity 1)
- **AND** 雲已飛離畫面(`v-if !== 'done'` 不再渲染)
- **AND** 文字區 fade-in 並上移(opacity 0 → 1,translateY 12px → 0)
- **AND** 系統呼叫 `useTeruAudio.bloom()` 播放完成音效

#### Scenario: 元件 unmount 清除 timer

- **WHEN** 使用者於動畫中按下「重新祈禱」(假設在 1900ms 前)導致 CompleteScreen unmount
- **THEN** 未觸發的 setTimeout 被清空
- **AND** 不會在 unmount 後執行 setPhase 或 bloom

### Requirement: Complete 畫面 — 達成文案

系統 SHALL 於 CompleteScreen 進入 `done` 階段時顯示文字區,包含:
- 標題「一定會是好天氣的!」(`.complete-title`)
- 副標「{TOTAL_DOLLS} 隻晴天娃娃,已經掛滿」— 數字 MUST 從 `useWishFlow.TOTAL_DOLLS` 動態讀取(不可寫死),修正 reference 寫死「20」的 bug
- Meta:`formatDateCN(date)` 換行後接「為 {location} 祈禱」
- 「重新祈禱」按鈕(`.btn-primary`)

#### Scenario: 文案顯示 25 而非 20

- **WHEN** CompleteScreen 進入 done 階段且 `TOTAL_DOLLS === 25`
- **THEN** `.complete-sub` 文字為「25 隻晴天娃娃,已經掛滿」
- **AND** 該數字不來自 hardcoded 字串

#### Scenario: 顯示祈禱對象資訊

- **WHEN** CompleteScreen 進入 done 階段
- **THEN** 顯示 `formatDateCN(date)` 格式的日期(如「2026 年 5 月 22 日(五)」)
- **AND** 顯示「為 {location} 祈禱」(地點來自 setup 階段使用者輸入)

### Requirement: Complete 畫面 — 重新祈禱

系統 SHALL 在 CompleteScreen 提供「重新祈禱」按鈕,點擊 MUST 播放 `tok()` 並呼叫 `goTo('setup')`,後續行為由 `useWishFlow.goTo` + `reset` 處理:phase 回到 setup、dolls 清空、date 回今天,但 location MUST 保留(由 localStorage 持久化)。

#### Scenario: 點重新祈禱回到 setup

- **WHEN** 使用者於 CompleteScreen done 階段點擊「重新祈禱」
- **THEN** 播放 `tok()` 音效
- **AND** 經 transition 過場後 phase 切回 setup
- **AND** `dolls.value.length === 0`

#### Scenario: 重新祈禱保留地點

- **WHEN** 使用者於 setup 輸入「淡水」、完成流程到 complete、按重新祈禱
- **THEN** SetupScreen 的 location input 仍顯示「淡水」
- **AND** 「淡水」chip 仍套上 `active` 樣式

#### Scenario: 重新祈禱重置日期為今天

- **WHEN** 使用者於 setup 選了 2026/12/25、完成流程、按重新祈禱
- **THEN** SetupScreen 的 date 回到今天(非 12/25)

### Requirement: LoadingScreen 過場 curtain

系統 SHALL 在 `useWishFlow.transition === true` 期間於頁面頂層(最高 z-index)渲染 LoadingScreen,內含:左右兩塊雲形 curtain 從中央向外散開、中央背後一顆小 Sun(size 140)、底部 "Loading ... Sunshine" tagline。LoadingScreen 元件 MUST 不主動控制何時消失 — 消失由 `useWishFlow.goTo` 在 1250ms 後將 `transition` 切回 false 觸發 `v-if` 自然移除。

#### Scenario: 任何 phase 切換時 LoadingScreen 出現

- **WHEN** `useWishFlow.goTo(next, ...)` 被呼叫(任一 phase → 任一 phase)
- **THEN** `transition` 立即變 true
- **AND** LoadingScreen 渲染並覆蓋整個畫面

#### Scenario: 1250ms 後 LoadingScreen 自動消失

- **WHEN** `goTo` 後約 1250ms
- **THEN** `transition` 變回 false
- **AND** LoadingScreen 從 DOM 移除

#### Scenario: LoadingScreen 不接 props 也不設 timer

- **WHEN** LoadingScreen 元件 mount
- **THEN** 不接受任何 props
- **AND** 內部沒有 setTimeout / setInterval
- **AND** 只負責呈現(curtain SVG / Sun / tagline)
