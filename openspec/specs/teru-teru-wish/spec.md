# teru-teru-wish Specification

## Purpose
TBD - created by archiving change port-teru-setup-screen. Update Purpose after archive.
## Requirements
### Requirement: Setup 畫面整體佈局

系統 SHALL 於 phase 為 `setup` 時顯示 SetupScreen,SetupScreen MUST 由以下區塊由上而下構成:主標題「Teru Teru 放晴中」、副標、3 個主題色 dot picker、日期選擇區(3 個下拉 + week strip)、地點輸入區(text input + 8 個常用 chips)、開始放晴按鈕、底部 hint「掛滿晴天娃娃就會放晴」。

#### Scenario: 預設 phase 顯示 SetupScreen

- **WHEN** 首次造訪頁面,`useWishFlow().phase === 'setup'`
- **THEN** 畫面渲染 SetupScreen 完整內容
- **AND** 主標題顯示「Teru Teru 放晴中」
- **AND** 副標顯示「為一個日子,為一個地方,求一場好天氣」

### Requirement: Setup 畫面 — 日期選擇

系統 SHALL 提供日期選擇,規則:
- **過去日期不可選**(week strip 對應 day 元素加 `is-disabled` class,選單選項從可用日起算)
- **「今天」MUST 視覺強調**(`is-today` class)
- **下拉(年/月/日)與 week strip 雙向同步**:任一處變更日期,另一處立即反映
- **Year 範圍**:當年 + 2 年
- **Mount 時**:week strip 自動將「今天」(或當前 selected) scroll 至視窗中央
- **日期不持久化**:reload 後預設值再次為今天

#### Scenario: 預設選今天

- **WHEN** 使用者首次進入 SetupScreen
- **THEN** 已選日期 === 當地時區的今天(`hours/minutes/seconds/ms` 皆為 0)
- **AND** week strip 中對應的 `.day` 有 `is-today is-selected` class

#### Scenario: 點選過去日期被忽略

- **WHEN** 使用者點擊 week strip 中過去的日期(`.day.is-disabled`)
- **THEN** 已選日期不變
- **AND** 不播放音效

#### Scenario: 下拉變更同步 strip

- **WHEN** 使用者於月份下拉選擇下個月
- **AND** 該月份內有可用日期(非全月過去)
- **THEN** week strip 滾動到新月份的對應日
- **AND** 對應 `.day` 套上 `is-selected`

#### Scenario: Year 範圍正確

- **WHEN** SetupScreen 渲染年份下拉
- **THEN** 選項剛好包含 `[今年, 今年+1, 今年+2]` 三個值

#### Scenario: Reload 後重置為今天

- **WHEN** 使用者選了 2026/12/25 後 reload 瀏覽器
- **THEN** SetupScreen 顯示今天(非 12/25)

### Requirement: Setup 畫面 — 地點輸入

系統 SHALL 提供地點 text input 與 8 個常用地點 chips(`['台北', '台中', '高雄', '東京', '大阪', '京都', '首爾', '沖繩']`),點選 chip 等同於把該地點填入 input。當前若 input 值與 chip 文字一致,該 chip MUST 顯示 `.chip.active` style。地點 MUST 持久化至 `localStorage.teru.location`,reload 後自動帶回。

#### Scenario: 點 chip 填入 + active

- **WHEN** 使用者點選「東京」chip
- **THEN** input 值變為「東京」
- **AND** 「東京」chip 套上 `active` class
- **AND** 其他 chips 無 `active` class
- **AND** 播放 `pluck(620)`

#### Scenario: 自由輸入持久化

- **WHEN** 使用者於 input 輸入「淡水」
- **THEN** `useWishFlow().location.value === '淡水'`
- **AND** `localStorage.teru.location === '淡水'`

#### Scenario: Reload 後地點記得

- **WHEN** 使用者輸入「京都」後 reload 頁面
- **THEN** SetupScreen 的 input 預設值為「京都」
- **AND** 「京都」chip 套上 `active` class

#### Scenario: 8 個 chip 固定順序

- **WHEN** SetupScreen 渲染 chips
- **THEN** chip 按陣列順序呈現:台北、台中、高雄、東京、大阪、京都、首爾、沖繩

### Requirement: Setup 畫面 — 主題色切換

系統 SHALL 於 SetupScreen 提供 3 個主題色 dot(sunny / sakura / matcha),每個 dot 以 reference 指定的色碼(`#B8DEF0` / `#FFD3DE` / `#C7DDB5`)作為背景,當前 `useTweaks().themeColor` 對應的 dot MUST 顯示 `.theme-dot.active` style。點擊 dot MUST 透過 `setTweak('themeColor', ...)` 更新狀態(進而觸發 root `data-theme` 切換)並播放 `pluck(700)`。

#### Scenario: 點 dot 即時切換並持久化

- **WHEN** 使用者點 sakura dot
- **THEN** root `data-theme` 變為 `"sakura"`
- **AND** sakura dot 套上 `active` class
- **AND** sunny / matcha dot 沒有 `active`
- **AND** `localStorage.teru.themeColor === 'sakura'`(此持久化由 foundation 的 `useTweaks` 提供)

#### Scenario: Reload 後主題保留

- **WHEN** 使用者切到 matcha 後 reload
- **THEN** matcha dot 顯示 `active`,整體色調為 matcha palette

### Requirement: Setup 畫面 — 開始按鈕門檻與行為

系統 SHALL 提供「開始放晴」按鈕,**啟用條件:`location.trim().length > 0`**(date 不參與檢查因為預設為今天)。停用時 MUST 套用 disabled style。點擊啟用的按鈕 MUST 播放 `tok()` 並呼叫 `goTo('praying', { date, location: location.trim() })`,phase 切換為 `praying`。

#### Scenario: 空地點按鈕停用

- **WHEN** location input 為空字串或僅含空白
- **THEN** 「開始放晴」按鈕為 disabled

#### Scenario: 填地點後可開始

- **WHEN** 使用者輸入「台北」
- **THEN** 「開始放晴」按鈕為 enabled

#### Scenario: 點按鈕觸發切換

- **WHEN** 使用者點啟用狀態的「開始放晴」
- **THEN** 播放 `tok()` 音效
- **AND** `useWishFlow().phase` 變為 `praying`(經過 600ms 過場後)
- **AND** `useWishFlow().date` 與 `useWishFlow().location` 已更新為使用者輸入

#### Scenario: Trim 空白

- **WHEN** 使用者輸入 「  台北  」(前後有空白)後按開始
- **THEN** `useWishFlow().location.value === '台北'`(空白被 trim)

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

