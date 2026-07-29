import DecimalJs from "decimal.js";

import {
  MODEL_DECIMAL_PRECISION,
  MODEL_INTERMEDIATE_ROUNDING,
  MODEL_MAXIMUM_DAYS_PER_PERSON_MONTH,
  MODEL_MAXIMUM_HOURS_PER_PERSON_DAY,
  MODEL_P80_Z_SCORE,
  MODEL_PRESENTATION_ROUNDING,
  MODEL_ROUNDING_MODE,
} from "./model-definition";
import type {
  CalculationIssue,
  CalculationRequest,
  ComplexityLevel,
  CrossCuttingPhase,
  DecimalString,
  RiskFactorId,
  RiskLevel,
  VendorComparisonBand,
  WorkItemType,
} from "./types";
import {
  isCanonicalNonNegativeDecimal,
  parseParameterSetId,
} from "./value-objects";

const ValidationDecimal = DecimalJs.clone({
  precision: 80,
  rounding: DecimalJs.ROUND_HALF_UP,
  toExpNeg: -1_000_000_000,
  toExpPos: 1_000_000_000,
});

function compareStableText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export const WORK_ITEM_TYPES: readonly WorkItemType[] = [
  "UI",
  "REPORT",
  "BUSINESS_LOGIC",
  "DATABASE",
  "INTEGRATION",
  "BATCH",
  "MIGRATION",
  "AUTHORIZATION",
  "TESTING",
  "DEPLOYMENT",
  "DOCUMENTATION",
  "CUSTOM",
];

export const COMPLEXITY_LEVELS: readonly ComplexityLevel[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "VERY_HIGH",
];

export const RISK_LEVELS: readonly RiskLevel[] = [
  "LOW",
  "NOMINAL",
  "HIGH",
  "VERY_HIGH",
];

export const RISK_FACTOR_IDS: readonly RiskFactorId[] = [
  "REQUIREMENT_CLARITY",
  "LEGACY_TECHNICAL_DEBT",
  "INTEGRATION_DEPENDENCY",
  "SECURITY_COMPLIANCE",
  "DATA_MIGRATION_QUALITY",
  "SCHEDULE_COMPRESSION",
];

export const CROSS_CUTTING_PHASES: readonly CrossCuttingPhase[] = [
  "BUSINESS_ANALYSIS",
  "ARCHITECTURE_DESIGN",
  "PROJECT_MANAGEMENT",
  "QUALITY_ASSURANCE",
  "DEPLOYMENT_RELEASE",
  "DOCUMENTATION_TRAINING",
];

export const VENDOR_COMPARISON_BANDS: readonly VendorComparisonBand[] = [
  "CLEARLY_BELOW_MODEL_RANGE",
  "NEAR_MODEL_REFERENCE_RANGE",
  "ABOVE_MODEL_P50",
  "ABOVE_MODEL_P80",
];

interface DecimalRange {
  readonly minimum?: DecimalString;
  readonly minimumExclusive?: boolean;
  readonly maximum?: DecimalString;
}

function addIssue(
  issues: CalculationIssue[],
  code: CalculationIssue["code"],
  path: string,
  details: Readonly<Record<string, string>> = {},
): void {
  issues.push({ code, path, details });
}

function validateRequiredString(
  value: string,
  path: string,
  issues: CalculationIssue[],
  maximumLength = 1_000,
): void {
  if (value.trim().length === 0) {
    addIssue(issues, "REQUIRED_VALUE", path);
  } else if (value.length > maximumLength) {
    addIssue(issues, "OUT_OF_RANGE", path, {
      maximumLength: String(maximumLength),
    });
  }
}

