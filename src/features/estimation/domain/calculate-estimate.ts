import DecimalJs from "decimal.js";

import {
  CURRENT_MODEL_VERSION,
  MODEL_DECIMAL_PRECISION,
} from "./model-definition";
import type {
  CalculationTraceNode,
  CalculationOutcome,
  CalculationRequest,
  CalculationUnit,
  CalculationWarning,
  EstimateDriver,
  TraceOperand,
  TraceSource,
  VendorComparison,
} from "./types";
import {
  CROSS_CUTTING_PHASES,
  RISK_FACTOR_IDS,
  validateCalculationRequest,
} from "./validation";

function compareStableText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function calculateEstimate(
  request: CalculationRequest,
): CalculationOutcome {
  if (request.modelVersion !== CURRENT_MODEL_VERSION) {
    return {
      ok: false,
      issues: [
        {
          code: "UNSUPPORTED_MODEL_VERSION",
          path: "modelVersion",
          details: {
            actual: request.modelVersion,
            supported: CURRENT_MODEL_VERSION,
          },
        },
      ],
    };
  }

  const issues = validateCalculationRequest(request);
  if (issues.length > 0) {
    return { ok: false, issues };
  }

  const Decimal = DecimalJs.clone({
    precision: MODEL_DECIMAL_PRECISION,
    rounding: DecimalJs.ROUND_HALF_UP,
    toExpNeg: -1_000_000_000,
    toExpPos: 1_000_000_000,
  });
  const zero = new Decimal(0);
  const decimal = (value: string) => new Decimal(value);
  const canonical = (value: DecimalJs) => {
    const serialized = value.toFixed();
    return serialized === "-0" ? "0" : serialized;
  };
  const source = (
    kind: TraceSource["kind"],
    path: string,
    id?: string,
  ): TraceSource => (id === undefined ? { kind, path } : { kind, path, id });
  const operand = (
    name: string,
    value: DecimalJs,
    unit: CalculationUnit,
    operandSource: TraceSource,
  ): TraceOperand => ({
    name,
    value: canonical(value),
    unit,
    source: operandSource,
  });
  const calculationTrace: CalculationTraceNode[] = [];
  const addTrace = ({
    id,
    metric,
    formulaId,
    formula,
    operands,
    result,
    unit,
  }: {
    readonly id: string;
    readonly metric: string;
    readonly formulaId: string;
    readonly formula: string;
    readonly operands: readonly TraceOperand[];
    readonly result: DecimalJs;
    readonly unit: CalculationUnit;
  }): void => {
    const seenSources = new Set<string>();
    const sources = operands
      .map(({ source: operandSource }) => operandSource)
      .filter((operandSource) => {
        const key = `${operandSource.kind}:${operandSource.path}:${operandSource.id ?? ""}`;
        if (seenSources.has(key)) {
          return false;
        }
        seenSources.add(key);
        return true;
      });
    calculationTrace.push({
      id,
      metric,
      formulaId,
      formula,
      operands,
      result: canonical(result),
      unit,
      sources,
    });
  };

  const complexityByLevel = new Map(
    request.parameterSnapshot.complexityParameters.map((parameter) => [
      parameter.level,
      parameter,
    ]),
  );
  const riskById = new Map(
    request.parameterSnapshot.riskFactors.map((parameter) => [
      parameter.id,
      parameter,
    ]),
  );

  const calculatedItems = [...request.input.workItems]
    .sort((left, right) => compareStableText(left.id, right.id))
    .map((item) => {
      const baseEffort = decimal(item.quantity).times(item.unitHours);
      const complexityMultiplier = decimal(
        complexityByLevel.get(item.complexity)!.multiplier,
      );
      const complexityAdjustedEffort = baseEffort.times(complexityMultiplier);
      const applicableRiskFactorIds = RISK_FACTOR_IDS.filter((factorId) =>
        item.applicableRiskFactorIds.includes(factorId),
      );
      const riskProduct = applicableRiskFactorIds.reduce(
        (product, factorId) => {
          const riskFactor = riskById.get(factorId)!;
          const selection = request.input.riskProfile[factorId];
          return product.times(riskFactor.multipliers[selection.level]);
        },
        new Decimal(1),
      );

      return {
        item,
        applicableRiskFactorIds,
        baseEffort,
        complexityAdjustedEffort,
        riskProduct,
        adjustedEffort: complexityAdjustedEffort.times(riskProduct),
      };
    });

  const riskProductSafetyCap = decimal(
    request.parameterSnapshot.constraints.riskProductSafetyCap,
  );
  const warnings: CalculationWarning[] = calculatedItems
    .filter(({ riskProduct }) => riskProduct.greaterThan(riskProductSafetyCap))
    .map(({ item, riskProduct }) => ({
      code: "RISK_PRODUCT_SAFETY_CAP_EXCEEDED",
      path: `input.workItems.${item.id}.applicableRiskFactorIds`,
      details: {
        itemId: item.id,
        actual: canonical(riskProduct),
        safetyCap: canonical(riskProductSafetyCap),
      },
    }));

  const baseEffort = calculatedItems.reduce(
    (total, item) => total.plus(item.baseEffort),
    zero,
  );
  const adjustedEffort = calculatedItems.reduce(
    (total, item) => total.plus(item.adjustedEffort),
    zero,
  );

  const phaseEfforts = CROSS_CUTTING_PHASES.map((phase) => {
    const eligibleEffort = calculatedItems.reduce(
      (total, item) =>
        item.item.includedCrossCuttingPhases.includes(phase)
          ? total
          : total.plus(item.adjustedEffort),
      zero,
    );

    return {
      phase,
      effort: eligibleEffort.times(request.input.phaseLoading[phase]),
    };
  });
  const crossCuttingEffort = phaseEfforts.reduce(
    (total, phase) => total.plus(phase.effort),
    zero,
  );
  const fixedEffort = decimal(request.input.fixedEffortHours ?? "0");
  const mostLikelyEffort = adjustedEffort
    .plus(crossCuttingEffort)
    .plus(fixedEffort);
  const optimisticEffort = mostLikelyEffort.times(
    new Decimal(1).minus(request.input.uncertainty.downsideRate),
  );
  const pessimisticEffort = mostLikelyEffort.times(
    new Decimal(1).plus(request.input.uncertainty.upsideRate),
  );
  const p50Effort = optimisticEffort
    .plus(mostLikelyEffort.times(4))
    .plus(pessimisticEffort)
    .dividedBy(6);
  const standardDeviation = pessimisticEffort
    .minus(optimisticEffort)
    .dividedBy(6);
  const calculatedP80 = p50Effort.plus(
    standardDeviation.times(
      request.parameterSnapshot.calculationPolicy.p80ZScore,
    ),
  );
  const p80Effort = calculatedP80.isNegative() ? zero : calculatedP80;

  const { commercialTerms } = request.input;
  const hoursPerPersonMonth = decimal(commercialTerms.hoursPerPersonDay).times(
    commercialTerms.daysPerPersonMonth,
  );
  const p50PersonDays = p50Effort.dividedBy(commercialTerms.hoursPerPersonDay);
  const p80PersonDays = p80Effort.dividedBy(commercialTerms.hoursPerPersonDay);
  const p50PersonMonths = p50Effort.dividedBy(hoursPerPersonMonth);
  const p80PersonMonths = p80Effort.dividedBy(hoursPerPersonMonth);

  const directCost = decimal(commercialTerms.directCost);
  const overheadMultiplier = new Decimal(1).plus(commercialTerms.overheadRate);
  const warrantyCost = decimal(commercialTerms.warrantyCost);
  const markupMultiplier = new Decimal(1).plus(
    commercialTerms.vendorMarkupRate,
  );
  const taxMultiplier = new Decimal(1).plus(commercialTerms.taxRate);

  const calculateCost = (effort: DecimalJs) => {
    const engineeringCost = effort
      .times(commercialTerms.hourlyRate)
      .plus(directCost);
    const fullCost = engineeringCost
      .times(overheadMultiplier)
      .plus(warrantyCost);
    const quoteExTax = fullCost.times(markupMultiplier);
    const quoteIncTax = quoteExTax.times(taxMultiplier);

    return {
      engineeringCost,
      quoteExTax,
      quoteIncTax,
    };
  };

  const p50Cost = calculateCost(p50Effort);
  const p80Cost = calculateCost(p80Effort);

  calculatedItems.forEach(
    ({
      item,
      applicableRiskFactorIds,
      baseEffort: itemBaseEffort,
      complexityAdjustedEffort,
      riskProduct,
      adjustedEffort: itemAdjustedEffort,
    }) => {
      const itemPath = `input.workItems.${item.id}`;
      addTrace({
        id: `work-item:${item.id}:base`,
        metric: "workItemBaseEffortHours",
        formulaId: "work-item-base-effort",
        formula: "H_i,base = q_i × u_i",
        operands: [
          operand(
            "quantity",
            decimal(item.quantity),
            "dimensionless",
            source("work-item", `${itemPath}.quantity`, item.id),
          ),
          operand(
            "unitHours",
            decimal(item.unitHours),
            "person-hour",
            source("work-item", `${itemPath}.unitHours`, item.id),
          ),
        ],
        result: itemBaseEffort,
        unit: "person-hour",
      });
      addTrace({
        id: `work-item:${item.id}:complexity`,
        metric: "workItemComplexityAdjustedEffortHours",
        formulaId: "complexity-adjustment",
        formula: "H_i,complex = H_i,base × c_i",
        operands: [
          operand(
            "baseEffort",
            itemBaseEffort,
            "person-hour",
            source("derived", `work-item:${item.id}:base`, item.id),
          ),
          operand(
            "complexityMultiplier",
            decimal(complexityByLevel.get(item.complexity)!.multiplier),
            "ratio",
            source(
              "parameter",
              `complexityParameters.${item.complexity}.multiplier`,
            ),
          ),
        ],
        result: complexityAdjustedEffort,
        unit: "person-hour",
      });
      const riskOperands =
        applicableRiskFactorIds.length === 0
          ? [
              operand(
                "identity",
                new Decimal(1),
                "ratio",
                source("parameter", "riskFactors.identity"),
              ),
            ]
          : applicableRiskFactorIds.map((factorId) => {
              const riskLevel = request.input.riskProfile[factorId].level;
              return operand(
                factorId,
                decimal(riskById.get(factorId)!.multipliers[riskLevel]),
                "ratio",
                source(
                  "risk-factor",
                  `input.riskProfile.${factorId}`,
                  factorId,
                ),
              );
            });
      addTrace({
        id: `work-item:${item.id}:risk-product`,
        metric: "workItemRiskProduct",
        formulaId: "risk-factor-adjustment",
        formula: "R_i = ∏ r_i,k",
        operands: riskOperands,
        result: riskProduct,
        unit: "ratio",
      });
      addTrace({
        id: `work-item:${item.id}:adjusted`,
        metric: "workItemAdjustedEffortHours",
        formulaId: "risk-factor-adjustment",
        formula: "H_i,adj = H_i,complex × R_i",
        operands: [
          operand(
            "complexityAdjustedEffort",
            complexityAdjustedEffort,
            "person-hour",
            source("derived", `work-item:${item.id}:complexity`, item.id),
          ),
          operand(
            "riskProduct",
            riskProduct,
            "ratio",
            source("derived", `work-item:${item.id}:risk-product`, item.id),
          ),
        ],
        result: itemAdjustedEffort,
        unit: "person-hour",
      });
    },
  );

  addTrace({
    id: "estimate:base",
    metric: "baseEffortHours",
    formulaId: "work-item-base-effort",
    formula: "H_base = Σ H_i,base",
    operands: calculatedItems.map(({ item, baseEffort: itemBaseEffort }) =>
      operand(
        item.id,
        itemBaseEffort,
        "person-hour",
        source("derived", `work-item:${item.id}:base`, item.id),
      ),
    ),
    result: baseEffort,
    unit: "person-hour",
  });
  addTrace({
    id: "estimate:adjusted",
    metric: "adjustedEffortHours",
    formulaId: "risk-factor-adjustment",
    formula: "H_adj = Σ H_i,adj",
    operands: calculatedItems.map(
      ({ item, adjustedEffort: itemAdjustedEffort }) =>
        operand(
          item.id,
          itemAdjustedEffort,
          "person-hour",
          source("derived", `work-item:${item.id}:adjusted`, item.id),
        ),
    ),
    result: adjustedEffort,
    unit: "person-hour",
  });
  phaseEfforts.forEach(({ phase, effort }) => {
    const eligibleItems = calculatedItems.filter(
      ({ item }) => !item.includedCrossCuttingPhases.includes(phase),
    );
    addTrace({
      id: `phase:${phase}`,
      metric: "phaseEffortHours",
      formulaId: "cross-cutting-effort",
      formula: "H_cross,p = α_p × Σ H_i,adj (eligible)",
      operands: [
        ...eligibleItems.map(({ item, adjustedEffort: itemAdjustedEffort }) =>
          operand(
            item.id,
            itemAdjustedEffort,
            "person-hour",
            source("derived", `work-item:${item.id}:adjusted`, item.id),
          ),
        ),
        operand(
          "phaseLoadingRate",
          decimal(request.input.phaseLoading[phase]),
          "ratio",
          source("phase-loading", `input.phaseLoading.${phase}`, phase),
        ),
      ],
      result: effort,
      unit: "person-hour",
    });
  });
  addTrace({
    id: "estimate:cross-cutting",
    metric: "crossCuttingEffortHours",
    formulaId: "cross-cutting-effort",
    formula: "H_cross = Σ H_cross,p",
    operands: phaseEfforts.map(({ phase, effort }) =>
      operand(
        phase,
        effort,
        "person-hour",
        source("derived", `phase:${phase}`, phase),
      ),
    ),
    result: crossCuttingEffort,
    unit: "person-hour",
  });
  addTrace({
    id: "estimate:most-likely",
    metric: "mostLikelyEffortHours",
    formulaId: "three-point-estimate",
    formula: "H_M = H_adj + H_cross + H_fixed",
    operands: [
      operand(
        "adjustedEffort",
        adjustedEffort,
        "person-hour",
        source("derived", "estimate:adjusted"),
      ),
      operand(
        "crossCuttingEffort",
        crossCuttingEffort,
        "person-hour",
        source("derived", "estimate:cross-cutting"),
      ),
      operand(
        "fixedEffort",
        fixedEffort,
        "person-hour",
        source("input", "input.fixedEffortHours"),
      ),
    ],
    result: mostLikelyEffort,
    unit: "person-hour",
  });
  addTrace({
    id: "estimate:optimistic",
    metric: "optimisticEffortHours",
    formulaId: "three-point-estimate",
    formula: "H_O = H_M × (1 − d)",
    operands: [
      operand(
        "mostLikelyEffort",
        mostLikelyEffort,
        "person-hour",
        source("derived", "estimate:most-likely"),
      ),
      operand(
        "downsideRate",
        decimal(request.input.uncertainty.downsideRate),
        "ratio",
        source("input", "input.uncertainty.downsideRate"),
      ),
    ],
    result: optimisticEffort,
    unit: "person-hour",
  });
  addTrace({
    id: "estimate:pessimistic",
    metric: "pessimisticEffortHours",
    formulaId: "three-point-estimate",
    formula: "H_P = H_M × (1 + u)",
    operands: [
      operand(
        "mostLikelyEffort",
        mostLikelyEffort,
        "person-hour",
        source("derived", "estimate:most-likely"),
      ),
      operand(
        "upsideRate",
        decimal(request.input.uncertainty.upsideRate),
        "ratio",
        source("input", "input.uncertainty.upsideRate"),
      ),
    ],
    result: pessimisticEffort,
    unit: "person-hour",
  });
  addTrace({
    id: "estimate:p50",
    metric: "p50EffortHours",
    formulaId: "pert-percentiles",
    formula: "H_P50 = (H_O + 4H_M + H_P) ÷ 6",
    operands: [
      operand(
        "optimisticEffort",
        optimisticEffort,
        "person-hour",
        source("derived", "estimate:optimistic"),
      ),
      operand(
        "mostLikelyEffort",
        mostLikelyEffort,
        "person-hour",
        source("derived", "estimate:most-likely"),
      ),
      operand(
        "pessimisticEffort",
        pessimisticEffort,
        "person-hour",
        source("derived", "estimate:pessimistic"),
      ),
    ],
    result: p50Effort,
    unit: "person-hour",
  });
  addTrace({
    id: "estimate:standard-deviation",
    metric: "standardDeviationHours",
    formulaId: "pert-percentiles",
    formula: "σ = (H_P − H_O) ÷ 6",
    operands: [
      operand(
        "pessimisticEffort",
        pessimisticEffort,
        "person-hour",
        source("derived", "estimate:pessimistic"),
      ),
      operand(
        "optimisticEffort",
        optimisticEffort,
        "person-hour",
        source("derived", "estimate:optimistic"),
      ),
    ],
    result: standardDeviation,
    unit: "person-hour",
  });
  addTrace({
    id: "estimate:p80",
    metric: "p80EffortHours",
    formulaId: "pert-percentiles",
    formula: "H_P80 = max(0, H_P50 + z_80σ)",
    operands: [
      operand(
        "p50Effort",
        p50Effort,
        "person-hour",
        source("derived", "estimate:p50"),
      ),
      operand(
        "p80ZScore",
        decimal(request.parameterSnapshot.calculationPolicy.p80ZScore),
        "ratio",
        source("parameter", "calculationPolicy.p80ZScore"),
      ),
      operand(
        "standardDeviation",
        standardDeviation,
        "person-hour",
        source("derived", "estimate:standard-deviation"),
      ),
    ],
    result: p80Effort,
    unit: "person-hour",
  });

  const addConversionTrace = (
    percentile: "p50" | "p80",
    effort: DecimalJs,
    personDays: DecimalJs,
    personMonths: DecimalJs,
  ) => {
    addTrace({
      id: `estimate:${percentile}:person-days`,
      metric: `${percentile}PersonDays`,
      formulaId: "effort-conversion",
      formula: "PersonDays_x = H_Px ÷ hoursPerPersonDay",
      operands: [
        operand(
          "effort",
          effort,
          "person-hour",
          source("derived", `estimate:${percentile}`),
        ),
        operand(
          "hoursPerPersonDay",
          decimal(commercialTerms.hoursPerPersonDay),
          "person-hour/person-day",
          source("commercial-term", "input.commercialTerms.hoursPerPersonDay"),
        ),
      ],
      result: personDays,
      unit: "person-day",
    });
    addTrace({
      id: `estimate:${percentile}:person-months`,
      metric: `${percentile}PersonMonths`,
      formulaId: "effort-conversion",
      formula:
        "PersonMonths_x = H_Px ÷ (hoursPerPersonDay × daysPerPersonMonth)",
      operands: [
        operand(
          "effort",
          effort,
          "person-hour",
          source("derived", `estimate:${percentile}`),
        ),
        operand(
          "hoursPerPersonMonth",
          hoursPerPersonMonth,
          "person-hour/person-month",
          source(
            "commercial-term",
            "input.commercialTerms.hoursPerPersonDay,input.commercialTerms.daysPerPersonMonth",
          ),
        ),
      ],
      result: personMonths,
      unit: "person-month",
    });
  };
  addConversionTrace("p50", p50Effort, p50PersonDays, p50PersonMonths);
  addConversionTrace("p80", p80Effort, p80PersonDays, p80PersonMonths);

  const addCostTrace = (
    percentile: "p50" | "p80",
    effort: DecimalJs,
    cost: ReturnType<typeof calculateCost>,
  ) => {
    addTrace({
      id: `estimate:${percentile}:engineering-cost`,
      metric: `${percentile}EngineeringCost`,
      formulaId: "engineering-cost",
      formula: "C_delivery,x = (H_Px × R_h) + D",
      operands: [
        operand(
          "effort",
          effort,
          "person-hour",
          source("derived", `estimate:${percentile}`),
        ),
        operand(
          "hourlyRate",
          decimal(commercialTerms.hourlyRate),
          "TWD/person-hour",
          source("commercial-term", "input.commercialTerms.hourlyRate"),
        ),
        operand(
          "directCost",
          directCost,
          "TWD",
          source("commercial-term", "input.commercialTerms.directCost"),
        ),
      ],
      result: cost.engineeringCost,
      unit: "TWD",
    });
    addTrace({
      id: `estimate:${percentile}:quote-ex-tax`,
      metric: `${percentile}QuoteExTax`,
      formulaId: "commercial-loadings",
      formula: "Q_exTax,x = (C_delivery,x × (1 + o) + W) × (1 + m)",
      operands: [
        operand(
          "engineeringCost",
          cost.engineeringCost,
          "TWD",
          source("derived", `estimate:${percentile}:engineering-cost`),
        ),
        operand(
          "overheadRate",
          decimal(commercialTerms.overheadRate),
          "ratio",
          source("commercial-term", "input.commercialTerms.overheadRate"),
        ),
        operand(
          "warrantyCost",
          warrantyCost,
          "TWD",
          source("commercial-term", "input.commercialTerms.warrantyCost"),
        ),
        operand(
          "vendorMarkupRate",
          decimal(commercialTerms.vendorMarkupRate),
          "ratio",
          source("commercial-term", "input.commercialTerms.vendorMarkupRate"),
        ),
      ],
      result: cost.quoteExTax,
      unit: "TWD",
    });
    addTrace({
      id: `estimate:${percentile}:quote-inc-tax`,
      metric: `${percentile}QuoteIncTax`,
      formulaId: "commercial-loadings",
      formula: "Q_incTax,x = Q_exTax,x × (1 + t)",
      operands: [
        operand(
          "quoteExTax",
          cost.quoteExTax,
          "TWD",
          source("derived", `estimate:${percentile}:quote-ex-tax`),
        ),
        operand(
          "taxRate",
          decimal(commercialTerms.taxRate),
          "ratio",
          source("commercial-term", "input.commercialTerms.taxRate"),
        ),
      ],
      result: cost.quoteIncTax,
      unit: "TWD",
    });
  };
  addCostTrace("p50", p50Effort, p50Cost);
  addCostTrace("p80", p80Effort, p80Cost);

  let vendorComparison: VendorComparison | null = null;
  if (request.input.vendorQuote !== null) {
    const quoteAmount = decimal(request.input.vendorQuote.amount);
    const normalizedQuoteExTax =
      request.input.vendorQuote.taxBasis === "TAX_INCLUSIVE"
        ? quoteAmount.dividedBy(taxMultiplier)
        : quoteAmount;
    const differenceFromP50 = normalizedQuoteExTax.minus(p50Cost.quoteExTax);
    const differenceFromP80 = normalizedQuoteExTax.minus(p80Cost.quoteExTax);
    const hasP50Benchmark = p50Cost.quoteExTax.greaterThan(0);
    const hasP80Benchmark = p80Cost.quoteExTax.greaterThan(0);
    const varianceFromP50 = hasP50Benchmark
      ? differenceFromP50.dividedBy(p50Cost.quoteExTax)
      : null;
    const varianceFromP80 = hasP80Benchmark
      ? differenceFromP80.dividedBy(p80Cost.quoteExTax)
      : null;
    const quoteToP50Ratio = hasP50Benchmark
      ? normalizedQuoteExTax.dividedBy(p50Cost.quoteExTax)
      : null;
    const quoteToP80Ratio = hasP80Benchmark
      ? normalizedQuoteExTax.dividedBy(p80Cost.quoteExTax)
      : null;
    const clearlyBelowThreshold = p50Cost.quoteExTax.times(
      request.parameterSnapshot.comparison.clearlyBelowP50Ratio,
    );

    let band: VendorComparison["band"];
    if (
      hasP50Benchmark &&
      normalizedQuoteExTax.lessThan(clearlyBelowThreshold)
    ) {
      band = "CLEARLY_BELOW_MODEL_RANGE";
    } else if (normalizedQuoteExTax.lessThanOrEqualTo(p50Cost.quoteExTax)) {
      band = "NEAR_MODEL_REFERENCE_RANGE";
    } else if (normalizedQuoteExTax.lessThanOrEqualTo(p80Cost.quoteExTax)) {
      band = "ABOVE_MODEL_P50";
    } else {
      band = "ABOVE_MODEL_P80";
    }

    addTrace({
      id: "vendor:normalized-quote-ex-tax",
      metric: "normalizedQuoteExTax",
      formulaId: "tax-normalization",
      formula:
        request.input.vendorQuote.taxBasis === "TAX_INCLUSIVE"
          ? "V_exTax = V_incTax ÷ (1 + t)"
          : "V_exTax = V",
      operands: [
        operand(
          "quoteAmount",
          quoteAmount,
          "TWD",
          source("input", "input.vendorQuote.amount"),
        ),
        ...(request.input.vendorQuote.taxBasis === "TAX_INCLUSIVE"
          ? [
              operand(
                "taxRate",
                decimal(commercialTerms.taxRate),
                "ratio",
                source("commercial-term", "input.commercialTerms.taxRate"),
              ),
            ]
          : []),
      ],
      result: normalizedQuoteExTax,
      unit: "TWD",
    });
    const addVendorDifferenceTrace = (
      percentile: "p50" | "p80",
      benchmark: DecimalJs,
      difference: DecimalJs,
      variance: DecimalJs | null,
      ratio: DecimalJs | null,
    ) => {
      addTrace({
        id: `vendor:difference-from-${percentile}`,
        metric: `differenceFrom${percentile.toUpperCase()}`,
        formulaId: "vendor-quote-variance",
        formula: "Δ_x = V_exTax − Q_exTax,x",
        operands: [
          operand(
            "normalizedQuoteExTax",
            normalizedQuoteExTax,
            "TWD",
            source("derived", "vendor:normalized-quote-ex-tax"),
          ),
          operand(
            "benchmarkQuoteExTax",
            benchmark,
            "TWD",
            source("derived", `estimate:${percentile}:quote-ex-tax`),
          ),
        ],
        result: difference,
        unit: "TWD",
      });
      if (variance !== null && ratio !== null) {
        addTrace({
          id: `vendor:variance-from-${percentile}`,
          metric: `varianceFrom${percentile.toUpperCase()}`,
          formulaId: "vendor-quote-variance",
          formula: "Variance_x = Δ_x ÷ Q_exTax,x",
          operands: [
            operand(
              "difference",
              difference,
              "TWD",
              source("derived", `vendor:difference-from-${percentile}`),
            ),
            operand(
              "benchmarkQuoteExTax",
              benchmark,
              "TWD",
              source("derived", `estimate:${percentile}:quote-ex-tax`),
            ),
          ],
          result: variance,
          unit: "ratio",
        });
        addTrace({
          id: `vendor:ratio-to-${percentile}`,
          metric: `quoteTo${percentile.toUpperCase()}Ratio`,
          formulaId: "vendor-quote-variance",
          formula: "QuoteRatio_x = V_exTax ÷ Q_exTax,x",
          operands: [
            operand(
              "normalizedQuoteExTax",
              normalizedQuoteExTax,
              "TWD",
              source("derived", "vendor:normalized-quote-ex-tax"),
            ),
            operand(
              "benchmarkQuoteExTax",
              benchmark,
              "TWD",
              source("derived", `estimate:${percentile}:quote-ex-tax`),
            ),
          ],
          result: ratio,
          unit: "ratio",
        });
      }
    };
    addVendorDifferenceTrace(
      "p50",
      p50Cost.quoteExTax,
      differenceFromP50,
      varianceFromP50,
      quoteToP50Ratio,
    );
    addVendorDifferenceTrace(
      "p80",
      p80Cost.quoteExTax,
      differenceFromP80,
      varianceFromP80,
      quoteToP80Ratio,
    );

    vendorComparison = {
      normalizedQuoteExTax: canonical(normalizedQuoteExTax),
      differenceFromP50: canonical(differenceFromP50),
      differenceFromP80: canonical(differenceFromP80),
      varianceFromP50:
        varianceFromP50 === null ? null : canonical(varianceFromP50),
      varianceFromP80:
        varianceFromP80 === null ? null : canonical(varianceFromP80),
      quoteToP50Ratio:
        quoteToP50Ratio === null ? null : canonical(quoteToP50Ratio),
      quoteToP80Ratio:
        quoteToP80Ratio === null ? null : canonical(quoteToP80Ratio),
      band,
      questions: [...request.parameterSnapshot.vendorQuestions]
        .sort(
          (left, right) =>
            left.priority - right.priority ||
            compareStableText(left.id, right.id),
        )
        .map(({ id, text }) => ({ id, text })),
    };
  }

  const driverCandidates: Array<{
    driver: EstimateDriver;
    contribution: DecimalJs;
  }> = [
    ...calculatedItems.map(({ item, adjustedEffort: contribution }) => ({
      driver: {
        kind: "WORK_ITEM" as const,
        sourceId: item.id,
        contributionHours: canonical(contribution),
      },
      contribution,
    })),
    ...phaseEfforts.map(({ phase, effort: contribution }) => ({
      driver: {
        kind: "CROSS_CUTTING_PHASE" as const,
        sourceId: phase,
        contributionHours: canonical(contribution),
      },
      contribution,
    })),
  ];
  const drivers = driverCandidates
    .filter(({ contribution }) => contribution.greaterThan(0))
    .sort(
      (left, right) =>
        right.contribution.comparedTo(left.contribution) ||
        compareStableText(left.driver.kind, right.driver.kind) ||
        compareStableText(left.driver.sourceId, right.driver.sourceId),
    )
    .slice(0, 3)
    .map(({ driver }) => driver);

  return {
    ok: true,
    result: {
      modelVersion: request.modelVersion,
      parameterSetId: request.parameterSnapshot.id,
      parameterSetVersion: request.parameterSnapshot.version,
      baseEffortHours: canonical(baseEffort),
      adjustedEffortHours: canonical(adjustedEffort),
      crossCuttingEffortHours: canonical(crossCuttingEffort),
      mostLikelyEffortHours: canonical(mostLikelyEffort),
      optimisticEffortHours: canonical(optimisticEffort),
      pessimisticEffortHours: canonical(pessimisticEffort),
      p50EffortHours: canonical(p50Effort),
      p80EffortHours: canonical(p80Effort),
      p50PersonDays: canonical(p50PersonDays),
      p80PersonDays: canonical(p80PersonDays),
      p50PersonMonths: canonical(p50PersonMonths),
      p80PersonMonths: canonical(p80PersonMonths),
      p50EngineeringCost: canonical(p50Cost.engineeringCost),
      p80EngineeringCost: canonical(p80Cost.engineeringCost),
      p50QuoteExTax: canonical(p50Cost.quoteExTax),
      p80QuoteExTax: canonical(p80Cost.quoteExTax),
      p50QuoteIncTax: canonical(p50Cost.quoteIncTax),
      p80QuoteIncTax: canonical(p80Cost.quoteIncTax),
      vendorComparison,
      drivers,
      warnings,
      calculationTrace,
    },
  };
}
