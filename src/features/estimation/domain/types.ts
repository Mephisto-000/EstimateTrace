/**
 * Editable and external decimal input. It is intentionally unbranded because a
 * form can temporarily contain an incomplete value such as `1.`. Validation
 * must promote it to a canonical value before calculation or persistence.
 */
export type DecimalString = string;

declare const canonicalDecimalBrand: unique symbol;
declare const canonicalNonNegativeDecimalBrand: unique symbol;
declare const effortHoursBrand: unique symbol;
declare const moneyBrand: unique symbol;
declare const ratioBrand: unique symbol;
declare const quantityBrand: unique symbol;
declare const modelVersionBrand: unique symbol;
declare const parameterSetIdBrand: unique symbol;

export type CanonicalDecimalString = string & {
  readonly [canonicalDecimalBrand]: true;
};
export type CanonicalNonNegativeDecimalString = CanonicalDecimalString & {
  readonly [canonicalNonNegativeDecimalBrand]: true;
};
export type EffortHours = CanonicalDecimalString & {
  readonly [effortHoursBrand]: true;
};
export type Money = CanonicalDecimalString & {
  readonly [moneyBrand]: true;
};
export type Ratio = CanonicalDecimalString & {
  readonly [ratioBrand]: true;
};
export type Quantity = CanonicalNonNegativeDecimalString & {
  readonly [quantityBrand]: true;
};
export type ModelVersion = string & {
  readonly [modelVersionBrand]: true;
};
export type ParameterSetId = string & {
  readonly [parameterSetIdBrand]: true;
};
export type ParameterSetVersion = string;

export type WorkItemType =
  | "UI"
  | "REPORT"
  | "BUSINESS_LOGIC"
  | "DATABASE"
  | "INTEGRATION"
  | "BATCH"
  | "MIGRATION"
  | "AUTHORIZATION"
  | "TESTING"
  | "DEPLOYMENT"
  | "DOCUMENTATION"
  | "CUSTOM";

export type ComplexityLevel = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

export type RiskLevel = "LOW" | "NOMINAL" | "HIGH" | "VERY_HIGH";

export type RiskFactorId =
  | "REQUIREMENT_CLARITY"
  | "LEGACY_TECHNICAL_DEBT"
  | "INTEGRATION_DEPENDENCY"
  | "SECURITY_COMPLIANCE"
  | "DATA_MIGRATION_QUALITY"
  | "SCHEDULE_COMPRESSION";

export type CrossCuttingPhase =
  | "BUSINESS_ANALYSIS"
  | "ARCHITECTURE_DESIGN"
  | "PROJECT_MANAGEMENT"
  | "QUALITY_ASSURANCE"
  | "DEPLOYMENT_RELEASE"
  | "DOCUMENTATION_TRAINING";

export interface RiskSelection {
  readonly level: RiskLevel;
  readonly rationale: string;
}

export type RiskProfile = Readonly<Record<RiskFactorId, RiskSelection>>;

export interface WorkItemInput {
  readonly id: string;
  readonly type: WorkItemType;
  readonly title: string;
  readonly description: string;
  readonly quantity: DecimalString;
  readonly unit: string;
  readonly unitHours: DecimalString;
  readonly complexity: ComplexityLevel;
  readonly applicableRiskFactorIds: readonly RiskFactorId[];
  readonly includedCrossCuttingPhases: readonly CrossCuttingPhase[];
  readonly assumptions: readonly string[];
}

export type PhaseLoading = Readonly<Record<CrossCuttingPhase, DecimalString>>;

export interface UncertaintyProfile {
  readonly downsideRate: DecimalString;
  readonly upsideRate: DecimalString;
}

export interface CommercialTerms {
  readonly hourlyRate: DecimalString;
  readonly directCost: DecimalString;
  readonly overheadRate: DecimalString;
  readonly warrantyCost: DecimalString;
  readonly vendorMarkupRate: DecimalString;
  readonly taxRate: DecimalString;
  readonly hoursPerPersonDay: DecimalString;
  readonly daysPerPersonMonth: DecimalString;
}

export type QuoteTaxBasis = "TAX_INCLUSIVE" | "TAX_EXCLUSIVE";

export interface VendorQuote {
  readonly amount: DecimalString;
  readonly taxBasis: QuoteTaxBasis;
  readonly note?: string;
  readonly quoteDate?: string;
}

export interface EstimateInput {
  readonly workItems: readonly WorkItemInput[];
  readonly riskProfile: RiskProfile;
  readonly phaseLoading: PhaseLoading;
  readonly fixedEffortHours?: DecimalString;
  readonly uncertainty: UncertaintyProfile;
  readonly commercialTerms: CommercialTerms;
  readonly vendorQuote: VendorQuote | null;
}

export interface WorkItemCatalogEntry {
  readonly code: WorkItemType;
  readonly displayName: string;
  readonly description: string;
  readonly defaultUnitHours: DecimalString;
  readonly unit: string;
  readonly includedActivities: readonly string[];
  readonly sourceNote: string;
}