function validateDecimal(
  value: DecimalString,
  path: string,
  issues: CalculationIssue[],
  range: DecimalRange = {},
): DecimalJs | undefined {
  if (!isCanonicalNonNegativeDecimal(value)) {
    addIssue(issues, "INVALID_DECIMAL", path, {
      expected: "canonical non-negative decimal string",
    });
    return undefined;
  }

  const parsed = new ValidationDecimal(value);
  if (!parsed.isFinite()) {
    addIssue(issues, "INVALID_DECIMAL", path, { expected: "finite decimal" });
    return undefined;
  }

  if (range.minimum !== undefined) {
    const comparison = parsed.comparedTo(range.minimum);
    const belowMinimum = range.minimumExclusive
      ? comparison <= 0
      : comparison < 0;
    if (belowMinimum) {
      addIssue(issues, "OUT_OF_RANGE", path, {
        minimum: range.minimum,
        minimumExclusive: String(range.minimumExclusive ?? false),
      });
    }
  }

  if (range.maximum !== undefined && parsed.greaterThan(range.maximum)) {
    addIssue(issues, "OUT_OF_RANGE", path, {
      maximum: range.maximum,
    });
  }

  return parsed;
}

function validateUniqueValues(
  values: readonly string[],
  path: string,
  issues: CalculationIssue[],
): void {
  const seen = new Set<string>();
  values.forEach((value, index) => {
    if (seen.has(value)) {
      addIssue(issues, "DUPLICATE_VALUE", `${path}.${index}`, { value });
    }
    seen.add(value);
  });
}

