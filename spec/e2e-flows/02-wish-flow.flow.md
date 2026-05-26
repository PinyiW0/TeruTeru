# Flow: 晴天娃娃祈晴流程（Setup → Praying → Complete）

> 對應規格：spec/gherkin-feature/teru-teru-wish.feature
> 涵蓋頁面：/（單頁應用，依 phase 切換內容）
> 性質：純前端 UI flow，無後端 API

## Background
- 單頁應用 `/`，內部以 `useWishFlow().phase` 控制顯示哪一個 Screen
- phase 取值：`setup` / `praying` / `complete`
- 過場 curtain：`useWishFlow.goTo(next)` 被呼叫時 `transition` 設為 true，1250ms 後切回 false，期間覆蓋整個畫面顯示 LoadingScreen
- 時區：使用者本機時區的「今天」（hours/minutes/seconds/ms 皆為 0）
- localStorage：地點持久化於 `teru.location`；日期不持久化

---

## Business Invariants（合約核心）

1. **三段流程依序推進**：使用者必能從 setup → praying → complete 順利完成一次完整祈禱
2. **過場 curtain 出現於任何 phase 切換**：goTo 觸發時畫面被 LoadingScreen 蓋住，1250ms 內自動消失
3. **日期選擇受限**：過去日期不可選；預設為本機時區今天；年份範圍為 [今年, 今年+1, 今年+2]
4. **日期下拉與 week strip 同步**：兩種日期選擇器互為鏡像，任一變動另一即時反映
5. **日期不持久化**：reload 後日期回到今天
6. **地點輸入持久化**：地點寫入 localStorage，reload 後 input 與對應 chip 仍顯示先前值
7. **8 個地點 chip 順序固定**：台北、台中、高雄、東京、大阪、京都、首爾、沖繩
8. **「開始放晴」按鈕門檻**：location.trim() 非空才可啟用；點擊後播 tok() 並 600ms 後切到 praying
9. **Praying stage 接受任意處點擊新增娃娃**：但點返回鈕 / 點頂部 meta 區不新增娃娃
10. **娃娃數量上限 25**：第 25 次點擊後 1400ms 自動切到 complete；過渡期間再點不增加
11. **娃娃漂浮入場**：新娃娃套 floating-in 1100ms 後切 hung，CSS 變數已設定
12. **繩子 5 條，順序由下往上**：rope 0 最底（Y 0.92）、rope 4 最上（Y 0.08），有 catenary sag
13. **Stage resize 響應**：繩與已掛娃娃座標重新計算
14. **Complete 三段動畫**：clouded → clearing (350ms) → done (1900ms) 並於 done 播 bloom()
15. **Complete 達成文案數字動態**：「{TOTAL_DOLLS} 隻晴天娃娃」數字來自常數而非寫死
16. **重新祈禱**：phase 回 setup、dolls 清空、date 重置為今天、location 保留

---

## Flow: 首次造訪顯示 SetupScreen（happy-path）

> 對應 Feature: Setup 畫面 — 整體佈局 → Scenario: 預設 phase 顯示 SetupScreen

### 業務脈絡
- 使用者首次造訪 `/`，phase 預設為 `setup`

### E2E 驗證流程
1. 進入 `/`
2. 期待：
   - 看到主標題「Teru Teru 放晴中」
   - 看到副標「為一個日子，為一個地方，求一場好天氣」
   - 看到底部 hint「掛滿晴天娃娃就會放晴」
   - 三個主題色選擇器、日期選擇區、地點輸入區、開始按鈕都可見

### Verification 策略
- `getByText('Teru Teru 放晴中')`
- `getByText('為一個日子，為一個地方，求一場好天氣')`
- `getByText('掛滿晴天娃娃就會放晴')`
- 找到日期選擇器（role=combobox 或 input）、地點 input、開始按鈕

### 不再凍結
- 各區塊上下順序的微調（spec 描述為主要順序，但細部間距與分隔線不限）
- 主標、副標、hint 的字體大小、顏色、字距
- 是否有額外裝飾（雲朵、SVG 等視覺增添）

---

## Flow: 日期預設為今天（happy-path）

> 對應 Feature: Setup 畫面 — 日期選擇 → Scenario: 預設選今天

### 業務脈絡
- 使用者首次進入 SetupScreen

### E2E 驗證流程
1. 進入 `/`
2. 期待：
   - 已選日期等於本機時區的今天（hours/minutes/seconds/ms 皆為 0）
   - week strip 中對應今天的元素標示為「今天」+「已選」（語意上的雙標）

