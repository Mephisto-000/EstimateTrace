/**
 * Canonical, source-controlled LaTeX used by calculation trace nodes.
 *
 * These expressions are presentation metadata only. The deterministic
 * calculation continues to be implemented with Decimal.js in the domain
 * engine; no expression is evaluated at runtime.
 */
export const CALCULATION_FORMULAS = Object.freeze({
  workItemBaseEffort: String.raw`H_{i,\mathrm{base}} = q_i \times u_i`,
  workItemComplexity: String.raw`H_{i,\mathrm{complex}} = H_{i,\mathrm{base}} \times c_i`,
  riskProduct: String.raw`R_i = \prod_{k \in K_i} r_{i,k}`,
  workItemAdjusted: String.raw`H_{i,\mathrm{adj}} = H_{i,\mathrm{complex}} \times R_i`,
  aggregateBaseEffort: String.raw`H_{\mathrm{base}} = \sum_i H_{i,\mathrm{base}}`,
  aggregateComplexityEffort: String.raw`H_{\mathrm{complex}} = \sum_i H_{i,\mathrm{complex}}`,
  complexityAdjustment: String.raw`\Delta H_{\mathrm{complex}} = H_{\mathrm{complex}} - H_{\mathrm{base}}`,
  effectiveComplexity: String.raw`c_{\mathrm{effective}} = \frac{H_{\mathrm{complex}}}{H_{\mathrm{base}}}`,
  aggregateAdjustedEffort: String.raw`H_{\mathrm{adj}} = \sum_i H_{i,\mathrm{adj}}`,
  riskAdjustment: String.raw`\Delta H_{\mathrm{risk}} = H_{\mathrm{adj}} - H_{\mathrm{complex}}`,
  phaseCrossCutting: String.raw`H_{\mathrm{cross},p} = \alpha_p \times \sum_{i \in E_p} H_{i,\mathrm{adj}}`,
  aggregateCrossCutting: String.raw`H_{\mathrm{cross}} = \sum_p H_{\mathrm{cross},p}`,
  mostLikelyEffort: String.raw`H_M = H_{\mathrm{adj}} + H_{\mathrm{cross}} + H_{\mathrm{fixed}}`,
  optimisticEffort: String.raw`H_O = H_M \times (1 - d)`,
  pessimisticEffort: String.raw`H_P = H_M \times (1 + u)`,
  p50Effort: String.raw`H_{P50} = \frac{H_O + 4H_M + H_P}{6}`,
  standardDeviation: String.raw`\sigma = \frac{H_P - H_O}{6}`,
  p80Effort: String.raw`H_{P80} = \max\left(0, H_{P50} + z_{80}\sigma\right)`,
  personDays: String.raw`\mathrm{PersonDays}_x = \frac{H_{P_x}}{h_d}`,
  personMonths: String.raw`\mathrm{PersonMonths}_x = \frac{H_{P_x}}{h_d \times d_m}`,
  laborCost: String.raw`C_{\mathrm{labor},x} = H_{P_x} \times R_h`,
  directCost: String.raw`D_x = D`,
  deliveryCost: String.raw`C_{\mathrm{delivery},x} = C_{\mathrm{labor},x} + D`,
  engineeringCost: String.raw`C_{\mathrm{engineering},x} = C_{\mathrm{delivery},x}`,
  overheadAmount: String.raw`C_{\mathrm{overhead},x} = C_{\mathrm{delivery},x} \times o`,
  costAfterOverhead: String.raw`C_{\mathrm{after\ overhead},x} = C_{\mathrm{delivery},x} + C_{\mathrm{overhead},x}`,
  warrantyCost: String.raw`W_x = W`,
  fullCost: String.raw`C_{\mathrm{full},x} = C_{\mathrm{after\ overhead},x} + W`,
  markupAmount: String.raw`C_{\mathrm{markup},x} = C_{\mathrm{full},x} \times m`,
  quoteExTax: String.raw`Q_{\mathrm{exTax},x} = C_{\mathrm{full},x} + C_{\mathrm{markup},x}`,
  taxAmount: String.raw`C_{\mathrm{tax},x} = Q_{\mathrm{exTax},x} \times t`,
  quoteIncTax: String.raw`Q_{\mathrm{incTax},x} = Q_{\mathrm{exTax},x} + C_{\mathrm{tax},x}`,
  normalizeTaxInclusiveQuote: String.raw`V_{\mathrm{exTax}} = \frac{V_{\mathrm{incTax}}}{1 + t}`,
  normalizeTaxExclusiveQuote: String.raw`V_{\mathrm{exTax}} = V`,
  vendorDifference: String.raw`\Delta_x = V_{\mathrm{exTax}} - Q_{\mathrm{exTax},x}`,
  vendorVariance: String.raw`\mathrm{Variance}_x = \frac{\Delta_x}{Q_{\mathrm{exTax},x}}`,
  vendorQuoteRatio: String.raw`\mathrm{QuoteRatio}_x = \frac{V_{\mathrm{exTax}}}{Q_{\mathrm{exTax},x}}`,
});
