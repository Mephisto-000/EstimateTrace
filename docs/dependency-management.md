# Dependency Management

## 結論

EstimateTrace 使用 Node.js `24.18.0`、pnpm `10.34.5`、單一 `package.json` 與單一 `pnpm-lock.yaml`。所有專案 dependency、pnpm store、Corepack cache 與 Playwright browser 都配置在 repository 內；日常命令優先經 `scripts/pnpm-local.sh` 執行，不得使用 `npm install`、global package install 或第二份 lock file。CI 以 frozen lockfile 還原後執行 format、lint、typecheck、tests、dependency audit、production build 與獨立 E2E。

目前本機實際 Node.js 是 `24.15.0`，低於專案 pin 的 `24.18.0`；執行 release gate 前必須切換到目標版本。以下路徑與版本於 2026-07-29 由實際命令查證，未執行的 audit、CI、E2E 或 deployment 不在本文件宣稱通過。

## 版本與實際安裝位置

| 項目                           | 專案設定／查證結果                                                    |
| ------------------------------ | --------------------------------------------------------------------- |
| Node.js target                 | `24.18.0`：`.node-version`、`.nvmrc`、CI                              |
| Node.js compatibility          | `package.json#engines.node`：`>=24.0.0 <25`                           |
| 查證時本機 Node.js             | `v24.15.0`                                                            |
| 查證時 Node executable         | 既有 NVM-managed binary；本專案未安裝或修改 system Node               |
| pnpm exact version             | `10.34.5`：`package.json#packageManager`                              |
| Corepack version               | `0.34.6`                                                              |
| Dependency root                | `$REPOSITORY_ROOT/node_modules`                                       |
| pnpm content-addressable store | `$REPOSITORY_ROOT/.pnpm-store/v10`                                    |
| pnpm virtual store             | `$REPOSITORY_ROOT/node_modules/.pnpm`                                 |
| KaTeX resolved package         | `$REPOSITORY_ROOT/node_modules/.pnpm/katex@0.18.1/node_modules/katex` |
| Corepack cache／shim           | `$REPOSITORY_ROOT/.corepack`                                          |
| Playwright browsers            | `$REPOSITORY_ROOT/.playwright-browsers`                               |
| Manifest                       | `$REPOSITORY_ROOT/package.json`                                       |
| Lock file                      | `$REPOSITORY_ROOT/pnpm-lock.yaml`                                     |

`$REPOSITORY_ROOT` 代表執行 `pwd -P` 查得的目前 repository 絕對路徑。Public
文件不提交開發者的 home directory 或 OS username；上表仍對應本次實際命令解析
出的路徑，而不是未驗證的 package-manager 預設值。

查證命令：

```bash
export REPOSITORY_ROOT="$PWD"
export COREPACK_HOME="$PWD/.corepack"

pwd -P
node --version
command -v node
corepack --version
corepack pnpm --version
corepack pnpm root
corepack pnpm store path
corepack pnpm config get virtual-store-dir
corepack pnpm config get store-dir
```

`pnpm config get virtual-store-dir` 實際輸出 `undefined`，表示沒有自訂該設定；已確認實際 default virtual store 為 `node_modules/.pnpm`。`.npmrc` 的 `store-dir=.pnpm-store` 則讓 content-addressable store 留在 repository。

## 隔離與 lock policy

`.npmrc` 設定：

- `store-dir=.pnpm-store`：不使用 user-level pnpm store。
- `minimum-release-age=1440`：新發布版本至少等待 1,440 分鐘，降低立即採用遭入侵版本的風險。
- `save-exact=true`：manifest 保存 exact version。
- `strict-peer-dependencies=true`：peer mismatch 使 install 失敗。
- `verify-store-integrity=true`：讀取 store package 時驗證完整性。

`.gitignore` 排除 `.corepack/`、`.pnpm-store/`、`node_modules/`、`.playwright-browsers/`、`.next/`、test report 與本機環境檔；`package.json` 與 `pnpm-lock.yaml` 必須納入版本控制。

`package.json#pnpm.ignoredBuiltDependencies` 明列：

- `sharp`
- `unrs-resolver`

這表示 pnpm 不執行這兩個 transitive／optional package 的 install build script，減少 supply-chain script execution。它不等於功能已自動驗證；任何調整 allowlist 的 PR 都必須說明 script 用途與來源，並重新執行 clean frozen install、Next.js build、image path（若使用）與 resolver 相關測試。`peerDependencyRules.allowedVersions` 對 `@emnapi/core` 與 `@emnapi/runtime` 的相容範圍也必須隨 dependency upgrade 一併檢視。

