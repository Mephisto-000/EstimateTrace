import DecimalJs from "decimal.js";

import { CALCULATION_FORMULAS } from "./formulas/calculation-formulas";
import {
  CURRENT_MODEL_VERSION,
  MODEL_DECIMAL_PRECISION,
} from "./model-definition";
import type {
  CanonicalDecimalString,
  CalculationTraceNode,
  CalculationOutcome,
  CalculationPrecisionPolicy,
  CalculationRequest,
  CalculationUnit,
  CalculationWarning,
  CostDriverId,
  CostWaterfall,
  EstimateDriver,
  TraceOperand,
  TraceSource,
  VendorComparison,
  VendorComparisonBand,
  VendorQuestion,
  VendorQuestionEvidence,
} from "./types";
import {
  asEffortHours,
  asMoney,
  asQuantity,
  asRatio,
  normalizeNonNegativeDecimal,
  parseCanonicalDecimal,
  parseParameterSetId,
} from "./value-objects";
import {
  CROSS_CUTTING_PHASES,
  RISK_FACTOR_IDS,
  RISK_LEVELS,
  WORK_ITEM_TYPES,
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

  const parameterSetId = parseParameterSetId(request.parameterSnapshot.id);
  if (parameterSetId === null) {
    return {
      ok: false,
      issues: [
        {
          code: "INVALID_PARAMETER_SET",
          path: "parameterSnapshot.id",
          details: {
            expected: "lowercase kebab-case parameter set identifier",
          },
        },
      ],
    };
  }

  const Decimal = DecimalJs.clone({
    precision: MODEL_DECIMAL_PRECISION,
    rounding: DecimalJs.ROUND_HALF_UP,
    toExpNeg: -1_000_000_000,
    toExpPos: 1_000_000_000,
  });
  const zero = new Decimal(0);
  const decimal = (value: string) => new Decimal(value);
  const canonical = (value: DecimalJs): CanonicalDecimalString => {
    const serialized = value.toFixed();
    const parsed = parseCanonicalDecimal(
      serialized === "-0" ? "0" : serialized,
    );
    if (parsed === null) {
      throw new RangeError(
        "Calculation produced a non-canonical or unsafe decimal.",
      );
    }
    return parsed;
  };
  const effortHours = (value: DecimalJs) => asEffortHours(canonical(value));
  const money = (value: DecimalJs) => asMoney(canonical(value));
  const ratio = (value: DecimalJs) => asRatio(canonical(value));
  const precisionPolicy: CalculationPrecisionPolicy = {
    decimalPrecision:
      request.parameterSnapshot.calculationPolicy.decimalPrecision,
    roundingMode: request.parameterSnapshot.calculationPolicy.roundingMode,
    intermediateRounding:
      request.parameterSnapshot.calculationPolicy.intermediateRounding,
    presentationRounding:
      request.parameterSnapshot.calculationPolicy.presentationRounding,
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
      precisionPolicy,
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

  const quantities = new Map<string, ReturnType<typeof asQuantity>>();
  const unitEfforts = new Map<string, ReturnType<typeof asEffortHours>>();
  for (const [index, item] of request.input.workItems.entries()) {
    const normalizedQuantity = normalizeNonNegativeDecimal(item.quantity);
    const normalizedUnitEffort = normalizeNonNegativeDecimal(item.unitHours);
    if (normalizedQuantity === null || normalizedUnitEffort === null) {
      return {
        ok: false,
        issues: [
          {
            code: "INVALID_DECIMAL",
            path:
              normalizedQuantity === null
                ? `input.workItems.${index}.quantity`
                : `input.workItems.${index}.unitHours`,
            details: {
              expected: "canonical non-negative decimal string",
            },
          },
        ],
      };
    }
    quantities.set(item.id, asQuantity(normalizedQuantity));
    unitEfforts.set(item.id, asEffortHours(normalizedUnitEffort));
  }

  const calculatedItems = [...request.input.workItems]
    .sort((left, right) => compareStableText(left.id, right.id))
    .map((item) => {
      const baseEffort = decimal(quantities.get(item.id)!).times(
        unitEfforts.get(item.id)!,
      );
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
  const complexityAdjustedEffort = calculatedItems.reduce(
    (total, item) => total.plus(item.complexityAdjustedEffort),
    zero,
  );
  const complexityAdjustment = complexityAdjustedEffort.minus(baseEffort);
  const effectiveComplexityMultiplier = baseEffort.greaterThan(0)
    ? complexityAdjustedEffort.dividedBy(baseEffort)
    : zero;
  const adjustedEffort = calculatedItems.reduce(
    (total, item) => total.plus(item.adjustedEffort),
    zero,
  );
  const riskAdjustment = adjustedEffort.minus(complexityAdjustedEffort);

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
  const warrantyCost = decimal(commercialTerms.warrantyCost);
  const taxMultiplier = new Decimal(1).plus(commercialTerms.taxRate);

  const calculateCost = (effort: DecimalJs) => {
    const laborCost = effort.times(commercialTerms.hourlyRate);
    const deliveryCost = laborCost.plus(directCost);
    const overheadAmount = deliveryCost.times(commercialTerms.overheadRate);
    const costAfterOverhead = deliveryCost.plus(overheadAmount);
    const fullCost = costAfterOverhead.plus(warrantyCost);
    const vendorMarkupAmount = fullCost.times(commercialTerms.vendorMarkupRate);
    const quoteExTax = fullCost.plus(vendorMarkupAmount);
    const taxAmount = quoteExTax.times(commercialTerms.taxRate);
    const quoteIncTax = quoteExTax.plus(taxAmount);

    return {
      laborCost,
      directCost,
      deliveryCost,
      overheadAmount,
      costAfterOverhead,
      warrantyCost,
      fullCost,
      vendorMarkupAmount,
      quoteExTax,
      taxAmount,
      quoteIncTax,
    };
  };

  const p50Cost = calculateCost(p50Effort);
  const p80Cost = calculateCost(p80Effort);
  const serializeCost = (
    cost: ReturnType<typeof calculateCost>,
  ): CostWaterfall => ({
    laborCost: money(cost.laborCost),
    directCost: money(cost.directCost),
    deliveryCost: money(cost.deliveryCost),
    overheadAmount: money(cost.overheadAmount),
    costAfterOverhead: money(cost.costAfterOverhead),
    warrantyCost: money(cost.warrantyCost),
    fullCost: money(cost.fullCost),
    vendorMarkupAmount: money(cost.vendorMarkupAmount),
    quoteExTax: money(cost.quoteExTax),
    taxAmount: money(cost.taxAmount),
    quoteIncTax: money(cost.quoteIncTax),
  });

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
        formula: CALCULATION_FORMULAS.workItemBaseEffort,
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
        formula: CALCULATION_FORMULAS.workItemComplexity,
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
        formula: CALCULATION_FORMULAS.riskProduct,
        operands: riskOperands,
        result: riskProduct,
        unit: "ratio",
      });
      addTrace({
        id: `work-item:${item.id}:adjusted`,
        metric: "workItemAdjustedEffortHours",
        formulaId: "risk-factor-adjustment",
        formula: CALCULATION_FORMULAS.workItemAdjusted,
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
    formula: CALCULATION_FORMULAS.aggregateBaseEffort,
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
    id: "estimate:complexity-adjusted",
    metric: "complexityAdjustedEffortHours",
    formulaId: "complexity-adjustment",
    formula: CALCULATION_FORMULAS.aggregateComplexityEffort,
    operands: calculatedItems.map(
      ({ item, complexityAdjustedEffort: itemComplexityAdjustedEffort }) =>
        operand(
          item.id,
          itemComplexityAdjustedEffort,
          "person-hour",
          source("derived", `work-item:${item.id}:complexity`, item.id),
        ),
    ),
    result: complexityAdjustedEffort,
    unit: "person-hour",
  });
  addTrace({
    id: "estimate:complexity-adjustment",
    metric: "complexityAdjustmentHours",
    formulaId: "complexity-adjustment",
    formula: CALCULATION_FORMULAS.complexityAdjustment,
    operands: [
      operand(
        "complexityAdjustedEffort",
        complexityAdjustedEffort,
        "person-hour",
        source("derived", "estimate:complexity-adjusted"),
      ),
      operand(
        "baseEffort",
        baseEffort,
        "person-hour",
        source("derived", "estimate:base"),
      ),
    ],
    result: complexityAdjustment,
    unit: "person-hour",
  });
  addTrace({
    id: "estimate:effective-complexity-multiplier",
    metric: "effectiveComplexityMultiplier",
    formulaId: "complexity-adjustment",
    formula: CALCULATION_FORMULAS.effectiveComplexity,
    operands: [
      operand(
        "complexityAdjustedEffort",
        complexityAdjustedEffort,
        "person-hour",
        source("derived", "estimate:complexity-adjusted"),
      ),
      operand(
        "baseEffort",
        baseEffort,
        "person-hour",
        source("derived", "estimate:base"),
      ),
    ],
    result: effectiveComplexityMultiplier,
    unit: "ratio",
  });
  addTrace({
    id: "estimate:adjusted",
    metric: "adjustedEffortHours",
    formulaId: "risk-factor-adjustment",
    formula: CALCULATION_FORMULAS.aggregateAdjustedEffort,
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
  addTrace({
    id: "estimate:risk-adjustment",
    metric: "riskAdjustmentHours",
    formulaId: "risk-factor-adjustment",
    formula: CALCULATION_FORMULAS.riskAdjustment,
    operands: [
      operand(
        "adjustedEffort",
        adjustedEffort,
        "person-hour",
        source("derived", "estimate:adjusted"),
      ),
      operand(
        "complexityAdjustedEffort",
        complexityAdjustedEffort,
        "person-hour",
        source("derived", "estimate:complexity-adjusted"),
      ),
    ],
    result: riskAdjustment,
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
      formula: CALCULATION_FORMULAS.phaseCrossCutting,
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
    formula: CALCULATION_FORMULAS.aggregateCrossCutting,
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
    formula: CALCULATION_FORMULAS.mostLikelyEffort,
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
    formula: CALCULATION_FORMULAS.optimisticEffort,
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
    formula: CALCULATION_FORMULAS.pessimisticEffort,
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
    formula: CALCULATION_FORMULAS.p50Effort,
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
    formula: CALCULATION_FORMULAS.standardDeviation,
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
    formula: CALCULATION_FORMULAS.p80Effort,
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
      formula: CALCULATION_FORMULAS.personDays,
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
      formula: CALCULATION_FORMULAS.personMonths,
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
      id: `estimate:${percentile}:labor-cost`,
      metric: `${percentile}LaborCost`,
      formulaId: "engineering-cost",
      formula: CALCULATION_FORMULAS.laborCost,
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
      ],
      result: cost.laborCost,
      unit: "TWD",
    });
    addTrace({
      id: `estimate:${percentile}:direct-cost`,
      metric: `${percentile}DirectCost`,
      formulaId: "engineering-cost",
      formula: CALCULATION_FORMULAS.directCost,
      operands: [
        operand(
          "directCost",
          directCost,
          "TWD",
          source("commercial-term", "input.commercialTerms.directCost"),
        ),
      ],
      result: cost.directCost,
      unit: "TWD",
    });
    addTrace({
      id: `estimate:${percentile}:delivery-cost`,
      metric: `${percentile}DeliveryCost`,
      formulaId: "engineering-cost",
      formula: CALCULATION_FORMULAS.deliveryCost,
      operands: [
        operand(
          "laborCost",
          cost.laborCost,
          "TWD",
          source("derived", `estimate:${percentile}:labor-cost`),
        ),
        operand(
          "directCost",
          cost.directCost,
          "TWD",
          source("derived", `estimate:${percentile}:direct-cost`),
        ),
      ],
      result: cost.deliveryCost,
      unit: "TWD",
    });
    addTrace({
      id: `estimate:${percentile}:engineering-cost`,
      metric: `${percentile}EngineeringCost`,
      formulaId: "engineering-cost",
      formula: CALCULATION_FORMULAS.engineeringCost,
      operands: [
        operand(
          "deliveryCost",
          cost.deliveryCost,
          "TWD",
          source("derived", `estimate:${percentile}:delivery-cost`),
        ),
      ],
      result: cost.deliveryCost,
      unit: "TWD",
    });
    addTrace({
      id: `estimate:${percentile}:overhead-amount`,
      metric: `${percentile}OverheadAmount`,
      formulaId: "commercial-loadings",
      formula: CALCULATION_FORMULAS.overheadAmount,
      operands: [
        operand(
          "deliveryCost",
          cost.deliveryCost,
          "TWD",
          source("derived", `estimate:${percentile}:delivery-cost`),
        ),
        operand(
          "overheadRate",
          decimal(commercialTerms.overheadRate),
          "ratio",
          source("commercial-term", "input.commercialTerms.overheadRate"),
        ),
      ],
      result: cost.overheadAmount,
      unit: "TWD",
    });
    addTrace({
      id: `estimate:${percentile}:cost-after-overhead`,
      metric: `${percentile}CostAfterOverhead`,
      formulaId: "commercial-loadings",
      formula: CALCULATION_FORMULAS.costAfterOverhead,
      operands: [
        operand(
          "deliveryCost",
          cost.deliveryCost,
          "TWD",
          source("derived", `estimate:${percentile}:delivery-cost`),
        ),
        operand(
          "overheadAmount",
          cost.overheadAmount,
          "TWD",
          source("derived", `estimate:${percentile}:overhead-amount`),
        ),
      ],
      result: cost.costAfterOverhead,
      unit: "TWD",
    });
    addTrace({
      id: `estimate:${percentile}:warranty-cost`,
      metric: `${percentile}WarrantyCost`,
      formulaId: "commercial-loadings",
      formula: CALCULATION_FORMULAS.warrantyCost,
      operands: [
        operand(
          "warrantyCost",
          warrantyCost,
          "TWD",
          source("commercial-term", "input.commercialTerms.warrantyCost"),
        ),
      ],
      result: cost.warrantyCost,
      unit: "TWD",
    });
    addTrace({
      id: `estimate:${percentile}:full-cost`,
      metric: `${percentile}FullCost`,
      formulaId: "commercial-loadings",
      formula: CALCULATION_FORMULAS.fullCost,
      operands: [
        operand(
          "costAfterOverhead",
          cost.costAfterOverhead,
          "TWD",
          source("derived", `estimate:${percentile}:cost-after-overhead`),
        ),
        operand(
          "warrantyCost",
          cost.warrantyCost,
          "TWD",
          source("derived", `estimate:${percentile}:warranty-cost`),
        ),
      ],
      result: cost.fullCost,
      unit: "TWD",
    });
    addTrace({
      id: `estimate:${percentile}:vendor-markup-amount`,
      metric: `${percentile}VendorMarkupAmount`,
      formulaId: "commercial-loadings",
      formula: CALCULATION_FORMULAS.markupAmount,
      operands: [
        operand(
          "fullCost",
          cost.fullCost,
          "TWD",
          source("derived", `estimate:${percentile}:full-cost`),
        ),
        operand(
          "vendorMarkupRate",
          decimal(commercialTerms.vendorMarkupRate),
          "ratio",
          source("commercial-term", "input.commercialTerms.vendorMarkupRate"),
        ),
      ],
      result: cost.vendorMarkupAmount,
      unit: "TWD",
    });
    addTrace({
      id: `estimate:${percentile}:quote-ex-tax`,
      metric: `${percentile}QuoteExTax`,
      formulaId: "commercial-loadings",
      formula: CALCULATION_FORMULAS.quoteExTax,
      operands: [
        operand(
          "fullCost",
          cost.fullCost,
          "TWD",
          source("derived", `estimate:${percentile}:full-cost`),
        ),
        operand(
          "vendorMarkupAmount",
          cost.vendorMarkupAmount,
          "TWD",
          source("derived", `estimate:${percentile}:vendor-markup-amount`),
        ),
      ],
      result: cost.quoteExTax,
      unit: "TWD",
    });
    addTrace({
      id: `estimate:${percentile}:tax-amount`,
      metric: `${percentile}TaxAmount`,
      formulaId: "commercial-loadings",
      formula: CALCULATION_FORMULAS.taxAmount,
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
      result: cost.taxAmount,
      unit: "TWD",
    });
    addTrace({
      id: `estimate:${percentile}:quote-inc-tax`,
      metric: `${percentile}QuoteIncTax`,
      formulaId: "commercial-loadings",
      formula: CALCULATION_FORMULAS.quoteIncTax,
      operands: [
        operand(
          "quoteExTax",
          cost.quoteExTax,
          "TWD",
          source("derived", `estimate:${percentile}:quote-ex-tax`),
        ),
        operand(
          "taxAmount",
          cost.taxAmount,
          "TWD",
          source("derived", `estimate:${percentile}:tax-amount`),
        ),
      ],
      result: cost.quoteIncTax,
      unit: "TWD",
    });
  };
  addCostTrace("p50", p50Effort, p50Cost);
  addCostTrace("p80", p80Effort, p80Cost);

  const selectVendorQuestions = (
    band: VendorComparisonBand,
  ): readonly VendorQuestion[] => {
    const evidenceKey = (evidence: VendorQuestionEvidence): string => {
      switch (evidence.kind) {
        case "BAND":
          return `0:${evidence.band}`;
        case "WORK_ITEM_TYPE":
          return `1:${evidence.workItemType}:${evidence.workItemIds.join(",")}`;
        case "RISK_FACTOR":
          return `2:${evidence.factorId}:${evidence.level}:${evidence.workItemIds.join(",")}`;
      }
    };
    const questions = request.parameterSnapshot.vendorQuestions
      .map((question) => {
        const evidence: VendorQuestionEvidence[] = [];
        for (const trigger of question.triggers) {
          switch (trigger.kind) {
            case "BAND":
              if (trigger.bands.includes(band)) {
                evidence.push({ kind: "BAND", band });
              }
              break;
            case "WORK_ITEM_TYPE":
              for (const workItemType of WORK_ITEM_TYPES) {
                if (!trigger.workItemTypes.includes(workItemType)) {
                  continue;
                }
                const workItemIds = calculatedItems
                  .filter(({ item }) => item.type === workItemType)
                  .map(({ item }) => item.id);
                if (workItemIds.length > 0) {
                  evidence.push({
                    kind: "WORK_ITEM_TYPE",
                    workItemType,
                    workItemIds,
                  });
                }
              }
              break;
            case "RISK_FACTOR":
              for (const factorId of RISK_FACTOR_IDS) {
                if (!trigger.factorIds.includes(factorId)) {
                  continue;
                }
                const selection = request.input.riskProfile[factorId];
                if (
                  RISK_LEVELS.indexOf(selection.level) <
                  RISK_LEVELS.indexOf(trigger.minimumLevel)
                ) {
                  continue;
                }
                const workItemIds = calculatedItems
                  .filter(({ item }) =>
                    item.applicableRiskFactorIds.includes(factorId),
                  )
                  .map(({ item }) => item.id);
                if (workItemIds.length > 0) {
                  evidence.push({
                    kind: "RISK_FACTOR",
                    factorId,
                    level: selection.level,
                    workItemIds,
                  });
                }
              }
              break;
          }
        }

        const deduplicatedEvidence = [
          ...new Map(
            evidence.map((item) => [evidenceKey(item), item] as const),
          ).entries(),
        ]
          .sort(([left], [right]) => compareStableText(left, right))
          .map(([, item]) => item);

        return {
          id: question.id,
          priority: question.priority,
          text: question.text,
          evidence: deduplicatedEvidence,
        };
      })
      .filter(({ evidence }) => evidence.length > 0)
      .sort(
        (left, right) =>
          left.priority - right.priority ||
          compareStableText(left.id, right.id),
      );

    return [
      ...new Map(
        questions.map((question) => [question.id, question] as const),
      ).values(),
    ].map(({ id, text, evidence }) => ({ id, text, evidence }));
  };

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
          ? CALCULATION_FORMULAS.normalizeTaxInclusiveQuote
          : CALCULATION_FORMULAS.normalizeTaxExclusiveQuote,
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
        formula: CALCULATION_FORMULAS.vendorDifference,
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
          formula: CALCULATION_FORMULAS.vendorVariance,
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
          formula: CALCULATION_FORMULAS.vendorQuoteRatio,
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
      normalizedQuoteExTax: money(normalizedQuoteExTax),
      differenceFromP50: money(differenceFromP50),
      differenceFromP80: money(differenceFromP80),
      varianceFromP50: varianceFromP50 === null ? null : ratio(varianceFromP50),
      varianceFromP80: varianceFromP80 === null ? null : ratio(varianceFromP80),
      quoteToP50Ratio: quoteToP50Ratio === null ? null : ratio(quoteToP50Ratio),
      quoteToP80Ratio: quoteToP80Ratio === null ? null : ratio(quoteToP80Ratio),
      band,
      questions: selectVendorQuestions(band),
    };
  }

  const driverCandidates: Array<{
    sourceId: CostDriverId;
    contribution: DecimalJs;
    source: TraceSource;
  }> = [
    {
      sourceId: "P50_LABOR_COST",
      contribution: p50Cost.laborCost,
      source: source("derived", "estimate:p50:labor-cost"),
    },
    {
      sourceId: "P50_DIRECT_COST",
      contribution: p50Cost.directCost,
      source: source("derived", "estimate:p50:direct-cost"),
    },
    {
      sourceId: "P50_OVERHEAD_COST",
      contribution: p50Cost.overheadAmount,
      source: source("derived", "estimate:p50:overhead-amount"),
    },
    {
      sourceId: "P50_WARRANTY_COST",
      contribution: p50Cost.warrantyCost,
      source: source("derived", "estimate:p50:warranty-cost"),
    },
    {
      sourceId: "P50_VENDOR_MARKUP_COST",
      contribution: p50Cost.vendorMarkupAmount,
      source: source("derived", "estimate:p50:vendor-markup-amount"),
    },
    {
      sourceId: "P50_TAX_COST",
      contribution: p50Cost.taxAmount,
      source: source("derived", "estimate:p50:tax-amount"),
    },
  ];
  const drivers: readonly EstimateDriver[] = driverCandidates
    .sort(
      (left, right) =>
        right.contribution.comparedTo(left.contribution) ||
        compareStableText(left.sourceId, right.sourceId),
    )
    .slice(0, 3)
    .map(({ sourceId, contribution, source: driverSource }) => ({
      kind: "COST",
      sourceId,
      contributionValue: money(contribution),
      unit: "TWD",
      source: driverSource,
    }));

  return {
    ok: true,
    result: {
      modelVersion: CURRENT_MODEL_VERSION,
      parameterSetId,
      parameterSetVersion: request.parameterSnapshot.version,
      baseEffortHours: effortHours(baseEffort),
      adjustedEffortHours: effortHours(adjustedEffort),
      crossCuttingEffortHours: effortHours(crossCuttingEffort),
      mostLikelyEffortHours: effortHours(mostLikelyEffort),
      optimisticEffortHours: effortHours(optimisticEffort),
      pessimisticEffortHours: effortHours(pessimisticEffort),
      p50EffortHours: effortHours(p50Effort),
      p80EffortHours: effortHours(p80Effort),
      p50PersonDays: canonical(p50PersonDays),
      p80PersonDays: canonical(p80PersonDays),
      p50PersonMonths: canonical(p50PersonMonths),
      p80PersonMonths: canonical(p80PersonMonths),
      p50EngineeringCost: money(p50Cost.deliveryCost),
      p80EngineeringCost: money(p80Cost.deliveryCost),
      p50QuoteExTax: money(p50Cost.quoteExTax),
      p80QuoteExTax: money(p80Cost.quoteExTax),
      p50QuoteIncTax: money(p50Cost.quoteIncTax),
      p80QuoteIncTax: money(p80Cost.quoteIncTax),
      complexityAggregate: {
        baseEffortHours: effortHours(baseEffort),
        complexityAdjustedEffortHours: effortHours(complexityAdjustedEffort),
        complexityAdjustmentHours: effortHours(complexityAdjustment),
        riskAdjustmentHours: effortHours(riskAdjustment),
        effectiveMultiplier: ratio(effectiveComplexityMultiplier),
      },
      costWaterfall: {
        p50: serializeCost(p50Cost),
        p80: serializeCost(p80Cost),
      },
      vendorComparison,
      drivers,
      warnings,
      calculationTrace,
    },
  };
}
