# Phase 0：解析 Feature、推導 module 分組、列計畫

## 目標

掃描 `spec/gherkin-feature/` 下所有 `.feature` 檔（包含 `.dsl.feature` 副檔名變體），依領域分組為 N 個 module，產出計畫表並等使用者確認，**不寫任何檔案**。

---

## 步驟

### 1. 掃描來源

讀取 `spec/gherkin-feature/` 下所有副檔名以 `.feature` 結尾的檔案（涵蓋 `*.feature` 與 `*.dsl.feature`）。建議用：

```bash
find spec/gherkin-feature -maxdepth 1 -type f -name '*.feature'
```

> 不要用 `ls spec/gherkin-feature/*.dsl.feature`，在 zsh 找不到時會報 `no matches found`。

切割成 `Feature:` 區塊（每個 `Feature:` 行起始一個區塊），抽取：

| 欄位 | 來源 |
|------|------|
| `featureName` | `Feature:` 之後的文字 |
| `description` | Feature 名稱下一行的描述 |
| `scenarios[]` | 每個 `Scenario:` 的標題、tags、Given/When/Then |
| `events[]` | 從 Given/Then 抽取的事件名稱（`AccountCreated`、`PlayerDeleted` 等） |
| `commands[]` | 從 When 抽取的命令名稱（`CreateAccount`、`Login` 等） |
| `views[]` | 從 When/Then 抽取的 view 名稱（`AccountList`、`PracticeHistory` 等） |
| `viewFields{}` | 每個 view 的 `Then the view returns` 內陣列第一筆物件的 key 集合（用於計算欄位數，提醒 Phase 1 不要漏欄位） |
| `failureMessages[]` | `Then the operation fails with: ...` 的失敗訊息 |

### 2. 推導 module 分組

依事件/命令/view 前綴對應到 module。預設對照表：

| 前綴 | module |
|------|--------|
| `Account*`（事件/命令/view） | `accounts` |
| `Login` / `CoachLoggedIn` / `Password` / `Remark` | `accounts` |
| `Team*` | `teams` |
| `Player*` | `players` |
| `Practice*` / `Pitch*` / `Pitcher*` | `practice` |
| `Camera*` | `cameras` |
| `Export*` | `export` |

> 若 Feature 同時涉及多個前綴（如「練習投球清單」涉及 Practice + Pitch），歸到主軸（practice）。

### 2.5 分配檔案編號（NN）

最終檔名格式為 `{NN}-{module}.flow.md`。

**新建（無既有 flow）：**
- 依 SDD 推進邏輯排序：認證/帳號 → 主資料 → 流程 → 周邊
- 預設順序：`01-accounts` → `02-teams` → `03-players` → `04-practice` → `05-cameras` → `06-export`
- 出現新 module 時，往後加編號

**Sync（有既有 flow）：**
- 掃描 `spec/e2e-flows/` 取得既有 `{NN}-{module}.flow.md`
- 同名 module 保留原編號（**禁止重排**，下游 `/test e2e` 會以編號比對 spec）
- 新模組分配最大編號 + 1

### 3. 推導頁面路由

依 module 與 Feature 性質推導路由（用於 .flow.md 的「開啟 `/xxx`」步驟）：

| module | 主要頁面 |
|--------|----------|
| `accounts` | `/accounts`（列表）、`/login`（登入） |
| `teams` | `/teams` |
| `players` | `/players` |
| `practice` | `/practice/history`（歷史總覽）、`/practice/[practiceId]`（投球清單）、`/practice/live`（進行中） |
| `camera` | `/cameras` |
| `export` | `/export` 或內嵌於 practice 頁的操作 |

> 路由僅為**建議**，使用者可在確認計畫時調整。最終以 `ui-config.yaml` 或專案 `pages/` 結構為準。

### 4. 分類 Feature 屬性

每個 Feature 區塊判斷主要型態：

| 型態 | 條件 | 對應 UI 操作 |
|------|------|-------------|
| **List/View** | When 出現 `view is queried` | 開啟列表頁、驗證表格內容 |
| **Command (Create)** | When 出現 `sends Create*` | 開啟對話框、填表單、提交 |
| **Command (Update)** | When 出現 `sends Update*` / `Change*` | 開啟編輯框、修改、提交 |
| **Command (Delete)** | When 出現 `sends Delete*` | 點刪除、確認對話框 |
| **Command (Action)** | When 出現 `sends Login` / `Start*` / `End*` / `Favorite*` 等 | 操作對應按鈕 |
| **System Event** | When `System sends` 或外部 translator | 不對應 UI 直接操作，標記為「背景同步」flow |

### 5. 輸出計畫表

以 markdown 表格回報給使用者，不寫入任何檔案。格式：

```markdown
## 📋 Feature-to-Flow 計畫

### 來源
- 掃描路徑：`spec/gherkin-feature/`（含 `*.feature` 與 `*.dsl.feature`）
- 共找到 X 份檔案，N 個 Feature 區塊，M 個 Scenario

### 建議分組（共 K 個 module → K 個 .flow.md）

#### `01-accounts.flow.md`（路由：/accounts、/login）
| Feature | Scenarios | 操作型態 | view 欄位數 | 備註 |
|---------|-----------|---------|-----------|------|
| 帳號列表 | 顯示帳號列表、排除已刪除帳號 | List/View | 4（accountId, name, username, remark） | |
| 建立帳號 | 成功建立、帳號名稱重複 | Command (Create) | — | |
| 登入 | 成功登入、帳號不存在、帳號已刪除 | Command (Action) | — | |
| 修改密碼 | 成功、不存在、已刪除 | Command (Update) | — | |
| 修改備註 | 成功、不存在、已刪除 | Command (Update) | — | |
| 刪除帳號 | 成功、不存在、已刪除 | Command (Delete) | — | |

> **view 欄位數**欄是給 Phase 1 的提示：欄位 ≥ 5 的 view 必須特別注意，每欄都要產 testid（見 [phase-1-write.md](phase-1-write.md) 第 4 段）。歷史教訓：04-practice 曾經 14 欄只實作 1 欄。

#### `03-players.flow.md`（路由：/players）
...

### 寫入計畫
- ✅ 新建：01-accounts.flow.md, 02-teams.flow.md, 03-players.flow.md, ...
- ⚠️ 覆寫：（若 spec/e2e-flows/ 已存在同編號檔案）
- 🔢 編號分配：Sync 模式保留既有編號，新模組往後遞增

### 待確認
1. module 分組是否合理？
2. 路由是否符合預期（或由我推導即可）？
3. 是否有 Feature 應該排除（例如純 System 事件不需要 UI flow）？

回覆「OK」或調整後，執行 `/feature-to-flow 1` 進入寫檔階段。
```

---

## 規則

- **Phase 0 只讀不寫**：不能建立或修改 `spec/e2e-flows/` 內任何檔案
- 計畫輸出後必須停下來等使用者回覆，不要自動進入 Phase 1
- 若使用者帶參數 `accounts`，只列出 `accounts` module 的計畫
- 計畫表內 Feature 與 Scenario 名稱必須與原 .feature 完全一致（含繁中），方便比對
