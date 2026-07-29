# EstimateTrace — Codex 開發目標與專案規格

> Public GitHub repository：`estimate-trace`
> 產品定位：可追溯的軟體需求成本估算與乙方報價合理性分析工具
> 文件版本：`1.0.0`
> 文件日期：2026-07-29
> 文件語言：繁體中文；專有名詞、API、程式碼與必要術語保留英文
> 預定授權：MIT License
> 規格狀態：Ready for implementation

---

## 0. 結論與關鍵決策

EstimateTrace 是一個公開、免費、可說明計算過程的軟體需求成本估算網站，主要協助甲方 IT Business Analyst：

1. 將需求拆解為可估算的工作項目。
2. 產生 P50、P80 合理工作量與價格區間。
3. 比較乙方報價與模型結果。
4. 向需求提出者、主管或採購說明估算依據。
5. 以公式、參數快照及版本資訊保留可追溯性。

MVP 採以下關鍵決策：

- GitHub repository 與 Vercel Production 網站皆為 **Public**。
- 網站是通用方法展示與本機估算工具，不是公司正式採購核價系統。
- MVP **不提供登入、不使用後端資料庫、不上傳使用者輸入、不預設啟用 Analytics**。
- 估算案件只儲存在使用者瀏覽器；提供 JSON 匯入／匯出及列印報告。
- 所有範例資料皆為虛構資料，不得包含真實公司、乙方、員工、內部系統或實際報價。
- 核心估算採確定性的 Bottom-up Parametric Model；相同輸入與相同模型版本必須得到相同輸出。
- `/methodology` 必須提供完整的公式／定義說明專頁，使用繁體中文、數學式與 English terminology。
- COCOMO II 僅作為方法論背景與後續擴充方向，不作為 MVP 的主要估算引擎。
- 未來公司專用版應以獨立 Private repository 或 private fork 實作，不得把公司機密提交回 public upstream。

---

## 1. 專案基本資料

| 項目 | 規格 |
|---|---|
| Product name | EstimateTrace |
| Repository name | `estimate-trace` |
| GitHub visibility | Public |
| Website | Vercel Public Production Deployment |
| Primary audience | 甲方 IT Business Analyst、Project Manager、Product Owner、採購與需求提出者 |
| Default locale | `zh-TW` |
| Default currency | `TWD` |
| Default effort unit | `person-hour` |
| License | MIT License |
| Runtime | Node.js 24 LTS |
| Framework | Next.js 16 App Router；實作時採已修補安全問題的受支援 16.x 版本 |
| Language | TypeScript，啟用 strict mode |
| Package manager | pnpm；只允許一份 `pnpm-lock.yaml` |
| Deployment | Vercel，連接 GitHub repository |
| Persistence | Browser-only local storage adapter；無 server-side persistence |

### 1.1 GitHub Description

```text
Traceable software requirement cost estimation and vendor quote analysis for IT business analysts.
```

### 1.2 一句話產品說明

> EstimateTrace 將需求、工作量、風險、成本與乙方報價連成一條可檢查、可重算、可說明的估算軌跡。

### 1.3 前提與假設

- MVP 面向個人使用與公開示範，不處理多人協作。
- 使用者能取得乙方報價總額，但未必有完整工時明細。
- 公開版的預設參數只代表示範基準，不代表任何產業或公司的市場公允價格。
- 使用者對每個輸入值與參數選擇負責；系統只提供決策輔助，不作出採購或法律結論。
- 瀏覽器支援範圍至少符合 Next.js 16 官方基準：Chrome 111+、Edge 111+、Firefox 111+、Safari 16.4+。
- TWD 金額顯示預設不使用小數；計算過程不得提早四捨五入。

---

## 2. 產品目標

### 2.1 主要目標

- **可解釋**：每個結果可向下追溯到需求項目、數量、單位工時、複雜度、風險因子及商業加成。
- **可比較**：以相同稅基與成本口徑比較模型 P50、P80 與乙方報價。
- **可重現**：JSON 匯出檔包含輸入、參數快照、模型版本與結果，重新匯入後可得到相同結果。
- **可教育**：公式專頁讓非工程背景使用者理解估算如何形成，以及結果有哪些限制。
- **可擴充**：估算引擎與 UI、儲存機制分離，日後可在公司專用版加入登入、資料庫、Audit Log 與組織參數校準。
- **安全公開**：程式碼、文件與示範資料可公開，不依賴任何秘密資料或 private service。

### 2.2 非目標

MVP 不試圖：

- 宣稱乙方報價「正確」或「錯誤」。
- 以單一數字取代專業判斷、議價、採購或合約審查。
- 建立跨公司通用且保證精準的市場單價。
- 儲存真實需求書、合約、乙方名稱、個人資料或公司內部報價。
- 使用 AI／LLM 直接決定成本。
- 進行 OCR、需求文件上傳或自動解析乙方報價。
- 實作多人協作、RBAC、SSO、server-side Audit Log 或正式簽核流程。
- 在 MVP 實作完整 COCOMO II、COSMIC、Function Point 或 Machine Learning 模型。

### 2.3 成功指標

公開版上線後，以匿名且不需追蹤個人的方式進行人工驗收：

- 新使用者能在 10 分鐘內完成一筆示範估算。
- 使用者能在結果頁找到每個主要數字的來源。
- 使用者能解釋 P50 與 P80 的差異。
- 匯出後重新匯入，所有輸入與結果一致。
- 無網路 API 接收估算案件內容。
- Lighthouse 在 Production build 的 Accessibility、Best Practices、SEO 各達 90 分以上；Performance 目標 85 分以上。

---

## 3. 使用者角色與使用情境

### 3.1 Primary Persona：甲方 IT Business Analyst

需求：

- 把模糊需求拆成畫面、報表、邏輯、資料庫、介接、資料轉置、權限、測試、部署與文件等工作。
- 將乙方報價轉換成可討論的差異。
- 向非工程使用者說明「為什麼需要這些成本」。
- 保存估算依據，避免只留下最後一個總價。

### 3.2 Secondary Personas

| 角色 | 使用目的 |
|---|---|
| Product Owner／需求提出者 | 了解需求範圍、複雜度與成本的關係 |
| Project Manager | 交叉檢查工作量、時程壓縮與交付成本 |
| 採購／主管 | 檢視乙方報價與合理區間差異及追問事項 |
| 開源使用者 | 學習估算方法、fork 專案並替換參數 |

### 3.3 核心使用情境

#### UC-01：建立估算

1. BA 建立一個本機估算案件。
2. 輸入不含敏感資訊的案件名稱與背景摘要。
3. 選擇或新增工作項目。
4. 設定數量、複雜度與風險因子。
5. 設定工時與商業參數。
6. 取得 P50、P80 工作量與合理價格。

#### UC-02：比較乙方報價

1. BA 輸入乙方報價金額及是否含稅。
2. 系統正規化成與模型相同的稅基。
3. 顯示差額、差異率、落點與可能追問事項。
4. 系統不得直接輸出「合理／不合理」的絕對結論。

#### UC-03：說明估算

1. BA 開啟結果說明。
2. 查看工作量、風險、成本與報價加成 waterfall。
3. 展開每個數字的公式與輸入來源。
4. 以瀏覽器列印功能輸出適合分享的報告。

#### UC-04：保存與重現

1. BA 將案件匯出成 JSON。
2. 系統將 `schemaVersion`、`modelVersion`、`parameterSnapshot`、輸入與結果一併匯出。
3. 另一個瀏覽器匯入 JSON。
4. 系統驗證資料後重算；若結果與檔案中的 snapshot 不一致，必須警告使用者。

#### UC-05：理解公式

1. 使用者從全站主導覽進入「公式與定義」。
2. 依序理解 Estimate、Effort、Complexity、Risk Factor、P50、P80、Overhead、Vendor Markup 與 Variance。
3. 從公式的變數連回計算器對應欄位。

---

## 4. 產品原則

1. **Explainability First**：結果頁先呈現來源與假設，再呈現判斷標籤。
2. **Deterministic Core**：核心計算為 pure functions，不依賴時間、網路、UI state 或隨機數。
3. **No Hidden Coefficients**：每個係數都有名稱、定義、預設值、允許範圍及選擇理由。
4. **Units Are Types**：`person-hour`、`person-day`、百分比、TWD 與一般數字不可在 domain layer 任意混用。
5. **No Double Counting**：同一成本不得同時存在於 unit effort、phase loading、risk factor 與 overhead。
6. **Uncertainty Is Visible**：輸出 P50、P80 與假設，不只輸出單一金額。
7. **Public by Design**：不需要 secret 才能 build；不收集估算內容；範例完全虛構。
8. **Accessible by Default**：鍵盤可操作、表單有 label、錯誤可被 screen reader 讀取、色彩不是唯一訊息載體。
9. **Simple Before Extensible**：先完成透明的單機 MVP，再擴充登入、資料庫或 AI。

---

## 5. MVP 範圍