### Verification 策略
- 透過 evaluate 取 `useWishFlow().date.value`，與 `new Date(new Date().setHours(0,0,0,0))` 比對
- week strip 找到今天的元素，檢查其 active 標示（不限 `.is-today.is-selected` class 字面）

### 不再凍結
- week strip 顯示天數（spec 慣例 7 天，但可調整）
- 「今天」「已選」標示的視覺呈現（class / outline / underline / icon 皆可）

---

## Flow: 過去日期不可選（field-validation）

> 對應 Feature: Setup 畫面 — 日期選擇 → Scenario: 點選過去日期被忽略

### 業務脈絡
- week strip 中存在過去日期

### E2E 驗證流程
1. 進入 `/`
2. 找到 week strip 中過去日期（標記為 disabled）
3. 嘗試點擊該過去日期
4. 期待：
   - 已選日期不變
   - 不播放音效

### Verification 策略
- click 前後比對 `useWishFlow().date.value` 不變
- 音效 spy（AudioContext oscillator 計數）不增加
- 過去日期元素應具備 disabled 語意（`aria-disabled="true"` / `pointer-events:none` / disabled attribute）

### 不再凍結
- disabled 視覺呈現（灰色 / 半透明 / 刪除線皆可）
- 是否完全隱藏過去日期（隱藏比 disabled 更嚴格，亦符合 invariant）

---

## Flow: 下拉與 week strip 雙向同步（derivation）

> 對應 Feature: Setup 畫面 — 日期選擇 → Scenario: 下拉變更同步 strip

### 業務脈絡
- SetupScreen 已渲染，目前在當前月份

### E2E 驗證流程
1. 進入 `/`
2. 透過月份下拉選擇下個月
3. 期待：
   - week strip 滾動到新月份對應日期
   - 對應日標示為「已選」

### Verification 策略
- 月份下拉 `selectOption` 或對應動作觸發後，找到 week strip 內 active 元素
- 透過 evaluate 確認 `useWishFlow().date.value.getMonth()` 等於新選擇月份

### 不再凍結
- 下拉是 native select / custom dropdown / combobox 皆可
- 「滾動」是否有動畫
- week strip 是否預設展示一週、兩週、整月皆可

---

## Flow: 年份下拉範圍正確（derivation）

> 對應 Feature: Setup 畫面 — 日期選擇 → Scenario: Year 範圍正確

### 業務脈絡
- SetupScreen 渲染年份下拉

### E2E 驗證流程
1. 進入 `/`
2. 檢查年份下拉
3. 期待：選項剛好為 [今年, 今年+1, 今年+2]

### Verification 策略
- 對年份下拉的 options 蒐集 text 值，比對 `[currentYear, currentYear+1, currentYear+2]`
- 若為 custom dropdown，透過點開觸發 option list 後查 role=option

### 不再凍結
- 下拉實作方式（native / custom）
- 年份顯示格式（「2026」/「2026 年」皆可）

---

## Flow: 日期不持久化（derivation）

> 對應 Feature: Setup 畫面 — 日期選擇 → Scenario: Reload 後重置為今天

### 業務脈絡
- 使用者選了未來某天，如 `2026/12/25`

### E2E 驗證流程
1. 進入 `/`，選擇 2026/12/25
2. Reload 頁面
3. 期待：
   - SetupScreen 顯示今天為已選
   - `useWishFlow().date.value` 為今天

### Verification 策略
- evaluate 比對日期等於今天 00:00:00
- localStorage 內無 `teru.date` 鍵（或鍵不影響 reload 後初始狀態）

### 不再凍結
- 是否曾將日期暫存到 sessionStorage / memory（只要 reload 後初始為今天即可）

---

## Flow: 點選地點 chip 同步 input（happy-path）

> 對應 Feature: Setup 畫面 — 地點輸入 → Scenario: 點 chip 填入並 active

### 業務脈絡
- SetupScreen 已渲染、location input 為空

### E2E 驗證流程
1. 進入 `/`
2. 點擊「東京」chip
3. 期待：
   - location input 值為「東京」
   - 「東京」chip 標示為 active
   - 其他 chips 失去 active
   - 播放音效（pluck 系列，頻率不強制斷言）

### Verification 策略
- input value 斷言 `'東京'`
- 找到「東京」chip 元素檢查 active 標示
- 蒐集其他 chips 確認無 active
- 音效 spy 確認 oscillator 被建立至少一次

