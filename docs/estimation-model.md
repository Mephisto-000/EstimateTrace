# EstimateTrace Estimation Model

## 結論

MVP 使用 deterministic Bottom-up Parametric Model
`bottom-up-1.0.0`。相同 input、完整 parameter snapshot 與 model version 必須
產生相同 canonical result；任何 clock、UUID、locale、browser 或 network
狀態都不得參與計算。

本模型是 decision-support scenario，不是正式報價、採購結論或市場公允價格。

## Decimal 與 rounding policy

- Domain boundary 以 canonical decimal string 接收與輸出數值。
- Decimal.js 使用隔離的 context、48 significant digits 與
  `ROUND_HALF_UP`。
- 不在中間步驟四捨五入。
- UI 最後才格式化：effort 1 位、ratio 1 位百分比、TWD 0 位。
- `NaN`、`Infinity`、scientific notation、負值與超界值會在 calculation 前
  拒絕。

Canonical decimal string 不包含 exponent、前導 `+`、多餘前導零或多餘尾端零。

## 1. Work Item Base Effort

對工作項目 \(i\)：

```text
H_base,i = quantity_i × unitHours_i
H_base = Σ H_base,i
```

`quantity > 0`，`unitHours >= 0.25`。Unit effort 是 fictional／illustrative
起點，不代表市場標準。

## 2. Complexity

```text
H_complex,i = H_base,i × complexityMultiplier_i
```

公開示範值：

| Level     | Multiplier |
| --------- | ---------: |
| Low       |       0.80 |
| Medium    |       1.00 |
| High      |       1.35 |
| Very High |       1.70 |

## 3. Risk adjustment

Risk level 存在案件的 global `riskProfile`；每個 work item 只列出真正適用的
factor IDs。

```text
riskProduct_i = Π multiplier(factor, selectedLevel)
H_adjusted,i = H_complex,i × riskProduct_i
H_adjusted = Σ H_adjusted,i
```

若乘積高於 parameter set 的 safety cap，engine 保留原值並產生 warning，
不 silent clamp。

## 4. Cross-cutting effort

為同時滿足 phase loading 與避免 double counting，MVP 使用逐 phase eligible
base：

```text
eligibleAdjustedHours_p =
  Σ H_adjusted,i where work item i does not already include phase p

H_cross,p = eligibleAdjustedHours_p × phaseLoading_p
H_cross = Σ H_cross,p
H_mostLikely = H_adjusted + H_cross + H_fixed
```

例如 `TESTING` item 或已標記包含 `quality-assurance` 的 item，不會再成為完整
QA loading 的分母。每個 phase 的 eligible base、ratio 與結果都寫入 trace。

## 5. Three-point estimate

```text
H_optimistic = H_mostLikely × (1 - downside)
H_pessimistic = H_mostLikely × (1 + upside)
```

限制：

```text
0 <= downside <= 0.50
0 <= upside <= 2.00
0 <= H_optimistic <= H_mostLikely <= H_pessimistic
```

## 6. PERT、P50 與 P80

```text
μ = (H_optimistic + 4 × H_mostLikely + H_pessimistic) / 6
σ = (H_pessimistic - H_optimistic) / 6
P50 = μ
P80 = max(0, μ + 0.8416 × σ)
```

這是可解釋的 Normal approximation，不宣稱真實 effort 服從 Normal
distribution。P80 不是固定百分比 buffer，也不是保證值。

## 7. Effort conversion

```text
personDays_x = H_x / hoursPerPersonDay
personMonths_x = H_x / (hoursPerPersonDay × daysPerPersonMonth)
```

Person-month 是 effort conversion，不是 calendar duration。

## 8. Engineering cost 與 benchmark quote

```text
laborCost_x = H_x × hourlyRate
engineeringCost_x = laborCost_x + directCost
fullCost_x = engineeringCost_x × (1 + overheadRate) + warrantyCost
quoteExTax_x = fullCost_x × (1 + vendorMarkupRate)
quoteIncTax_x = quoteExTax_x × (1 + taxRate)
```

`Vendor Markup` 以成本為分母，不是以售價為分母的 `Gross Margin`。P80
uncertainty 不得再以 risk reserve 名義重複加價。

## 9. Tax normalization 與 variance

所有比較使用未稅基準：

```text
vendorExTax =
  vendorAmount / (1 + taxRate)  when tax-inclusive
  vendorAmount                  when tax-exclusive

delta_x = vendorExTax - quoteExTax_x
variance_x = delta_x / quoteExTax_x
ratio_x = vendorExTax / quoteExTax_x
```

當 benchmark denominator 為 0，`variance` 與 `ratio` 是 typed unavailable
state，UI 顯示「無法計算」，不得輸出 `NaN` 或 `Infinity`。

## 10. Traceability

每個主要 metric 都關聯一個 structured trace node：

- stable formula ID 與 `/methodology` anchor
- operands 與 canonical decimal values
- result 與 unit
- work item、risk factor、parameter 或 commercial term source
- rounding policy

Trace、warnings、drivers 與 questions 使用固定 priority 與 stable tie-break
排序，確保 JSON snapshot 可 exact compare。

## 11. Model limitations

- Unit effort、multiplier、phase loading 與 threshold 是 fictional public demo。
- 輸出品質受 scope decomposition 與 input rationale 限制。
- 模型不估算 calendar schedule、capacity、resource contention 或 vendor
  negotiation。
- MVP 不實作 Monte Carlo、COCOMO II、COSMIC、Function Point 或 Machine
  Learning。
- 若缺乏歷史資料，P50／P80 只代表透明 scenario range。

## Model versioning

- 改變公式或結果語意：major。
- 新增 backward-compatible factor/output：minor。
- 不改預期語意的修正：patch；若實際結果改變，至少 minor。
- 任何變更同步更新 canonical parameter、tests、methodology 與 release notes。
