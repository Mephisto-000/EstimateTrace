# Contributing to EstimateTrace

## 結論

EstimateTrace 歡迎能維持「可追溯、可重現、browser-only、公開資料安全」邊界的貢獻。提交前請使用專案固定的 Node.js 與 pnpm、從 `pnpm-lock.yaml` 還原依賴，並讓 formatting、lint、typecheck、tests、E2E 與 production build 通過。請勿在 issue、PR、commit、fixture 或截圖中放入任何真實公司、乙方、員工、系統、報價或 credential。

行為事件的私下回報管道尚未配置完成時，maintainer 不應開放外部貢獻；詳見 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。安全漏洞請依 [SECURITY.md](SECURITY.md) 處理，不要建立 public issue。

## 開始前

1. 閱讀 `estimate-trace-project-spec.md`、`docs/architecture.md`、`docs/privacy-and-security.md` 與相關模型文件。
2. 搜尋既有 issue，確認問題沒有重複。
3. 對會改變公式、參數語意、資料格式、隱私邊界或 dependency 的變更，先建立 issue 並取得 maintainer 同意。
4. 使用完全虛構、可公開的資料重現問題。

## 建立本機環境

專案目標版本為 Node.js `24.18.0` 與 pnpm `10.34.5`。Corepack cache、pnpm store、Playwright browser 與專案依賴都應留在 repository 內。優先使用 repository wrapper，它會把 `COREPACK_HOME` 指向 `.corepack/`：

```bash
node --version
./scripts/pnpm-local.sh --version
./scripts/pnpm-local.sh install --frozen-lockfile
```

完整的手動 Corepack 設定、實際路徑、版本與疑難排解請參考 [docs/dependency-management.md](docs/dependency-management.md)。

## 開發流程

1. 從最新 `main` 建立範圍單一的 branch。
2. 先寫能表達行為與邊界的測試，再做最小 production change。
3. 保持 Clean Architecture dependency direction；domain 不得依賴 React、Next.js、Web Storage、時間、網路或隨機數。
4. User input、local storage 與 imported JSON 都是 untrusted input，必須在邊界驗證。
5. 更新同一變更所影響的文件、migration note 與 release note。
6. 使用 PR template 提供實際驗證證據與 rollback 方式。

建議 commit 使用清楚的 imperative message；一個 commit 應能說明一個可回復的意圖。不要把格式化整個 repository、dependency upgrade 與功能變更混在同一個 PR。

## 模型與資料格式變更

下列變更不得只修改畫面文案：

- 公式或結果語意改變：bump `modelVersion` major。
- 新增 backward-compatible factor 或 output：bump minor。
- Bug fix 若會改變既有結果：至少 bump minor，並提供 migration／recalculation note。
- Parameter default 或 threshold 改變：bump `parameterSetVersion`，保存完整 snapshot。
- Schema 改變：定義相容性、migration、失敗時 rollback；匯入不得無聲覆蓋既有案件。

同一組 input、parameter snapshot 與 model version 必須產生完全相同的未格式化結果。公式只能位於 domain boundary，UI 與測試 fixture 不得複製 production magic number。

## Dependency 變更

新增、升級或移除套件前，PR 必須記錄：

- 解決的問題，以及不用新套件時的替代方案。
- Exact version、production／development 分類與 Node.js／Next.js 相容性。
- License 與 public MIT repository 的相容性。
- 已知 security advisory、`pnpm audit` 結果與 supply-chain 風險。
- Bundle、latency、privacy、build script 與移除方式的影響。

只使用 pnpm 並提交唯一的 `pnpm-lock.yaml`。不得加入 `package-lock.json`、`yarn.lock` 或 `bun.lock`。Major update 不自動合併，必須獨立驗證。

## 必要驗證

依變更風險執行以下命令，PR checklist 只能勾選實際通過的項目：

```bash
./scripts/pnpm-local.sh format:check
./scripts/pnpm-local.sh lint
./scripts/pnpm-local.sh typecheck
./scripts/pnpm-local.sh test
./scripts/pnpm-local.sh build

PLAYWRIGHT_BROWSERS_PATH="$PWD/.playwright-browsers" \
  ./scripts/pnpm-local.sh exec playwright install chromium
PLAYWRIGHT_BROWSERS_PATH="$PWD/.playwright-browsers" \
  ./scripts/pnpm-local.sh test:e2e
```

UI 變更另需檢查 keyboard-only flow、360 px mobile layout、200% zoom、focus、error announcement 與不只依賴顏色的狀態。Privacy 或 security 變更需檢查 production response headers 與 browser network，確認案件名稱、描述、工作項目、金額及匯入內容沒有離開瀏覽器。

## Public data hygiene

- Sample、fixture、screenshot、screen recording 與 issue reproduction 只可使用 fictional／illustrative data。
- 不得貼完整 local storage、JSON import、production log 或 raw stack trace；先縮成不含 payload 的最小證據。
- 不得使用真實公司、乙方、員工、客戶、系統、domain、email、電話、統編、帳號、費率、報價或合約。
- 不得把真實資料「改幾個字」或等比例調整後當 sample。
- `.env.local`、`.vercel/`、cache、build output、IDE state 與 Playwright browsers 不得提交。

詳細規則見 [docs/sample-data-policy.md](docs/sample-data-policy.md)。

## Pull Request 完成條件

PR 應保持小且可 review，並包含：

- 對應 issue／spec／Acceptance Criteria。
- 測試、build 與人工驗證的實際結果。
- 公式、參數、schema、security、privacy、accessibility 與 dependency 影響。
- UI 變更的無敏感資料 desktop／mobile evidence。
- 文件同步與明確 rollback strategy。

如果結果仍有未完成風險，請直接列在 PR 中，不要用沒有 owner 或驗收條件的隱藏 `TODO`。