### 5.1 In Scope

- Public landing page。
- 本機估算案件清單。
- 建立、編輯、複製、刪除本機案件。
- 需求工作項目 CRUD 與預設 catalog。
- 複雜度與風險問卷。
- 工時、P50、P80、成本與合理價格計算。
- 乙方報價比較。
- 可展開的計算說明與參數快照。
- 公式／定義說明專頁。
- 內建至少兩筆虛構範例。
- JSON 匯入／匯出。
- 適合 A4 的列印報告。
- Browser local persistence。
- 重設為公開預設參數。
- 基本 responsive layout、dark mode 非必要。
- Unit、integration、component 與 end-to-end tests。
- GitHub Actions CI。
- Vercel Preview 與 Production deployment。
- README、方法論、參數、資料安全、相依套件管理與貢獻文件。

### 5.2 Out of Scope

- 使用者帳號、OAuth、SSO、RBAC。
- PostgreSQL、ORM、server actions 寫入或任何遠端案件儲存。
- 多人共同編輯與審批。
- 真實公司參數或市場行情資料。
- PDF server generation；MVP 使用 print stylesheet。
- Excel 匯入／匯出。
- 自動匯率、稅率或物價資料。
- AI 需求拆解、文件上傳、RAG、LLM 成本判斷。
- 完整 COCOMO II／COSMIC engine。
- 以 Vercel Web Analytics、Google Analytics 或其他工具蒐集估算輸入。

---

## 6. 功能需求

### 6.1 Landing 與導覽

#### FR-001：產品首頁

首頁必須顯示：

- 產品用途與適用對象。
- 「開始估算」Primary CTA。
- 「查看公式與定義」Secondary CTA。
- 三步驟說明：拆需求、估工作量、比報價。
- 明顯免責聲明：「本工具為決策輔助，不構成正式報價、採購或法律意見」。
- 明顯資料提醒：「請勿輸入公司機密、個人資料或受 NDA 保護內容」。

#### FR-002：全站導覽

Desktop 使用 top navigation；mobile 使用可鍵盤操作的 menu。固定項目：

- 首頁
- 我的估算
- 建立估算
- 公式與定義
- 範例
- 關於

### 6.2 本機案件管理

#### FR-010：案件清單

- 顯示案件名稱、最後更新時間、P50、P80、乙方報價及狀態。
- 支援依最後更新時間排序。
- 空狀態提供「建立估算」與「載入範例」。
- 明確標示「資料只儲存在此瀏覽器」。

#### FR-011：建立案件

必要欄位：

- `name`
- `description`，最多 1,000 字元，並提示不得輸入敏感資料
- `currency`，MVP 只允許 `TWD`，資料模型保留擴充能力
- `hoursPerPersonDay`，預設 8
- `daysPerPersonMonth`，預設 20
- `taxRate`，公開範例預設 5%，可改為 0；必須標示為示範值

#### FR-012：編輯、複製與刪除

- 修改後自動在本機儲存。
- 複製時產生新的 UUID 與建立時間。
- 刪除前顯示確認對話框。
- 刪除只影響當前瀏覽器資料，且 MVP 不提供回收桶。

### 6.3 需求工作項目

#### FR-020：工作項目 Catalog

內建工作類型：

| Code | 類型 | 範例 |
|---|---|---|
| `UI` | 畫面功能 | 查詢、維護、審核畫面 |
| `REPORT` | 報表 | Excel、PDF、監管報表 |
| `BUSINESS_LOGIC` | 商業邏輯 | 計算、規則、狀態流程 |
| `DATABASE` | 資料庫 | Table、View、Stored Procedure |
| `INTEGRATION` | 系統介接 | REST API、SFTP、Message Queue |
| `BATCH` | 批次處理 | 排程、日終、月結 |
| `MIGRATION` | 資料轉置 | 清理、轉換、核對 |
| `AUTHORIZATION` | 權限 | Role、Function、Data Permission |
| `TESTING` | 額外測試 | Regression、Performance、Security |
| `DEPLOYMENT` | 部署 | SIT、UAT、Production |
| `DOCUMENTATION` | 文件與教育 | 操作手冊、技術文件、訓練 |
| `CUSTOM` | 自訂 | 使用者自行定義 |

每種 catalog item 具有：

- 顯示名稱與說明。
- 公開示範用 `unitHours`。
- 單位，例如 screen、report、rule、endpoint、job、table、batch。
- 是否已包含 analysis、implementation、basic test。
- 資料來源說明：「示範值，非市場標準」。

#### FR-021：工作項目 CRUD

每個工作項目包含：

- `title`
- `type`
- `description`
- `quantity`
- `unit`
- `unitHours`
- `complexityLevel`
- 適用的 risk factors
- 備註與假設

限制：

- `quantity > 0`
- `unitHours >= 0.25`
- 金額與工時輸入有明確上下限。
- 所有錯誤顯示在欄位旁與表單摘要。

#### FR-022：複雜度

預設複雜度：

| Level | Multiplier | 定義 |
|---|---:|---|
| Low | 0.80 | 單一路徑、規則明確、低整合依賴 |
| Medium | 1.00 | 一般企業功能、少量例外與驗證 |
| High | 1.35 | 多路徑、多角色、多例外或高整合依賴 |
| Very High | 1.70 | 核心交易、複雜狀態、嚴格效能或高度法遵 |

UI 必須顯示定義，不得只顯示係數。

### 6.4 Risk Factors 與 Cross-cutting Effort

#### FR-030：Risk Factor Questionnaire

MVP 支援：

- Requirement Clarity
- Legacy／Technical Debt
- Integration Dependency
- Security／Compliance
- Data Migration Quality
- Schedule Compression

每個 factor 有 Low／Nominal／High／Very High 選項、說明與 multiplier。所有預設值集中於 versioned parameter set。

#### FR-031：Cross-cutting Effort

可設定以下 phase loading：

- Business Analysis
- Architecture／Technical Design
- Project Management
- Quality Assurance
- Deployment／Release
- Documentation／Training

預設百分比必須明確指出分母為 adjusted implementation effort。若 catalog item 已把該活動包含在 unit effort，UI 與 engine 必須避免重複計入。

### 6.5 估算與結果

#### FR-040：即時計算

- 合法輸入改變後重新計算。
- 計算只能呼叫 domain engine，不得在 React component 重寫公式。
- 非法輸入時不產生誤導結果，並顯示可修正錯誤。

#### FR-041：結果摘要

至少顯示：

- Base implementation effort。
- Adjusted implementation effort。
- Cross-cutting effort。
- Total most-likely effort。
- P50 與 P80 person-hours。
- 換算 person-days、person-months。
- P50 與 P80 engineering cost。
- P50 與 P80 benchmark quote，分別顯示未稅與含稅。
- 主要三項成本或風險驅動因素。
- `modelVersion` 與參數集名稱。

#### FR-042：Explainability Breakdown

每個摘要數字都能展開，顯示：

- 公式。
- 代入值。
- 中間結果。
- 單位。
- 四捨五入規則。
- 來源工作項目或參數。
- 避免 double counting 的提示。

#### FR-043：Waterfall

以 accessible table 為必要實作，圖表為 progressive enhancement，依序顯示：

1. Base effort
2. Complexity adjustment
3. Risk adjustment
4. Cross-cutting effort
5. Direct cost
6. Overhead
7. Warranty／Support
8. Vendor Markup
9. Tax

### 6.6 乙方報價比較

#### FR-050：輸入乙方報價

欄位：

- Quote amount
- Tax basis：tax-inclusive 或 tax-exclusive
- Optional quote note，不得要求乙方真實名稱
- Quote date，可選

#### FR-051：比較結果

顯示：

- 正規化後乙方未稅報價。
- 與 P50 的金額差與百分比。
- 與 P80 的金額差與百分比。
- Vendor quote／P50 ratio。
- Vendor quote／P80 ratio。
- 區間標籤。
- 根據主要差異產生的規則式追問清單。

區間標籤只可使用：

- 明顯低於模型區間，請檢查漏項或追加風險。
- 接近模型參考區間。
- 高於模型 P50，請確認成本來源。
- 高於模型 P80，建議要求工作量與風險明細。

標籤門檻必須來自 parameter set、可追溯、可調整，並標示為公開示範規則，不得宣稱是產業標準。

#### FR-052：追問事項

追問清單由 deterministic rules 產生，例如：

- 是否包含完整 SIT、UAT 與 Regression Test？
- 是否包含既有系統影響分析與資料核對？
- 是否包含 Production deployment、rollback 與 hypercare？
- Warranty 範圍、期間與 SLA 為何？
- 是否因需求未明而加入 contingency？
- 乙方是否能提供角色別人日與 blended rate？
- 報價是否包含稅、授權、第三方服務與差旅？

### 6.7 匯入、匯出與列印

#### FR-060：JSON 匯出

檔案至少包含：

