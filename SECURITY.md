# Security Policy

## 結論

請勿在 public issue、discussion、PR 或 commit 張貼 exploit、secret、匯入檔、local storage 內容或其他敏感資料。EstimateTrace 的 public MVP 是 browser-only 決策輔助工具，不應接收、同步或記錄估算案件；使用者仍不得輸入公司機密、個人資料、真實乙方名稱、NDA 內容或未公開報價。

Repository owner 必須在公開上線與接受外部回報前啟用 GitHub Private Vulnerability Reporting，並驗證 `Security` 頁面可使用 `Report a vulnerability`。目前 repository 內沒有可驗證的私下聯絡管道，且本專案不虛構 email；在 owner 完成設定並更新本文件前，這是 public launch blocker。

## 支援範圍

| Version                            | Security support                              |
| ---------------------------------- | --------------------------------------------- |
| 最新 production release            | 支援；以修補後 release 取代受影響版本         |
| `main`／Preview                    | Best effort；不是 production support contract |
| 舊版、fork 或自行修改的 deployment | 不保證支援；請先重現於最新 release            |

尚未建立 production release 時，maintainer 只接受針對目前 `main` 的修補，不應把 pre-release 狀態宣稱為正式支援版本。

## 私下回報流程

在 Private Vulnerability Reporting 已啟用後：

1. 前往 repository 的 `Security` → `Advisories` → `Report a vulnerability`。
2. 提供受影響 version／commit、風險、最小重現步驟與建議修補方向。
3. Proof of concept 必須使用虛構資料；不要附 token、真實案件、完整 local storage、browser profile 或未遮蔽的 production log。
4. 在 maintainer 確認修補與揭露時程前，請避免公開細節。

若介面沒有 `Report a vulnerability`，表示私下管道尚未就緒。請勿改用 public issue；repository owner 應先完成設定，或在本文件公布另一個經驗證的 private channel。

## 回應目標

以下是維護目標，不是服務等級保證：

- 3 個工作天內確認收到並移除不必要的敏感附件。
- 7 個工作天內完成初步 severity、affected versions 與重現評估。
- Critical／High 問題優先建立私下修補、回歸測試、release 與 rollback plan。
- 修補發布後更新 advisory、受影響版本與必要的 model／schema migration note。

Maintainer 會盡量與 reporter 協調 credit 與 disclosure；不得在 security advisory 中複製真實使用者資料。

## 優先回報項目

- User input 或 imported JSON 造成 XSS、script execution、prototype pollution 或任意 code execution。
- 案件名稱、描述、工作項目、金額或匯入內容被送到 server、analytics、remote log 或第三方。
- 跨案件資料混淆、未確認的覆寫、import failure 仍修改既有資料。
- CSP／security header bypass，或 `/estimates` 內容被索引且洩漏敏感字串。
- Dependency／GitHub Actions supply-chain compromise、惡意 build script 或 exposed credential。
- 可利用的 denial of service，例如繞過 1 MB import limit。

一般功能 bug、文件問題或沒有安全影響的 browser 相容性問題可使用 issue template，但仍只能使用虛構資料。

## Security boundary

Public MVP 的預期邊界：

- 無登入、後端案件 API、database、server-side persistence、analytics、session replay 或 third-party tracker。
- 案件只保存在當前 browser 的 local storage；共享裝置上的其他使用者仍可能讀取。
- Local storage 不提供 encryption、multi-user isolation、backup、immutable audit log 或 transaction guarantee。
- Imported JSON 必須限制 1 MB、以 strict schema 驗證、拒絕不支援 major version、防止 prototype pollution，並在 commit 前重新計算。
- User-generated text 只能以 escaped text 顯示，不接收使用者 LaTeX 或 remote script。
- Calculation trace 是可重現說明，不是具法律效力或 tamper-evident 的 audit log。

公司資料、SSO、RBAC、database、正式 audit log、retention 或多人協作必須在獨立 private project 中設計，不得直接加入 public upstream。

## Maintainer release checklist

下列平台設定無法只靠 repository file 保證，owner 必須在 public release 前逐項驗證：

- GitHub Dependency Graph、Dependabot alerts、security updates、secret scanning 與 push protection。
- `main` ruleset：required PR、required CI、conversation resolution、禁止 force push 與 branch deletion。
- GitHub Private Vulnerability Reporting 與實際 private report smoke test。
- Vercel production branch、deployment visibility、HTTPS、response headers 與 rollback。
- Production network inspection：估算內容沒有送到 Vercel Function 或第三方。
- `pnpm audit`、lockfile frozen install、tests、E2E、build 與 dependency license review。

不要把尚未實際檢查的項目記錄為已通過。
