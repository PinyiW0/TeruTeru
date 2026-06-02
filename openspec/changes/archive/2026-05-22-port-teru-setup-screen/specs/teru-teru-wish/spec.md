## ADDED Requirements

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
