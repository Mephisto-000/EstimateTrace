/**
 * Canonical calculation-formula presentation metadata.
 *
 * `snapshotText` is the stable text stored in CalculationTraceNode.formula.
 * It is intentionally preserved for v0.1.0 export compatibility.
 *
 * `latex` and `accessibleLabel` are presentation-only metadata. The
 * deterministic calculation continues to be implemented with Decimal.js in
 * the domain engine; no expression is evaluated at runtime.
 */
export type CalculationFormulaDefinition = Readonly<{
  snapshotText: string;
  latex: string;
  accessibleLabel: string;
}>;

function defineFormula(
  snapshotText: string,
  latex: string,
  accessibleLabel: string,
): CalculationFormulaDefinition {
  return Object.freeze({ snapshotText, latex, accessibleLabel });
}

export const CALCULATION_FORMULAS = Object.freeze({
  workItemBaseEffort: defineFormula(
    "H_i,base = q_i × u_i",
    String.raw`H_{i,\mathrm{base}} = q_i \times u_i`,
    "第 i 個工作項目的基礎工時 H i base，等於數量 q i 乘以每單位工時 u i。",
  ),
  workItemComplexity: defineFormula(
    "H_i,complex = H_i,base × c_i",
    String.raw`H_{i,\mathrm{complex}} = H_{i,\mathrm{base}} \times c_i`,
    "第 i 個工作項目的複雜度調整工時 H i complex，等於基礎工時 H i base 乘以複雜度乘數 c i。",
  ),
  riskProduct: defineFormula(
    "R_i = ∏ r_i,k",
    String.raw`R_i = \prod_{k \in K_i} r_{i,k}`,
    "第 i 個工作項目的風險乘積 R i，等於所有適用風險乘數 r i k 的乘積。",
  ),
  workItemAdjusted: defineFormula(
    "H_i,adj = H_i,complex × R_i",
    String.raw`H_{i,\mathrm{adj}} = H_{i,\mathrm{complex}} \times R_i`,
    "第 i 個工作項目的調整後工時 H i adj，等於複雜度調整工時 H i complex 乘以風險乘積 R i。",
  ),
  aggregateBaseEffort: defineFormula(
    "H_base = Σ H_i,base",
    String.raw`H_{\mathrm{base}} = \sum_i H_{i,\mathrm{base}}`,
    "基礎總工時 H base，等於所有工作項目基礎工時 H i base 的總和。",
  ),
  aggregateComplexityEffort: defineFormula(
    "H_complex = Σ H_i,complex",
    String.raw`H_{\mathrm{complex}} = \sum_i H_{i,\mathrm{complex}}`,
    "複雜度調整總工時 H complex，等於所有工作項目複雜度調整工時 H i complex 的總和。",
  ),
  complexityAdjustment: defineFormula(
    "ΔH_complex = H_complex − H_base",
    String.raw`\Delta H_{\mathrm{complex}} = H_{\mathrm{complex}} - H_{\mathrm{base}}`,
    "複雜度增加工時 ΔH complex，等於複雜度調整總工時 H complex 減去基礎總工時 H base。",
  ),
  effectiveComplexity: defineFormula(
    "c_effective = H_complex ÷ H_base",
    String.raw`c_{\mathrm{effective}} = \frac{H_{\mathrm{complex}}}{H_{\mathrm{base}}}`,
    "有效複雜度乘數 c effective，等於複雜度調整總工時 H complex 除以基礎總工時 H base。",
  ),
  aggregateAdjustedEffort: defineFormula(
    "H_adj = Σ H_i,adj",
    String.raw`H_{\mathrm{adj}} = \sum_i H_{i,\mathrm{adj}}`,
    "調整後總工時 H adj，等於所有工作項目調整後工時 H i adj 的總和。",
  ),
  riskAdjustment: defineFormula(
    "ΔH_risk = H_adj − H_complex",
    String.raw`\Delta H_{\mathrm{risk}} = H_{\mathrm{adj}} - H_{\mathrm{complex}}`,
    "風險增加工時 ΔH risk，等於調整後總工時 H adj 減去複雜度調整總工時 H complex。",
  ),
  phaseCrossCutting: defineFormula(
    "H_cross,p = α_p × Σ H_i,adj (eligible)",
    String.raw`H_{\mathrm{cross},p} = \alpha_p \times \sum_{i \in E_p} H_{i,\mathrm{adj}}`,
    "第 p 個跨階段工時 H cross p，等於階段工時比例 αp，乘以適用項目集合 E p 內各工作項目調整後工時的總和。",
  ),
  aggregateCrossCutting: defineFormula(
    "H_cross = Σ H_cross,p",
    String.raw`H_{\mathrm{cross}} = \sum_p H_{\mathrm{cross},p}`,
    "跨階段總工時 H cross，等於所有階段的跨階段工時 H cross p 總和。",
  ),
  mostLikelyEffort: defineFormula(
    "H_M = H_adj + H_cross + H_fixed",
    String.raw`H_M = H_{\mathrm{adj}} + H_{\mathrm{cross}} + H_{\mathrm{fixed}}`,
    "最可能工時 H M，等於調整後工時 H adj、跨階段工時 H cross 與固定工時 H fixed 的總和。",
  ),
  optimisticEffort: defineFormula(
    "H_O = H_M × (1 − d)",
    String.raw`H_O = H_M \times (1 - d)`,
    "樂觀工時 H O，等於最可能工時 H M 乘以一減樂觀下修率 d。",
  ),
  pessimisticEffort: defineFormula(
    "H_P = H_M × (1 + u)",
    String.raw`H_P = H_M \times (1 + u)`,
    "悲觀工時 H P，等於最可能工時 H M 乘以一加悲觀上修率 u。",
  ),
  p50Effort: defineFormula(
    "H_P50 = (H_O + 4H_M + H_P) ÷ 6",
    String.raw`H_{P50} = \frac{H_O + 4H_M + H_P}{6}`,
    "P50 工時 H P50，等於樂觀工時 H O，加四倍最可能工時 H M，再加悲觀工時 H P，最後除以六。",
  ),
  standardDeviation: defineFormula(
    "σ = (H_P − H_O) ÷ 6",
    String.raw`\sigma = \frac{H_P - H_O}{6}`,
    "標準差 sigma，等於悲觀工時 H P 減去樂觀工時 H O，再除以六。",
  ),
  p80Effort: defineFormula(
    "H_P80 = max(0, H_P50 + z_80σ)",
    String.raw`H_{P80} = \max\left(0, H_{P50} + z_{80}\sigma\right)`,
    "P80 工時 H P80，等於零與 P50 工時 H P50 加上 z 80 乘以標準差 sigma 兩者中的較大值。",
  ),
  personDays: defineFormula(
    "PersonDays_x = H_Px ÷ hoursPerPersonDay",
    String.raw`\mathrm{PersonDays}_x = \frac{H_{P_x}}{h_d}`,
    "指定百分位數的人日，等於該百分位工時 H P x 除以每日工時 h d。",
  ),
  personMonths: defineFormula(
    "PersonMonths_x = H_Px ÷ (hoursPerPersonDay × daysPerPersonMonth)",
    String.raw`\mathrm{PersonMonths}_x = \frac{H_{P_x}}{h_d \times d_m}`,
    "指定百分位數的人月，等於該百分位工時 H P x，除以每日工時 h d 與每月工作日 d m 的乘積。",
  ),
  laborCost: defineFormula(
    "C_labor,x = H_Px × R_h",
    String.raw`C_{\mathrm{labor},x} = H_{P_x} \times R_h`,
    "指定百分位數的人力成本 C labor x，等於該百分位工時 H P x 乘以每小時費率 R h。",
  ),
  directCost: defineFormula(
    "D_x = D",
    String.raw`D_x = D`,
    "指定百分位數的直接成本 D x，等於直接成本 D。",
  ),
  deliveryCost: defineFormula(
    "C_delivery,x = C_labor,x + D",
    String.raw`C_{\mathrm{delivery},x} = C_{\mathrm{labor},x} + D`,
    "指定百分位數的交付成本 C delivery x，等於人力成本 C labor x 加直接成本 D。",
  ),
  engineeringCost: defineFormula(
    "C_engineering,x = C_delivery,x",
    String.raw`C_{\mathrm{engineering},x} = C_{\mathrm{delivery},x}`,
    "指定百分位數的工程成本 C engineering x，等於交付成本 C delivery x。",
  ),
  overheadAmount: defineFormula(
    "C_overhead,x = C_delivery,x × o",
    String.raw`C_{\mathrm{overhead},x} = C_{\mathrm{delivery},x} \times o`,
    "指定百分位數的管銷間接成本 C overhead x，等於交付成本 C delivery x 乘以管銷間接成本率 o。",
  ),
  costAfterOverhead: defineFormula(
    "C_afterOverhead,x = C_delivery,x + C_overhead,x",
    String.raw`C_{\mathrm{after\ overhead},x} = C_{\mathrm{delivery},x} + C_{\mathrm{overhead},x}`,
    "指定百分位數的計入管銷後成本 C after overhead x，等於交付成本 C delivery x 加管銷間接成本 C overhead x。",
  ),
  warrantyCost: defineFormula(
    "W_x = W",
    String.raw`W_x = W`,
    "指定百分位數的保固成本 W x，等於固定保固成本 W。",
  ),
  fullCost: defineFormula(
    "C_full,x = C_afterOverhead,x + W",
    String.raw`C_{\mathrm{full},x} = C_{\mathrm{after\ overhead},x} + W`,
    "指定百分位數的完整成本 C full x，等於計入管銷後成本 C after overhead x 加保固成本 W。",
  ),
  markupAmount: defineFormula(
    "C_markup,x = C_full,x × m",
    String.raw`C_{\mathrm{markup},x} = C_{\mathrm{full},x} \times m`,
    "指定百分位數的成本加成金額 C markup x，等於完整成本 C full x 乘以成本加成率 m。",
  ),
  quoteExTax: defineFormula(
    "Q_exTax,x = C_full,x + C_markup,x",
    String.raw`Q_{\mathrm{exTax},x} = C_{\mathrm{full},x} + C_{\mathrm{markup},x}`,
    "指定百分位數的未稅報價 Q ex tax x，等於完整成本 C full x 加成本加成金額 C markup x。",
  ),
  taxAmount: defineFormula(
    "C_tax,x = Q_exTax,x × t",
    String.raw`C_{\mathrm{tax},x} = Q_{\mathrm{exTax},x} \times t`,
    "指定百分位數的稅額 C tax x，等於未稅報價 Q ex tax x 乘以稅率 t。",
  ),
  quoteIncTax: defineFormula(
    "Q_incTax,x = Q_exTax,x + C_tax,x",
    String.raw`Q_{\mathrm{incTax},x} = Q_{\mathrm{exTax},x} + C_{\mathrm{tax},x}`,
    "指定百分位數的含稅報價 Q inc tax x，等於未稅報價 Q ex tax x 加稅額 C tax x。",
  ),
  normalizeTaxInclusiveQuote: defineFormula(
    "V_exTax = V_incTax ÷ (1 + t)",
    String.raw`V_{\mathrm{exTax}} = \frac{V_{\mathrm{incTax}}}{1 + t}`,
    "乙方未稅報價 V ex tax，等於乙方含稅報價 V inc tax 除以一加稅率 t。",
  ),
  normalizeTaxExclusiveQuote: defineFormula(
    "V_exTax = V",
    String.raw`V_{\mathrm{exTax}} = V`,
    "乙方未稅報價 V ex tax，等於輸入報價 V。",
  ),
  vendorDifference: defineFormula(
    "Δ_x = V_exTax − Q_exTax,x",
    String.raw`\Delta_x = V_{\mathrm{exTax}} - Q_{\mathrm{exTax},x}`,
    "指定百分位數的金額差 Δx，等於乙方未稅報價 V ex tax 減去模型未稅報價 Q ex tax x。",
  ),
  vendorVariance: defineFormula(
    "Variance_x = Δ_x ÷ Q_exTax,x",
    String.raw`\mathrm{Variance}_x = \frac{\Delta_x}{Q_{\mathrm{exTax},x}}`,
    "指定百分位數的報價差異率，等於金額差 Δx 除以模型未稅報價 Q ex tax x。",
  ),
  vendorQuoteRatio: defineFormula(
    "QuoteRatio_x = V_exTax ÷ Q_exTax,x",
    String.raw`\mathrm{QuoteRatio}_x = \frac{V_{\mathrm{exTax}}}{Q_{\mathrm{exTax},x}}`,
    "指定百分位數的報價比率，等於乙方未稅報價 V ex tax 除以模型未稅報價 Q ex tax x。",
  ),
});

const calculationFormulaBySnapshotText = new Map<
  string,
  CalculationFormulaDefinition
>(
  Object.values(CALCULATION_FORMULAS).map((definition) => [
    definition.snapshotText,
    definition,
  ]),
);

export function getCalculationFormulaPresentation(
  snapshotText: string,
): CalculationFormulaDefinition | undefined {
  return calculationFormulaBySnapshotText.get(snapshotText);
}