### 不再凍結
- chip 形式（按鈕 / radio / segment）
- pluck 具體頻率（spec 註明 620Hz 為 reference，不強制斷言）
- active 視覺呈現

---

## Flow: 8 個地點 chip 固定順序（derivation）

> 對應 Feature: Setup 畫面 — 地點輸入 → Scenario: 8 個 chip 固定順序

### 業務脈絡
- SetupScreen 渲染 chips 區

### E2E 驗證流程
1. 進入 `/`
2. 蒐集 chips 文字
3. 期待：依序為 ["台北", "台中", "高雄", "東京", "大阪", "京都", "首爾", "沖繩"]

### Verification 策略
- `locator('地點 chip 容器').allTextContents()` 後過濾、斷言順序
- 找 chip 元素的策略：role=button 且文字落在這 8 個之一

### 不再凍結
- chip 容器版型（單列 / 兩列 / wrap）
- 字型 / 大小 / 顏色

---

## Flow: 自由輸入地點持久化（persistence）

> 對應 Feature: Setup 畫面 — 地點輸入 → Scenario: 自由輸入持久化

### 業務脈絡
- 使用者於 input 自由輸入 "淡水"

### E2E 驗證流程
1. 進入 `/`
2. 在 location input 輸入 "淡水"
3. 期待：
   - `useWishFlow().location.value` 為 "淡水"
   - `localStorage.teru.location` 為 "淡水"

### Verification 策略
- evaluate 取 wishFlow location 與 localStorage 值
- 寫入時機：input blur / debounce 後 / 即時皆可（只要最終可被觀察）

### 不再凍結
- 寫入時機（每次 keyup / blur / 開始時批次寫入皆可）
- 是否同時更新 chip active 狀態（若文字非預設 8 個則不需 active）

---

## Flow: 地點 reload 後保留（persistence）

> 對應 Feature: Setup 畫面 — 地點輸入 → Scenario: Reload 後地點記得

### 業務脈絡
- 使用者已輸入並儲存 "京都"

### E2E 驗證流程
1. 進入 `/`，輸入 / 點選 "京都"
2. Reload
3. 期待：
   - location input 預設顯示 "京都"
   - "京都" chip 套 active

### Verification 策略
- reload 後 input value 斷言 "京都"
- "京都" chip active 斷言

### 不再凍結
- chip active 視覺呈現

---

## Flow: 點 dot 切換主題並持久化（happy-path）

> 對應 Feature: Setup 畫面 — 主題色切換 → Scenario: 點 dot 即時切換並持久化
> 詳細視覺切換 invariant 見 01-customization.flow.md

### 業務脈絡
- SetupScreen 已渲染，root data-theme 為 sunny

### E2E 驗證流程
1. 進入 `/`
2. 點擊 sakura 主題選擇器
3. 期待：
   - root `data-theme="sakura"`
   - sakura 選擇器 active、sunny / matcha 不 active
   - `localStorage.teru.themeColor` 為 "sakura"
   - 播放音效（pluck 系列，spec 記載 700Hz）

### Verification 策略
- evaluate 檢查 data-theme 與 localStorage
- 音效 spy 確認一次 oscillator 建立

### 不再凍結
- pluck 頻率
- 選擇器形式

---

## Flow: 開始按鈕停用 / 啟用門檻（field-validation）

> 對應 Feature: Setup 畫面 — 開始按鈕門檻與行為 → Scenarios: 空地點按鈕停用、填地點後可開始

### 業務脈絡
- location input 為空白或僅含空白

### E2E 驗證流程
1. 進入 `/`，清空 localStorage 確保 location 起始為空
2. 期待：「開始放晴」按鈕為 disabled
3. 在 input 輸入 "  "（純空白）
4. 期待：按鈕仍 disabled
5. 在 input 輸入 "台北"
6. 期待：按鈕變為 enabled

### Verification 策略
- 按鈕 `isDisabled()` 真假變化
- 也可檢查 `aria-disabled` / disabled attribute

### 不再凍結
- disabled 視覺呈現
- 按鈕文字（「開始放晴」/「啟程」/「開始」皆語意接近，但 spec 寫死「開始放晴」，建議保留）

---

## Flow: 點開始按鈕切到 praying（happy-path）

> 對應 Feature: Setup 畫面 — 開始按鈕門檻與行為 → Scenario: 點按鈕觸發切換

### 業務脈絡
- location input 為 "台北"、按鈕 enabled

