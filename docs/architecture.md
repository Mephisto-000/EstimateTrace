# Architecture

## 結論

EstimateTrace 是一個 static-first、browser-only 的 Next.js App Router 應用。核心估算採 deterministic domain engine；UI 只能透過 application use case 呼叫 domain，local storage 與 JSON file 則是可替換 adapter。Public route 可由 server/static rendering 產生，但任何案件內容都不得進入 server、URL、cookie、analytics 或 remote log。

這個 boundary 優先保護可重現性、隱私、測試性與未來替換 storage 的能力，不為尚未核准的登入、database、多人協作或 AI 預先建立 framework。

## Context 與信任邊界

```text
Vercel static/public response
  └─ HTML, CSS, source-controlled content, application JavaScript
                         │
                         ▼
User browser ── Presentation / Next.js client boundary
                         │
                         ▼
                  Application use cases
                    │              │
                    ▼              ▼
            Domain model       Declared ports
            + pure engine          ▲
                    │              │
                    └────── Infrastructure adapters
                            localStorage / JSON file /
                            clock / UUID
```

信任規則：

- Public source code、canonical parameter set 與內建 fictional sample 是 trusted source-controlled input。
- Form、URL navigation state、local storage、imported JSON 與 browser API result 都是不可信輸入。
- `/estimates/[id]` 的 path segment 只允許 opaque UUID；案件名稱、描述、金額與工作項目不得放入 URL。
- Public server-rendered content 不得 import 或讀取 browser case repository。
- Public MVP 沒有接收案件的 Server Action、Route Handler、API endpoint 或 database。

## Module responsibilities

### Domain

Domain 負責：

- `EffortHours`、`Money`、`Ratio`、`Quantity`、`ModelVersion`、`ParameterSetId` 等 value semantics。
- Work item、complexity、risk、phase loading、PERT、P50／P80、cost、tax normalization 與 variance formula。
- Input invariant、finite result、safety cap、double-counting warning 與 calculation trace。
- 同一 input、parameter snapshot 與 model version 的 deterministic output。

Domain 不得 import：

- `react`、`next` 或 presentation component。
- `window`、`localStorage`、File API 或其他 browser global。
- Current time、network、random UUID 或 remote configuration。
- Locale formatting、currency display 或 UI copy。

Money 與 ratio 的內部計算使用 decimal-safe strategy；formatting 只在 presentation boundary 發生，不能把顯示四捨五入回寫到 domain。

Decimal boundary 由 domain `value-objects.ts` 集中定義。Form draft 可保留未完成
字串；wizard 只正規化完整 plain decimal，storage schema 與 calculator 則共用
strict canonical predicate。Validated output 以 `EffortHours`、`Money`、
`Ratio`、`Quantity`、`ModelVersion` 與 `ParameterSetId` branded types
區隔單位，避免 TWD、person-hour、比例與一般數量在 critical boundary
任意混用。

### Application

Application use case 協調：

- Create、edit、duplicate、delete、clear 與 calculate estimate。
- Load／save repository、storage failure fallback。
- Import → validate → migrate → recalculate → compare snapshot → commit。
- Export snapshot 與 safe filename。
- Vendor quote comparison 與 deterministic follow-up questions。

Application 不包含 JSX、CSS、browser formatting 或公式常數。Clock、UUID、repository 與 file transfer 都從 port 注入，使測試能固定時間與 identifier。

### Infrastructure

Infrastructure 實作：

- Namespaced local storage repository。
- Strict storage schema validation 與 version migration。
- JSON import／export、1 MB file size guard 與 prototype pollution defense。
- Browser clock、UUID 與 file download adapter。

每次 storage read 都必須驗證，corrupted entry 不得造成整站白屏。Storage unavailable／quota exceeded 時，application 保留目前 in-memory state、顯示不可保存的明確警告，並提供 JSON export；不得 silent fallback 為空案件。

### Presentation

Presentation 負責：

- App Router pages、semantic forms、navigation、responsive layout 與 A4 print style。
- Field label、description、error summary、focus management、live region 與 accessible table。
- `TWD`、person-hour、person-day、person-month 與 ratio display formatting。
- 以 KaTeX 顯示 source-controlled LaTeX，並提供中文 `aria-label` 文字替代。
- Client hydration 後讀取 browser repository。

Presentation 不得以輸入字串重寫公式、複製 canonical parameter magic
number，或使用 unvalidated result。User-generated text 只能進入 escaped text
node；唯一的 `dangerouslySetInnerHTML` boundary 是 `MathFormula` 對 KaTeX
`renderToString` 的輸出，固定使用 `trust=false`、bounded expansion／size，
parse failure 則以 React escaped text fallback。Form、localStorage、JSON
import 與 URL 都不得提供 LaTeX expression。

## Rendering strategy

| Route             | Strategy                                           | Case data                    |
| ----------------- | -------------------------------------------------- | ---------------------------- |
| `/`               | Static public content                              | 不讀取                       |
| `/methodology`    | Static public methodology                          | 不讀取                       |
| `/examples`       | Static shell；client 載入 source-controlled sample | 只含 fictional built-in data |
| `/about`          | Static public content                              | 不讀取                       |
| `/privacy`        | Static public content                              | 不讀取                       |
| `/estimates`      | Static shell＋client repository                    | 只在 browser                 |
| `/estimates/new`  | Static shell＋client state                         | 只在 browser                 |
| `/estimates/[id]` | Static shell＋client lookup                        | 只在 browser                 |

