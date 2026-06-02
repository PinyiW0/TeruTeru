# language: zh-TW
# 對應 openspec/specs/teru-teru-wish/spec.md
# Setup → Praying → Complete 三段流程與 Loading 過場

Feature: Setup 畫面 — 整體佈局
  phase 為 setup 時顯示 SetupScreen，由上而下：主標題、副標、3 個主題色 dot、日期選擇區、地點輸入區、開始放晴按鈕、底部 hint

  @happy-path
  Rule: 預設 phase 顯示 SetupScreen

    Scenario: 預設 phase 顯示 SetupScreen
      首次造訪頁面時 phase 為 setup，畫面完整渲染 SetupScreen
      Given 使用者首次造訪頁面
      And useWishFlow().phase 為 "setup"
      Then 畫面渲染 SetupScreen 完整內容
      And 主標題顯示「Teru Teru 放晴中」
      And 副標顯示「為一個日子，為一個地方，求一場好天氣」
      And 底部 hint 顯示「掛滿晴天娃娃就會放晴」

Feature: Setup 畫面 — 日期選擇
  提供下拉與 week strip 雙向同步的日期選擇，過去日期不可選，預設今天，不持久化

  @happy-path
  Rule: 預設選今天

    Scenario: 預設選今天
      首次進入 SetupScreen 時已選日期為今天
      Given 使用者首次進入 SetupScreen
      Then 已選日期等於當地時區的今天
      And 已選日期的 hours/minutes/seconds/ms 皆為 0
      And week strip 中對應的 .day 套上 "is-today is-selected" class

  @field-validation
  Rule: 過去日期不可選

    Scenario: 點選過去日期被忽略
      點擊 .day.is-disabled 不變更日期、不播音效
      Given SetupScreen 已渲染
      And week strip 中存在過去日期 .day.is-disabled
      When 使用者點擊該過去日期
      Then 已選日期不變
      And 不播放音效

  @derivation
  Rule: 下拉與 week strip 雙向同步

    Scenario: 下拉變更同步 strip
      下拉選擇下個月時，strip 滾動到對應日並 .is-selected
      Given SetupScreen 已渲染
      And 當前月份內有可用日期
      When 使用者於月份下拉選擇下個月
      Then week strip 滾動到新月份的對應日
      And 對應 .day 套上 "is-selected"

    Scenario: Year 範圍正確
      年份下拉只有今年、今年+1、今年+2 三個值
      Given SetupScreen 渲染年份下拉
      Then 選項剛好為 [今年, 今年+1, 今年+2] 三個值

  @derivation
  Rule: 日期不持久化

    Scenario: Reload 後重置為今天
      Reload 後預設日期回到今天
      Given 使用者選了 "2026/12/25"
      When 使用者 reload 瀏覽器
      Then SetupScreen 顯示今天
      And 已選日期非 "2026/12/25"

Feature: Setup 畫面 — 地點輸入
  提供 text input 與 8 個常用地點 chips，點選 chip 等同填入 input，地點持久化至 localStorage

  @happy-path
  Rule: chip 與 input 同步

    Scenario: 點 chip 填入並 active
      點選「東京」chip，input 變為「東京」並只該 chip active
      Given SetupScreen 已渲染
      When 使用者點選 "東京" chip
      Then input 值變為 "東京"
      And "東京" chip 套上 "active" class
      And 其他 chips 無 "active" class
      And 播放 pluck(620)

    Scenario: 8 個 chip 固定順序
      chips 依序為台北、台中、高雄、東京、大阪、京都、首爾、沖繩
      Given SetupScreen 渲染 chips
      Then chips 依序呈現:
        """
        ["台北", "台中", "高雄", "東京", "大阪", "京都", "首爾", "沖繩"]
        """

  @persistence
  Rule: 地點持久化

    Scenario: 自由輸入持久化
      input 輸入「淡水」後寫入 localStorage 與 state
      Given SetupScreen 已渲染
      When 使用者於 input 輸入 "淡水"
      Then useWishFlow().location.value 為 "淡水"
      And localStorage.teru.location 為 "淡水"

    Scenario: Reload 後地點記得
      Reload 後 input 預設值取自 localStorage
      Given 使用者已輸入並儲存 "京都"
      When 使用者 reload 頁面
      Then SetupScreen 的 input 預設值為 "京都"
      And "京都" chip 套上 "active" class