### E2E 驗證流程
1. 進入 `/`，輸入 "台北"
2. 點擊「開始放晴」按鈕
3. 期待：
   - 播放 tok() 音效（音效 spy 計數 +1）
   - LoadingScreen 立即出現（transition=true）
   - 約 600ms 後 `useWishFlow().phase` 為 "praying"
   - `useWishFlow().date` 與 `useWishFlow().location` 已更新為使用者輸入
   - 約 1250ms 後 LoadingScreen 消失

### Verification 策略
- evaluate `useWishFlow().phase` 等於 `'praying'`
- 等候 PrayingScreen 標題「晴天娃娃降臨中」可見
- 音效 spy 計數變化

### 不再凍結
- 過場具體動畫
- 600ms 與 1250ms 是 spec 數字，測試可加寬容（如 500-800ms / 1000-1500ms）

---

## Flow: 開始時 trim 地點空白（happy-path）

> 對應 Feature: Setup 畫面 — 開始按鈕門檻與行為 → Scenario: Trim 空白

### 業務脈絡
- 使用者輸入 "  台北  "

### E2E 驗證流程
1. 進入 `/`，輸入 "  台北  "
2. 按開始
3. 期待：`useWishFlow().location.value` 為 "台北"

### Verification 策略
- evaluate 比對

### 不再凍結
- trim 時機（輸入時 trim / 提交時 trim 皆可）

---

## Flow: 切到 praying 顯示 PrayingScreen（happy-path）

> 對應 Feature: Praying 畫面 — 整體佈局 → Scenario: 切到 praying 顯示 PrayingScreen

### 業務脈絡
- 使用者完成 setup，phase 切為 praying

### E2E 驗證流程
1. 進入 `/`，完成 setup 至 praying
2. 期待：
   - 頂部顯示 `formatDateCN(date)` 格式的日期
   - 頂部顯示「為 {location} 祈禱晴天」
   - 中央顯示「晴天娃娃降臨中」
   - 底部顯示「點任意處 · 掛上晴天娃娃」

### Verification 策略
- `getByText('晴天娃娃降臨中')`
- `getByText(/為 .{1,10} 祈禱晴天/)`
- `getByText('點任意處 · 掛上晴天娃娃')` 或 regex `/點任意處.+掛上晴天娃娃/`
- 日期格式不強制具體字面，能找到包含年/月/日字元的文字即可

### 不再凍結
- 頂部 / 中央 / 底部之間的排版細節
- 日期格式具體呈現

---

## Flow: 點 stage 空白處新增娃娃（happy-path）

> 對應 Feature: Praying 畫面 — 點任意處掛娃娃 → Scenario: 點 stage 空白處新增娃娃

### 業務脈絡
- PrayingScreen 已渲染、目前娃娃數 N < 25

### E2E 驗證流程
1. 進入 `/`，完成 setup → praying
2. 點擊 stage 上不在頂部 meta 與返回鈕的位置
3. 期待：
   - 新增一隻娃娃至 slot N
   - 娃娃從點擊位置漂浮到 slot 位置（短暫具備 floating-in 視覺特徵）
   - 播放音效（chimeAt(N)）

### Verification 策略
- evaluate `useWishFlow().dolls.value.length` 從 N → N+1
- 音效 spy 計數 +1
- DOM 層找到第 N+1 個娃娃元素（透過 doll 範圍 / class / role 任一）

### 不再凍結
- 漂浮動畫的具體實作（class 名稱 floating-in 為 reference，可變）
- chime 具體頻率
- slot 排列演算法

---

## Flow: 點返回鈕回 setup（condition）

> 對應 Feature: Praying 畫面 — 點任意處掛娃娃 → Scenario: 點返回鈕不新增娃娃

### 業務脈絡
- PrayingScreen 已渲染

### E2E 驗證流程
1. 進入 `/`，進入 praying
2. 點擊返回鈕
3. 期待：
   - 不新增任何娃娃（dolls.length 不變）
   - phase 回到 setup（透過 LoadingScreen 過場後）

### Verification 策略
- 找返回鈕：role=button + accessible name 含「返回」/「上一步」/`/back/i` regex
- evaluate dolls.length 不變
- evaluate phase 變為 'setup'

### 不再凍結
- 返回鈕位置（spec 描述 `.pray-top` 內，但實際位置不限定 top-left / top-right）
- 返回鈕呈現（icon-only / 文字 / icon+文字）

---

## Flow: 點頂部 meta 區不新增娃娃（condition）