function validateParameterSet(
  request: CalculationRequest,
  issues: CalculationIssue[],
): void {
  const { parameterSnapshot: parameters } = request;
  validateRequiredString(parameters.id, "parameterSnapshot.id", issues, 128);
  if (
    parameters.id.trim().length > 0 &&
    parseParameterSetId(parameters.id) === null
  ) {
    addIssue(issues, "INVALID_PARAMETER_SET", "parameterSnapshot.id", {
      expected: "lowercase kebab-case parameter set identifier",
    });
  }
  validateRequiredString(
    parameters.version,
    "parameterSnapshot.version",
    issues,
    64,
  );

  if (
    !Number.isInteger(parameters.calculationPolicy.decimalPrecision) ||
    parameters.calculationPolicy.decimalPrecision !== MODEL_DECIMAL_PRECISION
  ) {
    addIssue(
      issues,
      "INVALID_PARAMETER_SET",
      "parameterSnapshot.calculationPolicy.decimalPrecision",
      { expected: String(MODEL_DECIMAL_PRECISION) },
    );
  }
  if (parameters.calculationPolicy.roundingMode !== MODEL_ROUNDING_MODE) {
    addIssue(
      issues,
      "INVALID_PARAMETER_SET",
      "parameterSnapshot.calculationPolicy.roundingMode",
      { supported: MODEL_ROUNDING_MODE },
    );
  }
  if (
    parameters.calculationPolicy.intermediateRounding !==
    MODEL_INTERMEDIATE_ROUNDING
  ) {
    addIssue(
      issues,
      "INVALID_PARAMETER_SET",
      "parameterSnapshot.calculationPolicy.intermediateRounding",
      { supported: MODEL_INTERMEDIATE_ROUNDING },
    );
  }
  if (
    parameters.calculationPolicy.presentationRounding !==
    MODEL_PRESENTATION_ROUNDING
  ) {
    addIssue(
      issues,
      "INVALID_PARAMETER_SET",
      "parameterSnapshot.calculationPolicy.presentationRounding",
      { supported: MODEL_PRESENTATION_ROUNDING },
    );
  }
  validateDecimal(
    parameters.calculationPolicy.p80ZScore,
    "parameterSnapshot.calculationPolicy.p80ZScore",
    issues,
    { minimum: "0" },
  );
  if (parameters.calculationPolicy.p80ZScore !== MODEL_P80_Z_SCORE) {
    addIssue(
      issues,
      "INVALID_PARAMETER_SET",
      "parameterSnapshot.calculationPolicy.p80ZScore",
      { expected: MODEL_P80_Z_SCORE },
    );
  }

  if (
    !Number.isInteger(parameters.constraints.maximumWorkItems) ||
    parameters.constraints.maximumWorkItems < 1 ||
    parameters.constraints.maximumWorkItems > 10_000
  ) {
    addIssue(
      issues,
      "INVALID_PARAMETER_SET",
      "parameterSnapshot.constraints.maximumWorkItems",
      { expected: "integer between 1 and 10000" },
    );
  }

  const issueCountBeforeConstraints = issues.length;
  const positiveConstraintPaths = [
    "maximumQuantity",
    "maximumUnitHours",
    "maximumMoney",
    "maximumCommercialRate",
    "maximumPhaseLoadingRate",
    "maximumTotalPhaseLoadingRate",
    "riskProductSafetyCap",
  ] as const;
  positiveConstraintPaths.forEach((key) => {
    validateDecimal(
      parameters.constraints[key],
      `parameterSnapshot.constraints.${key}`,
      issues,
      { minimum: "0", minimumExclusive: true },
    );
  });
  validateDecimal(
    parameters.constraints.maximumHoursPerPersonDay,
    "parameterSnapshot.constraints.maximumHoursPerPersonDay",
    issues,
    {
      minimum: "0",
      minimumExclusive: true,
      maximum: MODEL_MAXIMUM_HOURS_PER_PERSON_DAY,
    },
  );
  validateDecimal(
    parameters.constraints.maximumDaysPerPersonMonth,
    "parameterSnapshot.constraints.maximumDaysPerPersonMonth",
    issues,
    {
      minimum: "0",
      minimumExclusive: true,
      maximum: MODEL_MAXIMUM_DAYS_PER_PERSON_MONTH,
    },
  );

  validateDecimal(
    parameters.comparison.clearlyBelowP50Ratio,
    "parameterSnapshot.comparison.clearlyBelowP50Ratio",
    issues,
    { minimum: "0", minimumExclusive: true, maximum: "1" },
  );
  if (issues.length > issueCountBeforeConstraints) {
    return;
  }

  validateUniqueValues(
    parameters.workItemCatalog.map(({ code }) => code),
    "parameterSnapshot.workItemCatalog",
    issues,
  );
  WORK_ITEM_TYPES.forEach((code) => {
    if (!parameters.workItemCatalog.some((entry) => entry.code === code)) {
      addIssue(
        issues,
        "INVALID_PARAMETER_SET",
        "parameterSnapshot.workItemCatalog",
        { missing: code },
      );
    }
  });
  parameters.workItemCatalog.forEach((entry, index) => {
    validateDecimal(
      entry.defaultUnitHours,
      `parameterSnapshot.workItemCatalog.${index}.defaultUnitHours`,
      issues,
      {
        minimum: "0.25",
        maximum: parameters.constraints.maximumUnitHours,
      },
    );
  });

  validateUniqueValues(
    parameters.complexityParameters.map(({ level }) => level),
    "parameterSnapshot.complexityParameters",
    issues,
  );
  COMPLEXITY_LEVELS.forEach((level) => {
    if (
      !parameters.complexityParameters.some(
        (parameter) => parameter.level === level,
      )
    ) {
      addIssue(
        issues,
        "INVALID_PARAMETER_SET",
        "parameterSnapshot.complexityParameters",
        { missing: level },
      );
    }
  });
  parameters.complexityParameters.forEach((parameter, index) => {
    validateDecimal(
      parameter.multiplier,
      `parameterSnapshot.complexityParameters.${index}.multiplier`,
      issues,
      { minimum: "0", minimumExclusive: true },
    );
  });

  validateUniqueValues(
    parameters.riskFactors.map(({ id }) => id),
    "parameterSnapshot.riskFactors",
    issues,
  );
  RISK_FACTOR_IDS.forEach((factorId) => {
    if (!parameters.riskFactors.some(({ id }) => id === factorId)) {
      addIssue(
        issues,
        "INVALID_PARAMETER_SET",
        "parameterSnapshot.riskFactors",
        { missing: factorId },
      );
    }
  });
  parameters.riskFactors.forEach((factor, factorIndex) => {
    RISK_LEVELS.forEach((level) => {
      validateDecimal(
        factor.multipliers[level],
        `parameterSnapshot.riskFactors.${factorIndex}.multipliers.${level}`,
        issues,
        { minimum: "0.8", maximum: "1.5" },
      );
    });
  });

  validateUniqueValues(
    parameters.phaseLoadingParameters.map(({ phase }) => phase),
    "parameterSnapshot.phaseLoadingParameters",
    issues,
  );
  CROSS_CUTTING_PHASES.forEach((phase) => {
    if (
      !parameters.phaseLoadingParameters.some(
        (parameter) => parameter.phase === phase,
      )
    ) {
      addIssue(
        issues,
        "INVALID_PARAMETER_SET",
        "parameterSnapshot.phaseLoadingParameters",
        { missing: phase },
      );
    }
  });
  parameters.phaseLoadingParameters.forEach((parameter, index) => {
    validateDecimal(
      parameter.defaultRate,
      `parameterSnapshot.phaseLoadingParameters.${index}.defaultRate`,
      issues,
      {
        minimum: "0",
        maximum: parameters.constraints.maximumPhaseLoadingRate,
      },
    );
  });

  validateUniqueValues(
    parameters.uncertaintyParameters.map(({ level }) => level),
    "parameterSnapshot.uncertaintyParameters",
    issues,
  );
  COMPLEXITY_LEVELS.forEach((level) => {
    if (
      !parameters.uncertaintyParameters.some(
        (parameter) => parameter.level === level,
      )
    ) {
      addIssue(
        issues,
        "INVALID_PARAMETER_SET",
        "parameterSnapshot.uncertaintyParameters",
        { missing: level },
      );
    }
  });
  parameters.uncertaintyParameters.forEach((parameter, index) => {
    validateDecimal(
      parameter.downsideRate,
      `parameterSnapshot.uncertaintyParameters.${index}.downsideRate`,
      issues,
      { minimum: "0", maximum: "0.5" },
    );
    validateDecimal(
      parameter.upsideRate,
      `parameterSnapshot.uncertaintyParameters.${index}.upsideRate`,
      issues,
      { minimum: "0", maximum: "2" },
    );
  });

  validateUniqueValues(
    parameters.vendorQuestions.map(({ id }) => id),
    "parameterSnapshot.vendorQuestions",
    issues,
  );
  parameters.vendorQuestions.forEach((question, index) => {
    const questionPath = `parameterSnapshot.vendorQuestions.${index}`;
    validateRequiredString(question.id, `${questionPath}.id`, issues, 128);
    validateRequiredString(question.text, `${questionPath}.text`, issues);
    if (!Number.isSafeInteger(question.priority)) {
      addIssue(issues, "INVALID_PARAMETER_SET", `${questionPath}.priority`, {
        expected: "safe integer",
      });
    }
    if (question.triggers.length === 0) {
      addIssue(issues, "INVALID_PARAMETER_SET", `${questionPath}.triggers`, {
        expected: "at least one evidence trigger",
      });
    }
    question.triggers.forEach((trigger, triggerIndex) => {
      const triggerPath = `${questionPath}.triggers.${triggerIndex}`;
      switch (trigger.kind) {
        case "BAND":
          if (trigger.bands.length === 0) {
            addIssue(issues, "INVALID_PARAMETER_SET", `${triggerPath}.bands`, {
              expected: "at least one comparison band",
            });
          }
          trigger.bands.forEach((band, bandIndex) => {
            if (!VENDOR_COMPARISON_BANDS.includes(band)) {
              addIssue(
                issues,
                "UNKNOWN_VALUE",
                `${triggerPath}.bands.${bandIndex}`,
                { actual: band },
              );
            }
          });
          break;
        case "WORK_ITEM_TYPE":
          if (trigger.workItemTypes.length === 0) {
            addIssue(
              issues,
              "INVALID_PARAMETER_SET",
              `${triggerPath}.workItemTypes`,
              { expected: "at least one work item type" },
            );
          }
          trigger.workItemTypes.forEach((workItemType, workItemTypeIndex) => {
            if (!WORK_ITEM_TYPES.includes(workItemType)) {
              addIssue(
                issues,
                "UNKNOWN_VALUE",
                `${triggerPath}.workItemTypes.${workItemTypeIndex}`,
                { actual: workItemType },
              );
            }
          });
          break;
        case "RISK_FACTOR":
          if (trigger.factorIds.length === 0) {
            addIssue(
              issues,
              "INVALID_PARAMETER_SET",
              `${triggerPath}.factorIds`,
              { expected: "at least one risk factor" },
            );
          }
          trigger.factorIds.forEach((factorId, factorIndex) => {
            if (!RISK_FACTOR_IDS.includes(factorId)) {
              addIssue(
                issues,
                "UNKNOWN_VALUE",
                `${triggerPath}.factorIds.${factorIndex}`,
                { actual: factorId },
              );
            }
          });
          if (!RISK_LEVELS.includes(trigger.minimumLevel)) {
            addIssue(issues, "UNKNOWN_VALUE", `${triggerPath}.minimumLevel`, {
              actual: trigger.minimumLevel,
            });
          }
          break;
      }
    });
  });
}

