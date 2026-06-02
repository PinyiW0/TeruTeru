## 1. PrayingScreen 元件

- [x] 1.1 建立 `app/components/PrayingScreen.vue` 骨架:script setup、template 區分頂部 / 標題 / stage / 底部 hint
- [x] 1.2 取 composable:`useWishFlow()`(date / location / dolls / addDoll / goTo / 排版常數 / slotToXY)、`useTeruAudio()`(chimeAt / tok)、`useTweaks()`(dollStyle / visualStyle)、import `formatDateCN`
- [x] 1.3 實作 `stageRef` + `size` reactive + `ResizeObserver`(`onMounted` 內 init、unmount 時 disconnect、僅 `import.meta.client`)
- [x] 1.4 實作 `ropePaths` computed:依 `size` 計算 5 條 path d、tack 圓座標、x0 / x1 / midX / midY
- [x] 1.5 實作 `handleTap(event)`:`event.target.closest('.pray-back, .pray-top')` 排除 chrome,計算相對 stageRef 的 tap 座標,呼叫 `addDoll(tapX, tapY, size.w, size.h)`,並 `chimeAt(slotIdx)`
- [x] 1.6 渲染頂部:`.pray-top` 內含 `.pray-back` 按鈕(SVG 箭頭,onClick → `goTo('setup')` + `tok()`) + `.pray-meta`(`.pray-meta-date` 顯示 formatDateCN + `.pray-meta-loc` 顯示「為 X 祈禱晴天」)
- [x] 1.7 渲染標題:`.pray-counter` > `.pray-title`「晴天娃娃降臨中」
- [x] 1.8 渲染 `.pray-stage` 內 `<svg class="clothesline-svg">`:`viewBox` 隨 size 變、5 條繩(shadow + main + dashed twist)+ 兩端 tack 圓
- [x] 1.9 渲染 dolls list:`v-for` 每隻娃娃 absolute `<div class="doll" :class="hung ? 'hung' : 'floating-in'">` + CSS 變數(`--from-x`、`--from-y`、`--sway-dur`、`--sway-delay`),內含 `<TeruDoll :index :doll-style :visual-style :size="0.86" />`
- [x] 1.10 渲染底部 hint:`.pray-hint-bot` > 「點任意處」+ `.tap-dot` + 「掛上晴天娃娃」

## 2. 頁面整合

- [x] 2.1 修改 `app/pages/index.vue`:`phase === 'praying'` 從 placeholder 換成 `<PrayingScreen />`(complete 仍保留 placeholder)

## 3. 視覺與功能驗證

- [x] 3.1 跑 `npx eslint . --fix` 與 `nuxi typecheck` 無 error
- [x] 3.2 從 setup 按開始進 praying,5 條繩可見、頂部 meta 顯示日期與地點、標題與 hint 都出現
- [x] 3.3 點 stage 任意位置 → 娃娃從點擊處漂浮到下一個 slot(底繩最左 → 最右 → 第二底繩最左...)
- [x] 3.4 點返回鈕回 setup;點頂部 meta 區無反應
- [x] 3.5 點滿 25 隻後自動切到 complete placeholder(短暫 1.4s 等待)
- [x] 3.6 滿 25 後在過渡時間內快速再點,不會出現第 26 隻
- [x] 3.7 resize 視窗,繩子與已掛娃娃跟著重排