### Audited transitive overrides

2026-07-29 對原始 lockfile 執行 registry-backed audit 時，發現以下 High advisories：

- `postcss`：GHSA-6g55-p6wh-862q、GHSA-r28c-9q8g-f849。
- `sharp`／libvips：GHSA-f88m-g3jw-g9cj。
- `brace-expansion`：GHSA-mh99-v99m-4gvg；由 ESLint toolchain 的 legacy `minimatch@3.1.5` 引入。

Remediation 將 `next` 與 `eslint-config-next` 升至 `16.2.12`，並在 `package.json#pnpm.overrides` 精準固定：

```json
{
  "brace-expansion": "5.0.8",
  "postcss": "8.5.24",
  "sharp": "0.35.3"
}
```

`brace-expansion@5.0.8` 的 CommonJS export 從舊版 callable function 改為 `{ expand }`，而 `minimatch@3.1.5` 尚未適配。Repository 因此用 pnpm 原生 `patchedDependencies` 套用 [最小 compatibility patch](../patches/minimatch@3.1.5.patch)，只讓 minimatch 同時接受舊／新 export shape，不修改 glob semantics 或安全上限。Patch path 與 content hash 都記錄在 `pnpm-lock.yaml`。

直接升級 ESLint 10 不是目前可用的替代方案：`eslint-config-next@16.2.12` 內的 `eslint-plugin-import@2.32.0`、`eslint-plugin-jsx-a11y@6.10.2` 與 `eslint-plugin-react@7.37.5` peer metadata 尚未支援 ESLint 10，且實測 `eslint-plugin-react` 會因移除的 context API 在 lint runtime crash。因此保留相容的 ESLint `9.39.5`，直到整組 upstream plugins 支援後再以獨立 PR 移除 patch。

重新安裝後，`pnpm why` 查證 dependency graph 只包含 `brace-expansion@5.0.8`、`postcss@8.5.24` 與 `sharp@0.35.3`；完整 `pnpm audit --audit-level=high` 實際回傳 `No known vulnerabilities found`。Compatibility patch 後 ESLint 可正常啟動與分析 repository；目前 lint 若有 application warning，仍由對應程式變更修正，不降低 `--max-warnings=0` gate。這個 audit 結果只代表 2026-07-29 當次 registry advisory 資料，不是永久無漏洞保證。

`sharp@0.35.3` 跨越 Next.js 原 optional range 的 `0.34.x`，因此 override 不能視為一般無風險 patch。Current source 沒有使用 `next/image` 或 `ImageResponse`，且仍忽略 `sharp` install script；release 前仍必須完成 production build 與 E2E。未來若加入 image optimization，要先測試實際 Vercel image path。只有當受支援的 Next.js release 已直接採用 audited versions，且 frozen install、audit、build 與 E2E 全部通過時，才能在獨立 dependency PR 移除 overrides。

## Production dependencies

以下版本與 license 由已安裝 package metadata 查證：

| Package      |   Version | License | Purpose                                                  |
| ------------ | --------: | ------- | -------------------------------------------------------- |
| `decimal.js` |  `10.6.0` | MIT     | Decimal-safe effort、ratio 與 money calculation          |
| `katex`      |  `0.18.1` | MIT     | Source-controlled LaTeX 的同源 HTML／CSS 數學排版        |
| `next`       | `16.2.12` | MIT     | App Router、static rendering、Vercel runtime integration |
| `react`      |  `19.2.8` | MIT     | Client UI                                                |
| `react-dom`  |  `19.2.8` | MIT     | Browser／server rendering                                |
| `zod`        |   `4.4.3` | MIT     | Form、storage 與 import boundary validation              |

## Development dependencies

