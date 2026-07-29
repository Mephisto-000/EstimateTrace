# Privacy and Security

## 結論

EstimateTrace Public MVP 的 privacy contract 是：估算案件只在目前 browser 計算與保存，不送往 Vercel Function、database、analytics、remote log 或第三方。這降低傳輸與 server breach 風險，但 local storage 沒有 encryption、帳號隔離、backup 或 immutable audit；共享裝置上的其他使用者仍可能看到資料。因此網站會持續提醒使用者不要輸入公司機密、個人資料、真實乙方名稱、NDA 內容或未公開報價。

Repository 設定與程式碼只能提供部分控制。GitHub security features、Vercel settings、Production headers 與 network behavior 必須由 owner 在實際 public deployment 上驗證；本文件不把未驗證的 external setting 宣稱為已啟用。

## Data flow

```text
User form / fictional built-in sample / local JSON file
                         │
                         ▼
              Browser validation boundary
                         │
                         ▼
             Deterministic domain engine
                   │             │
                   ▼             ▼
            UI / print       localStorage
                   │
                   └──── optional user-triggered JSON download
```

不允許的資料流：

- Case data → Server Action／Route Handler／API。
- Case data → Vercel Analytics／Speed Insights／Google Analytics／session replay。
- Case data → error reporting、remote log、chat widget、remote AI／LLM。
- Case data → URL query、path、cookie、referrer 或 Open Graph metadata。
- Imported file → document parser、storage service 或其他第三方。

Browser 仍會取得網站本身的 HTML、CSS、JavaScript 與 same-origin static assets；Vercel 會有一般 deployment／edge access metadata。Application 不得把案件內容加入 request。

## Data classification

| Classification | Public MVP | Examples                                     |
| -------------- | ---------- | -------------------------------------------- |
| Public         | 允許       | 公開公式、source-controlled fictional sample |
| Internal       | 不允許     | 公司流程、內部系統名稱、internal URL         |
| Confidential   | 不允許     | 真實報價、費率、預算、合約、NDA 內容         |
| Restricted     | 禁止       | 個資、credential、金融交易資料、private key  |

網站公開不代表輸入適合公開。即使資料只存在 local storage，shared browser profile、browser extension、malware、device backup 或實體使用者仍可能取得。

## Stored data 與清除

MVP repository adapter 使用 namespaced local storage，例如 `estimate-trace:v1:cases`。預期保存 estimate input、model／parameter version、parameter snapshot、result snapshot 與必要 timestamps；不建立 browser identifier、analytics ID 或跨站 identifier。

限制：

- Local storage 通常以 origin 與 browser profile 隔離，但不提供 application-level encryption 或 per-user authorization。
- Browser 清除網站資料、private mode、quota policy 或 device loss 都可能讓案件永久消失。
- `Clear local data` 沒有 server recycle bin；操作前必須明確確認。
- Storage failure 時保留 in-memory session 並提示 export，不得假裝已保存。
- JSON export 是使用者自行保管的明文檔案；分享前必須重新檢查內容。

Public MVP 不提供 retention policy、legal hold、backup、restore SLA 或跨裝置同步。

## Untrusted input controls

所有 form、local storage 與 imported JSON 都視為 untrusted：

- Import file 上限 1 MB，在 parse 前檢查。
- JSON parse 後以 strict Zod schema 驗證 type、range、length、enum、schema version 與 model／parameter identifiers。
- 拒絕不支援的 schema major；相容的舊 minor 只走明確、可測試 migration。
- Unknown field 採 schema 定義的 reject／strip policy，不以 generic deep merge 寫入 domain object。
- 明確拒絕 `__proto__`、`prototype`、`constructor` 等 prototype pollution path。
- Imported `resultSnapshot` 不可信；由 domain engine 重算後只用於差異比較。
- 任一驗證、migration 或 calculation 失敗都不修改既有案件。
- Error UI 只顯示 path 與可修正原因，不輸出整份 payload 或 raw stack。
- User-generated text 只以 escaped text 顯示，不接受 user-controlled HTML、script 或 LaTeX。

Deterministic calculation 同時是 integrity control：相同 input、parameter snapshot 與 model version 必須得到相同 result；snapshot mismatch 要警告，不能 silent overwrite。

## Response headers

`next.config.ts` 對所有 route 設定：

| Header                       | Policy                                                                     |
| ---------------------------- | -------------------------------------------------------------------------- |
| `Content-Security-Policy`    | same-origin default；禁止 object、frame、remote media 與 form exfiltration |
| `X-Content-Type-Options`     | `nosniff`                                                                  |
| `Referrer-Policy`            | `strict-origin-when-cross-origin`                                          |
| `Permissions-Policy`         | 關閉 camera、microphone、geolocation、payment、USB 與 browsing topics      |
| `Cross-Origin-Opener-Policy` | `same-origin`                                                              |
| `X-Frame-Options`            | `DENY`，作為 `frame-ancestors 'none'` 的 legacy defense                    |

`/estimates/:path*` 另設定 `X-Robots-Tag: noindex, nofollow, noarchive`。

Production CSP 重點：

```text
default-src 'self'
base-uri 'self'
object-src 'none'
frame-ancestors 'none'
frame-src 'none'
form-action 'self'
script-src 'self' 'unsafe-inline'
script-src-attr 'none'
style-src 'self' 'unsafe-inline'
img-src 'self' data: blob:
font-src 'self' data:
connect-src 'self'
worker-src 'self' blob:
media-src 'none'
manifest-src 'self'
```

