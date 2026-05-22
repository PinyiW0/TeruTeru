## ADDED Requirements

### Requirement: 主題色切換使用者面向 UI

系統 SHALL 在 SetupScreen 提供使用者面向的主題色 dot picker(3 個 dot,對應 sunny / sakura / matcha),提供 dev-only Tweaks panel 之外的常設切換入口。dot 視覺 MUST 以 reference 指定色碼為背景(`#B8DEF0` / `#FFD3DE` / `#C7DDB5`),當前主題對應的 dot MUST 顯示 `active` 視覺。

#### Scenario: SetupScreen 提供 dot picker

- **WHEN** 使用者進入 SetupScreen
- **THEN** 畫面顯示 3 個 dot,分別代表 sunny / sakura / matcha
- **AND** 當前 `useTweaks().themeColor` 對應的 dot 套上 `.theme-dot.active` class

#### Scenario: dot 切換立即套用

- **WHEN** 使用者點擊非當前的 dot
- **THEN** root `data-theme` 立即變更
- **AND** 整個 SetupScreen(包含 BgClouds、按鈕底色、文字色)的色調反映新主題