Feature: Setup 畫面 — 主題色切換
  3 個 dot（sunny / sakura / matcha）切換主題色，點擊更新 useTweaks 並播 pluck(700)

  @happy-path
  Rule: 點 dot 即時切換並持久化

    Scenario: 點 dot 即時切換並持久化
      點 sakura dot 後 root data-theme 更新且 localStorage 寫入
      Given SetupScreen 已渲染
      And root data-theme 為 "sunny"
      When 使用者點 sakura dot
      Then root data-theme 變為 "sakura"
      And sakura dot 套上 "active" class
      And sunny / matcha dot 沒有 "active"
      And localStorage.teru.themeColor 為 "sakura"

  @persistence
  Rule: 主題持久化

    Scenario: Reload 後主題保留
      切到 matcha 後 reload，主題仍為 matcha
      Given 使用者已切到 matcha 主題
      When 使用者 reload 頁面
      Then matcha dot 顯示 "active"
      And 整體色調為 matcha palette

Feature: Setup 畫面 — 開始按鈕門檻與行為
  「開始放晴」按鈕啟用條件為 location.trim().length > 0，點擊播 tok() 並切到 praying

  @field-validation
  Rule: 啟用條件

    Scenario: 空地點按鈕停用
      location 為空字串或僅含空白時按鈕 disabled
      Given SetupScreen 已渲染
      And location input 為空字串或僅含空白
      Then 「開始放晴」按鈕為 disabled

    Scenario: 填地點後可開始
      location 有效時按鈕 enabled
      Given SetupScreen 已渲染
      When 使用者輸入 "台北"
      Then 「開始放晴」按鈕為 enabled

  @happy-path
  Rule: 點擊觸發 phase 切換

    Scenario: 點按鈕觸發切換
      點啟用狀態的按鈕，播音效並 600ms 後切到 praying
      Given location input 為 "台北"
      And 「開始放晴」按鈕為 enabled
      When 使用者點啟用狀態的「開始放晴」
      Then 播放 tok() 音效
      And 經過 600ms 過場後 useWishFlow().phase 變為 "praying"
      And useWishFlow().date 與 useWishFlow().location 已更新為使用者輸入

    Scenario: Trim 空白
      開始時 location 前後空白被 trim
      Given 使用者於 input 輸入 "  台北  "
      When 使用者按開始
      Then useWishFlow().location.value 為 "台北"

Feature: Praying 畫面 — 整體佈局
  phase 為 praying 時顯示 PrayingScreen，含頂部區、標題、stage、底部 hint

  @happy-path
  Rule: 切到 praying 顯示 PrayingScreen

    Scenario: 切到 praying 顯示 PrayingScreen
      phase 變為 praying 後畫面渲染完整內容
      Given useWishFlow().date 為已選日期
      And useWishFlow().location 為使用者輸入的地點
      When useWishFlow().phase 變為 "praying"
      Then 畫面顯示 PrayingScreen
      And 頂部顯示 formatDateCN(date) 格式的日期
      And 頂部顯示「為 {location} 祈禱晴天」
      And 中央顯示標題「晴天娃娃降臨中」
      And 底部顯示 hint「點任意處 · 掛上晴天娃娃」

Feature: Praying 畫面 — 點任意處掛娃娃
  接受 stage 任意位置點擊新增娃娃，但 .pray-top 與 .pray-back 內的點擊僅執行原本功能

  @happy-path
  Rule: 點 stage 空白處新增娃娃

    Scenario: 點 stage 空白處新增娃娃
      點 stage 非 chrome 區，新增一隻娃娃漂浮到 slot
      Given PrayingScreen 已渲染
      And stage 上目前有 N 隻娃娃 (N < 25)
      When 使用者點擊 stage 上不在頂部與返回鈕的位置
      Then 新增一隻娃娃至 slot N
      And 娃娃從點擊位置漂浮到 slot 位置並套上 "floating-in" class
      And 播放 chimeAt(N) 音效

  @condition
  Rule: 點 chrome 不新增娃娃

    Scenario: 點返回鈕不新增娃娃
      點 .pray-back 不新增娃娃，僅 goTo("setup")
      Given PrayingScreen 已渲染
      When 使用者點擊返回鈕 .pray-back
      Then 不新增任何娃娃
      And 觸發 goTo("setup")
      And phase 回到 setup

    Scenario: 點頂部 meta 區不新增娃娃
      點 .pray-top 內非返回鈕區域，無任何動作
      Given PrayingScreen 已渲染
      When 使用者點擊頂部 meta 區（.pray-top 內，但非返回鈕）
      Then 不新增任何娃娃
      And 不執行任何切換

