## 1. LoadingScreen 元件

- [x] 1.1 建立 `app/components/LoadingScreen.vue`:無 props、無 setTimeout、純呈現
- [x] 1.2 渲染 `.loader-sun`(`<SunIcon :size="140" />`)、左右兩塊 `.loader-curtain-l` / `.loader-curtain-r` SVG(內含 cloud silhouette path + rain strands,沿用 reference 寫死 SVG)、底部 `.loader-text` "Loading ... Sunshine" tagline(含 3 個 `.dot` span)

## 2. CompleteScreen 元件

- [x] 2.1 建立 `app/components/CompleteScreen.vue`:取 `useWishFlow()`(date / location / goTo / TOTAL_DOLLS)、`useTeruAudio()`(tok / bloom)、import `formatDateCN`
- [x] 2.2 實作 animPhase state(`'clouded' | 'clearing' | 'done'`),`onMounted` 設兩個 timer:350ms → clearing、1900ms → done + bloom();`onBeforeUnmount` 清空 timer
- [x] 2.3 渲染背景光暈:fixed inset-0 div with `radial-gradient`,opacity 依 animPhase 切(done = 1,其他 = 0),transition 1.2s
- [x] 2.4 渲染中央 Sun:`<SunIcon :size="220" />`,inline style 控制 opacity 與 scale(clouded = 0.25/0.85,其他 = 1/1),transition 1.2s
- [x] 2.5 渲染 5 朵離場 RainCloud(`<RainCloud :w :color="#7F8FA3" :drops="phase === 'clouded' ? 3 : 0" />`):`v-if="phase !== 'done'"`,inline style 設 from / to / `animation-delay`(i * 80ms),沿用 reference 5 組 fromX/fromY/toX/toY/w 座標
- [x] 2.6 渲染文字 + CTA:`v-show` 透過 inline style opacity / translateY 控制(done = 1/0,其他 = 0/12px),含 `.complete-title`「一定會是好天氣的!」、`.complete-sub`「{{ TOTAL_DOLLS }} 隻晴天娃娃,已經掛滿」、`.complete-meta`(formatDateCN + 換行 + 「為 X 祈禱」)、`.btn-primary` 「重新祈禱」按鈕(click → `tok()` + `goTo('setup')`)

## 3. 頁面整合

- [x] 3.1 修改 `app/pages/index.vue`:`phase === 'complete'` 從 placeholder 換成 `<CompleteScreen />`、頂層加 `<LoadingScreen v-if="transition" />`(讀 `useWishFlow().transition`)

## 4. 視覺與功能驗證

- [x] 4.1 跑 `npx eslint . --fix` 與 `nuxi typecheck` 無 error
- [x] 4.2 從 setup → 開始 → praying → 點滿 25 → complete 完整跑一輪,中間每次 phase 切換都看到 LoadingScreen curtain
- [x] 4.3 CompleteScreen 動畫順序正確:雲在中央 → 飛離 → 太陽變亮 → 文字浮現
- [x] 4.4 文案顯示「25 隻晴天娃娃,已經掛滿」(不是 20)、日期格式正確、地點正確
- [x] 4.5 按「重新祈禱」聽到 tok、看到 curtain、回到 setup,地點仍在、date 回今天
- [x] 4.6 動畫進行中(1.9s 前)按「重新祈禱」不會出現 console error 或殘留 bloom
- [x] 4.7 進入 done 那刻聽到 bloom 五音琶音
