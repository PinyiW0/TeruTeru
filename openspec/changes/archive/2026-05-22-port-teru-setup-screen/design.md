## Context

Reference `setup.jsx`(222 行)定義了 setup 畫面的完整行為。本 change 把它 1:1 port 到 Vue,沿用 foundation 已 port 進 `teru.css` 的所有 `.setup-*` / `.theme-*` / `.weekstrip-*` / `.chip` / `.loc-input` / `.start-cta` / `.btn-primary` style,不重寫樣式。

## Goals / Non-Goals

**Goals:**
- SetupScreen 元件呈現與 reference 視覺一致(主標、副標、theme dot、年/月/日 select、week strip、地點輸入 + chips、開始按鈕、底部 hint)
- 過去日期不可選(week strip 與 select 雙重 gate)
- 「今天」在 week strip 上 mount 時自動 scroll 置中
- 地點透過 `useWishFlow.location` + localStorage 持久化(reload 後沿用)
- 主題色切換直接呼叫 `useTweaks.setTweak('themeColor', ...)` 並 pluck(700)
- 按「開始放晴」呼叫 `tok()` + `goTo('praying', { date, location })`,phase 切到 praying

**Non-Goals:**
- PrayingScreen 實作 — 留待下個 change(本 change 進入 praying 後僅顯示 placeholder)
- 地點 chip 自訂、編輯、新增 — 不做,固定 8 個
- 日期選擇器的 i18n(英文/日文版面) — 不做
- 自訂主題色(使用者自己挑 hex) — 不做
- 鍵盤 a11y 強化(arrow key 切日期等) — 不做(reference 也沒做)

## Decisions

### 1. SetupScreen 的 input 用原生 `<input>`,不用 NuxtUI `<UInput>`

`<input class="loc-input">` + `<select>`:reference 已寫好 `.loc-input`、`.date-picker select` style,NuxtUI 包進去反而要 override 一堆預設樣式。

**理由**:foundation 的 teru.css 已涵蓋這些 control 的視覺;NuxtUI 的 UInput/USelectMenu 設計語言與 reference 不一致(更現代、不夠手作感)。

**Alternatives:**
- 全用 NuxtUI — 視覺風格衝突
- 混搭(form field 用 UFormField + 原生 input) — 增加複雜度,沒明顯好處

### 2. utility 集中放 `app/utils/wishDate.ts`

`formatDateCN` / `buildDays` / `isSameDay` 三個 pure function,加上常數 `COMMON_LOCATIONS` / `WEEKDAY_LABELS` 放同一檔。

**理由**:這些 function 會被 praying/complete 也用到(reference 中 setup/praying/complete 都呼叫 `formatDateCN`)。集中以避免之後重複。**不**走 auto-import,顯式 import 較清楚 dependency。

### 3. Year range:沿用 reference 的「今天起算 + 2 年」

```ts
const minYear = today.getFullYear()
const years = [minYear, minYear + 1, minYear + 2]
```

如果使用者選了 minYear,month select 起點從今天的 month 開始;當 month 也是當月,day select 起點從今天的 date 開始。

**理由**:三年通常足夠涵蓋使用者實際祈願範圍(下個假期、明年生日、後年婚禮)。

### 4. Week strip mount 時 scroll-into-view

`onMounted` 後呼叫 `nextTick` → 找到 selected day 的 ref → `stripRef.scrollTo({ left, behavior: 'smooth' })`。後續 `date` 變化時 watch 跟著 scroll。

**理由**:reference 行為。

**注意**:SSR 階段不能存取 `scrollTo` — 全部包在 `onMounted` + `import.meta.client` 內。

### 5. Phase 切換策略 — 進入 praying 顯示 placeholder

`pages/index.vue` 改成:

```vue
<SetupScreen v-if="phase === 'setup'" />

<div v-else-if="phase === 'praying'" class="placeholder-stage">
  PrayingScreen 尚未實作,目前 phase = praying。
  <button @click="reset">回 setup</button>
</div>

<div v-else>
  CompleteScreen 尚未實作。
</div>
```

**理由**:本 change 證明「按開始能切 phase」即可;praying 真正畫面下個 change 處理。提供「回 setup」按鈕方便手動驗證。

### 6. 地點持久化的責任在 `useWishFlow`,不在 SetupScreen

`useWishFlow` 內把 `location` 的 `useState` 初始值改成「優先讀 `localStorage.teru.location`」,並在 client 端 `watch(location, ...)` 寫回。SetupScreen 只負責顯示與更新 `location.value`,不知道有 localStorage 這件事。

**理由**:reference 把持久化邏輯放在 App component,但 Vue/Nuxt 用 composable 是更乾淨的分層。SetupScreen 純 view,持久化是 state 層職責。

### 7. SetupScreen 本身不接 `props`,直接讀 `useWishFlow` / `useTweaks` / `useTeruAudio`

不傳 `onStart`、`themeColor`、`onThemeChange` 等 props。元件內部自行 wire composables。

**理由**:reference 用 props 是 React 沒有全域 state 慣例;Vue/Nuxt 有 composable 全域共享,props 反而是 over-engineering。SetupScreen 只在一個地方被用(`pages/index.vue`),沒有 reuse 需求。

### 8. 「今天」+「已選」雙重狀態的 class 疊加

依 reference:`is-today` / `is-selected` / `is-disabled` 三個 class 可同時存在(例如選了今天 → 同時 is-today + is-selected,套用 styles.css 的 `.day.is-selected.is-today { background: var(--sun-deep) }`)。

實作:`:class="[{ 'is-today': isToday(d), 'is-selected': isSelected(d), 'is-disabled': isPast(d) }]"`。

### 9. 音效對應(直譯 reference)

| 互動 | 音效 |
|---|---|
| 切換主題 dot | `pluck(700)` |
| 改年/月/日 select | `pluck(660)` |
| 點 week strip 某日 | `pluck(720)`(過去日無聲) |
| 點地點 chip | `pluck(620)` |
| 按「開始放晴」 | `tok()` |

## Risks / Trade-offs

- **[Risk] `localStorage.teru.location` 在 SSR 階段不存在,初次 hydrate 可能 mismatch** → Mitigation:`useState` 初始值用 function form,內部 `if (!import.meta.client) return ''`,client 端 hydration 完成後再讀 storage 並 sync(或在 `onMounted` 內補讀)。這會造成首次 paint 是空字串、然後跳成記憶值 — 接受(setup 畫面不在意這個短暫 flicker)
- **[Risk] week strip 用 ResizeObserver / scrollTo 在 SSR 環境炸** → Mitigation:全部包 `onMounted` + `if (import.meta.client)`
- **[Risk] 64 個 `<div class="day">` 在低階手機可能重排慢** → Mitigation:reference 已驗證過尺寸,接受
- **[Risk] iOS Safari `<select>` 預設樣式醜** → 接受,reference 也用原生 select;若日後想美化另開 change
- **[Trade-off] 不用 NuxtUI 元件,放棄了 dark mode 自動切換** → 接受,teru.css 沒設計 dark mode

## Open Questions

無 — reference 完備,foundation 已就緒。