Feature: Praying 畫面 — Stage 與繩子響應式渲染
  ResizeObserver 追蹤 stage 尺寸，5 條繩 SVG path 依寬高即時重算，呈 catenary sag 曲線

  @derivation
  Rule: Stage 尺寸變動繩子跟著重畫

    Scenario: Stage 尺寸變動繩子跟著重畫
      視窗 resize 後繩與已掛娃娃重新計算座標
      Given PrayingScreen 已渲染
      And stage 已有尺寸
      And 已掛若干娃娃
      When 瀏覽器視窗 resize 或裝置 rotate
      Then stage 的 reactive size 更新
      And 5 條繩 SVG path 重新計算
      And 已掛娃娃的 left/top 也以新尺寸重算（透過 slotToXY）

  @derivation
  Rule: 繩子順序由下往上 0 → 4

    Scenario: 繩子順序由下往上 0 → 4
      rope 0 在最底部、rope 4 在最上方，中段點下垂 ROPE_SAG
      Given PrayingScreen 首次渲染
      And stage 已有尺寸
      Then rope 0 位於最底部 (Y fraction 0.92)
      And rope 4 位於最上方 (Y fraction 0.08)
      And 5 條繩 path 的中段點 (midX, midY) 比兩端低 14px (ROPE_SAG)

Feature: Praying 畫面 — 漂浮入場與懸掛擺動
  新娃娃套 floating-in class 漂浮 1.1 秒後切 hung，各娃娃 sway-dur / sway-delay 錯開

  @happy-path
  Rule: 新娃娃從漂浮切到懸掛

    Scenario: 新娃娃從漂浮切到懸掛
      新增第 N 隻後 1100ms 切到 hung，CSS 變數已設定
      Given PrayingScreen 已渲染
      When 使用者點擊 stage 新增第 N 隻娃娃
      Then 娃娃元素套上 "doll floating-in" class
      And CSS 變數 --from-x, --from-y, --sway-dur, --sway-delay 已設定
      And 1100ms 後切換為 "doll hung" class

  @derivation
  Rule: 不同 slot 擺動時序不同

    Scenario: 不同 slot 擺動時序不同
      ≥5 隻 hung 娃娃的 sway-dur 與 sway-delay 不全相同
      Given stage 上已有 5 隻以上 "hung" 娃娃
      Then 每隻娃娃的 --sway-dur 與 --sway-delay 計算結果不全相同
      And 觀察可看出非完全同步的擺動節奏

Feature: Praying 畫面 — 滿 25 自動切換、鎖第 26 隻
  第 25 次點擊後 1400ms 自動 goTo("complete")，過渡期間任何 tap 不再新增

  @happy-path
  Rule: 第 25 次點擊後自動切 complete

    Scenario: 第 25 次點擊後自動切 complete
      第 25 次點擊後 1400ms 切到 complete
      Given PrayingScreen 已渲染
      And stage 上已有 24 隻娃娃
      When 使用者完成第 25 次點擊
      Then useWishFlow.dolls.value.length 為 25
      And 經過 1400ms transition 過場後 phase 變為 "complete"

  @condition
  Rule: 滿 25 後再點不增加

    Scenario: 滿 25 後再點不增加
      過渡時間內再點 stage 不新增娃娃也不重複切換
      Given 已掛滿 25 隻娃娃
      And 1400ms 過渡時間尚未結束
      When 使用者於過渡時間內再點 stage
      Then dolls.value.length 仍為 25
      And 不重複觸發 goTo("complete")

Feature: Complete 畫面 — 三段動畫時序
  mount 後 animPhase 依序 clouded → clearing (350ms) → done (1900ms，呼叫 bloom())

  @happy-path
  Rule: clouded 初始狀態

    Scenario: clouded 初始狀態
      mount 瞬間 Sun 半透明、雲在中央、文字未浮現
      Given useWishFlow().phase 為 "complete"
      When CompleteScreen 剛 mount
      Then Sun 顯示 opacity 0.25 且 scale 0.85
      And 5 朵雲位於中央（fromX/fromY 起始座標）
      And 完成文字尚未浮現（opacity 0）

  @happy-path
  Rule: clearing 階段 (350ms 後)

    Scenario: clearing 階段 350ms 後
      animPhase 切換為 clearing，Sun fade-in、雲飛向四角
      Given CompleteScreen 已 mount
      When 經過約 350ms
      Then animPhase 切換為 "clearing"
      And Sun 開始 fade-in 並 scale 至 1.0
      And 5 朵雲飛向四角（CSS animation-delay 各延遲 0/80/160/240/320ms）

  @happy-path
  Rule: done 階段 (1900ms 後)

    Scenario: done 階段 1900ms 後
      animPhase 切換為 done，Sun 全亮、雲消失、文字浮現、播 bloom()
      Given CompleteScreen 已 mount
      When 經過約 1900ms
      Then animPhase 切換為 "done"
      And Sun 完全亮（opacity 1）
      And 雲已飛離畫面（v-if !== "done" 不再渲染）
      And 文字區 fade-in 並上移（opacity 0 → 1, translateY 12px → 0）
      And 系統呼叫 useTeruAudio.bloom() 播放完成音效

  @edge-case
  Rule: 元件 unmount 清除 timer

    Scenario: 元件 unmount 清除 timer
      動畫中 unmount 不殘留 setPhase 或 bloom 呼叫
      Given CompleteScreen 已 mount 但尚未進入 done
      When 使用者於 1900ms 前按下「重新祈禱」導致 CompleteScreen unmount
      Then 未觸發的 setTimeout 被清空
      And 不會在 unmount 後執行 setPhase 或 bloom

