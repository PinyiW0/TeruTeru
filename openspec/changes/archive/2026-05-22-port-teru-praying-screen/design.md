## Context

PrayingScreen 是流程中最複雜的互動畫面:**整片畫面是點擊區、25 隻娃娃依固定 slot 排在 5 條繩上、漂浮動畫**。Reference `praying.jsx`(196 行)的核心邏輯在 foundation 階段已 port 到 `useWishFlow.addDoll` / `slotToXY`;本 change 只負責「組裝 UI」。

## Goals / Non-Goals

**Goals:**
- 點任意處新增一隻娃娃,從點擊位置漂浮到對應 slot
- 25 隻娃娃依固定 slot 位置排列,5 條繩呈 catenary sag 曲線
- 漂浮動畫 ~1.1s,結束後切到 `hung` class 開始永久擺動
- 頂部 meta 顯示日期 + 「為 X 祈禱晴天」
- 返回鈕回到 setup
- 點擊頂部 meta / 返回鈕 **不**新增娃娃
- 滿 25 後 1400ms 自動切 complete,使用者快速重複點擊不會出現第 26 隻

**Non-Goals:**
- 加震動(navigator.vibrate)、加觸覺回饋 — 不做(reference 沒做)
- 限制連點頻率(throttle / debounce)— 不做,reference 允許 rapid taps
- 自訂繩數或 slot 數 — 不做,沿用 5×5
- 撤銷上一隻娃娃 — 不做

## Decisions

### 1. Tap detection:root container @click + closest 排除 chrome

`<div class="screen praying" @click="handleTap">` 整個 stage 接 click,handler 內 `event.target.closest('.pray-back, .pray-top')` 排除頂部區域與返回鈕。

**理由**:reference 行為。比起在 stage 中間放透明 overlay 接 click,直接接根節點較簡單;chrome 元素用 `@click.stop` 阻止冒泡是另一個選項,但與 reference 寫法分歧、不一致。

**Alternatives:**
- 透明 button 覆蓋整個 stage — 破壞 SVG 互動可能性
- `@click.stop` on chrome — 增加散落的 stopPropagation

### 2. Stage size via ResizeObserver

`ref="stageRef"` + `onMounted` 內 `new ResizeObserver(update)` + `update()` 立即跑一次,寫入 reactive `size = { w, h }`。`addDoll` 與 SVG path 計算都需要這個 size。

**理由**:reference 行為。`size` 改變(rotate 螢幕、window resize)時繩子與 slot 自動跟著重排。

### 3. Rope SVG paths 用 computed 計算

`ropePaths = computed(() => ...)`:依 `size` 變化即時重算 5 條 path d、tack 圓座標、midX/midY。包進 `<svg class="clothesline-svg">`。

**理由**:Vue 的 computed 自動處理依賴追蹤;reference 用 plain const 在 render function 內計算,Vue 用 computed 更慣用。

### 4. Doll 渲染:absolute positioned `<div>` 包 `<TeruDoll>`,動畫透過 class 切換

```html
<div :class="['doll', doll.hung ? 'hung' : 'floating-in']"
     :style="{ left, top, '--from-x', '--from-y', '--sway-dur', '--sway-delay' }">
  <TeruDoll :index="doll.slot" :doll-style :visual-style :size="DOLL_SCALE" />
</div>
```

`floating-in` 與 `hung` 兩個 class 已在 teru.css 內定義動畫(用 `--from-x` / `--from-y` 等 CSS 變數)。本元件**不寫 CSS**,只負責綁屬性。

**注意**:每隻 doll 的 sway 動畫透過 `--sway-dur` 與 `--sway-delay` CSS 變數錯開時序,避免整排同步擺動。

### 5. addDoll 已在 useWishFlow,本元件只 wrap tap → addDoll

UI 元件職責是「把 tap 座標轉成相對 stage 的 (x, y) 並呼叫 composable」。composable 已處理:slot 計算、from offsets、push、`hung` class 1100ms 後切換、滿 25 自動切 complete。

**理由**:foundation 階段已決定 state 邏輯放 composable。

### 6. DOLL_SCALE = 0.86 寫死

Reference 用 0.86 縮娃娃以配合 5×5 排版不擠;沿用。

### 7. 過場期間整個畫面渲染但靠 LoadingScreen 蓋住

phase 切換時 `useWishFlow.transition` 為 true,理論上應該有 LoadingScreen 蓋上去。**本 change 不實作 LoadingScreen**(留待 complete-screen change 或單獨 change),先讓 phase 切換無 curtain 過場 — 體驗略生硬但流程通。

**Trade-off**:接受短暫無 curtain,讓本 change 範圍聚焦在 praying 本身。

## Risks / Trade-offs

- **[Risk] ResizeObserver 在 SSR 環境炸** → Mitigation:全部包 `onMounted` + `import.meta.client`
- **[Risk] iPhone notch / safe-area 在 fullscreen tap 時誤觸 chrome** → Mitigation:reference 已用 `viewport-fit=cover` + chrome 區固定在 top safe-area 內(.pray-top 用 padding-top: env(safe-area-inset-top))— 由 teru.css 處理
- **[Risk] 25 隻 doll 同時動畫在低階手機卡** → Mitigation:reference 已驗證 transform/opacity-only 動畫;本元件不引入額外動畫
- **[Risk] 滿 25 後 1400ms 內快速 reload 會看到「卡在 25 隻但已 transition=true」的中間狀態** → 接受,reload 後 state 全部重置(透過 `useState` SSR fallback,user 不會看到)
- **[Risk] iOS Safari `event.target` 在 SVG 內部可能是 path 而非 group,closest 仍能往上找到 `.pray-top`** → 確認 reference 行為:`.pray-top` 在 SVG 之外的 div,closest 會 hit;放心
- **[Trade-off] 無 LoadingScreen 過場** → 接受,下一個 change 補上

## Open Questions

無 — reference 完備、foundation 已提供 composable。