`/estimates` 全 route tree 以 response header 設定 `noindex, nofollow, noarchive`。這是 defense in depth，不代表可在 URL 或 rendered HTML 放敏感資料。

Static-compatible CSP 在 Production 允許 Next.js 所需的 same-origin inline bootstrap script，但不允許 `unsafe-eval`、remote script 或 third-party tracker。若未來改成 nonce-based CSP，必須評估它會讓對應 route dynamic rendering，不能靜默犧牲 static strategy。

## Determinism 與 traceability

計算 identity 由以下內容構成：

```text
schemaVersion
modelVersion
parameterSetId + parameterSetVersion
complete parameterSnapshot
validated estimate input
```

輸出包含未格式化 result 與 calculation trace。Trace 每一步要有 formula
identifier、source-controlled LaTeX expression、代入值、中間結果、unit、
parameter source 與 warning，使使用者能從 P50／P80 或 quote
追溯到工作項目。LaTeX 只作顯示 metadata，不被 engine evaluate，也不參與
結果 identity。

版本規則：

- Formula 或結果語意改變：model major。
- Backward-compatible factor／output：model minor。
- 會改變既有結果的 bug fix：至少 minor 並附 migration note。
- Parameter default／threshold 改變：parameter set version。
- UI copy 或不改變語意的修正：patch。

重新開啟舊案件不得無聲替換 snapshot。使用新模型重算前要顯示版本差異，並保留可匯出的舊 snapshot。

## Persistence、consistency 與 idempotency

Public MVP 不宣稱具備 database transaction。Local storage 單次 write 是 browser API operation，但跨 key workflow 沒有 ACID guarantee，因此：

- Repository key 使用 namespace，例如 `estimate-trace:v1:cases`。
- Save 前先完成完整 schema validation 與 deterministic calculation；非法資料不寫入。
- 相同 case ID 與相同 serialized content 重複 save 的 observable result 必須相同。
- Duplicate 由 UUID port 產生新 ID 與 timestamps，不能覆寫來源案件。
- Delete／clear 必須先明確確認；MVP 沒有回收桶。
- Import 先在 memory stage 全部驗證、migrate、recalculate 與比較 snapshot；任何步驟失敗都不修改既有 repository。
- Write failure 保留 session state，讓使用者能重試或匯出。

Calculation trace 提供可重現性，但不是 immutable、tamper-evident audit log。正式金融採購系統所需的 transaction consistency、idempotency key、RBAC、immutable estimate version、audit log、retention、backup／restore 與 encryption 屬於獨立 private Company Edition。

## Import／export boundary

Import pipeline：

```text
File selection
  → size ≤ 1 MB
  → JSON parse
  → supported schema major
  → strict Zod validation / unknown-key policy
  → explicit migration
  → canonical parameter validation
  → domain recalculation
  → result snapshot comparison
  → user-visible warning or commit
```

不得以 object spread、deep merge 或直接 assignment 把 untrusted keys 寫入 prototype-bearing object。匯入的 `resultSnapshot` 只供 comparison，不是計算來源。Error message 可顯示欄位 path 與原因，但不得把整份 payload 寫到 DOM、console 或 remote log。

Export 包含 schema、model、parameter snapshot、input 與 result snapshot；不包含 browser identifier、IP、analytics ID、cookie 或 hidden metadata。`exportedAt` 由 clock port 注入，不得影響 domain result。

## Security 與 privacy controls

- Response headers 集中在 `next.config.ts`，涵蓋 CSP、`nosniff`、Referrer、Permissions、COOP 與 frame protection。
- Production CSP 不含 `unsafe-eval`；Development 才為 HMR 加入。
- 不載入 remote font、remote script、tracker、chat widget 或 session replay；
  KaTeX CSS／font 是 build-time 打包的 same-origin asset。
- `NEXT_PUBLIC_*` 只可包含可公開資訊。
- Client error 不得送出 case payload；Production observability 限於 Vercel build／deployment log。
- Platform secret scanning、push protection、branch rules 與 vulnerability reporting 必須由 owner 在 GitHub 實際啟用並驗證。

完整 threat model 與驗證方式見 [privacy-and-security.md](privacy-and-security.md)。

## Deployment 與 rollback

Delivery path：

```text
feature branch
  → Pull Request
  → GitHub Actions quality + E2E
  → Vercel Preview review
  → merge main
  → Vercel Production
```

Production artifact 必須能追到 Git commit。問題發生時優先 revert commit；必要時暫時 promote 前一個已驗證 Vercel deployment。不得在 Dashboard 直接修改 code。若 rollback 涉及公式或 schema，需同時處理 model／parameter version、migration note 與舊 snapshot，不得只回復 UI。

## Deliberate limitations

- 無 account、SSO、RBAC、server database、多人協作或 formal approval。
- Local storage 無 encryption、跨裝置同步、backup、retention guarantee 或 immutable history。
- P50／P80 是公開示範模型的 scenario approximation，不是保證或市場公允價格。
- Public deployment 不適合真實金融案件、公司 rate card、合約或個資。
- Analytics、AI、document upload、OCR 與 remote telemetry 不在 MVP。

任何要跨越上述 boundary 的提案都必須先更新 product spec、privacy、security、architecture、tests 與 release／rollback plan；公司專用能力應分流到 independent private repository。