Feature: Complete 畫面 — 達成文案
  done 階段顯示標題、副標（動態 TOTAL_DOLLS）、meta（日期 + 地點）、重新祈禱按鈕

  @happy-path
  Rule: 副標數字動態取自 TOTAL_DOLLS

    Scenario: 文案顯示 25 而非 20
      .complete-sub 數字來自 useWishFlow.TOTAL_DOLLS 而非寫死
      Given useWishFlow.TOTAL_DOLLS 為 25
      When CompleteScreen 進入 done 階段
      Then .complete-sub 文字為「25 隻晴天娃娃，已經掛滿」
      And 該數字不來自 hardcoded 字串

  @happy-path
  Rule: 顯示祈禱對象資訊

    Scenario: 顯示祈禱對象資訊
      done 階段顯示 formatDateCN(date) 與「為 {location} 祈禱」
      Given useWishFlow().date 為使用者於 setup 階段選擇之日期
      And useWishFlow().location 為使用者於 setup 階段輸入之地點
      When CompleteScreen 進入 done 階段
      Then 畫面顯示 formatDateCN(date) 格式的日期
      And 畫面顯示「為 {location} 祈禱」

Feature: Complete 畫面 — 重新祈禱
  「重新祈禱」按鈕播 tok() 並 goTo("setup")，dolls 清空、date 回今天、location 保留

  @happy-path
  Rule: 點重新祈禱回到 setup

    Scenario: 點重新祈禱回到 setup
      點按鈕播 tok() 後 phase 切回 setup 且 dolls 清空
      Given CompleteScreen 處於 done 階段
      When 使用者點擊「重新祈禱」按鈕
      Then 播放 tok() 音效
      And 經過 transition 過場後 phase 切回 "setup"
      And dolls.value.length 為 0

  @persistence
  Rule: 重新祈禱保留地點

    Scenario: 重新祈禱保留地點
      回 setup 後 location input 仍顯示 reset 前的地點
      Given 使用者於 setup 階段輸入 "淡水" 並完成流程到 complete
      When 使用者按「重新祈禱」回到 setup
      Then SetupScreen 的 location input 仍顯示 "淡水"
      And "淡水" chip 仍套上 "active" 樣式

  @derivation
  Rule: 重新祈禱重置日期為今天

    Scenario: 重新祈禱重置日期為今天
      回 setup 後 date 回到今天而非先前選擇
      Given 使用者於 setup 選了 "2026/12/25" 並完成流程到 complete
      When 使用者按「重新祈禱」回到 setup
      Then SetupScreen 的 date 回到今天
      And 已選日期非 "2026/12/25"

Feature: LoadingScreen 過場 curtain
  transition === true 時於最高 z-index 渲染 LoadingScreen，1250ms 後 transition 切回 false

  @happy-path
  Rule: 任何 phase 切換時 LoadingScreen 出現

    Scenario: 任何 phase 切換時 LoadingScreen 出現
      goTo 被呼叫瞬間 transition 為 true 且 LoadingScreen 覆蓋整個畫面
      Given 任一 phase
      When useWishFlow.goTo(next) 被呼叫
      Then transition 立即變為 true
      And LoadingScreen 渲染並覆蓋整個畫面

  @happy-path
  Rule: 1250ms 後 LoadingScreen 自動消失

    Scenario: 1250ms 後 LoadingScreen 自動消失
      goTo 後約 1250ms 由 wishFlow 切回 transition=false 觸發 v-if 移除
      Given goTo 已被呼叫
      When 經過約 1250ms
      Then transition 變回 false
      And LoadingScreen 從 DOM 移除

  @derivation
  Rule: LoadingScreen 不接 props 也不設 timer

    Scenario: LoadingScreen 不接 props 也不設 timer
      元件僅呈現 curtain SVG / Sun / tagline，內部無 timer
      When LoadingScreen 元件 mount
      Then 不接受任何 props
      And 內部沒有 setTimeout / setInterval
      And 只負責呈現（curtain SVG / Sun / tagline）
