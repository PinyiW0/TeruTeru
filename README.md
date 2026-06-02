# ☀️ Teru Teru 放晴吧！

> 祈求好天氣的晴天娃娃平台

為一個日子、為一個地方，掛滿 25 隻晴天娃娃，求一場好天氣。

🔗 **Demo**：https://pinyiw0.github.io/TeruTeru/

---

## ✨ 功能特色

- **三段祈福流程**：Setup（設定）→ Praying（祈禱）→ Complete（放晴），搭配 Loading 過場 curtain。
- **掛娃娃互動**：在祈禱畫面點任意處掛上晴天娃娃，娃娃從點擊位置漂浮入場、懸掛擺動，掛滿 25 隻自動放晴。
- **響應式繩子**：5 條繩以 catenary sag 曲線即時重算，視窗縮放或旋轉時娃娃座標跟著重排。
- **客製化主題**：
  - 主題色：sunny ☀️ / sakura 🌸 / matcha 🍵
- **狀態持久化**：地點、主題與各項偏好寫入 localStorage，重新造訪自動還原（日期則每次重置為今天）。

---

## 🛠 技術棧

| 類別 | 技術 |
|------|------|
| 框架 | Nuxt 4（Vue 3 Composition API） |
| UI | Nuxt UI 4 + Tailwind CSS 4 |
| 狀態 | Pinia + `pinia-plugin-persistedstate` |
| 音效 | Web Audio API |
| 測試 | Playwright（E2E） |
| 型別 | TypeScript（strict mode） |
| Lint | ESLint + Prettier |

---

## 🚀 快速開始

需要 Node.js `>= 22.12.0`。

```bash
# 安裝依賴
npm install

# 啟動開發伺服器（http://localhost:3000）
npm run dev

# 產生靜態網站（輸出至 .output/public）
npm run generate

# 預覽 production build
npm run preview
```

### 測試與檢查

```bash
npm run test:e2e        # 跑 Playwright E2E
npm run test:e2e:ui     # 以 UI 模式跑
npm run eslint          # ESLint 檢查
npm run typelint        # 型別檢查
```

---

## 📁 專案結構

```
app/
├── components/       # 各畫面與元件（SetupScreen / PrayingScreen / CompleteScreen / TeruDoll ...）
├── composables/      # useWishFlow（流程狀態）、useTweaks（客製化）、useTeruAudio（音效）
├── pages/            # 頁面路由
├── types/            # wish / tweaks 型別
├── utils/            # wishDate 等工具
└── assets/css/       # teru.css 主題樣式
spec/
├── gherkin-feature/  # .feature 業務規格
├── e2e-flows/        # .flow.md 測試流程與 Business Invariants
└── ui-config/        # UI 設定與參考稿
test/
└── e2e/specs/        # Playwright 測試（主 spec, SSOT）
```

---

## 📐 開發方法：SDD（Spec-Driven Development）

本專案採規格驅動開發，由業務規格逐步驅動實作：

```
.feature（業務規格）
   → .flow.md（E2E 流程 + Business Invariants）
   → 型別 + Mock API
   → .spec.ts（測試合約，主 spec 凍結）
   → UI 實作
   → 跑 playwright 直到全綠
```

主 spec（`test/e2e/specs/*.spec.ts`）為唯一真理，修改 UI 時不得破壞對應 `.flow.md` 的 Business Invariants。

---

## 🌤 部署

Push 到 `main` 時，GitHub Actions（`.github/workflows/deploy-pages.yml`）會自動以 `nuxt generate` 產生靜態網站並部署到 GitHub Pages。

> 因部署於子路徑，workflow 中以 `NUXT_APP_BASE_URL=/TeruTeru/` 與 `NITRO_PRESET=github_pages` 設定 baseURL 並產生 `.nojekyll` / `404.html`。