> 對應 Feature: Praying 畫面 — 點任意處掛娃娃 → Scenario: 點頂部 meta 區不新增娃娃

### 業務脈絡
- PrayingScreen 已渲染

### E2E 驗證流程
1. 進入 `/`，進入 praying
2. 點擊頂部 meta 區（顯示日期 / 地點的非按鈕區域）
3. 期待：
   - dolls.length 不變
   - phase 不變

### Verification 策略
- 找到頂部 meta 文字（如「為 {location} 祈禱晴天」），對其父容器內非按鈕區點擊
- evaluate 確認狀態不變

### 不再凍結
- meta 區具體 layout

---

## Flow: Stage resize 繩子與娃娃重畫（derivation）

> 對應 Feature: Praying 畫面 — Stage 與繩子響應式渲染 → Scenario: Stage 尺寸變動繩子跟著重畫

### 業務脈絡
- PrayingScreen 已渲染、已掛數隻娃娃

### E2E 驗證流程
1. 進入 `/`，進入 praying，新增 3-5 隻娃娃
2. 紀錄繩 SVG path 的 `d` 屬性與娃娃座標
3. `page.setViewportSize` 改變視窗大小
4. 期待：
   - 繩 path 的 `d` 不同於 resize 前
   - 已掛娃娃的 left/top 改變

### Verification 策略
- 蒐集 `<path>` 元素的 `d` 屬性，resize 前後比對不同
- 蒐集娃娃元素 computed left/top，比對不同

### 不再凍結
- 重畫使用的內部機制（ResizeObserver / matchMedia / 等）
- 繩子曲線具體公式（catenary 為 reference）

---

## Flow: 繩子順序由下往上（derivation）

> 對應 Feature: Praying 畫面 — Stage 與繩子響應式渲染 → Scenario: 繩子順序由下往上 0 → 4

### 業務脈絡
- PrayingScreen 首次渲染、stage 已有尺寸

### E2E 驗證流程
1. 進入 `/`，進入 praying
2. 找 5 條繩 path 元素
3. 期待：
   - 共 5 條
   - 按渲染順序（或 data-index），第 0 條 Y 最大（最底）、第 4 條 Y 最小（最上）
   - 每條中段點比兩端低（catenary sag，差值約 14px 為 reference）

### Verification 策略
- 蒐集 5 個 `<path>` 元素或對應繩 SVG 結構
- 解析每條 d 取兩端 Y 與中段 Y，比對 sag 存在（mid > both ends）
- 比對 rope 0 與 rope 4 的 Y 大小關係

### 不再凍結
- ROPE_SAG 具體值（14px 為 reference，10-20px 範圍均可）
- 繩數量未來是否從 5 改為其他常數（目前 spec 凍結為 5，但若需調整應更新 .feature）

---

## Flow: 娃娃漂浮入場切換為懸掛（happy-path）

> 對應 Feature: Praying 畫面 — 漂浮入場與懸掛擺動 → Scenario: 新娃娃從漂浮切到懸掛

### 業務脈絡
- PrayingScreen 已渲染

### E2E 驗證流程
1. 進入 `/`，進入 praying
2. 點 stage 新增第 N 隻娃娃
3. 立即（< 100ms）期待：娃娃元素具有 floating-in 視覺特徵（class / data-state / animation 任一）
4. 等候約 1100ms 後期待：娃娃元素切換為 hung 狀態

### Verification 策略
- 點擊後立即查娃娃元素 class / data-state 含 floating-in 或等價語意
- 1100ms 後查娃娃元素切換為 hung 或等價語意
- CSS 變數 `--from-x` / `--from-y` / `--sway-dur` / `--sway-delay` 存在於 inline style

### 不再凍結
- class 名稱（floating-in / floating / fly-in 等同義詞，但 spec 寫 floating-in 為 reference）
- 1100ms 時間具體值（測試容差 ±200ms）
- CSS 變數命名（建議保留 spec 字面）

---

## Flow: 不同 slot 擺動時序錯開（derivation）

> 對應 Feature: Praying 畫面 — 漂浮入場與懸掛擺動 → Scenario: 不同 slot 擺動時序不同

### 業務脈絡
- stage 上已有 5 隻以上 hung 娃娃

### E2E 驗證流程
1. 進入 `/`，進入 praying，點擊 5+ 次新增娃娃，等候皆切到 hung
2. 蒐集每隻娃娃的 `--sway-dur` 與 `--sway-delay`
3. 期待：5 個值不全相同

### Verification 策略
- 蒐集 inline style 的 CSS 變數，比較唯一值數量 > 1