| Package                       |   Version | License    | Purpose                              |
| ----------------------------- | --------: | ---------- | ------------------------------------ |
| `@axe-core/playwright`        |  `4.12.1` | MPL-2.0    | Automated accessibility checks       |
| `@playwright/test`            |  `1.62.0` | Apache-2.0 | Desktop／mobile E2E                  |
| `@tailwindcss/postcss`        |   `4.3.3` | MIT        | Tailwind PostCSS integration         |
| `@testing-library/dom`        |  `10.4.1` | MIT        | DOM behavior testing                 |
| `@testing-library/jest-dom`   |   `7.0.0` | MIT        | Accessible DOM assertions            |
| `@testing-library/react`      |  `16.3.2` | MIT        | React component tests                |
| `@testing-library/user-event` |  `14.6.1` | MIT        | User interaction simulation          |
| `@types/node`                 | `24.13.3` | MIT        | Node.js types                        |
| `@types/react`                | `19.2.17` | MIT        | React types                          |
| `@types/react-dom`            |  `19.2.3` | MIT        | React DOM types                      |
| `eslint`                      |  `9.39.5` | MIT        | Static analysis                      |
| `eslint-config-next`          | `16.2.12` | MIT        | Next.js lint rules                   |
| `jsdom`                       |  `29.1.1` | MIT        | Vitest browser-like test environment |
| `prettier`                    |   `3.9.6` | MIT        | Deterministic formatting             |
| `tailwindcss`                 |   `4.3.3` | MIT        | Styling build tool                   |
| `typescript`                  |   `6.0.3` | Apache-2.0 | Strict type checking                 |
| `vitest`                      |  `4.1.10` | MIT        | Unit／integration test runner        |

License compatibility must be reviewed again on every upgrade，especially transitive dependencies and any future asset、font or icon。

KaTeX 由 `pnpm list katex --depth 0`、`pnpm why katex`、`realpath
node_modules/katex` 與已安裝的 package metadata 實際查證。它只處理
source-controlled LaTeX，`trust=false`，不接受 form、localStorage 或 JSON
import 的 expression；CSS 與 font 由 Next.js 打包為 same-origin assets，
不使用 CDN，也不需要放寬 CSP。移除時執行
`./scripts/pnpm-local.sh remove katex`，並同步移除 `/methodology` page 與
`/estimates` layout 的 route-scoped KaTeX CSS import、`MathFormula`
component 與公式 rendering tests。

## 建立與還原環境

先由既有 Node version manager 安裝／切換 Node.js `24.18.0`；專案不會修改 system runtime。Repository wrapper 會設定 `COREPACK_HOME="$PWD/.corepack"`，由 `packageManager` 欄位解析 exact pnpm：

```bash
node --version
./scripts/pnpm-local.sh --version
./scripts/pnpm-local.sh install --frozen-lockfile
```

需要直接呼叫 pnpm 的 shell 可手動建立 project-local shim：

```bash
export COREPACK_HOME="$PWD/.corepack"
mkdir -p "$COREPACK_HOME/shims"
corepack install --global pnpm@10.34.5
corepack enable --install-directory "$COREPACK_HOME/shims"
export PATH="$COREPACK_HOME/shims:$PATH"
```

Corepack 的 `--global` 只代表目前 `COREPACK_HOME` 的 default package manager；上述環境變數讓檔案寫入 `$PWD/.corepack`，不是 OS global directory。一般 restore 只需：

```bash
./scripts/pnpm-local.sh install --frozen-lockfile
```

若 lockfile 與 manifest 不一致，frozen install 應失敗；不要用 `--no-frozen-lockfile` 掩蓋差異，應由 dependency PR 明確更新並 review lockfile。

## 啟動、測試與 build

```bash
# Development
./scripts/pnpm-local.sh dev

# Production build and local production server
./scripts/pnpm-local.sh build
./scripts/pnpm-local.sh start

# Static and automated checks
./scripts/pnpm-local.sh format:check
./scripts/pnpm-local.sh lint
./scripts/pnpm-local.sh typecheck
./scripts/pnpm-local.sh test
./scripts/pnpm-local.sh check
```

Repository wrapper 會自動設定
`PLAYWRIGHT_BROWSERS_PATH="$PWD/.playwright-browsers"` 與
`NEXT_TELEMETRY_DISABLED=1`；Playwright browser 與 Next.js tooling state
不會寫入使用者層級目錄：

```bash
./scripts/pnpm-local.sh exec playwright install chromium
./scripts/pnpm-local.sh build
./scripts/pnpm-local.sh test:e2e
```

Linux CI 使用 `pnpm exec playwright install --with-deps chromium` 安裝 runner 所需 OS library；這只發生在 ephemeral GitHub-hosted runner，不應用來修改開發者系統。

## 新增、升級與移除 dependency

先在 issue／PR 記錄 purpose、exact version、license、security advisory、Node／Next compatibility、bundle／privacy 影響、build script 與替代方案，再執行：

