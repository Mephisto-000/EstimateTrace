export type DecimalString = string;
export type ModelVersion = string;
export type ParameterSetId = string;
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
  readonly riskProductSafetyCap: DecimalString;
}

export interface CalculationPolicy {
  readonly decimalPrecision: number;
  readonly roundingMode: "ROUND_HALF_UP";
  readonly p80ZScore: DecimalString;
}

export interface ComparisonParameters {
  readonly clearlyBelowP50Ratio: DecimalString;
}

export interface VendorQuestionParameter {
  readonly id: string;
  readonly priority: number;
  readonly text: string;
}

export interface ParameterSnapshot {
  readonly id: ParameterSetId;
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
  readonly modelVersion: ModelVersion;
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
  readonly value: DecimalString;
  readonly unit: CalculationUnit;
  readonly source: TraceSource;
}

export interface CalculationTraceNode {
  readonly id: string;
  readonly metric: string;
  readonly formulaId: string;
  readonly formula: string;
  readonly operands: readonly TraceOperand[];
  readonly result: DecimalString;
  readonly unit: CalculationUnit;
  readonly sources: readonly TraceSource[];
}

export type DriverKind = "WORK_ITEM" | "CROSS_CUTTING_PHASE";

export interface EstimateDriver {
  readonly kind: DriverKind;
  readonly sourceId: string;
  readonly contributionHours: DecimalString;
}

export type VendorComparisonBand =
  | "CLEARLY_BELOW_MODEL_RANGE"
  | "NEAR_MODEL_REFERENCE_RANGE"
  | "ABOVE_MODEL_P50"
  | "ABOVE_MODEL_P80";

export interface VendorQuestion {
  readonly id: string;
  readonly text: string;
}

export interface VendorComparison {
  readonly normalizedQuoteExTax: DecimalString;
  readonly differenceFromP50: DecimalString;
  readonly differenceFromP80: DecimalString;
  readonly varianceFromP50: DecimalString | null;
  readonly varianceFromP80: DecimalString | null;
  readonly quoteToP50Ratio: DecimalString | null;
  readonly quoteToP80Ratio: DecimalString | null;
  readonly band: VendorComparisonBand;
  readonly questions: readonly VendorQuestion[];
}

export interface EstimateResult {
  readonly modelVersion: ModelVersion;
  readonly parameterSetId: ParameterSetId;
  readonly parameterSetVersion: ParameterSetVersion;
  readonly baseEffortHours: DecimalString;
  readonly adjustedEffortHours: DecimalString;
  readonly crossCuttingEffortHours: DecimalString;
  readonly mostLikelyEffortHours: DecimalString;
  readonly optimisticEffortHours: DecimalString;
  readonly pessimisticEffortHours: DecimalString;
  readonly p50EffortHours: DecimalString;
  readonly p80EffortHours: DecimalString;
  readonly p50PersonDays: DecimalString;
  readonly p80PersonDays: DecimalString;
  readonly p50PersonMonths: DecimalString;
  readonly p80PersonMonths: DecimalString;
  readonly p50EngineeringCost: DecimalString;
  readonly p80EngineeringCost: DecimalString;
  readonly p50QuoteExTax: DecimalString;
  readonly p80QuoteExTax: DecimalString;
  readonly p50QuoteIncTax: DecimalString;
  readonly p80QuoteIncTax: DecimalString;
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
