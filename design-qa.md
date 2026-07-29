# Formula Typography Design QA

## Comparison target

- Source visual truth: `docs/design-qa/formula-typography-reference.png`
- Initial implementation evidence: 使用者回報附件 `Image #1`。
- Revised implementation evidence:
  `docs/design-qa/formula-typography-after.png`
- Combined comparison evidence:
  `docs/design-qa/formula-typography-comparison.png`
- Route and state: 從首頁以 client-side navigation 進入 `/methodology`，檢視
  `#risk` 的第一個 display formula。
- Browser viewport: Chromium，`1600 × 1000` CSS px，`deviceScaleFactor: 1`。
- Source pixels: `606 × 130`。
- Revised implementation pixels: `872 × 133`；其 CSS element 高度為
  `132.08px`，未做 density scaling。
- Combined comparison pixels: `1518 × 133`；兩張圖維持原生 density，
  垂直置中並排。

來源圖使用 Taylor series 示範目標數學排版；實作保留 EstimateTrace 的風險公式
內容，因此本次 fidelity scope 是字型、italic variables、上下標、大型運算子、
字級與垂直排列，不比較公式文字是否相同。

## Findings

目前沒有 actionable P0、P1 或 P2 finding。

- Fonts and typography：Revised implementation 使用 `KaTeX_Main` 與
  `KaTeX_Math`，變數為 italic；desktop display formula 為 `40px`，具真正
  subscript 與 display-size product operator，已符合 source 的 publication-style
  math treatment。
- Spacing and layout rhythm：大型運算子的上下限、baseline 與 operand 間距
  清楚；formula block 高度隨內容增長，沒有裁切或碰撞。
- Colors and visual tokens：數學字色與 source 同為近黑色。既有綠色左框、surface
  與圓角是 EstimateTrace design system，屬刻意保留的產品容器，不是公式視覺
  target 的一部分。
- Image quality and asset fidelity：公式由本地 KaTeX vector-like font glyph
  排版，沒有 raster placeholder、CSS art、SVG substitute 或 remote asset。
- Copy and content：domain formula 內容及中文 `aria-label` 均未改變。
- Responsiveness and accessibility：在 `640px` 與 `360px` viewport 無 document
  overflow；display formula 為 `32px`，過長內容只在可 focus 的公式容器內水平
  捲動。Axe serious／critical violations 為零。

## Full-view comparison evidence

`docs/design-qa/formula-typography-comparison.png` 同時呈現 source visual 與
完整 implementation formula block。兩者都使用 serif math font、italic
variables、分離的上下標與 display-size operator；implementation 額外保留產品
既有 card surface。

## Focused region comparison evidence

本次 source visual 本身就是單一公式的 focused crop，combined comparison 已在
native resolution 清楚顯示字型輪廓、上下標與大型運算子，因此不需要再做第二層
crop。

## Comparison history

1. Initial：`1508 × 388` 使用者截圖呈現 linear／monospace-like formula，
   subscript 與 operator 沒有專業數學排版；判定為 P1 typography mismatch。
2. Fix：將 KaTeX stylesheet 移至 root layout，並將 methodology display formula
   改為 responsive `32–44px`；calculation trace 改為 `21.6–26.4px`。
3. Revised：Chromium 實測 `KaTeX_Main`、`KaTeX_Math italic`、`40px`、
   `.vlist-t: inline-table`，font request 無失敗；desktop、640px、360px 均無
   document overflow。先前 P1 已關閉。

## Browser verification

- 首頁 Link soft navigation 後仍保留 window probe，確認不是 full reload。
- 全部 methodology display formula 使用 KaTeX、字級至少 `30px`，沒有 raw
  LaTeX command 或 viewport overflow。
- KaTeX font face 至少一個為 `loaded`，沒有 failed font request。
- Keyboard focus 與 overflow formula 的 ArrowRight 局部捲動通過。
- Calculation trace 使用 KaTeX、字級至少 `20px`，且無 document overflow。
- Console error、page error 與 serious／critical Axe finding 均為零。

final result: passed