```json
{
  "schemaVersion": "1.0.0",
  "modelVersion": "bottom-up-1.0.0",
  "exportedAt": "ISO-8601 timestamp",
  "estimate": {},
  "parameterSnapshot": {},
  "resultSnapshot": {}
}
```

規則：

- 不包含 browser identifier、IP、analytics identifier 或隱藏 metadata。
- 檔名使用安全字元，例如 `estimate-trace-2026-07-29.json`。
- 匯出前再次顯示不得分享敏感資訊的提醒。

#### FR-061：JSON 匯入

- 先以 schema 驗證，禁止直接信任輸入。
- 拒絕不支援的 major `schemaVersion`。
- 對可遷移的舊 minor version 執行明確 migration。
- 忽略未知欄位或明確報錯，不允許 prototype pollution。
- 限制檔案大小，MVP 上限 1 MB。
- 匯入後由 engine 重算，不直接信任 `resultSnapshot`。
- 若重算結果與 snapshot 不一致，顯示模型或參數版本差異。

#### FR-062：列印報告

列印內容：

- 案件名稱與估算時間。
- 免責聲明與資料敏感提醒。
- Scope 與 assumptions。
- Work item breakdown。
- Risk factor rationale。
- P50／P80 effort and price。
- Vendor quote comparison。
- Questions to vendor。
- Model version、parameter snapshot ID。
- 公式專頁 URL。

不得在列印版出現導覽、按鈕或無意義背景。

### 6.8 範例與說明

#### FR-070：內建範例

至少提供：

1. 「會員資料查詢與匯出」：一般 CRUD、權限與報表。
2. 「公開市場價格批次介接」：API、batch、資料核對與 rollback。

所有名稱、數字與描述必須明確標為 fictional／illustrative。

#### FR-071：清除資料

- 提供「清除本機所有資料」。
- 執行前顯示不可復原警告。
- 清除後保留網站程式與內建範例，但移除使用者建立的案件與自訂參數。

---

## 7. 非功能需求

### NFR-001：Correctness

- 核心公式由 pure functions 實作。
- 相同 input、parameter set 與 model version 必須得到 bit-for-bit 相同的未格式化結果。
- 金額使用 decimal-safe strategy；不得以浮點誤差造成可見金額錯誤。
- 顯示格式與 domain calculation 分離。
- 每個公式需有 normal、boundary、invalid 與 regression test。

### NFR-002：Traceability

- 每次計算結果包含 `modelVersion`、`parameterSetId`、`parameterSetVersion`。
- JSON 匯出包含完整 parameter snapshot。
- 公式文件、程式常數與測試 fixture 使用相同 parameter source。
- 禁止在 UI component 內散落 magic numbers。

### NFR-003：Performance

- Production 首頁與方法論頁以 static rendering 為優先。
- 初始頁面不得因圖表 library 載入過量 JavaScript。
- 計算器操作在一般桌面裝置上應於 100 ms 內更新結果。
- 不因案件增加而進行不必要的全量重算。
- 匯入 1 MB 內合法 JSON 應在 1 秒內完成驗證與重算。

### NFR-004：Accessibility

- 目標 WCAG 2.2 AA。
- 所有互動可用 keyboard 完成。
- Focus state 清楚可見。
- 表單欄位具有 programmatic label、description 與 error message。
- 金額與比例的正負差異不得只用紅綠色表達。
- Chart 必須有等價 data table。
- 數學式需有文字敘述或 `aria-label`。
- Dynamic result update 使用適當 live region，但不得造成 screen reader 噪音。

### NFR-005：Responsive Design

- 支援 360 px 寬手機、tablet 與 desktop。
- 計算表格在窄螢幕轉為 cards 或可理解的 horizontal scroll。
- 主要操作不依賴 hover。

### NFR-006：Security

- 不得將 secret、token、connection string 或 private endpoint 放進 repository。
- 不得使用 `NEXT_PUBLIC_*` 傳遞秘密。
- 所有 imported JSON 先驗證。
- User-generated text 只以 escaped text 顯示，不使用未清理的 `dangerouslySetInnerHTML`。
- KaTeX 只渲染 source-controlled 公式，不接受未清理的使用者 LaTeX。
- 建立 CSP、`X-Content-Type-Options`、`Referrer-Policy` 與合理的 `Permissions-Policy`。
- 禁止第三方 tracker、chat widget 與 remote script。
- CI 執行 dependency audit、secret scan 或等價檢查。

### NFR-007：Privacy

- MVP 不把案件資料送往伺服器。
- 不預設啟用 Vercel Web Analytics、Speed Insights、Google Analytics 或 session replay。
- 若未來加入 telemetry，必須另開 issue、更新 Privacy 頁、取得明確同意，且不得收集表單內容。
- 提供容易找到的「資料只留在瀏覽器」與「清除本機資料」說明。

### NFR-008：Maintainability

- Domain layer 不依賴 React、Next.js、Web Storage 或 formatting library。
- Storage 經由 port／adapter 隔離。
- 公式、參數、型別、驗證與 formatters 分層。
- TypeScript `strict: true`。
- ESLint 與 formatter 在 CI 強制執行。
- 公開 API 與重要 domain decision 有文件。

### NFR-009：Observability

公開 MVP 不記錄使用者輸入。只允許：

- Vercel build／deployment logs。
- 不含估算資料的 client-side error boundary 顯示。
- 開發環境 console diagnostics。

不得把案件名稱、描述、工作項目、金額或 JSON 檔內容寫入 remote log。

### NFR-010：Compatibility

- Node.js 24 LTS。
- Next.js 16.2.11 或更新且仍受支援的 16.x security-patched release。
- 現代瀏覽器支援依 Next.js 官方基準。
- 若 browser storage 不可用，網站仍可進行單次估算並提示無法保存。

### NFR-011：SEO 與分享

- Landing、Methodology、Examples、About 具有 metadata、Open Graph 基本資訊與 canonical URL。
- 本機案件頁不得被索引；使用 `noindex`。
- 不在 URL query string 放案件名稱、描述、金額或任何工作項目。

### NFR-012：Resilience

- Storage 寫入失敗時保留當前 session state 並提示匯出備份。
- Corrupted local data 不得造成全站白屏。
- Import failure 顯示可理解原因，不修改既有案件。
- Error Boundary 不得回傳敏感輸入到任何外部服務。

---

## 8. 頁面與導覽規劃

### 8.1 Sitemap

```text
/
├── /estimates
│   ├── /estimates/new
│   └── /estimates/[id]
│       ├── ?step=scope
│       ├── ?step=items
│       ├── ?step=risk
│       ├── ?step=commercial
│       └── ?step=result
├── /methodology
├── /examples
├── /about
├── /privacy
└── /not-found
```

注意：

- `[id]` 只使用 opaque UUID，不含敏感字串。
- `step` 只控制 UI，不承載估算內容。
- `/estimates/[id]` 與 `/estimates/new` 設為 `noindex`。

### 8.2 估算 Wizard

| Step | 名稱 | 主要內容 | 完成條件 |
|---|---|---|---|
| 1 | 範圍與假設 | 名稱、背景、計量單位、免責提醒 | 必填欄位合法 |
| 2 | 工作項目 | Catalog、quantity、unit hours、complexity | 至少一筆合法 item |
| 3 | 風險與交付 | Risk factors、phase loading、uncertainty | 所有 factor 有值 |
| 4 | 商業參數 | Hourly rate、direct cost、overhead、warranty、markup、tax | 金額與比率合法 |
| 5 | 結果與報價 | P50、P80、breakdown、vendor quote、questions | 可匯出或列印 |

### 8.3 主導覽文案

| Route | 顯示名稱 |
|---|---|
| `/` | 首頁 |
| `/estimates` | 我的估算 |
| `/estimates/new` | 建立估算 |
| `/methodology` | 公式與定義 |
| `/examples` | 範例 |
| `/about` | 關於 |

---

## 9. 公式／定義說明專頁

### 9.1 Route 與目的

- Route：`/methodology`
- Page title：`公式與定義｜EstimateTrace`
- H1：`軟體需求成本估算的公式與定義`
- 頁面必須可從主導覽與每個結果 breakdown 直接到達。
- 頁面是正式產品功能，不是 README 的替代品。

### 9.2 呈現規則

- 說明文字使用繁體中文。
- 專有名詞保留 English，例如 `Effort`、`Complexity Multiplier`、`P50`、`P80`、`Vendor Markup`。
- 數學式以 KaTeX 或等價 accessible renderer 呈現；display formula 必須使用
  傳統 serif math typography、italic variable、真正的上下標與可縮放大型運算子，
  不得退化為 Unicode／monospace-like linear text。
- 每個公式必須同時提供：
  - 中文目的。
  - 變數表。
  - 單位。
  - 允許範圍。
  - 代入數字的範例。
  - 限制與避免 double counting 的提醒。
  - 連到計算器欄位的 anchor。
- 所有係數明確標示為公開示範預設值，不是產業標準。

### 9.3 專頁章節