### 不再凍結
- 具體 dur / delay 範圍與分布演算法

---

## Flow: 第 25 次點擊後自動切 complete（happy-path）

> 對應 Feature: Praying 畫面 — 滿 25 自動切換、鎖第 26 隻 → Scenario: 第 25 次點擊後自動切 complete

### 業務脈絡
- stage 上已有 24 隻娃娃

### E2E 驗證流程
1. 進入 `/`，進入 praying，連續點擊 25 次（或預先 evaluate 設定 24 隻再點 1 次）
2. 第 25 次點擊後期待：
   - `dolls.value.length === 25`
   - 約 1400ms 後 phase 變為 "complete"
   - 過場 LoadingScreen 期間出現再消失

### Verification 策略
- evaluate dolls.length
- 等候 CompleteScreen 標示元素（「{TOTAL_DOLLS} 隻晴天娃娃，已經掛滿」）可見

### 不再凍結
- 1400ms 容差 ±200ms

---

## Flow: 滿 25 後過渡期內再點不增加（condition）

> 對應 Feature: Praying 畫面 — 滿 25 自動切換、鎖第 26 隻 → Scenario: 滿 25 後再點不增加

### 業務脈絡
- 剛掛滿 25 隻、1400ms 過渡尚未結束

### E2E 驗證流程
1. 進入 `/`，進入 praying，掛滿 25 隻
2. 立即（< 1400ms 內）再次點擊 stage 任一位置
3. 期待：
   - dolls.length 仍為 25
   - phase 不重複觸發 transition
   - 1400ms 後正常切到 complete（不重複切）

### Verification 策略
- evaluate dolls.length 不變
- spy goTo 呼叫只發生一次（透過 LoadingScreen v-if 變化次數推測，或檢查 phase 切換歷程）

### 不再凍結
- 鎖住點擊的具體實作（disabled / pointer-events / 程式判斷皆可）

---

## Flow: CompleteScreen clouded 初始狀態（happy-path）

> 對應 Feature: Complete 畫面 — 三段動畫時序 → Scenario: clouded 初始狀態

### 業務脈絡
- phase 剛切為 complete、CompleteScreen 剛 mount

### E2E 驗證流程
1. 進入 `/`，完成全流程至 complete
2. 立即（< 100ms 內）期待：
   - Sun 元素 opacity 0.25、scale 0.85 視覺特徵
   - 5 朵雲位於中央
   - 完成文字不可見（opacity 0）

### Verification 策略
- 對 Sun 元素檢查 computed style 或 inline style 反映半透明 / 縮小
- 5 朵雲元素的 transform / position 落在中央區域（不強制精確座標，落在 viewport 中心 ±100px 範圍）
- 完成文字 opacity 為 0 / display none / 尚未渲染

### 不再凍結
- opacity / scale 具體值（0.25 / 0.85 為 reference）
- 5 朵雲的具體初始座標公式

---

## Flow: CompleteScreen clearing 階段（happy-path）

> 對應 Feature: Complete 畫面 — 三段動畫時序 → Scenario: clearing 階段 350ms 後

### 業務脈絡
- CompleteScreen 已 mount

### E2E 驗證流程
1. 進入 `/`，至 complete
2. 等候 350ms（容差 ±100ms）
3. 期待：
   - Sun fade-in，scale 接近 1.0
   - 5 朵雲朝四角方向移動（位置偏離中央）

### Verification 策略
- Sun opacity > 0.5 且 scale 接近 1
- 雲朵元素位置不再於中央，散布到接近四角

### 不再凍結
- 各雲 animation-delay 具體值（0/80/160/240/320ms 為 reference）
- 雲朵終點具體座標

---

## Flow: CompleteScreen done 階段播 bloom（happy-path）

> 對應 Feature: Complete 畫面 — 三段動畫時序 → Scenario: done 階段 1900ms 後

### 業務脈絡
- CompleteScreen 已 mount

### E2E 驗證流程
1. 進入 `/`，至 complete
2. 等候 1900ms（容差 ±300ms）
3. 期待：
   - Sun opacity 1
   - 雲已不在畫面（v-if !== "done" 時移除）
   - 完成文字浮現（opacity 1、translateY 為 0）
   - 系統呼叫過 `useTeruAudio.bloom()`

### Verification 策略
- Sun computed opacity 1
- 雲朵元素已從 DOM 移除（`expect(locator).toHaveCount(0)`）
- 完成文字可見：`getByText(/已經掛滿/)` visible
- bloom 音效 spy 計數 +1

