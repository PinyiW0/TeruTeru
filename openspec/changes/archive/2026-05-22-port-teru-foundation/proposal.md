## Why

把 ui-reference 移植到 Nuxt 4 之前,先建好「**任何 screen 都會用到的基礎建設**」:全域 CSS、主題切換機制、共用 SVG 元件(娃娃、雲、太陽)、3 個 composable(tweaks、audio、wishFlow)。這層做完之後,後續每個 screen 的 change 都只是組裝既有零件,不會重複 port 基礎邏輯。

這是 5 個 port-* change 的第一個。後續 change 依序:setup-screen、praying-screen、complete-screen、tweaks-dev-panel。

## What Changes

- 建立全域 CSS(從 `spec/ui-config/ui-reference/styles.css` 直接 port,作為 unscoped 真理庫)
- 修改 `app/app.vue`:`<NuxtWelcome />` → `<NuxtPage />`,並依 `useTweaks` 把 `data-theme/font/style` 綁到 root
- 修改 `nuxt.config.ts`:載入 teru.css、Google Fonts(Huninn / Klee One / Zen Maru Gothic / Noto Sans TC / Yuji Boku)、補上 mobile viewport meta
- 建立型別檔(`app/types/wish.ts`、`app/types/tweaks.ts`)
- 建立 3 個 composable:`useTweaks` / `useTeruAudio` / `useWishFlow`(API 完整、本 change 內不接 UI)
- 建立共用 SVG 元件:`DollDefs` / `TeruDoll` / `BgClouds` / `SunIcon` / `RainCloud`
- 建立**最小 placeholder `pages/index.vue`**:render 一隻 doll + 主題切換 dot,證明所有基礎能跑

## Capabilities

### New Capabilities
- `teru-teru-customization`: 三主題色系切換(sunny/sakura/matcha)透過 root `data-theme` + CSS 變數實現;dev-only 設定(視覺風格、娃娃造型、字體、音效)由 `useTweaks` 管理;音效系統(pluck/chime/chimeAt/tok/bloom)由 `useTeruAudio` 提供且首次互動才 init AudioContext

### Modified Capabilities
<!-- 無;這是第一個 change -->

## Impact

- **新增**:
  - `app/assets/css/teru.css`(port styles.css)
  - `app/types/wish.ts`、`app/types/tweaks.ts`
  - `app/composables/useTweaks.ts`、`useTeruAudio.ts`、`useWishFlow.ts`
  - `app/components/DollDefs.vue`、`TeruDoll.vue`、`BgClouds.vue`、`SunIcon.vue`、`RainCloud.vue`
  - `app/pages/index.vue`(placeholder,僅展示一隻 doll + 3 個主題 dot 驗證 wiring)
- **修改**:
  - `app/app.vue`:換 `<NuxtPage />`、綁 `data-theme/font/style`
  - `nuxt.config.ts`:css、app.head.link(fonts)、app.head.meta(viewport)
- **不影響**:server/、現有 spec/、其他既有 Nuxt 模板配置
- **依賴**:不引入新 npm package
- **後續 change 依賴**:setup/praying/complete-screen 三個 change 都依賴本 change 的元件與 composable