1. 為什麼成本估算應輸出區間。
2. 名詞與計量單位。
3. Work Item Base Effort。
4. Complexity Multiplier。
5. Risk Factor Adjustment。
6. Cross-cutting Effort。
7. Three-point Estimate。
8. P50 與 P80。
9. Engineering Cost。
10. Overhead、Warranty 與 Vendor Markup。
11. Tax normalization。
12. Vendor Quote Variance。
13. 結果如何解讀。
14. 常見 double counting。
15. 模型限制與適用邊界。
16. COCOMO II、COSMIC 與後續擴充。

---

## 10. 估算模型與數學定義

### 10.1 符號與單位

| 符號 | 名稱 | 定義 | 單位 |
|---|---|---|---|
| \(q_i\) | Quantity | 第 \(i\) 個工作項目的數量 | item unit |
| \(u_i\) | Unit Effort | 每單位基礎工時 | person-hour／unit |
| \(c_i\) | Complexity Multiplier | 複雜度乘數 | dimensionless |
| \(r_{i,k}\) | Risk Multiplier | 第 \(k\) 個風險對項目 \(i\) 的乘數 | dimensionless |
| \(H_{i,base}\) | Base Effort | 項目基礎工作量 | person-hour |
| \(H_{i,adj}\) | Adjusted Effort | 複雜度與風險調整後工作量 | person-hour |
| \(\alpha_p\) | Phase Loading | 橫向交付階段比例 | ratio |
| \(H_M\) | Most-likely Effort | 最可能工作量 | person-hour |
| \(H_O\) | Optimistic Effort | 樂觀工作量 | person-hour |
| \(H_P\) | Pessimistic Effort | 悲觀工作量 | person-hour |
| \(\mu\) | Expected Effort | PERT 期望工作量 | person-hour |
| \(\sigma\) | Standard Deviation | PERT 標準差近似 | person-hour |
| \(R_h\) | Hourly Rate | 基礎 blended hourly cost | TWD／person-hour |
| \(D\) | Direct Cost | 授權、設備、差旅等直接成本 | TWD |
| \(o\) | Overhead Rate | 供應商管銷與間接成本比例 | ratio |
| \(W\) | Warranty Cost | 保固與 hypercare 成本 | TWD |
| \(m\) | Vendor Markup | 成本加成率，不是 Gross Margin | ratio |
| \(t\) | Tax Rate | 稅率 | ratio |
| \(V\) | Vendor Quote | 正規化後乙方報價 | TWD |

### 10.2 Work Item Base Effort

第 \(i\) 個工作項目的基礎工時：

\[
H_{i,base}=q_i \times u_i
\]

全部項目的基礎工時：

\[
H_{base}=\sum_{i=1}^{n}H_{i,base}
\]

規則：

- \(q_i>0\)。
- \(u_i\geq0.25\)。
- `unitHours` 是公開示範起點，使用者應依組織歷史資料校準。
- 若 `unitHours` 已包含 basic analysis、coding 與 unit test，後續不得再次把同一活動完整加入 phase loading。

### 10.3 Complexity Adjustment

第 \(i\) 個項目經複雜度調整：

\[
H_{i,complex}=H_{i,base}\times c_i
\]

MVP 預設：

\[
c_i \in \{0.80,\ 1.00,\ 1.35,\ 1.70\}
\]

分別代表 Low、Medium、High、Very High。

複雜度描述必須基於可觀察條件，例如：

- Business rule 數量。
- 狀態與例外路徑。
- Role／permission 數量。
- Data source 與 integration endpoint 數量。
- Transaction consistency、rollback 與 auditability。
- Performance、security、compliance 強度。

### 10.4 Risk Factor Adjustment

適用於項目 \(i\) 的風險乘數集合為 \(K_i\)：

\[
H_{i,adj}=H_{i,complex}\times\prod_{k\in K_i}r_{i,k}
\]

全體調整後工時：

\[
H_{adj}=\sum_{i=1}^{n}H_{i,adj}
\]

MVP 參數限制：

\[
0.80 \le r_{i,k} \le 1.50
\]

實作規則：

- 預設為 1.00。
- Factor 只套用到真正受影響的 item；不得無條件套用到所有工作。
- UI 顯示乘數與 rationale。
- 最終乘積若超過 parameter set 的 safety cap，必須警告並要求檢視，不能悄悄截斷。
- `Schedule Compression` 不得被描述為單純把日曆時間縮短；它代表協調、平行作業、返工或加班造成的額外 effort。

### 10.5 Cross-cutting Effort

對每個 phase \(p\)，令 \(E_p\) 為尚未在 work item 內涵蓋該 phase 的
eligible item 集合。先分別計算各 phase，再加總：

\[
H_{cross,p}=\alpha_p\times\sum_{i\in E_p}H_{i,adj}
\]

\[
H_{cross}=\sum_{p=1}^{j}H_{cross,p}
\]

固定額外工作，例如正式上線值班，可另以 \(H_{fixed}\) 表示：

\[
H_M=H_{adj}+H_{cross}+H_{fixed}
\]

公開示範 parameter set 可提供以下起始值，但必須可修改：

| Phase | Symbol | Demo default |
|---|---|---:|
| Business Analysis | \(\alpha_{BA}\) | 0.12 |
| Architecture／Design | \(\alpha_{ARCH}\) | 0.08 |
| Project Management | \(\alpha_{PM}\) | 0.10 |
| Quality Assurance | \(\alpha_{QA}\) | 0.18 |
| Deployment／Release | \(\alpha_{DEPLOY}\) | 0.05 |
| Documentation／Training | \(\alpha_{DOC}\) | 0.05 |

Double-counting 規則：

- 若工作項目本身是 `TESTING`，對該工時不得再套完整 \(\alpha_{QA}\)。
- 若 `unitHours` 已是 end-to-end delivery effort，phase loading 應設為 0 或只加入明確未涵蓋部分。
- 每個 parameter set 必須記錄 unit effort 的包含範圍。

### 10.6 Three-point Estimate

MVP 使用可解釋的 Three-point Estimate 描述不確定性。

使用者設定 downside 與 upside uncertainty：

\[
H_O=H_M\times(1-d)
\]

\[
H_P=H_M\times(1+u)
\]

其中：

\[
0\le d\le0.50,\qquad 0\le u\le2.00
\]

必須保證：

\[
0\le H_O\le H_M\le H_P
\]

建議 UI 不直接要求統計背景，而以風險描述產生示範值：

| Uncertainty | \(d\) | \(u\) | 說明 |
|---|---:|---:|---|
| Low | 0.10 | 0.15 | Scope 清楚、依賴少 |
| Medium | 0.15 | 0.30 | 一般企業需求 |
| High | 0.20 | 0.55 | 多系統依賴或需求未定 |
| Very High | 0.25 | 0.90 | 核心系統、轉置或重大法遵不確定性 |

此表同樣是公開示範值。

### 10.7 PERT、P50 與 P80

使用 Beta-PERT 的常見近似：

\[
\mu=\frac{H_O+4H_M+H_P}{6}
\]

\[
\sigma=\frac{H_P-H_O}{6}
\]

以 Normal approximation 產生 percentile：

\[
H_{P_x}=\max(0,\mu+z_x\sigma)
\]

MVP 使用：

\[
z_{50}=0
\]

\[
z_{80}\approx0.8416
\]

因此：

\[
H_{P50}=\mu
\]

\[
H_{P80}=\max(0,\mu+0.8416\sigma)
\]

限制必須在專頁明示：

- 這是近似，不代表真實工作量服從 Normal distribution。
- P80 不是「多加 30%」的固定 buffer。
- 當輸入的 optimistic／pessimistic 沒有歷史資料支持時，輸出只是一個透明的 scenario range。
- MVP 不做 Monte Carlo simulation；後續版本可加入。

### 10.8 工時換算

若每人日工時為 \(h_d\)，每人月工作日為 \(d_m\)：

\[
PersonDays_x=\frac{H_{P_x}}{h_d}
\]

\[
PersonMonths_x=\frac{H_{P_x}}{h_d\times d_m}
\]

預設：

\[
h_d=8,\qquad d_m=20
\]

UI 必須顯示此為換算假設，不可把 person-month 當作 calendar month。

### 10.9 Engineering Cost

對 percentile \(x\)：

\[
C_{labor,x}=H_{P_x}\times R_h
\]

\[
C_{delivery,x}=C_{labor,x}+D
\]

定義：

- \(R_h\) 是 delivery labor 的基礎 blended hourly cost。
- \(D\) 是不隨工時變動的直接成本。
- 若 \(R_h\) 已包含 overhead，則 \(o\) 必須設為 0。

### 10.10 Overhead、Warranty、Vendor Markup 與 Tax

供應商完整成本：

\[
C_{full,x}=C_{delivery,x}\times(1+o)+W
\]

未稅 benchmark quote：

\[
Q_{exTax,x}=C_{full,x}\times(1+m)
\]

含稅 benchmark quote：

\[
Q_{incTax,x}=Q_{exTax,x}\times(1+t)
\]