Next.js static rendering 需要 source-controlled inline bootstrap，因此目前 Production 保留 `script-src 'unsafe-inline'`；它不是允許 user-controlled HTML 的理由。Production 明確不含 `unsafe-eval`，Development 才為 HMR 條件加入 `unsafe-eval` 與 WebSocket connection。不得為消除 console error 把 remote host、`*`、`data:` script 或 Production `unsafe-eval` 加入 allowlist。

`Strict-Transport-Security` 由 hosting edge／HTTPS policy 管理，不在 application config 重複假設。Owner 必須對實際 Vercel Production response 驗證 HTTPS redirect、HSTS 與上述 headers。

## Threat model

| Threat                           | Primary controls                                                                     | Residual risk                                           |
| -------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| 使用者輸入敏感資料               | 全流程 warning、browser-only、無 analytics                                           | Shared device、extension、screenshot、export 仍可能洩漏 |
| XSS／HTML injection              | React escaping、strict validation、KaTeX `trust=false`、no user HTML、CSP            | Production CSP 仍需 inline bootstrap；持續測試          |
| Malicious／oversized import      | 1 MB cap、strict schema、prototype guard、staged commit                              | Browser resource exhaustion 仍需 boundary tests         |
| Corrupted local storage          | Validate-on-read、error isolation、in-memory fallback                                | Local data 可能無法復原                                 |
| Formula tampering／silent drift  | Canonical parameters、model version、snapshot、trace、regression tests               | Public sample 不等於正式核價 control                    |
| Supply-chain compromise          | Exact versions、lockfile、minimum release age、audit、Dependabot、SHA-pinned Actions | Registry／maintainer compromise 無法完全消除            |
| Secret committed to public repo  | `.gitignore`、CI heuristic、GitHub push protection／secret scanning                  | Platform controls 必須由 owner 啟用並驗證               |
| Clickjacking／cross-origin abuse | frame ancestors、X-Frame-Options、COOP、Permissions Policy                           | Browser／extension compromise 在 scope 外               |
| Search indexing                  | Noindex header、opaque ID、no case data in HTML／URL                                 | Noindex 不是 access control                             |

## Logging and observability

允許：

- 不含 case payload 的 Vercel build／deployment logs。
- Development console diagnostics，使用 fictional data。
- Client-side error boundary 向使用者顯示 sanitized message。

禁止：

- 把 name、description、work item、assumption、amount、vendor note、JSON payload 或 local storage dump 寫到 remote log。
- 在 Production `console` 輸出完整 domain input／result。
- 啟用 Vercel Web Analytics、Speed Insights、Google Analytics、session replay 或 remote error SDK，而未先核准 spec 與 consent flow。

未來若提議 telemetry，必須另開 issue、更新 Privacy、明確 opt-in，且永遠不得收集 form content。

## Repository and deployment controls

Code-controlled：

- Exact pnpm version、single frozen lockfile、project-local stores。
- GitHub Actions full SHA pin、read-only token permission、dependency audit、basic secret pattern check、quality gate 與 E2E。
- Dependabot weekly pnpm／GitHub Actions updates；major update 不自動合併。
- Production security headers 與 noindex policy。

Owner-controlled，public release 前必須實際設定：

- GitHub Dependency Graph、Dependabot alerts／security updates。
- Secret scanning、push protection 與 private vulnerability reporting。
- `main` ruleset：PR、required checks、conversation resolution、no force push／delete。
- Vercel project root、Next.js preset、production branch `main`、public Production visibility。
- Preview protection policy、environment scopes、HTTPS、headers 與 rollback。

任何 GitHub／Vercel Dashboard 狀態都必須以平台查證，不得從 repository file 推論為已啟用。

## Verification procedure

Release candidate 至少驗證：

```bash
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm audit --audit-level=high
pnpm build
pnpm test:e2e
```

Production response：

```bash
curl --fail --silent --show-error --head https://PUBLIC_DEPLOYMENT_URL/
curl --fail --silent --show-error --head https://PUBLIC_DEPLOYMENT_URL/estimates
```

人工 browser 驗證：

1. 開啟 DevTools Network 並清空紀錄。
2. 使用完全虛構資料完成 create、edit、quote comparison、export、clear、import。
3. 確認 request body、URL、query、referrer 與 third-party request 都沒有案件內容。
4. 驗證 storage disabled／quota failure 時仍可單次計算且不宣稱已保存。
5. 測試 malformed、oversized、unsupported schema、prototype pollution 與 XSS strings；既有案件不得改變。
6. 檢查 Production CSP 不含 `unsafe-eval`，`/estimates` response 具有 noindex。

把實際 URL、commit SHA、執行日期與結果記入 release evidence；不要在 evidence 附真實 payload。

## Incident and rollback

若發現資料傳輸、XSS、secret 或 formula integrity 問題：

1. 停止 promote，保存不含敏感 payload 的 commit／deployment／header evidence。
2. Secret 先 revoke／rotate，再清除 code；刪除 Git history 不能取代 rotation。
3. Revert 導致問題的 Git commit，必要時暫時回復前一個已驗證 Vercel deployment。
4. 新增 regression test；公式或 schema 結果改變時處理 model version、migration 與 snapshot warning。
5. 透過 private advisory 協調修補與 disclosure。
6. 更新本文件、release note 與 affected versions。

正式公司案件所需的 incident audit、RBAC、transaction log、retention 與 legal process 不屬於 public MVP，必須由獨立 private system 提供。
