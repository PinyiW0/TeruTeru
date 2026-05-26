# language: zh-TW
# 對應 openspec/specs/teru-teru-customization/spec.md
# 主題色 / 字體 / 視覺風格 / 音效系統 / 共用 SVG

Feature: 主題色系切換機制
  root data-theme 切換 sunny / sakura / matcha，透過 CSS 變數即時生效，不需 remount

  @happy-path
  Rule: 切換 data-theme 即時生效

    Scenario: 切換 data-theme 即時生效
      data-theme 由 sunny 變 sakura，所有使用 var(--sun) 等元素立即顯示新色
      Given root data-theme 為 "sunny"
      When 程式更新 root data-theme 為 "sakura"
      Then 所有使用 var(--sun) 等變數的元素立即顯示新色
      And 元件不需重新建立

  @persistence
  Rule: 主題持久化

    Scenario: 主題持久化
      呼叫 setTweak 後 localStorage 與 reload 後的 state 一致
      When 程式呼叫 useTweaks().setTweak("themeColor", "matcha")
      Then localStorage.teru.themeColor 為 "matcha"
      And reload 後 useTweaks().themeColor.value 為 "matcha"

  @derivation
  Rule: 預設主題 fallback

    Scenario: 預設主題 fallback
      localStorage 空白時預設為 sunny
      Given localStorage 為空白或 themeColor 鍵不存在
      Then useTweaks().themeColor.value 為 "sunny"

Feature: 字體切換機制
  載入 5 套 Google Fonts，root data-font 切換 round / hand 兩種值

  @happy-path
  Rule: round 字體預設套用

    Scenario: round 字體預設套用
      未指定 data-font 時 body font-family 為 Zen Maru Gothic
      Given 頁面首次載入
      And 未指定 data-font
      Then body 元素 font-family resolve 為 "Zen Maru Gothic"

  @happy-path
  Rule: hand 字體切換生效

    Scenario: hand 字體切換生效
      data-font="hand" 時 body 與標題類套手寫風 fallback chain
      Given root data-font 為 "hand"
      Then body 元素 font-family resolve 為 "Huninn" 為首的 fallback chain
      And .setup-title / .pray-title / .complete-title 等以 var(--font-hand) 為主的元素顯示手寫風格

Feature: 視覺風格切換機制
  root data-style 切換 flat / washi / collage，washi 透過 SVG filter 加紙感邊緣

  @happy-path
  Rule: washi 風格啟用 SVG filter

    Scenario: washi 風格啟用 SVG filter
      data-style="washi" 時 doll body 與 head 套 url(#washi-edge) filter
      Given root data-style 為 "washi"
      When TeruDoll 元件被渲染
      Then doll 的 body 與 head SVG 套用 url(#washi-edge) filter
      And filter defs 由 DollDefs 元件一次性提供於頁面

  @happy-path
  Rule: collage 風格顯示 paper edge

    Scenario: collage 風格顯示 paper edge
      data-style="collage" 時 doll 額外渲染 dashed circle 模擬紙邊
      Given root data-style 為 "collage"
      When TeruDoll 元件被渲染
      Then TeruDoll 額外渲染一個 dashed circle 模擬紙邊

Feature: 音效系統 lazy init 與 setEnabled
  useTeruAudio 提供 pluck/chime/chimeAt/tok/bloom/setEnabled，AudioContext 首次播放才建立，僅 client 端

  @derivation
  Rule: 模組載入不建立 AudioContext

    Scenario: 模組載入不建立 AudioContext
      只呼叫 useTeruAudio() 不觸發任何播放，AudioContext 計數為 0
      When useTeruAudio() 被呼叫
      And 無任何播放函式被觸發
      Then 全域 AudioContext 實例計數為 0

  @happy-path
  Rule: 首次 pluck 才 init AudioContext

    Scenario: 首次 pluck 才 init AudioContext
      第一次 pluck 建立 AudioContext，若 suspended 則 resume
      Given useTeruAudio() 已被呼叫
      And 全域 AudioContext 實例計數為 0
      When 程式首次呼叫 useTeruAudio().pluck(440)
      Then 一個 AudioContext 被建立
      And 若其 state 為 "suspended" 則立即 resume()

  @edge-case
  Rule: SSR 環境不炸

    Scenario: SSR 環境不炸
      SSR 環境 import 與呼叫播放函式皆 noop，不 throw
      Given 環境無 window（SSR）
      When useTeruAudio() 被 import
      Then 不 throw error
      And 任何播放函式呼叫亦 noop（因為 import.meta.client 為 false）

  @condition
  Rule: 關閉音效

    Scenario: 關閉音效
      setEnabled(false) 後任何播放呼叫立即 return，不建立 audio resource
      Given useTeruAudio().setEnabled(false) 已被呼叫
      When 使用者點擊任何觸發音效的操作
      Then 不發出任何聲音
      And 不建立新的 oscillator 或 buffer source

Feature: 共用 SVG 元件
  提供 5 個共用 SVG 元件：TeruDoll、DollDefs、BgClouds、SunIcon、RainCloud

  @happy-path
  Rule: TeruDoll varied 模式輪替

    Scenario: TeruDoll varied 模式輪替
      6 個 varied TeruDoll 顯示 6 種不同 tieColor 與 6 種不同臉
      Given dollStyle 為 "varied"
      When 渲染 6 個 <TeruDoll>，index 從 0 到 5
      Then 每隻 doll 顯示不同的 tieColor（來自 6 色預設清單）
      And 每隻 doll 顯示不同的臉（來自 6 套預設表情）

  @derivation
  Rule: DollDefs 僅渲染一次

    Scenario: DollDefs 僅渲染一次
      頁面根節點掛 DollDefs 後整頁 TeruDoll 皆可透過 url(#...) 引用
      Given <DollDefs /> 被掛在 pages/index.vue 根節點
      Then 整頁的 SVG filter 與 gradient defs 皆可被 TeruDoll 透過 url(#...) 引用

Feature: 主題色切換使用者面向 UI
  SetupScreen 提供使用者面向的 3 個 dot picker（非 dev Tweaks panel），dot 視覺以 reference 色碼為背景

  @happy-path
  Rule: SetupScreen 提供 dot picker

    Scenario: SetupScreen 提供 dot picker
      畫面顯示 3 個 dot 對應三種主題，當前主題對應 dot 套 active
      Given 使用者進入 SetupScreen
      Then 畫面顯示 3 個 dot，分別代表 sunny / sakura / matcha
      And dot 背景色分別為 "#B8DEF0" / "#FFD3DE" / "#C7DDB5"
      And 當前 useTweaks().themeColor 對應的 dot 套上 ".theme-dot.active" class

  @happy-path
  Rule: dot 切換立即套用

    Scenario: dot 切換立即套用
      點非當前 dot 後整個 SetupScreen 色調反映新主題
      Given 使用者進入 SetupScreen
      When 使用者點擊非當前的 dot
      Then root data-theme 立即變更
      And 整個 SetupScreen（包含 BgClouds、按鈕底色、文字色）的色調反映新主題