```bash
# Production dependency
./scripts/pnpm-local.sh add package-name@x.y.z --save-exact

# Development dependency
./scripts/pnpm-local.sh add --save-dev package-name@x.y.z --save-exact

# Upgrade an existing dependency to a reviewed exact version
./scripts/pnpm-local.sh update package-name@x.y.z

# Remove
./scripts/pnpm-local.sh remove package-name

# Review after every change
./scripts/pnpm-local.sh audit --audit-level=high
./scripts/pnpm-local.sh check
./scripts/pnpm-local.sh test:e2e
```

確認 `package.json` 與 `pnpm-lock.yaml` 是唯一預期的 dependency changes。Major update 必須獨立 PR，不自動合併。若 pnpm 本身升級，需同步更新 `packageManager`、CI、Corepack commands 與本文件。

## Environment variables

MVP 不需要 production secret。目前唯一公開變數：

| Variable               | Scope                            | Purpose                                                                                        | Safe local value        |
| ---------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------- |
| `NEXT_PUBLIC_SITE_URL` | Development／Preview／Production | Canonical public site URL；production 未設定時 fallback 至 `https://estimate-trace.vercel.app` | `http://localhost:3000` |

`NEXT_PUBLIC_*` 會進入 browser bundle，絕對不能存放 secret。Local override 放在 `.env.local`，該檔已被 `.gitignore` 排除；`.env.example` 只放安全示範值。新增變數時要更新 `.env.example`、README、本文件與 Vercel 各 environment scope。

`COREPACK_HOME`、`PLAYWRIGHT_BROWSERS_PATH`、`NEXT_TELEMETRY_DISABLED` 是 tooling／CI runtime controls，不是 application secret。

## CI 與 Vercel

`.github/workflows/ci.yml` 使用：

- GitHub Actions full commit SHA pin 與最小 `contents: read` permission。
- Node.js `24.18.0` 與 project-local Corepack／pnpm `10.34.5`。
- `pnpm install --frozen-lockfile`。
- Formatting、lint、typecheck、unit／integration tests、完整 dependency audit、basic secret hygiene 與 production build。
- 獨立 Chromium desktop／mobile E2E job。

目前 production project `estimate-trace` 已透過連線的 Vercel API 使用 tracked
source 建立，公開 URL 為 <https://estimate-trace.vercel.app>。Project link
只寫入 repository-local、已忽略的 `.vercel/project.json`；不安裝 global
Vercel CLI，也不寫入 user-level 設定。這種 source deployment 必須先有 clean
local commit、完整 quality gate，且 release note 要記錄來源 tag。

Remote push 完成後的正式 workflow 應改用 Git integration：repository root、
Next.js preset、production branch `main`，每個 PR／branch 建 Preview，merge
到 `main` 後建 Production。MVP 不需要 Vercel token 或 production secret；
不要建立可接收案件資料的 Function。

平台連線、Preview 與 Production URL 必須在實際部署後驗證，不能因設定檔存在就宣稱 deployment 成功。Production 問題先 revert 對應 Git commit，必要時暫時 promote 前一個已驗證 deployment；公式結果改變時同步處理 model version 與 release note。

## 常見問題

### Corepack 嘗試寫入 user cache 或出現 `EPERM`

確認每個 shell 都先設定：

```bash
./scripts/pnpm-local.sh --version
```

若 wrapper 仍失敗，確認 repository 可寫入 `.corepack/` 且 network 可取得 package manager；不要以 `sudo` 或 global pnpm install 繞過。

### Node.js 顯示 `24.15.0`

這是查證時的本機 runtime，不是 release target。使用既有 Node version manager 切換到 `.node-version`／`.nvmrc` 的 `24.18.0`，再重新執行 frozen install 與 quality gate。

### 出現 ignored build scripts warning

先比對 warning 是否只有 `package.json#pnpm.ignoredBuiltDependencies` 中已 review 的 `sharp` 與 `unrs-resolver`。不要直接執行或允許新的 install script；先 review package provenance、script、license 與 build impact。

### Playwright 找不到 Chromium

```bash
export PLAYWRIGHT_BROWSERS_PATH="$PWD/.playwright-browsers"
./scripts/pnpm-local.sh exec playwright install chromium
```

確認該路徑仍在 repository 內且未提交。

### Vercel 與本機結果不同

比對 Node、pnpm、lockfile、environment scope、Git commit 與 build log；不得直接在 Vercel Dashboard 修改 code。若公式輸出不同，停止 promote，保存兩邊的 model／parameter version 與無敏感資料 trace 後調查。
