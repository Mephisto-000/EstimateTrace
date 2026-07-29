# EstimateTrace

EstimateTrace 是公開、免費、可說明計算過程的軟體需求成本估算網站，協助甲方
資訊科技商業分析師把需求、工作量、風險、成本與乙方報價連成一條可檢查、可重
算、可說明的估算軌跡。

> 本工具為決策輔助，不構成正式報價、採購或法律意見。公開示範參數不是市場
> 標準，也不代表任何公司或產業的合理價格。

## 隱私邊界

案件資料只保存在目前瀏覽器的 `localStorage` 或記憶體中。最小可行產品沒有帳
號、資料庫、網站分析、人工智慧、接收案件內容的 API 或 Server Action。

EstimateTrace 是公開網站。請勿輸入公司機密、個人資料、真實乙方名稱、受保密
協議保護的內容或未公開報價；使用共享裝置時，其他使用者仍可能讀到本機資料。

## 功能

- 五步驟建立可追溯的由下而上估算。
- 計算 P50、P80 工作量、工程成本與基準報價。
- 將含稅／未稅乙方報價正規化後比較。
- 展開公式、代入值、單位、來源與參數版本。
- 以同源 KaTeX 樣式表排版公開公式與計算軌跡，提供真正的上下標、大型運算子
  與中文文字替代。
- 僅在瀏覽器保存案件，支援新增、查詢、修改、刪除、兩筆虛構範例與 JSON
  匯入／匯出。
- A4 列印報告與完整「公式與定義」專頁。
- 本機儲存失敗時保留目前工作階段，仍可計算與匯出備份。

## 技術基線

- Node.js `24.18.0` LTS target
- pnpm `10.34.5`
- Next.js `16.2.12` Active LTS
- React `19.2.8`
- TypeScript strict mode
- Tailwind CSS 4
- Zod、Decimal.js、KaTeX、Vitest、Playwright

所有 direct dependencies 使用 exact version，唯一 lock file 為
`pnpm-lock.yaml`。pnpm store 與 Corepack cache 均設定在本 repository 內。
Next.js 的 transitive `postcss`、optional `sharp` 與 tooling 的
`brace-expansion` 另以 exact `pnpm.overrides` 固定到已修補版本；legacy
`minimatch@3` 的最小 API compatibility patch 由 pnpm lock 追蹤。移除 override
或 patch 前必須重新執行完整 audit、lint、build 與 E2E。

## 建立環境

需求：macOS、Linux 或 Windows/WSL，並安裝 Node.js 24。

```bash
./scripts/pnpm-local.sh install --frozen-lockfile
cp .env.example .env.local
```

`.env.local` 只有公開 canonical URL，不包含 secret。第一次安裝會把：

- dependencies 放在 `node_modules/`
- pnpm content-addressable store 放在 `.pnpm-store/`
- exact pnpm binary cache 放在 `.corepack/`
- Playwright browser binary 放在 `.playwright-browsers/`

這些本機資料皆已由 `.gitignore` 排除。

## 開發、測試與建置

```bash
./scripts/pnpm-local.sh dev
./scripts/pnpm-local.sh format:check
./scripts/pnpm-local.sh lint
./scripts/pnpm-local.sh typecheck
./scripts/pnpm-local.sh test
./scripts/pnpm-local.sh build
./scripts/pnpm-local.sh test:e2e
```

E2E 以 production build 執行，因此先執行 `build`。Repository wrapper 會把
Playwright browser 固定在 `.playwright-browsers/`，並停用 Next.js telemetry；
安裝 Chromium：

```bash
./scripts/pnpm-local.sh exec playwright install chromium
```

完整 quality gate：

```bash
./scripts/pnpm-local.sh check
```

## 架構

```text
Next.js UI
    ↓
Application use cases
    ↓
Deterministic domain engine
    ↑
Ports
    ↑
Browser storage / JSON adapters
```

Domain engine 不依賴 React、Next.js、Web Storage、clock、UUID 或 network。
估算輸入與輸出使用 canonical decimal strings，顯示格式化不參與計算。

詳細設計請見：

- [Architecture](docs/architecture.md)
- [Estimation model](docs/estimation-model.md)
- [Parameter definitions](docs/parameter-definition.md)
- [Dependency management](docs/dependency-management.md)
- [Privacy and security](docs/privacy-and-security.md)
- [Sample data policy](docs/sample-data-policy.md)
- [v0.1.3 發行說明](docs/releases/v0.1.3.md)

## Vercel

Production：<https://estimate-trace.vercel.app>

Project 設定：

- Project name：`estimate-trace`
- Framework：Next.js
- Root directory：repository root
- Production branch：`main`
- Node.js：`24.x`
- Package manager：由 `packageManager` 欄位固定為 pnpm `10.34.5`

MVP 不需要 production secret。`NEXT_PUBLIC_SITE_URL` 只是公開 canonical URL；
若 Vercel API deployment 未提供 system environment variable，production build
會安全 fallback 到上述 stable production URL。

目前 production 由已連線的 Vercel API 使用 tracked source 部署；實際 project
link 保存在已忽略的 `.vercel/project.json`，不會污染 user-level 設定。GitHub
remote push 完成後，目標 workflow 是由 GitHub Actions 執行 quality gate，
Vercel Git integration 提供 Preview 與 Production deployment。

## Dependency 操作

```bash
# 新增 production dependency
./scripts/pnpm-local.sh add --save-exact <package>

# 新增 development dependency
./scripts/pnpm-local.sh add --save-dev --save-exact <package>

# 升級指定 dependency
./scripts/pnpm-local.sh update <package>

# 移除 dependency
./scripts/pnpm-local.sh remove <package>

# High / critical vulnerability gate
./scripts/pnpm-local.sh audit --audit-level=high
```

完整政策、實際安裝路徑與常見問題見
[`docs/dependency-management.md`](docs/dependency-management.md)。

## Contributing 與 security

請先閱讀 [CONTRIBUTING.md](CONTRIBUTING.md)。安全問題請依
[SECURITY.md](SECURITY.md) 私下回報，不要在 public issue 張貼 exploit、
secret 或真實案件資料。

## License

程式碼採 [MIT License](LICENSE)。模型輸出與示範參數的免責聲明不因軟體授權
而失效。
