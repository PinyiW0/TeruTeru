## Context

Reference `complete.jsx` 同時定義 `CompleteScreen` 與 `LoadingScreen`(共用 `Sun` 與 `RainCloud` 元件,foundation 已 port)。本 change 把這兩個 screen 一起 port,因為 LoadingScreen 是進入 CompleteScreen 的視覺序曲、兩者使用同樣 asset。

## Goals / Non-Goals

**Goals:**
- CompleteScreen 三段動畫嚴格遵循 reference 時序(clouded 0 → clearing 350ms → done 1900ms)
- 進入 done phase 同時播 `bloom()`
- 文字「一定會是好天氣的!」+ 動態娃娃數(從 `TOTAL_DOLLS` 讀,不寫死 20)+ 日期 + 地點 + 「重新祈禱」按鈕
- 「重新祈禱」呼叫 `tok()` + `goTo('setup')`,完整 reset 流程
- LoadingScreen 在任何 phase 切換時透過 `v-if="transition"` 蓋在最上層

**Non-Goals:**
- 自訂雲離場路徑、自訂太陽外觀 — 不做(沿用 reference 寫死座標)
- 完成後分享、截圖、許願紀錄 — 不做(留待後續 change)
- LoadingScreen 加變化(不同 phase 不同視覺)— 不做,統一一套 curtain

## Decisions

### 1. Phase 內動畫用 `ref<phase>` + setTimeout 而非 Vue Transition

CompleteScreen 內部 state `animPhase: 'clouded' | 'clearing' | 'done'`,`onMounted` 內兩個 setTimeout 推進(350ms 切 clearing、1900ms 切 done + bloom)。`onBeforeUnmount` 清空 timer 以防使用者快速離開。

**理由**:reference 行為一致;Vue Transition 適合單一進場/離場、不適合三段時序。

### 2. 元素的呈現透過 inline style + opacity / transform transition

每個視覺元素(Sun、文字、光暈背景)有 `:style="{ opacity, transform, transition }"`,值依 `animPhase` computed。離場雲(`.depart-cloud`)用 CSS animation + `animation-delay` 錯開(沿用 teru.css 的 keyframe)。

**理由**:reference 直接 inline style,移植 1:1。teru.css 沒有為 `.complete-*` 元素寫 transition,所以靠 inline 控制。

### 3. 5 朵離場雲座標常數寫在元件內

```ts
const departing = [
  { fromX: -30, fromY: -10, toX: -260, toY: -160, w: 110 },
  { fromX: 40, fromY: -30, toX: 260, toY: -200, w: 130 },
  { fromX: -60, fromY: 40, toX: -300, toY: 100, w: 100 },
  { fromX: 50, fromY: 50, toX: 280, toY: 140, w: 120 },
  { fromX: 0, fromY: -60, toX: 0, toY: -260, w: 90 },
]
```

不抽 helper,reference 寫死座標、視覺設計 baked。

### 4. LoadingScreen 在 `pages/index.vue` 頂層渲染,不在各 screen 內

```vue
<SetupScreen v-if="..." />

<PrayingScreen v-else-if="..." />

<CompleteScreen v-else />

<LoadingScreen v-if="transition" />  <!-- 蓋最上 -->
```

`teru.css` 中 `.loader` 已是 fixed + 高 z-index,跨 screen 通用。

**理由**:過場是 app 層級行為而非 screen 內部行為。

### 5. Restart 行為:`tok() + goTo('setup')` + 不清地點

CompleteScreen 的「重新祈禱」按鈕呼叫 `tok()` + `goTo('setup')`。`goTo('setup')` 內部會清空 `dolls`(已在 foundation 寫好),但**保留 location**(`useWishFlow.location` 由 localStorage 持久化,使用者下次祈願不用再輸入)。

**理由**:reference 行為。

### 6. Bug fix:文案「20 隻」改為動態讀 `TOTAL_DOLLS`

Reference `complete-sub` 寫死「20 隻晴天娃娃,已經掛滿」,但 `TOTAL_DOLLS = 25`。修正後:

```html
<p class="complete-sub">{{ TOTAL_DOLLS }} 隻晴天娃娃,已經掛滿</p>
```

### 7. LoadingScreen 自動消失機制 — 不在 LoadingScreen 內,由 `useWishFlow.goTo` 控制

`useWishFlow.goTo` 已設定 1250ms 後 `transition = false`,LoadingScreen 用 `v-if="transition"` 自然消失。LoadingScreen 元件本身**不做** setTimeout、不接 callback。

**理由**:state 邏輯集中在 composable,view 元件純呈現。

### 8. CompleteScreen 內的 Sun 大小固定 220,LoadingScreen 內 140

沿用 reference 數值,行動裝置上以 viewport center 對齊,無需縮放(reference 行為一致)。

## Risks / Trade-offs

- **[Risk] setTimeout 在使用者快速按瀏覽器回上一頁 / 切換 tab 時可能在 unmount 後觸發** → Mitigation:`onBeforeUnmount` 清空 timer
- **[Risk] bloom() 在 `animPhase = 'done'` 切換瞬間呼叫,若 `soundOn = false` 應該 noop** → 已由 `useTeruAudio` 內部處理(`if (!isOn()) return`)
- **[Risk] LoadingScreen 與 CompleteScreen 同時 mount 時 z-index 衝突** → Mitigation:teru.css 中 `.loader { z-index: 高 }`,沿用
- **[Risk] iOS Safari `100dvh` 在 LoadingScreen fullscreen 時有 viewport 切換閃爍** → 接受,reference 已 viewport-fit=cover
- **[Trade-off] 離場雲座標固定(非依 viewport 計算)** → 行動裝置上可能略偏出畫面,接受(`overflow: hidden` 由 `.complete` 容器處理)

## Open Questions

無 — reference 完備、foundation 與前 3 個 change 已提供所有依賴。