function validateInput(
  request: CalculationRequest,
  issues: CalculationIssue[],
): void {
  const { input, parameterSnapshot: parameters } = request;
  if (input.workItems.length === 0) {
    addIssue(issues, "REQUIRED_VALUE", "input.workItems");
  }
  if (input.workItems.length > parameters.constraints.maximumWorkItems) {
    addIssue(issues, "TOO_MANY_WORK_ITEMS", "input.workItems", {
      maximum: String(parameters.constraints.maximumWorkItems),
    });
  }

  validateUniqueValues(
    input.workItems.map(({ id }) => id),
    "input.workItems",
    issues,
  );
  input.workItems.forEach((item, index) => {
    const path = `input.workItems.${index}`;
    validateRequiredString(item.id, `${path}.id`, issues, 128);
    validateRequiredString(item.title, `${path}.title`, issues, 256);
    validateRequiredString(item.unit, `${path}.unit`, issues, 64);
    if (!WORK_ITEM_TYPES.includes(item.type)) {
      addIssue(issues, "UNKNOWN_VALUE", `${path}.type`, {
        actual: item.type,
      });
    }
    if (!COMPLEXITY_LEVELS.includes(item.complexity)) {
      addIssue(issues, "UNKNOWN_VALUE", `${path}.complexity`, {
        actual: item.complexity,
      });
    }
    validateDecimal(item.quantity, `${path}.quantity`, issues, {
      minimum: "0",
      minimumExclusive: true,
      maximum: parameters.constraints.maximumQuantity,
    });
    validateDecimal(item.unitHours, `${path}.unitHours`, issues, {
      minimum: "0.25",
      maximum: parameters.constraints.maximumUnitHours,
    });

    validateUniqueValues(
      item.applicableRiskFactorIds,
      `${path}.applicableRiskFactorIds`,
      issues,
    );
    item.applicableRiskFactorIds.forEach((factorId, factorIndex) => {
      if (!RISK_FACTOR_IDS.includes(factorId)) {
        addIssue(
          issues,
          "UNKNOWN_VALUE",
          `${path}.applicableRiskFactorIds.${factorIndex}`,
          { actual: factorId },
        );
      }
    });

    validateUniqueValues(
      item.includedCrossCuttingPhases,
      `${path}.includedCrossCuttingPhases`,
      issues,
    );
    item.includedCrossCuttingPhases.forEach((phase, phaseIndex) => {
      if (!CROSS_CUTTING_PHASES.includes(phase)) {
        addIssue(
          issues,
          "UNKNOWN_VALUE",
          `${path}.includedCrossCuttingPhases.${phaseIndex}`,
          { actual: phase },
        );
      }
    });
  });

  const profileKeys = Object.keys(input.riskProfile);
  validateUniqueValues(profileKeys, "input.riskProfile", issues);
  RISK_FACTOR_IDS.forEach((factorId) => {
    if (!Object.hasOwn(input.riskProfile, factorId)) {
      addIssue(issues, "REQUIRED_VALUE", `input.riskProfile.${factorId}`);
      return;
    }
    const selection = input.riskProfile[factorId];
    if (!RISK_LEVELS.includes(selection.level)) {
      addIssue(issues, "UNKNOWN_VALUE", `input.riskProfile.${factorId}.level`, {
        actual: selection.level,
      });
    }
  });
  profileKeys.forEach((factorId) => {
    if (!RISK_FACTOR_IDS.includes(factorId as RiskFactorId)) {
      addIssue(issues, "UNKNOWN_VALUE", `input.riskProfile.${factorId}`);
    }
  });

  let totalPhaseLoading = new ValidationDecimal(0);
  CROSS_CUTTING_PHASES.forEach((phase) => {
    if (!Object.hasOwn(input.phaseLoading, phase)) {
      addIssue(issues, "REQUIRED_VALUE", `input.phaseLoading.${phase}`);
      return;
    }
    const parsed = validateDecimal(
      input.phaseLoading[phase],
      `input.phaseLoading.${phase}`,
      issues,
      {
        minimum: "0",
        maximum: parameters.constraints.maximumPhaseLoadingRate,
      },
    );
    if (parsed !== undefined) {
      totalPhaseLoading = totalPhaseLoading.plus(parsed);
    }
  });
  Object.keys(input.phaseLoading).forEach((phase) => {
    if (!CROSS_CUTTING_PHASES.includes(phase as CrossCuttingPhase)) {
      addIssue(issues, "UNKNOWN_VALUE", `input.phaseLoading.${phase}`);
    }
  });
  if (
    totalPhaseLoading.greaterThan(
      parameters.constraints.maximumTotalPhaseLoadingRate,
    )
  ) {
    addIssue(issues, "OUT_OF_RANGE", "input.phaseLoading", {
      maximumTotal: parameters.constraints.maximumTotalPhaseLoadingRate,
    });
  }

  validateDecimal(
    input.fixedEffortHours ?? "0",
    "input.fixedEffortHours",
    issues,
    { minimum: "0", maximum: parameters.constraints.maximumUnitHours },
  );
  validateDecimal(
    input.uncertainty.downsideRate,
    "input.uncertainty.downsideRate",
    issues,
    { minimum: "0", maximum: "0.5" },
  );
  validateDecimal(
    input.uncertainty.upsideRate,
    "input.uncertainty.upsideRate",
    issues,
    { minimum: "0", maximum: "2" },
  );

  const { commercialTerms } = input;
  const moneyFields = ["hourlyRate", "directCost", "warrantyCost"] as const;
  moneyFields.forEach((field) => {
    validateDecimal(
      commercialTerms[field],
      `input.commercialTerms.${field}`,
      issues,
      { minimum: "0", maximum: parameters.constraints.maximumMoney },
    );
  });
  const rateFields = ["overheadRate", "vendorMarkupRate", "taxRate"] as const;
  rateFields.forEach((field) => {
    validateDecimal(
      commercialTerms[field],
      `input.commercialTerms.${field}`,
      issues,
      {
        minimum: "0",
        maximum: parameters.constraints.maximumCommercialRate,
      },
    );
  });
  validateDecimal(
    commercialTerms.hoursPerPersonDay,
    "input.commercialTerms.hoursPerPersonDay",
    issues,
    {
      minimum: "0",
      minimumExclusive: true,
      maximum: parameters.constraints.maximumHoursPerPersonDay,
    },
  );
  validateDecimal(
    commercialTerms.daysPerPersonMonth,
    "input.commercialTerms.daysPerPersonMonth",
    issues,
    {
      minimum: "0",
      minimumExclusive: true,
      maximum: parameters.constraints.maximumDaysPerPersonMonth,
    },
  );

  if (input.vendorQuote !== null) {
    validateDecimal(
      input.vendorQuote.amount,
      "input.vendorQuote.amount",
      issues,
      { minimum: "0", maximum: parameters.constraints.maximumMoney },
    );
    if (
      input.vendorQuote.taxBasis !== "TAX_INCLUSIVE" &&
      input.vendorQuote.taxBasis !== "TAX_EXCLUSIVE"
    ) {
      addIssue(issues, "UNKNOWN_VALUE", "input.vendorQuote.taxBasis", {
        actual: input.vendorQuote.taxBasis,
      });
    }
  }
}

export function validateCalculationRequest(
  request: CalculationRequest,
): readonly CalculationIssue[] {
  const issues: CalculationIssue[] = [];
  validateParameterSet(request, issues);
  if (issues.length === 0) {
    validateInput(request, issues);
  }

  return issues.sort(
    (left, right) =>
      compareStableText(left.path, right.path) ||
      compareStableText(left.code, right.code),
  );
}