export interface ComplexityParameter {
  readonly level: ComplexityLevel;
  readonly displayName: string;
  readonly multiplier: DecimalString;
  readonly description: string;
}

export interface RiskFactorParameter {
  readonly id: RiskFactorId;
  readonly displayName: string;
  readonly description: string;
  readonly multipliers: Readonly<Record<RiskLevel, DecimalString>>;
}

export interface PhaseLoadingParameter {
  readonly phase: CrossCuttingPhase;
  readonly displayName: string;
  readonly defaultRate: DecimalString;
  readonly description: string;
}

export interface UncertaintyParameter {
  readonly level: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
  readonly downsideRate: DecimalString;
  readonly upsideRate: DecimalString;
  readonly description: string;
}

export interface ParameterConstraints {
  readonly maximumWorkItems: number;
  readonly maximumQuantity: DecimalString;
  readonly maximumUnitHours: DecimalString;
  readonly maximumMoney: DecimalString;
  readonly maximumCommercialRate: DecimalString;
  readonly maximumPhaseLoadingRate: DecimalString;
  readonly maximumTotalPhaseLoadingRate: DecimalString;
  readonly maximumHoursPerPersonDay: DecimalString;
  readonly maximumDaysPerPersonMonth: DecimalString;
  readonly riskProductSafetyCap: DecimalString;
}

export interface CalculationPolicy {
  readonly decimalPrecision: number;
  readonly roundingMode: "ROUND_HALF_UP";
  readonly intermediateRounding: "NONE";
  readonly presentationRounding: "PRESENTATION_ONLY";
  readonly p80ZScore: DecimalString;
}

export interface ComparisonParameters {
  readonly clearlyBelowP50Ratio: DecimalString;
}

export type VendorComparisonBand =
  | "CLEARLY_BELOW_MODEL_RANGE"
  | "NEAR_MODEL_REFERENCE_RANGE"
  | "ABOVE_MODEL_P50"
  | "ABOVE_MODEL_P80";

export type VendorQuestionTrigger =
  | {
      readonly kind: "BAND";
      readonly bands: readonly VendorComparisonBand[];
    }
  | {
      readonly kind: "WORK_ITEM_TYPE";
      readonly workItemTypes: readonly WorkItemType[];
    }
  | {
      readonly kind: "RISK_FACTOR";
      readonly factorIds: readonly RiskFactorId[];
      readonly minimumLevel: RiskLevel;
    };

export interface VendorQuestionParameter {
  readonly id: string;
  readonly priority: number;
  readonly text: string;
  readonly triggers: readonly VendorQuestionTrigger[];
}

export interface ParameterSnapshot {
  /**
   * Raw snapshots are untrusted at this boundary. The calculator promotes this
   * value to ParameterSetId only after validation.
   */
  readonly id: string;
  readonly version: ParameterSetVersion;
  readonly displayName: string;
  readonly description: string;
  readonly workItemCatalog: readonly WorkItemCatalogEntry[];
  readonly complexityParameters: readonly ComplexityParameter[];
  readonly riskFactors: readonly RiskFactorParameter[];
  readonly phaseLoadingParameters: readonly PhaseLoadingParameter[];
  readonly uncertaintyParameters: readonly UncertaintyParameter[];
  readonly comparison: ComparisonParameters;
  readonly calculationPolicy: CalculationPolicy;
  readonly constraints: ParameterConstraints;
  readonly vendorQuestions: readonly VendorQuestionParameter[];
  readonly sourceNotes: readonly string[];
}

export interface CalculationRequest {
  /** Raw boundary value; promoted to ModelVersion after validation. */
  readonly modelVersion: string;
  readonly parameterSnapshot: ParameterSnapshot;
  readonly input: EstimateInput;
}

export type CalculationIssueCode =
  | "UNSUPPORTED_MODEL_VERSION"
  | "INVALID_PARAMETER_SET"
  | "INVALID_DECIMAL"
  | "OUT_OF_RANGE"
  | "REQUIRED_VALUE"
  | "DUPLICATE_VALUE"
  | "UNKNOWN_VALUE"
  | "TOO_MANY_WORK_ITEMS";

export interface CalculationIssue {
  readonly code: CalculationIssueCode;
  readonly path: string;
  readonly details: Readonly<Record<string, string>>;
}

export type CalculationWarningCode = "RISK_PRODUCT_SAFETY_CAP_EXCEEDED";

export interface CalculationWarning {
  readonly code: CalculationWarningCode;
  readonly path: string;
  readonly details: Readonly<Record<string, string>>;
}

export type CalculationUnit =
  | "person-hour"
  | "person-day"
  | "person-month"
  | "TWD"
  | "TWD/person-hour"
  | "person-hour/person-day"
  | "person-hour/person-month"
  | "ratio"
  | "dimensionless";

export type TraceSourceKind =
  | "input"
  | "work-item"
  | "risk-factor"
  | "phase-loading"
  | "commercial-term"
  | "parameter"
  | "derived";

export interface TraceSource {
  readonly kind: TraceSourceKind;
  readonly path: string;
  readonly id?: string;
}

