---
name: vibe-check
description: 最小主 spec 守門 — 跑 npx playwright test 確認主 spec 綠燈。紅燈時對照 spec/e2e-flows/*.flow.md 的 Business Invariants 指出可能違反的條目。Use when vibe 完想驗證業務合約沒踩線。
---

# Vibe Check — 最小主 spec 守門（v3）

## 目的

**只做一件事**：跑主 spec（`test/e2e/specs/*.spec.ts`），確認 vibe 後業務合約沒被破壞。

**不做**：UI 分層、vibe spec 產生、vibe spec 執行（這些由 `/vibe-setup` 與 `/vibe-e2e` 負責）。

主 spec 是 SSOT（Single Source of Truth），凍結，不可被任何 vibe 流程修改。

## 何時用

- 每次 vibe UI 完，**第一步**先跑這個
- 主 spec 綠燈才有資格往 `/vibe-setup`、`/vibe-e2e` 推進
- 想單獨確認主 spec 狀態

## 使用方式

```bash
/vibe-check
```

無參數。永遠跑全量主 spec。

---

## 絕對禁止（SSOT 政策）

以下永遠不可在 /vibe-check 過程中發生：

- 不可修改 `test/e2e/specs/` 內任何檔案
- 不可修改 `spec/gherkin-feature/`、`spec/e2e-flows/`
- 不可修改 `playwright.config.ts`
- 不可主動修 `app/` 程式碼（即使能修好違規也不行）
- 不可主動 commit / push
- **失敗時不可建議「改 spec 來配合 vibe」這類解法**，要建議「還原 vibe 改動」或「調整 vibe 讓它仍滿足業務 invariant」

如果發現非破壞合約無法達成 vibe 目標，**停下來告訴使用者**，不要擅自處理。

---

## 流程

### Step 1：跑主 spec

```bash
npx playwright test
```

不用 fast、不用 diff 分類、不挑 module——全量跑。原因：主 spec 是業務合約守門，少跑一條都可能漏判。

### Step 2：解析結果

**綠燈**：

```
=== Vibe Check 通過 ===

主 spec：45/45 passed ✅（含 N skipped 為 spec 自身 .skip）

業務合約完整，vibe 改動沒踩線。

下一步建議：
- 視 vibe 改動內容跑 /vibe-setup 做 UI 分層
- 純 visual 改動可直接 commit
```

**紅燈**：

1. 解析失敗 test 名稱（如 `01-accounts.spec.ts › 規則：顯示帳號列表（v2） › 顯示帳號列表`）
2. 對應到 `spec/e2e-flows/{N}-{module}.flow.md` 的 `## Flow: {scenarioName}` 區段
3. 讀該 flow 段的 `Business Invariants` 與 `Verification 策略`，找出可能違反的 invariant
4. 用以下格式報告：

```
=== Vibe Check 失敗 ===

主 spec：3/45 failed ❌

失敗清單：

1. 01-accounts.spec.ts › 規則：顯示帳號列表（v2） › 顯示帳號列表
   失敗訊息：findAccountEntity(/coach_wang/) 找不到 element
   對應 flow：spec/e2e-flows/01-accounts.flow.md → Flow: 顯示帳號列表
   可能違反的 invariant：
   - 「列表必須能識別未刪除的帳號實體」
   - 「username 為主要識別欄」
   嫌疑 vibe 改動（grep app/pages/accounts/）：
   - app/pages/accounts/index.vue 是否還顯示 username 欄位？是否還能用 username 找到 row？
   建議行動：
   - 確認 coach_wang 帳號列在 /accounts 頁、且其 username 字串「coach_wang」可被視覺/讀屏識別
   - 不要修改 test/e2e/specs/01-accounts.spec.ts

2. ...

下一步建議：
- 請對照上方建議調整 vibe，調整後再跑 /vibe-check 驗證
- 主 spec 紅燈時不要往 /vibe-setup、/vibe-e2e 推進
```

### Step 3：總結

最後一行明確表態：

- 全綠 → 「業務合約守住，可繼續 /vibe-setup 或 commit」
- 紅燈 → 「請對照上方建議調整 vibe，調整後再跑 /vibe-check」

---

## 實作要點

1. **不污染 git**：檢查過程不該動到任何檔案
2. **失敗報告要可行動**：不只說「失敗」，要指出「對應 flow.md 哪一段」+「可能違反的 invariant」+「建議調整方向」
3. **不過度推測**：UI 截圖能補上時要報告 Playwright 的 error context（截圖 / page snapshot），讓使用者直接看
4. **遇到無法解決的根本衝突（如業務 invariant 與 PM 想要的 UX 互斥），停下來問使用者**，不擅自決定
5. **保持最小職責**：不做 diff 分類、不跑 vibe spec、不生 spec——那些是 /vibe-setup 與 /vibe-e2e 的事

---

## 與相關 skill 的關係

```
/vibe-check    （這個 skill）只跑主 spec，回報 pass/fail
   ↓ green 才繼續
/vibe-setup    git diff → 分類為 visual / 互動 / 結構，產出分層報告
   ↓
/vibe-e2e      依分層 pattern-driven 產生 vibe spec → 跑 vibe spec → 回報
```

三個 skill 各自獨立，使用者按順序呼叫。/vibe-check 不會自動呼叫下游，也不該被下游呼叫。
