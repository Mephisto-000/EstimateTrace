import { MODEL_P80_Z_SCORE } from "../model-definition";
import { CALCULATION_FORMULAS } from "./calculation-formulas";

/**
 * Canonical mathematical notation used by the public methodology page.
 *
 * Keeping these expressions beside the calculation-formula registry prevents
 * presentation code from becoming a second source of model formulas.
 * Worked examples are source-controlled documentation only and are never
 * evaluated by the calculation engine.
 */
export const METHODOLOGY_MATH = Object.freeze({
  symbols: Object.freeze({
    quantity: String.raw`q_i`,
    unitEffort: String.raw`u_i`,
    complexityMultiplier: String.raw`c_i`,
    riskMultiplier: String.raw`r_{i,k}`,
    phaseLoading: String.raw`\alpha_p`,
    mostLikelyEffort: String.raw`H_M`,
    threePointBounds: String.raw`H_O,\ H_P`,
    hourlyRate: String.raw`R_h`,
    directCost: String.raw`D`,
    commercialRates: String.raw`o,\ m,\ t`,
    vendorQuote: String.raw`V`,
    itemBaseEffort: String.raw`H_{i,\mathrm{base}}`,
    phase: String.raw`p`,
    eligibleItemSet: String.raw`E_p`,
    downsideRatio: String.raw`d`,
    upsideRatio: String.raw`u`,
    percentileEffort: String.raw`H_{P_x}`,
    overheadRatio: String.raw`o`,
    warrantyCost: String.raw`W`,
    markupRatio: String.raw`m`,
    taxRate: String.raw`t`,
    grossMargin: String.raw`g`,
    benchmarkQuotes: String.raw`Q_{\mathrm{exTax},50},\ Q_{\mathrm{exTax},80}`,
    benchmarkVariances: String.raw`\mathrm{Variance}_{50},\ \mathrm{Variance}_{80}`,
    hoursPerPersonDay: String.raw`h_d`,
    daysPerPersonMonth: String.raw`d_m`,
    personDays: String.raw`\mathrm{PersonDays}_x`,
    personMonths: String.raw`\mathrm{PersonMonths}_x`,
  }),
  formulas: Object.freeze({
    workItemBaseEffort: CALCULATION_FORMULAS.workItemBaseEffort.latex,
    aggregateBaseEffort: String.raw`H_{\mathrm{base}} = \sum_{i=1}^{n} H_{i,\mathrm{base}}`,
    workItemComplexity: CALCULATION_FORMULAS.workItemComplexity.latex,
    workItemRiskAdjusted: String.raw`H_{i,\mathrm{adj}} = H_{i,\mathrm{complex}} \times \prod_{k \in K_i} r_{i,k}`,
    aggregateAdjustedEffort: String.raw`H_{\mathrm{adj}} = \sum_{i=1}^{n} H_{i,\mathrm{adj}}`,
    phaseCrossCutting: CALCULATION_FORMULAS.phaseCrossCutting.latex,
    aggregateCrossCutting: CALCULATION_FORMULAS.aggregateCrossCutting.latex,
    mostLikelyEffort: CALCULATION_FORMULAS.mostLikelyEffort.latex,
    optimisticEffort: CALCULATION_FORMULAS.optimisticEffort.latex,
    pessimisticEffort: CALCULATION_FORMULAS.pessimisticEffort.latex,
    pertMean: String.raw`\mu = \frac{H_O + 4H_M + H_P}{6}`,
    standardDeviation: CALCULATION_FORMULAS.standardDeviation.latex,
    percentileEffort: String.raw`H_{P_x} = \max\left(0, \mu + z_x \sigma\right)`,
    p50Effort: String.raw`H_{P50} = \mu`,
    p80Effort: String.raw`H_{P80} = \max\left(0, \mu + ${MODEL_P80_Z_SCORE}\sigma\right)`,
    personDays: CALCULATION_FORMULAS.personDays.latex,
    personMonths: CALCULATION_FORMULAS.personMonths.latex,
    laborCost: CALCULATION_FORMULAS.laborCost.latex,
    deliveryCost: CALCULATION_FORMULAS.deliveryCost.latex,
    fullCost: String.raw`C_{\mathrm{full},x} = C_{\mathrm{delivery},x} \times (1 + o) + W`,
    quoteExTax: String.raw`Q_{\mathrm{exTax},x} = C_{\mathrm{full},x} \times (1 + m)`,
    quoteIncTax: String.raw`Q_{\mathrm{incTax},x} = Q_{\mathrm{exTax},x} \times (1 + t)`,
    markup: String.raw`C \times (1 + m)`,
    grossMargin: String.raw`\frac{C}{1 - g}`,
    normalizeTaxInclusiveQuote:
      CALCULATION_FORMULAS.normalizeTaxInclusiveQuote.latex,
    normalizeTaxExclusiveQuote:
      CALCULATION_FORMULAS.normalizeTaxExclusiveQuote.latex,
    vendorDifferenceP50: String.raw`\Delta_{50} = V_{\mathrm{exTax}} - Q_{\mathrm{exTax},50}`,
    vendorVarianceP50: String.raw`\mathrm{Variance}_{50} = \frac{\Delta_{50}}{Q_{\mathrm{exTax},50}},\quad Q_{\mathrm{exTax},50} > 0`,
    vendorDifferenceP80: String.raw`\Delta_{80} = V_{\mathrm{exTax}} - Q_{\mathrm{exTax},80}`,
    vendorVarianceP80: String.raw`\mathrm{Variance}_{80} = \frac{\Delta_{80}}{Q_{\mathrm{exTax},80}},\quad Q_{\mathrm{exTax},80} > 0`,
    vendorQuoteRatio: String.raw`\mathrm{QuoteRatio}_x = \frac{V_{\mathrm{exTax}}}{Q_{\mathrm{exTax},x}},\quad Q_{\mathrm{exTax},x} > 0`,
  }),
  examples: Object.freeze({
    baseEffort: String.raw`2 \times 16 = 32`,
    complexity: String.raw`32 \times 1.35 = 43.2`,
    risk: String.raw`43.2 \times 1.20 = 51.84`,
    crossCutting: String.raw`51.84 \times (1 + 0.40) = 72.576`,
    threePointInputs: String.raw`H_M = 72.576,\ d = 0.15,\ u = 0.30`,
    threePointBounds: String.raw`H_O = 61.6896,\ H_P = 94.3488`,
    p50AndSigma: String.raw`H_{P50} = 74.3904,\ \sigma = 5.4432`,
    p80: String.raw`74.3904 + 0.8416 \times 5.4432 = 78.97139712`,
    personDays: String.raw`\frac{78.97139712}{8} = 9.87142464`,
    personMonths: String.raw`\frac{78.97139712}{8 \times 20} = 0.493571232`,
    normalizeTax: String.raw`\frac{105{,}000}{1.05} = 100{,}000`,
  }),
  invariants: Object.freeze({
    orderedThreePointEffort: String.raw`0 \le H_O \le H_M \le H_P`,
  }),
});