export interface TraceOperand {
  readonly name: string;
  readonly value: CanonicalDecimalString;
  readonly unit: CalculationUnit;
  readonly source: TraceSource;
}

export interface CalculationTraceNode {
  readonly id: string;
  readonly metric: string;
  readonly formulaId: string;
  /**
   * Stable snapshot text retained for export compatibility. Presentation
   * resolves it to source-controlled LaTeX; the engine never evaluates it.
   */
  readonly formula: string;
  readonly operands: readonly TraceOperand[];
  readonly result: CanonicalDecimalString;
  readonly unit: CalculationUnit;
  readonly sources: readonly TraceSource[];
  readonly precisionPolicy: CalculationPrecisionPolicy;
}

export interface CalculationPrecisionPolicy {
  readonly decimalPrecision: number;
  readonly roundingMode: "ROUND_HALF_UP";
  readonly intermediateRounding: "NONE";
  readonly presentationRounding: "PRESENTATION_ONLY";
}

export type CostDriverId =
  | "P50_LABOR_COST"
  | "P50_DIRECT_COST"
  | "P50_OVERHEAD_COST"
  | "P50_WARRANTY_COST"
  | "P50_VENDOR_MARKUP_COST"
  | "P50_TAX_COST";

export type DriverKind = "COST";

export interface EstimateDriver {
  readonly kind: DriverKind;
  readonly sourceId: CostDriverId;
  readonly contributionValue: Money;
  readonly unit: "TWD";
  readonly source: TraceSource;
}

export type VendorQuestionEvidence =
  | {
      readonly kind: "BAND";
      readonly band: VendorComparisonBand;
    }
  | {
      readonly kind: "WORK_ITEM_TYPE";
      readonly workItemType: WorkItemType;
      readonly workItemIds: readonly string[];
    }
  | {
      readonly kind: "RISK_FACTOR";
      readonly factorId: RiskFactorId;
      readonly level: RiskLevel;
      readonly workItemIds: readonly string[];
    };

export interface VendorQuestion {
  readonly id: string;
  readonly text: string;
  readonly evidence: readonly VendorQuestionEvidence[];
}

export interface VendorComparison {
  readonly normalizedQuoteExTax: Money;
  readonly differenceFromP50: Money;
  readonly differenceFromP80: Money;
  readonly varianceFromP50: Ratio | null;
  readonly varianceFromP80: Ratio | null;
  readonly quoteToP50Ratio: Ratio | null;
  readonly quoteToP80Ratio: Ratio | null;
  readonly band: VendorComparisonBand;
  readonly questions: readonly VendorQuestion[];
}

export interface ComplexityAggregate {
  readonly baseEffortHours: EffortHours;
  readonly complexityAdjustedEffortHours: EffortHours;
  readonly complexityAdjustmentHours: EffortHours;
  readonly riskAdjustmentHours: EffortHours;
  readonly effectiveMultiplier: Ratio;
}

export interface CostWaterfall {
  readonly laborCost: Money;
  readonly directCost: Money;
  readonly deliveryCost: Money;
  readonly overheadAmount: Money;
  readonly costAfterOverhead: Money;
  readonly warrantyCost: Money;
  readonly fullCost: Money;
  readonly vendorMarkupAmount: Money;
  readonly quoteExTax: Money;
  readonly taxAmount: Money;
  readonly quoteIncTax: Money;
}

export interface CostWaterfalls {
  readonly p50: CostWaterfall;
  readonly p80: CostWaterfall;
}

export interface EstimateResult {
  readonly modelVersion: ModelVersion;
  readonly parameterSetId: ParameterSetId;
  readonly parameterSetVersion: ParameterSetVersion;
  readonly baseEffortHours: EffortHours;
  readonly adjustedEffortHours: EffortHours;
  readonly crossCuttingEffortHours: EffortHours;
  readonly mostLikelyEffortHours: EffortHours;
  readonly optimisticEffortHours: EffortHours;
  readonly pessimisticEffortHours: EffortHours;
  readonly p50EffortHours: EffortHours;
  readonly p80EffortHours: EffortHours;
  readonly p50PersonDays: DecimalString;
  readonly p80PersonDays: DecimalString;
  readonly p50PersonMonths: DecimalString;
  readonly p80PersonMonths: DecimalString;
  readonly p50EngineeringCost: Money;
  readonly p80EngineeringCost: Money;
  readonly p50QuoteExTax: Money;
  readonly p80QuoteExTax: Money;
  readonly p50QuoteIncTax: Money;
  readonly p80QuoteIncTax: Money;
  readonly complexityAggregate: ComplexityAggregate;
  readonly costWaterfall: CostWaterfalls;
  readonly vendorComparison: VendorComparison | null;
  readonly drivers: readonly EstimateDriver[];
  readonly warnings: readonly CalculationWarning[];
  readonly calculationTrace: readonly CalculationTraceNode[];
}

export type CalculationOutcome =
  | {
      readonly ok: true;
      readonly result: EstimateResult;
    }
  | {
      readonly ok: false;
      readonly issues: readonly CalculationIssue[];
    };
