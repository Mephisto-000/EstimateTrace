# 公開示範參數定義

## 結論

目前參數集為 `public-demo-zh-tw@1.0.1`。所有數值都是虛構的教學示範預設值，
不是市場標準。案件匯出會保存完整參數快照，之後即使公開預設值更新，原案件仍
可重算。

`1.0.1` 只把公開顯示名稱與說明統一為繁體中文；數值、程式識別碼、計算公式與
限制都沒有改變。既有 `1.0.0` 參數快照仍可匯入、檢視與重算，介面會在呈現邊界
把舊英文顯示值轉為中文。

正式環境的權威來源位於：

```text
src/config/parameter-sets/public-demo.ts
```

本文件只解釋語意；程式、使用者介面與測試不得從 Markdown 讀取數值。

## 工作項目類型目錄

| 程式識別碼       | 顯示名稱   | 單位識別碼     | 示範單位工時 | 預設包含活動                |
| ---------------- | ---------- | -------------- | -----------: | --------------------------- |
| `UI`             | 畫面功能   | screen         |           24 | implementation              |
| `REPORT`         | 報表       | report         |           24 | implementation              |
| `BUSINESS_LOGIC` | 商業邏輯   | rule           |           16 | implementation              |
| `DATABASE`       | 資料庫     | object         |            8 | implementation              |
| `INTEGRATION`    | 系統介接   | endpoint       |           24 | implementation              |
| `BATCH`          | 批次處理   | job            |           24 | implementation              |
| `MIGRATION`      | 資料轉置   | batch          |           32 | implementation              |
| `AUTHORIZATION`  | 權限       | permission-set |           16 | implementation              |
| `TESTING`        | 額外測試   | test-scope     |           16 | test-design、test-execution |
| `DEPLOYMENT`     | 部署       | environment    |           16 | deployment、rollback-plan   |
| `DOCUMENTATION`  | 文件與教育 | deliverable    |            8 | documentation               |
| `CUSTOM`         | 自訂       | item           |            8 | implementation              |

實際數值以程式中的權威來源為準。每個工作項目可覆寫 `unitHours`，但必須保留
參數快照與計算軌跡。

一般目錄項目與 `CUSTOM` 的示範單位工時明確只代表實作工作量；商業分析、
架構與技術設計、專案管理、品質保證、部署與發布、文件與訓練會由跨階段比例
另行加入。這項定義刻意保留規格計算範例的語意，不能把示範單位工時解讀為
端到端交付工作量。

`TESTING`、`DEPLOYMENT`、`DOCUMENTATION` 是專門交付項目，建立時會分別預設
`QUALITY_ASSURANCE`、`DEPLOYMENT_RELEASE`、
`DOCUMENTATION_TRAINING` 已包含；因此同一工作項目不會再進入對應跨階段比例
的適用基礎。若使用者自行修改單位工時的包含範圍，必須同步調整工作項目的
`includedCrossCuttingPhases`。

## 複雜度

| 等級 | 程式識別碼  | 乘數 | 可觀察定義                             |
| ---- | ----------- | ---: | -------------------------------------- |
| 低   | `LOW`       | 0.80 | 單一路徑、規則明確、低整合依賴         |
| 中   | `MEDIUM`    | 1.00 | 一般企業功能、少量例外與驗證           |
| 高   | `HIGH`      | 1.35 | 多路徑、多角色、多例外或高整合依賴     |
| 極高 | `VERY_HIGH` | 1.70 | 核心交易、複雜狀態、嚴格效能或高度法遵 |

## 風險因子

- 需求明確度：`REQUIREMENT_CLARITY`
- 舊有系統與技術債：`LEGACY_TECHNICAL_DEBT`
- 系統介接依賴：`INTEGRATION_DEPENDENCY`
- 資訊安全與法遵：`SECURITY_COMPLIANCE`
- 資料轉置品質：`DATA_MIGRATION_QUALITY`
- 時程壓縮：`SCHEDULE_COMPRESSION`

每個風險因子都有低、一般、高、極高四個等級，以及對應乘數與中文理由。權威
示範乘數依序為 `0.90`、`1.00`、`1.15`、`1.30`。

風險乘積安全上限是可追溯參數，公開版值為 `3.00`。超過時會顯示警告，計算
引擎不會截斷結果。

## 跨階段比例預設值

分母是每個階段適用的調整後實作工作量：

| 階段名稱       | 程式識別碼               | 示範比例 |
| -------------- | ------------------------ | -------: |
| 商業分析       | `BUSINESS_ANALYSIS`      |     0.12 |
| 架構與技術設計 | `ARCHITECTURE_DESIGN`    |     0.08 |
| 專案管理       | `PROJECT_MANAGEMENT`     |     0.10 |
| 品質保證       | `QUALITY_ASSURANCE`      |     0.18 |
| 部署與發布     | `DEPLOYMENT_RELEASE`     |     0.05 |
| 文件與訓練     | `DOCUMENTATION_TRAINING` |     0.05 |

工作項目若已包含同一階段，該項目不會進入該階段的分母。

目錄的 `includedActivities` 與工作項目的 `includedCrossCuttingPhases` 由同一份
型別化涵蓋範圍對照產生；新增工作項目、虛構範例與重設公開參數都使用相同
輔助函式，避免介面與計算引擎的預設值漂移。

## 不確定性預設值

| 等級 | 程式識別碼  | 下行比例 | 上行比例 |
| ---- | ----------- | -------: | -------: |
| 低   | `LOW`       |     0.10 |     0.15 |
| 中   | `MEDIUM`    |     0.15 |     0.30 |
| 高   | `HIGH`      |     0.20 |     0.55 |
| 極高 | `VERY_HIGH` |     0.25 |     0.90 |

公開版的 P80 標準分數為 `0.8416`。

## 商業參數預設值

- 幣別：`TWD`
- 每人日工時：`8`
- 每人月工作日：`20`
- 稅率：`0.05`（可改為 `0`；只是公開示範值）
- 所有金額輸入都以 TWD 表示，不接受負值。
- 比例在內部使用 `0`～`1` 範圍的標準十進位字串。

每小時費率、直接成本、間接費用、保固成本與乙方加成率的預設值只為完成
虛構範例，使用者應以已授權的組織資料校準。

## Comparison bands

Comparison label 只能使用規格定義的下列中性、規則式敘述：

1. 明顯低於模型區間，請檢查漏項或追加風險。
2. 接近模型參考區間。
3. 高於模型 P50，請確認成本來源。
4. 高於模型 P80，建議要求工作量與風險明細。

明顯低於門檻為「正規化未稅報價 ÷ P50 未稅模型值 < `0.80`」。其餘
evaluation order 與 boundary inclusiveness 由 model version 固定；門檻則儲存
於 canonical parameter snapshot。這些都是公開示範 rule，不是產業標準。

## Input and safety limits

Parameter set 集中定義：

- case name/description 長度
- work item count
- title、description、assumption 長度
- quantity、unit hours、fixed effort 上限
- hourly rate 與 direct/warranty cost 上限
- ratio 上限
- risk product safety cap
- import file maximum `1 MiB`

Validation error 與 calculation warning 是不同型別：非法輸入不產生結果；
safety-cap warning 保留結果並要求使用者檢視假設。

## 變更政策

調整任何值前必須：

1. 建立 issue 並記錄 evidence、owner 與目的。
2. 更新 parameter set version。
3. 加入 normal、boundary 與 regression tests。
4. 更新 `/methodology`、本文件與 release notes。
5. 保留舊 snapshot 的 import/recalculation 行為。