重要定義：

- \(m\) 是 `Vendor Markup`，不是 `Gross Margin`。
- 若使用 Gross Margin \(g\)，公式會是 \(C/(1-g)\)；MVP UI 不混用兩種定義。
- `Overhead`、`Warranty`、`Vendor Markup`、`Tax` 必須分開顯示。
- 不得把 P80 uncertainty 再命名為 risk reserve 後重複加價。

### 10.11 Tax Normalization

若乙方輸入含稅報價 \(V_{incTax}\)：

\[
V_{exTax}=\frac{V_{incTax}}{1+t}
\]

若乙方輸入未稅報價，則：

\[
V_{exTax}=V
\]

所有比較預設使用未稅基準；結果可另外顯示含稅數字。

### 10.12 Vendor Quote Variance

相對於 P50：

\[
\Delta_{50}=V_{exTax}-Q_{exTax,50}
\]

\[
Variance_{50}=
\begin{cases}
\dfrac{\Delta_{50}}{Q_{exTax,50}}, & Q_{exTax,50}>0\\
\text{undefined}, & Q_{exTax,50}=0
\end{cases}
\]

相對於 P80：

\[
\Delta_{80}=V_{exTax}-Q_{exTax,80}
\]

\[
Variance_{80}=
\begin{cases}
\dfrac{\Delta_{80}}{Q_{exTax,80}}, & Q_{exTax,80}>0\\
\text{undefined}, & Q_{exTax,80}=0
\end{cases}
\]

若分母為 0，UI 顯示「無法計算」，不得顯示 Infinity 或 NaN。

### 10.13 示範計算

假設一個工作項目：

- \(q=2\) 個 endpoint。
- \(u=16\) person-hours／endpoint。
- \(c=1.35\)。
- Integration risk \(=1.20\)。
- 其他 risk \(=1.00\)。

則：

\[
H_{base}=2\times16=32
\]

\[
H_{adj}=32\times1.35\times1.20=51.84
\]

若 cross-cutting loading 合計為 40% 且無 fixed effort：

\[
H_M=51.84\times(1+0.40)=72.576
\]

若 \(d=0.15\)、\(u=0.30\)：

\[
H_O=61.6896
\]

\[
H_P=94.3488
\]

\[
H_{P50}=\frac{61.6896+4(72.576)+94.3488}{6}=74.3904
\]

\[
\sigma=\frac{94.3488-61.6896}{6}=5.4432
\]

\[
H_{P80}=74.3904+0.8416(5.4432)\approx78.9714
\]

畫面最後才格式化，例如顯示 P50 `74.4 小時`、P80 `79.0 小時`。

### 10.14 Rounding 與 Decimal Policy

- Domain calculation 保留完整精度。
- Money 使用整數 minor unit 或經審核的 decimal library；TWD 顯示 0 位小數。
- Percentage 內部使用 ratio，例如 15% 儲存為 `0.15`。
- UI 工時顯示 1 位小數；百分比顯示 1 位小數；TWD 顯示整數。
- 匯出檔保留未格式化 decimal string 或可重現 numeric representation。
- 不得在每個中間步驟各自四捨五入。

### 10.15 Model Versioning

模型 ID：

```text
bottom-up-1.0.0
```

版本規則：

- 修改公式或結果語意：major。
- 新增 backward-compatible factor 或 output：minor。
- 修正不改變預期語意的 bug／文件：patch；若實際結果會改變，至少 minor 並提供 migration note。
- 每筆估算保存 `modelVersion`。
- 新版本重算舊案件前必須提示差異，不可無聲覆蓋 snapshot。

---

## 11. 資料模型

### 11.1 Domain Entities

#### `EstimateCase`

| Field | Type | 說明 |
|---|---|---|
| `id` | UUID string | 本機 opaque identifier |
| `schemaVersion` | semver string | 資料格式版本 |
| `modelVersion` | semver-tagged string | 計算模型版本 |
| `name` | string | 案件名稱 |
| `description` | string | 非敏感背景摘要 |
| `currency` | `"TWD"` | MVP 固定 |
| `workItems` | `WorkItem[]` | 工作項目 |
| `riskProfile` | `RiskProfile` | 風險設定 |
| `phaseLoading` | `PhaseLoading` | Cross-cutting ratios |
| `uncertainty` | `UncertaintyProfile` | Three-point 參數 |
| `commercialTerms` | `CommercialTerms` | 成本與報價參數 |
| `vendorQuote` | `VendorQuote \| null` | 乙方報價 |
| `parameterSnapshot` | `ParameterSet` | 參數快照 |
| `createdAt` | ISO timestamp | 建立時間 |
| `updatedAt` | ISO timestamp | 更新時間 |

#### `WorkItem`

| Field | Type | 說明 |
|---|---|---|
| `id` | UUID string | 項目 ID |
| `type` | `WorkItemType` | Catalog code |
| `title` | string | 顯示名稱 |
| `description` | string | 工作內容 |
| `quantity` | positive decimal | 數量 |
| `unit` | string | 單位 |
| `unitHours` | positive decimal | 單位工時 |
| `complexity` | enum | Low～Very High |
| `riskSelections` | record | 適用 factor selection |
| `includedActivities` | enum[] | 避免 double counting |
| `assumptions` | string[] | 假設 |

#### `CommercialTerms`

```text
hourlyRate
directCost
overheadRate
warrantyCost
vendorMarkupRate
taxRate
hoursPerPersonDay
daysPerPersonMonth
```

#### `EstimateResult`

```text
baseEffortHours
adjustedEffortHours
crossCuttingEffortHours
mostLikelyEffortHours
optimisticEffortHours
pessimisticEffortHours
p50EffortHours
p80EffortHours
p50PersonDays
p80PersonDays
p50PersonMonths
p80PersonMonths
p50EngineeringCost
p80EngineeringCost
p50QuoteExTax
p80QuoteExTax
p50QuoteIncTax
p80QuoteIncTax
vendorComparison
drivers[]
warnings[]
calculationTrace[]
```

### 11.2 Value Objects

至少建立：

- `EffortHours`
- `Money`
- `Ratio`
- `Quantity`
- `ModelVersion`
- `ParameterSetId`

這些 value object 或 branded types 應集中處理 validation，避免把 TWD、hours、percentage 與一般 `number` 混用。

### 11.3 Parameter Set

```text
ParameterSet
├── id
├── version
├── displayName
├── description
├── workItemCatalog[]
├── complexityMultipliers
├── riskMultipliers
├── phaseLoadingDefaults
├── uncertaintyDefaults
├── comparisonThresholds
├── roundingPolicy
└── sourceNotes[]
```

第一版：

```text
public-demo-zh-tw@1.0.0
```

### 11.4 Browser Storage

- Storage key 需 namespace，例如 `estimate-trace:v1:cases`。
- 以 repository interface 隔離：

```text
EstimateRepository
├── list()
├── getById(id)
├── save(estimate)
├── delete(id)
├── clear()
└── checkHealth()
```

- Infrastructure adapter 可先使用 `localStorage`。
- 每次讀取都執行 schema validation 與 migration。
- 若超過容量或寫入失敗，保留 in-memory state 並建議 JSON 匯出。
- 禁止把資料同步到 cookies、URL、Server Action 或第三方 API。

### 11.5 未來公司版資料模型

不屬於 MVP，但 domain interface 應保留替換空間：

- `users`
- `organizations`
- `estimate_cases`
- `work_items`
- `estimate_versions`
- `parameter_sets`
- `vendor_quotes`
- `actual_results`
- `audit_logs`

公司版必須另外處理：

- Tenant isolation。
- RBAC。
- Immutable estimate version。
- Idempotency。
- Transaction consistency。
- Audit log。
- Data retention。
- Encryption。
- Backup／restore。
- Rollback strategy。

---

## 12. 技術架構

### 12.1 技術選型

| Concern | Choice | 原因 |
|---|---|---|
| Framework | Next.js 16 App Router | 適合 Vercel、static content 與互動式 calculator |
| Language | TypeScript strict | 降低工時、比率、金額混用 |
| Runtime | Node.js 24 LTS | 目前受支援的 LTS |
| Package manager | pnpm | 專案本地依賴、單一 lock file |
| Styling | Tailwind CSS | 與 create-next-app 慣例一致，便於 responsive UI |
| Components | 原生 semantic HTML 優先；必要時採 shadcn/ui source components | 保留可控性與 accessibility |
| Validation | Zod | 共用 form、storage、import schema |
| Math | KaTeX | 顯示公式；只處理 source-controlled expression |
| Decimal | 優先使用整數 minor unit；若需求不足再評估 `decimal.js` | 避免浮點金額錯誤與不必要依賴 |
| Charts | MVP 優先 CSS／SVG 與 accessible table；除非必要不加入 chart library | 降低 bundle 與維護成本 |
| Unit test | Vitest |
| Component test | React Testing Library |
| E2E | Playwright |
| CI | GitHub Actions |
| Deploy | Vercel Git integration |