### 不再凍結
- 雲消失的方式（fade out / unmount 皆可）
- 文字 transform 具體距離

---

## Flow: 動畫中 unmount 清除 timer（edge-case）

> 對應 Feature: Complete 畫面 — 三段動畫時序 → Scenario: 元件 unmount 清除 timer

### 業務脈絡
- CompleteScreen 已 mount 但尚未進入 done

### E2E 驗證流程
1. 進入 `/`，至 complete
2. 在 1900ms 前找「重新祈禱」按鈕並點擊
   - 注意：若 spec 預期此時按鈕尚未浮現，可由 evaluate 強制觸發 unmount（呼叫 goTo("setup") 或 reload）
3. 期待：
   - 不會在 unmount 後執行 bloom（bloom 音效計數應為 0）
   - 不會 throw uncaught error
   - phase 切回 setup 或新狀態正常

### Verification 策略
- spy bloom 呼叫次數
- console 無 uncaught exception

### 不再凍結
- 重新祈禱按鈕在 done 前是否可見（spec 通常於 done 才浮現；測試此 scenario 改用 evaluate 直接觸發 phase 切換較穩定）

---

## Flow: 達成文案數字動態（happy-path）

> 對應 Feature: Complete 畫面 — 達成文案 → Scenario: 文案顯示 25 而非 20

### 業務脈絡
- CompleteScreen 進入 done 階段

### E2E 驗證流程
1. 進入 `/`，完成全流程至 complete done
2. 期待：完成副標顯示「{TOTAL_DOLLS} 隻晴天娃娃，已經掛滿」，目前常數為 25

### Verification 策略
- `getByText(/25 隻晴天娃娃，已經掛滿/)`
- 若 TOTAL_DOLLS 修改：透過 evaluate 取常數值並動態組字串斷言

### 不再凍結
- 副標其他文字裝飾（前後綴句子）
- 25 為當前常數，未來改變需同時更新 spec

---

## Flow: 完成階段顯示祈禱對象資訊（happy-path）

> 對應 Feature: Complete 畫面 — 達成文案 → Scenario: 顯示祈禱對象資訊

### 業務脈絡
- 使用者於 setup 階段選了日期與輸入地點

### E2E 驗證流程
1. 進入 `/`，setup 選日期、輸入地點 "淡水"
2. 完成全流程至 complete done
3. 期待：
   - 顯示 formatDateCN(date) 格式的日期文字
   - 顯示「為 淡水 祈禱」

### Verification 策略
- `getByText('為 淡水 祈禱')` 或 regex
- 日期文字檢查（找到含當天年/月/日字串）

### 不再凍結
- 日期具體呈現格式
- 文字排版順序（日期在上 / 地點在上）

---

## Flow: 點重新祈禱回 setup（happy-path）

> 對應 Feature: Complete 畫面 — 重新祈禱 → Scenario: 點重新祈禱回到 setup

### 業務脈絡
- CompleteScreen 處於 done 階段

### E2E 驗證流程
1. 進入 `/`，完成全流程至 complete done
2. 點擊「重新祈禱」按鈕
3. 期待：
   - 播放 tok() 音效
   - 過場後 phase 變為 "setup"
   - `dolls.value.length` 為 0

### Verification 策略
- 找「重新祈禱」按鈕：`getByRole('button', { name: /重新祈禱/ })`
- 音效 spy 計數 +1
- evaluate phase 與 dolls.length

### 不再凍結
- 按鈕位置 / icon

---

## Flow: 重新祈禱保留地點（persistence）

> 對應 Feature: Complete 畫面 — 重新祈禱 → Scenario: 重新祈禱保留地點

### 業務脈絡
- 使用者於 setup 輸入 "淡水" 並完成至 complete

### E2E 驗證流程
1. 進入 `/`，輸入地點 "淡水"，完成全流程至 complete
2. 點「重新祈禱」回 setup
3. 期待：
   - location input 仍顯示 "淡水"
   - "淡水" chip 仍 active（若 "淡水" 不在 chips 清單，則僅 input 顯示）
   - localStorage.teru.location 仍為 "淡水"

### Verification 策略
- input value 斷言
- chip active 狀態（"淡水" 不在預設 8 個，所以無 chip active；若 spec 描述「淡水 chip 套 active」可能指自由輸入時是否該被視為 active，此處保守驗 input value 即可）

### 不再凍結
- 自由輸入時 chip 是否需出現對應 active（spec 描述模糊，建議以 input 內容為準）

