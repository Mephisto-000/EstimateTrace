# EstimateTrace Unreleased

更新日期：2026-07-29

## Math rendering

- `/methodology` 的 symbolic formula、worked example、invariant 與 variable
  symbol 改以 `katex@0.18.1` 排版。
- Methodology 與 Calculation trace 的 canonical LaTeX 集中於
  `domain/formulas`；trace 保留 `v0.1.0` 的 stable formula snapshot text，由
  presentation registry 映射到 LaTeX，因此舊匯出檔 exact comparison 不會誤報
  `RESULT_SNAPSHOT_MISMATCH`。
- 每個公式提供可朗讀完整等式語意的中文 `aria-label`；display formula
  可鍵盤聚焦並在窄螢幕內局部捲動，不造成整頁水平 overflow。
- KaTeX 固定 `trust=false` 與 bounded expansion／size；invalid expression
  安全退回 React escaped text，不接受任何 form、localStorage、JSON import 或
  URL expression。
- Cross-cutting 公開公式改為逐 phase eligible base，對齊既有
  double-counting guard 與 calculation trace；這是文件／顯示修正，不改變
  engine 計算結果。

## Compatibility and rollback

- Schema 仍為 `1.0.0`，model 仍為 `bottom-up-1.0.0`，Decimal.js
  計算、parameter set、result snapshot 與 stable formula text 均未改變，不需要
  migration。
- 若 math rendering 發生 regression，可 revert 此變更並重新部署前一個已驗證
  Vercel artifact；browser estimate data 不受影響。