### 12.2 Architecture Boundary

```text
UI / Next.js App Router
        ↓
Application Use Cases
        ↓
Domain Model + Estimation Engine
        ↑
Ports
        ↑
Browser Storage / Import-Export Adapters
```

規則：

- `domain` 不 import `react`、`next`、`window`、`localStorage`。
- `application` 協調 use case，不包含 UI formatting。
- `infrastructure` 實作 local storage、JSON file 與 clock／UUID adapter。
- `presentation` 負責 form、navigation、formatting 與 accessibility。
- 所有 server-rendered public content 不接觸案件資料。

### 12.3 Rendering Strategy

| Route | Strategy |
|---|---|
| `/` | Static |
| `/methodology` | Static |
| `/examples` | Static shell＋client load example |
| `/about` | Static |
| `/privacy` | Static |
| `/estimates` | Client-side data after static shell |
| `/estimates/new` | Client component inside static shell |
| `/estimates/[id]` | Client-side local repository lookup |

### 12.4 Dependency Policy

- 只安裝能明確降低風險或大量重複實作的套件。
- 安裝前記錄目的、版本、license、安全性與替代方案。
- Production dependencies 與 dev dependencies 分開。
- 禁止同時存在 `package-lock.json`、`yarn.lock`、`bun.lock`。
- `package.json` 設定 `packageManager`，固定 pnpm exact version。
- `engines.node` 固定 Node.js 24 compatible range。
- `pnpm-lock.yaml` 納入版本控制。
- GitHub Actions 使用 lockfile frozen install。

---

## 13. Repository 結構

```text
estimate-trace/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   ├── workflows/
│   │   └── ci.yml
│   ├── dependabot.yml
│   └── pull_request_template.md
├── docs/
│   ├── architecture.md
│   ├── dependency-management.md
│   ├── estimation-model.md
│   ├── parameter-definition.md
│   ├── privacy-and-security.md
│   └── sample-data-policy.md
├── public/
│   └── ...
├── src/
│   ├── app/
│   │   ├── estimates/
│   │   ├── methodology/
│   │   ├── examples/
│   │   ├── about/
│   │   ├── privacy/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── features/
│   │   ├── estimation/
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   ├── value-objects/
│   │   │   │   ├── formulas/
│   │   │   │   └── services/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   ├── vendor-quote/
│   │   ├── import-export/
│   │   └── reporting/
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── feedback/
│   ├── config/
│   │   ├── parameter-sets/
│   │   └── site.ts
│   ├── lib/
│   └── styles/
├── tests/
│   ├── fixtures/
│   ├── integration/
│   └── e2e/
├── .env.example
├── .gitignore
├── AGENTS.md
├── CONTRIBUTING.md
├── LICENSE
├── README.md
├── SECURITY.md
├── next.config.ts
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
└── vitest.config.ts
```

### 13.1 結構限制

- 估算公式只能存在於 `src/features/estimation/domain/formulas/` 或其明確 domain dependency。
- Public demo parameters 只能從 `src/config/parameter-sets/` 載入。
- UI 顯示文案不得成為公式來源。
- Test fixture 不得複製 production parameter magic numbers；應 import canonical parameter set，只有針對特定 scenario 才覆寫。
- `sources/` 若存在，視為 read-only reference，不得修改、移動或刪除。

---

## 14. UI／UX 規格

### 14.1 視覺方向

- 專業、清楚、接近 decision-support tool，不採遊戲化視覺。
- 主要色彩不暗示「綠色必然合理、紅色必然不合理」。
- 數值對齊、單位固定呈現。
- 一頁只強調一個主要下一步。
- 進階參數預設收合，但摘要中必須可見其影響。

### 14.2 結果資訊層級

1. P50／P80 effort and quote。
2. Vendor comparison。
3. Top drivers。
4. Breakdown。
5. Assumptions and warnings。
6. Full trace。

### 14.3 文案規則

使用：

- 「模型參考區間」
- 「請確認」
- 「可能差異來源」
- 「示範參數」
- 「估算假設」

避免：

- 「正確價格」
- 「乙方報價不合理」
- 「保證」
- 「市場公允價」
- 「AI 判定」

### 14.4 Empty、Loading、Error States

- Browser-only storage 不需要 fake server loading。
- Hydration 前避免顯示錯誤案件數。
- 無資料時提供範例與下一步。
- Import error 顯示欄位路徑與原因，但不顯示整份敏感 payload。
- Calculation warning 與 validation error 分開。

---

## 15. Vercel 部署規格

### 15.1 部署流程

```text
feature branch
    ↓
Pull Request
    ↓
GitHub Actions CI
    ↓
Vercel Preview Deployment
    ↓
Review and accessibility check
    ↓
merge to main
    ↓
Vercel Production Deployment
```

### 15.2 Vercel Project

- Project name：`estimate-trace`。
- Framework Preset：Next.js。
- Production branch：`main`。
- Root directory：repository root。
- Preview：每個 PR／非 production branch。
- Production：merge to `main` 自動部署。
- Public Production 不啟用登入保護。
- Preview 可視維護者需求啟用 Vercel Authentication。

### 15.3 Environment Variables

MVP 不需要 production secret。若工具要求：

- `.env.example` 只放變數名稱、用途與安全假值。
- `.env.local` 必須在 `.gitignore`。
- `NEXT_PUBLIC_SITE_URL` 只能是公開網站 URL，不是 secret。
- Development、Preview、Production 變數分開。
- 新增變數後更新 README 與 `docs/dependency-management.md`。

### 15.4 Build Gate

Vercel deployment 前至少執行：

```text
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

E2E 可在 CI 的獨立 job 對 production build 執行。

### 15.5 Rollback

- Production 問題優先 revert 導致問題的 Git commit。
- Vercel 可用前一個成功 deployment 暫時回復服務。
- 公式結果發生變更時，同時 bump model version 並在 release notes 說明。
- 不得只在 Vercel Dashboard 改 code 或生成無法對應 Git commit 的正式版本。

### 15.6 Custom Domain

MVP 可先使用 `*.vercel.app`。若增加 custom domain：

- 更新 canonical URL、Open Graph、README 與 allowlist。
- 確認 HTTPS、redirect 與 `www` 策略。
- 不在 domain 或 path 暗示屬於任何未授權公司。

---

## 16. Public Repository 注意事項

### 16.1 必要檔案

- `README.md`
- `LICENSE`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `CODE_OF_CONDUCT.md`（接受外部貢獻時）
- `.gitignore`
- `.env.example`
- `docs/dependency-management.md`
- `.github/dependabot.yml`
- Pull Request template
- Issue templates

### 16.2 License

- 預設使用 MIT License。
- 所有加入的 dependency 與圖片、icon、font、範例資料必須 license-compatible。
- 不得直接複製受著作權保護的報價書、公司表單、商業模型參數或內部文件。
- README 清楚區分 software license 與模型輸出的免責聲明。

### 16.3 Branch Protection／Ruleset

對 `main`：

- Require pull request。
- Require CI status checks。
- Block force push。
- Block branch deletion。
- Require conversation resolution。
- 建議 squash merge，保持 linear history。
- Vercel Preview 成功可作為必要或人工檢查條件。

### 16.4 Supply Chain

- 啟用 GitHub Dependency Graph、Dependabot alerts 與 Dependabot security updates。
- `.github/dependabot.yml` 每週檢查 pnpm 與 GitHub Actions。
- Public repository 啟用 secret scanning／push protection。
- GitHub Actions 使用最小 `permissions`。
- 第三方 GitHub Action 固定到完整 commit SHA；由 Dependabot 更新。
- dependency PR 必須通過 tests 與 build，不自動合併 major update。

### 16.5 不得公開的內容

- 公司名稱、客戶名稱、乙方名稱。
- 真實報價、費率、底價、預算、合約條款。
- 內部系統名稱、IP、URL、architecture diagram。
- Production log、stack trace 中的敏感 payload。
- Token、API key、cookie、certificate、connection string。
- 個人資料、員工資料、NDA 文件。
- 由公司資產衍生且未獲授權的 formula coefficient。

### 16.6 公司專用版分流

建議：

```text
estimate-trace
Public upstream，通用公式、UI、虛構資料

