# Public Demo Parameter Definition

## 結論

第一版 parameter set 為 `public-demo-zh-tw@1.0.0`。所有值都是
fictional／illustrative teaching defaults，不是 market standard。案件匯出會
保存完整 snapshot，之後即使公開預設值更新，原案件仍可重算。

Production canonical source 位於：

```text
src/config/parameter-sets/public-demo.ts
```

本文件只解釋語意；程式、UI 與 tests 不得從 Markdown 讀取數值。

## Work item catalog

| Code             | 類型       | Unit           | Demo unit hours | 預設包含                    |
| ---------------- | ---------- | -------------- | --------------: | --------------------------- |
| `UI`             | 畫面功能   | screen         |              24 | implementation              |
| `REPORT`         | 報表       | report         |              24 | implementation              |
| `BUSINESS_LOGIC` | 商業邏輯   | rule           |              16 | implementation              |
| `DATABASE`       | 資料庫     | object         |               8 | implementation              |
| `INTEGRATION`    | 系統介接   | endpoint       |              24 | implementation              |
| `BATCH`          | 批次處理   | job            |              24 | implementation              |
| `MIGRATION`      | 資料轉置   | batch          |              32 | implementation              |
| `AUTHORIZATION`  | 權限       | permission-set |              16 | implementation              |
| `TESTING`        | 額外測試   | test-scope     |              16 | test-design、test-execution |
| `DEPLOYMENT`     | 部署       | environment    |              16 | deployment、rollback-plan   |
| `DOCUMENTATION`  | 文件與教育 | deliverable    |               8 | documentation               |
| `CUSTOM`         | 自訂       | item           |               8 | implementation              |

實際數值以 canonical source 為準。每個 item 可覆寫 `unitHours`，但必須保留
snapshot 與 trace。

一般 catalog item 與 `CUSTOM` 的 demo unit hours 明確只代表
implementation effort；Business Analysis、Architecture／Technical Design、
Project Management、Quality Assurance、Deployment／Release 與
Documentation／Training 由 phase loading 另行加入。這項定義刻意保留規格
worked example 的計算語意，不能把 demo unit hours 解讀為 end-to-end delivery
effort。

`TESTING`、`DEPLOYMENT`、`DOCUMENTATION` 是專門交付項目，建立時會分別預設
`QUALITY_ASSURANCE`、`DEPLOYMENT_RELEASE`、
`DOCUMENTATION_TRAINING` 已包含；因此同一 item 不會再進入對應 phase loading
的 eligible base。若使用者自行修改 unit effort 的包含範圍，必須同步調整
item 的 `includedCrossCuttingPhases`。

## Complexity

| Level     | Multiplier | 可觀察定義                             |
| --------- | ---------: | -------------------------------------- |
| Low       |       0.80 | 單一路徑、規則明確、低整合依賴         |
| Medium    |       1.00 | 一般企業功能、少量例外與驗證           |
| High      |       1.35 | 多路徑、多角色、多例外或高整合依賴     |
| Very High |       1.70 | 核心交易、複雜狀態、嚴格效能或高度法遵 |

## Risk factors

Factors：

- Requirement Clarity
- Legacy／Technical Debt
- Integration Dependency
- Security／Compliance
- Data Migration Quality
- Schedule Compression

每個 factor 都有 Low、Nominal、High、Very High 四個 level、multiplier 與中文
rationale。Canonical demo multipliers 依序為 `0.90`、`1.00`、`1.15`、
`1.30`。

Risk product safety cap 是可追溯 parameter，MVP 值為 `3.00`。超過時產生
warning，engine 不截斷結果。

## Phase loading defaults

分母是每個 phase 的 eligible adjusted implementation effort：

| Phase                          | Demo ratio |
| ------------------------------ | ---------: |
| Business Analysis              |       0.12 |
| Architecture／Technical Design |       0.08 |
| Project Management             |       0.10 |
| Quality Assurance              |       0.18 |
| Deployment／Release            |       0.05 |
| Documentation／Training        |       0.05 |

Item 若已包含同一 phase，該 item 不進入該 phase 分母。

Catalog 的 `includedActivities` 與 item 的
`includedCrossCuttingPhases` 由同一份 typed coverage mapping 產生，新增 item、
fictional examples 與重設公開參數都使用相同 helper，避免 UI 與 engine
預設漂移。

## Uncertainty defaults

| Level     | Downside | Upside |
| --------- | -------: | -----: |
| Low       |     0.10 |   0.15 |
| Medium    |     0.15 |   0.30 |
| High      |     0.20 |   0.55 |
| Very High |     0.25 |   0.90 |

MVP 的 P80 z-score 是 `0.8416`。

## Commercial defaults

- Currency：`TWD`
- Hours per person-day：`8`
- Days per person-month：`20`
- Tax rate：`0.05`（可改為 `0`；只是公開示範值）
- 所有 money input 以 TWD 表示，不接受負值。
- Ratio 內部使用 `0`～`1` 範圍的 canonical decimal string。

Hourly rate、direct cost、overhead、warranty 與 markup 的預設值只為完成
fictional example，使用者應以已授權的組織資料校準。

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