---

## Flow: 重新祈禱重置日期為今天（derivation）

> 對應 Feature: Complete 畫面 — 重新祈禱 → Scenario: 重新祈禱重置日期為今天

### 業務脈絡
- 使用者於 setup 選了 "2026/12/25" 並完成至 complete

### E2E 驗證流程
1. 進入 `/`，選日期 2026/12/25，完成全流程
2. 點「重新祈禱」
3. 期待：SetupScreen 的 date 為今天

### Verification 策略
- evaluate `useWishFlow().date.value` 等於今天 00:00:00
- week strip 「今天」標示

### 不再凍結
- date 重置時機（goTo 之前 / 之後）

---

## Flow: 任何 phase 切換時 LoadingScreen 出現（happy-path）

> 對應 Feature: LoadingScreen 過場 curtain → Scenario: 任何 phase 切換時 LoadingScreen 出現

### 業務脈絡
- 任一 phase

### E2E 驗證流程
1. 進入 `/`，於 setup 完成輸入並按開始
2. 期待：
   - 點擊瞬間 `useWishFlow.transition.value` 為 true
   - LoadingScreen 覆蓋整個畫面（高 z-index、佔滿視窗）

### Verification 策略
- evaluate transition 為 true
- LoadingScreen 元素 visible 且 bounding box ≈ viewport size

### 不再凍結
- LoadingScreen 內容（curtain SVG / Sun / tagline 為 reference）
- 高 z-index 具體值

---

## Flow: 1250ms 後 LoadingScreen 自動消失（happy-path）

> 對應 Feature: LoadingScreen 過場 curtain → Scenario: 1250ms 後 LoadingScreen 自動消失

### 業務脈絡
- goTo 已被呼叫

### E2E 驗證流程
1. 進入 `/`，觸發任一 phase 切換
2. 等候 1250ms（容差 ±300ms）
3. 期待：
   - `transition` 變回 false
   - LoadingScreen 從 DOM 移除

### Verification 策略
- evaluate transition 為 false
- LoadingScreen 元素 `toHaveCount(0)` 或 detached

### 不再凍結
- 1250ms 容差

---

## Flow: LoadingScreen 元件無 props 無 timer（derivation）

> 對應 Feature: LoadingScreen 過場 curtain → Scenario: LoadingScreen 不接 props 也不設 timer

### 性質
此 invariant 偏向實作合約。E2E 難直接驗證「無 props / 無 timer」，但可透過行為間接驗證：

### E2E 驗證流程
1. 進入 `/`，觸發過場，LoadingScreen mount
2. 期待：LoadingScreen 元件存在期間，畫面只顯示 curtain / Sun / tagline 視覺
3. 透過 vitest 單元測試補強驗證（不在本 flow 範圍）

### Verification 策略
- 主要由元件 unit test 守護
- E2E 可斷言 LoadingScreen 範圍內元素類型（無互動元素 / 無 input）

### 不再凍結
- LoadingScreen 內容細節（curtain SVG / Sun / tagline 形式可調）

---

## Mock 假設
- 無後端 API mock 需求（純前端應用）
- localStorage 需在每個 flow 開始前清空（`page.context().clearCookies()` + 進入頁前 `localStorage.clear()`）或於 `page.addInitScript` 注入預設值
- 時間：建議使用 `page.clock` 或避開跨日邊界執行
- 音效 spy：於 `page.addInitScript` 中包裝 `window.AudioContext` constructor 與 `Oscillator` / `BufferSource` 建立計數

## Testid 索引（fallback only）

本 flow 盡量使用語意 locator（role + name + text），testid 僅在以下難以消歧時使用：

| testid | 用途 | 必要性 |
|--------|------|--------|
| `wish-stage` | praying stage 容器（點擊新增娃娃的可點區域） | 視 PrayingScreen 結構需求加上 |
| `wish-doll-{index}` | 個別娃娃元素（需精準找特定 slot 時） | fallback only |
| `wish-rope-{index}` | 個別繩 SVG path（需驗 path d 屬性時） | fallback only |
| `wish-loading-screen` | LoadingScreen 容器（驗存在 / 消失） | fallback only |
| `wish-complete-restart-button` | 重新祈禱按鈕（若文字無法穩定 disambiguate） | fallback，建議優先 `getByRole('button', { name: /重新祈禱/ })` |

> 命名規則遵守 testid-conventions.md：kebab-case、entity 在前、role 在後、businessId 在最後。