company-estimate-trace
Private repository，公司登入、參數、歷史案件、Audit Log
```

規則：

- 公司版不得把 sensitive commit 推回 public upstream。
- 共用改良先清除公司資訊並做 independent review，再以乾淨 patch 回饋 upstream。
- 公司版 secrets 只存在 approved secret manager／deployment environment。

---

## 17. 安全與範例資料規範

### 17.1 資料分類

| Classification | Public MVP 是否允許 | 範例 |
|---|---|---|
| Public | 允許 | 公開公式、虛構示範 |
| Internal | 不允許 | 公司流程、內部系統名稱 |
| Confidential | 不允許 | 報價、合約、人力單價 |
| Restricted | 禁止 | 個資、credential、金融交易資料 |

### 17.2 Sample Data Rules

所有範例：

- 使用中性虛構名稱。
- 不對應真實公司、專案或乙方。
- 數值以教學可讀性為目標，不宣稱市場基準。
- `description` 明示 `fictional`／`illustrative`。
- 金額不得從真實報價等比例微調而來。
- 不使用真實 production domain、email、電話、統編或帳號。
- 測試 fixture 使用保留字與 example domain。

### 17.3 User-facing Warning

在首頁、建立案件、匯入與匯出畫面顯示：

> EstimateTrace 是公開網站。請勿輸入公司機密、個人資料、真實乙方名稱、受 NDA 保護內容或未公開報價。MVP 的案件資料只儲存在目前瀏覽器，但使用共享裝置時仍可能被其他使用者看到。

### 17.4 Security Headers

至少評估並測試：

```text
Content-Security-Policy
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy
Cross-Origin-Opener-Policy
```

CSP 需以實際 Next.js／Vercel rendering 驗證，不得為了消除錯誤直接加入寬鬆的 `unsafe-eval` 到 Production。

### 17.5 Vulnerability Reporting

`SECURITY.md` 包含：

- 支援版本。
- 私下回報管道；建立 repository 時由 owner 填入，不在規格中虛構 email。
- 請勿在 public issue 張貼 exploit 或 secret。
- 預期回應流程。

---

## 18. 測試策略

### 18.1 Unit Tests

必要涵蓋：

- Base effort。
- Complexity。
- 多個 risk multiplier。
- Phase loading。
- Three-point estimate。
- P50／P80。
- Person-day／person-month conversion。
- Engineering cost。
- Overhead／warranty／markup／tax。
- Tax normalization。
- Variance 分母為 0。
- Decimal／rounding。
- Safety cap warning。
- Calculation trace。
- Determinism。

### 18.2 Property／Invariant Tests

至少驗證：

- 所有合法輸入產生 finite number。
- \(H_O\le H_M\le H_P\)。
- \(P80\ge P50\)。
- 非負 rate 下成本不為負。
- `taxInclusive → taxExclusive → taxInclusive` 在 rounding tolerance 內一致。
- 增加 quantity 且其他條件不變時，effort 不下降。
- 相同輸入重算結果完全一致。

### 18.3 Integration Tests

- Form data → Zod validation → use case → engine → view model。
- Local repository save／load／migration。
- JSON export／import／recalculate。
- Import failure 不修改既有資料。
- Storage failure fallback。

### 18.4 Component Tests

- Keyboard navigation。
- Error summary 與 field error 關聯。
- Result expansion。
- Quote tax basis switch。
- Delete confirmation。
- Clear local data confirmation。
- Methodology anchor navigation。

### 18.5 E2E Tests

至少：

1. 從首頁建立估算並看到 P50／P80。
2. 輸入乙方報價並看到 comparison。
3. 匯出後清除，再匯入並驗證結果一致。
4. 載入內建範例。
5. 開啟 `/methodology`，公式與變數表可見。
6. Mobile viewport 完成核心流程。
7. 無 browser storage 時仍可單次計算。
8. 列印頁不含導覽與按鈕。

### 18.6 Accessibility Tests

- Automated axe checks。
- Keyboard-only manual pass。
- Screen reader smoke test。
- Color contrast。
- 200% zoom。
- Error announcement。
- Math formula text alternative。

### 18.7 Security Tests

- Imported string 顯示時不執行 HTML／script。
- 超過 1 MB 匯入檔被拒絕。
- Malformed JSON 不破壞既有資料。
- Prototype pollution payload 被拒絕。
- Production response headers 符合設定。
- Network inspection 確認估算內容不送到第三方。

---

## 19. 開發階段

### Phase 0：Repository Foundation

交付：

- Next.js／TypeScript／pnpm 初始化。
- Node 與 pnpm version pin。
- `.gitignore`、`.env.example`、MIT License。
- README 與 `docs/dependency-management.md`。
- CI、Dependabot、PR template、SECURITY。
- Vercel 專案連接。

Exit criteria：

- `pnpm install --frozen-lockfile`、lint、typecheck、test、build 全部通過。
- Preview deployment 可開啟。

### Phase 1：Domain Engine

交付：

- Value objects。
- Canonical parameter set。
- Work item、risk、phase、PERT、cost、variance formulas。
- Calculation trace。
- Unit／invariant tests。
- `docs/estimation-model.md` 與 `docs/parameter-definition.md`。

Exit criteria：

- 公式測試涵蓋正常、邊界與錯誤案例。
- Engine 無 React／Next.js dependency。

### Phase 2：Core Estimation Flow

交付：

- Landing。
- 本機案件清單。
- 五步驟 wizard。
- Local storage adapter。
- Result summary 與 breakdown。

Exit criteria：

- E2E 可完成一筆估算。
- Browser refresh 後資料仍存在。
- Storage disabled 時仍可計算。

### Phase 3：Vendor Comparison 與 Methodology

交付：

- 乙方報價 tax normalization。
- P50／P80 comparison。
- Deterministic question rules。
- 完整 `/methodology`。
- 公式 anchor 與 calculator deep link。

Exit criteria：

- 每個主要輸出能追到公式與代入值。
- 無「正確／不合理」絕對判斷文案。

### Phase 4：Portability 與 Reporting

交付：

- JSON export／import／migration。
- Print report。
- 兩筆虛構範例。
- Clear local data。

Exit criteria：

- Round-trip import 可重現。
- Print preview 符合 A4。

### Phase 5：Hardening 與 Public Release

交付：

- Accessibility pass。
- Security headers 與 import hardening。
- Performance optimization。
- Privacy、sample data、contribution docs。
- Production deployment。
- `v0.1.0` release notes。

Exit criteria：

- 所有 Acceptance Criteria 通過。
- Public repository 不含 secrets 或敏感資料。
- Production URL、commit SHA 與 release tag 可互相追溯。

---

## 20. 驗收標準

### AC-001：Public Project

- GitHub repository 名稱為 `estimate-trace` 且 visibility 為 Public。
- 包含 MIT License、README、SECURITY、CONTRIBUTING。
- Vercel Production 可由公網開啟。

### AC-002：建立估算

Given 使用者從空白案件開始，
When 新增至少一個合法工作項目並完成必要參數，
Then 系統顯示 base、adjusted、P50、P80 effort 與 price，且無 NaN／Infinity。

### AC-003：Trace

Given 任何 P50／P80 結果，
When 使用者展開計算明細，
Then 可看到公式、代入值、單位、參數版本與來源項目。

### AC-004：Formula Page

Given 使用者位於任一頁面，
When 選擇「公式與定義」，
Then 可到 `/methodology`，並看到繁體中文說明、數學式、English terminology、變數表、範例、限制與 double-counting 提醒。

### AC-005：Vendor Quote

Given 使用者輸入含稅或未稅乙方報價，
When 比較結果生成，
Then 系統以相同稅基比較 P50／P80，顯示差額與差異率，且不做絕對合理性結論。

### AC-006：Reproducibility

Given 一筆完成估算，
When 匯出 JSON、清除資料後重新匯入，
Then 重算結果與原 result snapshot 在定義的精度內一致。

### AC-007：Privacy

Given 使用者完成估算，
When 以 browser network inspector 觀察操作，
Then 案件名稱、描述、工作項目、金額與匯入內容不會傳送到 Vercel function 或第三方。

### AC-008：Invalid Import

Given malformed、oversized 或不支援 schema 的 JSON，
When 使用者匯入，
Then 系統拒絕檔案、顯示原因，且既有案件不變。

### AC-009：Persistence Failure

Given browser storage 不可用或 quota exceeded，
When 使用者編輯案件，
Then 當前 session 可繼續計算，且系統提示無法保存並提供匯出。

### AC-010：Accessibility

- Core workflow 可全程使用鍵盤。
- 自動化 accessibility 測試無 serious／critical issue。
- Form error、result status 與 dialog 可由 screen reader 理解。

### AC-011：Quality Gate

以下全部成功：

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

### AC-012：Documentation

README 與 `docs/dependency-management.md` 必須與實際設定一致，包含：

- Runtime 與 package manager 實際版本。
- 隔離方式與套件實際安裝位置，須以工具查證。
- Manifest／lock file。
- Production／dev dependencies。
- Install、restore、start、test、build、upgrade、remove 指令。
- Environment variables。
- Vercel deploy 流程。
- 常見問題。

### AC-013：Public Data Hygiene

- Repository history 與目前 tree 無 credential。
- 無真實公司、乙方、員工、系統或報價資料。
- 內建 sample 明示 fictional。
- `.env.local`、build artifacts、cache、IDE settings 不在 Git。

---

## 21. Codex 執行指示

以下段落是交給 Codex 實作本規格時的直接指示。

### 21.1 任務目標

在 repository `estimate-trace` 中建立、測試並部署本文件定義的 Public MVP。以本規格為產品需求的 source of truth；若實作與規格衝突，先記錄差異與理由，不得靜默改變模型語意。

### 21.2 開始前

1. 讀取 root `AGENTS.md` 與所有適用的 nested instructions。
2. 檢查工作目錄與 Git status；保留使用者既有變更。
3. 若 `sources/` 存在，視為 read-only，不得編輯、移動或刪除。
4. 查證當下受支援版本與安全公告。
5. 以 Node.js 24 LTS 為 runtime。
6. 採安全修補完成的 Next.js 16.x；不得低於 `16.2.11`。若 16.x 已 EOL，先提出規格變更，不可自行跨 major。
7. 使用 pnpm 並固定 exact package manager version。
8. 建立單一 `pnpm-lock.yaml`，不得混用 package manager。
9. 新增 dependency 前，先說明用途、版本影響、license、安全與相容性。
10. 若關鍵產品決策不足且不同選擇會明顯改變結果，再詢問；其餘採本規格的最簡單可維護方案。

### 21.3 實作順序

1. Repository foundation 與 CI。
2. Domain types、parameters、formulas、tests。
3. Application use cases 與 storage ports。
4. Local storage／import-export adapters。
5. UI shell 與 estimation wizard。
6. Result trace 與 vendor comparison。
7. Methodology page。
8. Print、examples、privacy。
9. Accessibility、security、performance hardening。
10. Vercel Preview 與 Production validation。

### 21.4 工程限制

- 遵循 Clean Architecture、SOLID、DRY，但不過度設計。
- 核心公式不得寫在 React component。
- 不得加入 database、authentication、analytics 或 AI，除非另有核准的 scope change。
- 不得新增會接收估算資料的 server endpoint。
- 不得把任何使用者輸入放進 URL。
- 不得硬編碼秘密或使用 production credential。
- 金額、比率與 effort 使用 domain types／validated constructors。
- 所有外部輸入，包括 local storage 與 JSON import，都視為 untrusted。
- 所有計算錯誤必須可觀察且可測試；不得 silent fallback 成 0。
- 使用者可見結果不得出現 NaN、Infinity、undefined 或 raw stack trace。
- Formula constants、methodology content 與 tests 必須由單一 canonical parameter source 保持一致。
- `modelVersion` 或 parameter version 的變更必須有 migration／release note。

### 21.5 文件要求

必須建立或更新：

- `README.md`
- `docs/dependency-management.md`
- `docs/architecture.md`
- `docs/estimation-model.md`
- `docs/parameter-definition.md`
- `docs/privacy-and-security.md`
- `docs/sample-data-policy.md`
- `CONTRIBUTING.md`
- `SECURITY.md`

`docs/dependency-management.md` 必須使用實際指令查證：

- `node` 實際版本。
- `pnpm` 實際版本。
- Dependency 實際安裝位置。
- Store／virtual store 位置。
- Manifest 與 lock file。
- Install、start、test、build、update、remove 指令。

### 21.6 驗證與回報

完成每個 phase：

1. 執行對應 unit／integration／E2E tests。
2. 執行 lint、typecheck 與 production build。
3. 以 browser 驗證核心流程與 mobile layout。
4. 檢查 network，確認估算資料未送出。
5. 檢查 accessibility。
6. 記錄已完成、未完成、風險與偏離規格之處。

最終回報必須包含：

- Production URL。
- Git commit SHA／release tag。
- 實作摘要。
- 測試與驗證結果。
- Dependency 與版本摘要。
- 已知限制。
- 下一步建議。

不得宣稱成功部署、測試通過或無敏感資料，除非實際驗證。

### 21.7 Definition of Done

只有在以下條件全部完成時才算 MVP Done：

- AC-001～AC-013 全部通過。
- Production deployment 對公網可用。
- Formula page 完整。
- Core engine tests 完整。
- JSON round trip 可重現。
- Public repository hygiene 已檢查。
- README 與 dependency document 與實際狀態一致。
- 無未說明的 high／critical dependency vulnerability。
- 無 serious／critical accessibility issue。
- 所有未完成項目已明確列入 backlog，不以 TODO 隱藏。

---

## 22. 後續版本方向

### v0.2

- Estimate revision comparison。
- Actual effort 回填。
- Parameter calibration worksheet。
- CSV export。
- 更完整 scenario comparison。

### v0.3

- COCOMO II project-level cross-check。
- COSMIC／Function Point adapter。
- Monte Carlo simulation。
- Sensitivity analysis。

### v1.0 Public

- Stable model migration。
- 完整 i18n 基礎。
- Public parameter pack extension。
- Community contribution governance。

### Company Edition（獨立 Private 專案）

- SSO。
- RBAC。
- PostgreSQL。
- Immutable estimate version。
- Audit Log。
- Approval workflow。
- Vendor master 與真實 rate card。
- Data retention、backup、restore。
- AI-assisted requirement decomposition；結果必須經人工確認，核心價格仍由 deterministic engine 計算。

---

## 23. 風險與控制

| 風險 | 影響 | 控制 |
|---|---|---|
| 使用者把示範係數當市場標準 | 誤判報價 | 全站標示 illustrative、允許校準、顯示 parameter source |
| 公式 double counting | 高估 | included activities、phase loading guard、warning、tests |
| 公開網站輸入敏感資料 | 資料外洩 | 不上傳、明顯提醒、無 analytics、local-only |
| local storage 遺失 | 案件遺失 | JSON export、failure warning、clear ownership |
| 金額浮點錯誤 | 錯誤報價 | integer minor unit／decimal strategy、regression tests |
| Public repo secret leak | Credential compromise | push protection、secret scanning、`.gitignore`、review |
| Dependency vulnerability | Supply-chain risk | pinned lockfile、Dependabot、CI、security updates |
| P50／P80 被誤解為保證 | 決策誤用 | methodology limits、scenario wording、免責聲明 |
| 模型更新使舊結果改變 | 無法重現 | model version、parameter snapshot、migration warning |
| 過度複雜 UI | 使用率低 | five-step wizard、defaults、progressive disclosure |

---

## 24. Glossary

| Term | 中文說明 |
|---|---|
| Estimate | 根據現有資訊推算工作量或成本，不是承諾價格 |
| Effort | 完成交付所需人力工作量，通常以 person-hour／person-day 表示 |
| Duration | 日曆經過時間，不等於 Effort |
| Unit Effort | 每單位工作項目的基礎工時 |
| Complexity Multiplier | 反映單一工作項目複雜度的乘數 |
| Risk Multiplier | 反映不確定性或環境成本的乘數 |
| Cross-cutting Effort | BA、Architecture、PM、QA、Deployment、Documentation 等橫向工作 |
| P50 | 在本模型近似下的第 50 百分位估計 |
| P80 | 在本模型近似下的第 80 百分位估計，通常比 P50 保守 |
| Overhead | 不能直接歸屬單一工作項目的供應商間接成本 |
| Vendor Markup | 以成本為分母的加成率 |
| Gross Margin | 以售價為分母的毛利率；MVP 不使用此欄位 |
| Variance | 乙方報價與模型基準的相對差異 |
| Parameter Set | 一組有版本的 unit effort、multipliers、loading 與 thresholds |
| Calculation Trace | 公式、代入值、中間結果、單位與來源的完整紀錄 |
| COCOMO II | Project-level parametric software cost model，MVP 僅作背景 |
| COSMIC | ISO 標準化的 Functional Size Measurement 方法，MVP 不實作 |

---

## 25. 官方參考資料

本規格以 2026-07-29 可取得的官方資料為技術基準；實作時仍須再次查證安全公告與受支援版本。

- [Next.js App Router documentation](https://nextjs.org/docs/app)
- [Next.js installation and system requirements](https://nextjs.org/docs/app/getting-started/installation)
- [Next.js 16 release](https://nextjs.org/blog/next-16)
- [Next.js July 2026 security release](https://nextjs.org/blog/july-2026-security-release)
- [Node.js release schedule](https://nodejs.org/en/about/previous-releases)
- [Vercel Git deployments](https://vercel.com/docs/git)
- [Vercel deployment overview](https://vercel.com/docs/deployments/overview)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
- [Vercel Authentication](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication)
- [GitHub push protection](https://docs.github.com/en/code-security/concepts/secret-security/push-protection)
- [GitHub repository rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
- [GitHub Dependabot security updates](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-security-updates)

---

## 26. 規格變更程序

任何會改變下列項目的變更，必須更新本文件、對應 docs、tests 與 release note：

- 公式。
- 係數語意或預設值。
- P50／P80 方法。
- 成本／報價口徑。
- Tax basis。
- 資料是否離開瀏覽器。
- Repository visibility。
- License。
- Model／schema version。
- Security／privacy boundary。

變更紀錄格式：

| 日期 | 文件版本 | 變更 | 原因 | 影響 |
|---|---|---|---|---|
| 2026-07-29 | 1.0.0 | 初版 | 建立 Public MVP 開發目標 | 新專案 |
