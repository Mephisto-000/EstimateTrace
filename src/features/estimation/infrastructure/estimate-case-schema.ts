import { z } from "zod";

import type { EstimateCaseDocument } from "@/features/estimation/application/estimate-case";
import {
  CURRENT_MODEL_VERSION,
  isCanonicalNonNegativeDecimal,
} from "@/features/estimation/domain";

const decimalStringSchema = z
  .string()
  .refine(
    (value) => isCanonicalNonNegativeDecimal(value),
    "必須是 canonical non-negative decimal string",
  );

const workItemTypeSchema = z.enum([
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
]);

const complexityLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH", "VERY_HIGH"]);
const riskLevelSchema = z.enum(["LOW", "NOMINAL", "HIGH", "VERY_HIGH"]);
const riskFactorIdSchema = z.enum([
  "REQUIREMENT_CLARITY",
  "LEGACY_TECHNICAL_DEBT",
  "INTEGRATION_DEPENDENCY",
  "SECURITY_COMPLIANCE",
  "DATA_MIGRATION_QUALITY",
  "SCHEDULE_COMPRESSION",
]);
const crossCuttingPhaseSchema = z.enum([
  "BUSINESS_ANALYSIS",
  "ARCHITECTURE_DESIGN",
  "PROJECT_MANAGEMENT",
  "QUALITY_ASSURANCE",
  "DEPLOYMENT_RELEASE",
  "DOCUMENTATION_TRAINING",
]);
const vendorComparisonBandSchema = z.enum([
  "CLEARLY_BELOW_MODEL_RANGE",
  "NEAR_MODEL_REFERENCE_RANGE",
  "ABOVE_MODEL_P50",
  "ABOVE_MODEL_P80",
]);
const vendorQuestionTriggerSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("BAND"),
      bands: z.array(vendorComparisonBandSchema).min(1),
    })
    .strict(),
  z
    .object({
      kind: z.literal("WORK_ITEM_TYPE"),
      workItemTypes: z.array(workItemTypeSchema).min(1),
    })
    .strict(),
  z
    .object({
      kind: z.literal("RISK_FACTOR"),
      factorIds: z.array(riskFactorIdSchema).min(1),
      minimumLevel: riskLevelSchema,
    })
    .strict(),
]);

const riskSelectionSchema = z
  .object({
    level: riskLevelSchema,
    rationale: z.string().max(1000),
  })
  .strict();

const riskProfileSchema = z
  .object({
    REQUIREMENT_CLARITY: riskSelectionSchema,
    LEGACY_TECHNICAL_DEBT: riskSelectionSchema,
    INTEGRATION_DEPENDENCY: riskSelectionSchema,
    SECURITY_COMPLIANCE: riskSelectionSchema,
    DATA_MIGRATION_QUALITY: riskSelectionSchema,
    SCHEDULE_COMPRESSION: riskSelectionSchema,
  })
  .strict();

const workItemSchema = z
  .object({
    id: z.uuid(),
    type: workItemTypeSchema,
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(1000),
    quantity: decimalStringSchema,
    unit: z.string().min(1).max(50),
    unitHours: decimalStringSchema,
    complexity: complexityLevelSchema,
    applicableRiskFactorIds: z.array(riskFactorIdSchema).max(6),
    includedCrossCuttingPhases: z.array(crossCuttingPhaseSchema).max(6),
    assumptions: z.array(z.string().min(1).max(500)).max(20),
  })
  .strict();

const phaseLoadingSchema = z
  .object({
    BUSINESS_ANALYSIS: decimalStringSchema,
    ARCHITECTURE_DESIGN: decimalStringSchema,
    PROJECT_MANAGEMENT: decimalStringSchema,
    QUALITY_ASSURANCE: decimalStringSchema,
    DEPLOYMENT_RELEASE: decimalStringSchema,
    DOCUMENTATION_TRAINING: decimalStringSchema,
  })
  .strict();

const commercialTermsSchema = z
  .object({
    hourlyRate: decimalStringSchema,
    directCost: decimalStringSchema,
    overheadRate: decimalStringSchema,
    warrantyCost: decimalStringSchema,
    vendorMarkupRate: decimalStringSchema,
    taxRate: decimalStringSchema,
    hoursPerPersonDay: decimalStringSchema,
    daysPerPersonMonth: decimalStringSchema,
  })
  .strict();

const vendorQuoteSchema = z
  .object({
    amount: decimalStringSchema,
    taxBasis: z.enum(["TAX_INCLUSIVE", "TAX_EXCLUSIVE"]),
    note: z.string().max(1000).optional(),
    quoteDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  })
  .strict();

const estimateInputSchema = z
  .object({
    workItems: z.array(workItemSchema).max(500),
    riskProfile: riskProfileSchema,
    phaseLoading: phaseLoadingSchema,
    fixedEffortHours: decimalStringSchema.optional(),
    uncertainty: z
      .object({
        downsideRate: decimalStringSchema,
        upsideRate: decimalStringSchema,
      })
      .strict(),
    commercialTerms: commercialTermsSchema,
    vendorQuote: vendorQuoteSchema.nullable(),
  })
  .strict();

const workItemCatalogEntrySchema = z
  .object({
    code: workItemTypeSchema,
    displayName: z.string().min(1),
    description: z.string().min(1),
    defaultUnitHours: decimalStringSchema,
    unit: z.string().min(1),
    includedActivities: z.array(z.string()),
    sourceNote: z.string().min(1),
  })
  .strict();

const parameterSnapshotSchema = z
  .object({
    id: z.string().min(1),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    displayName: z.string().min(1),
    description: z.string().min(1),
    workItemCatalog: z.array(workItemCatalogEntrySchema).min(1),
    complexityParameters: z
      .array(
        z
          .object({
            level: complexityLevelSchema,
            displayName: z.string().min(1),
            multiplier: decimalStringSchema,
            description: z.string().min(1),
          })
          .strict(),
      )
      .min(1),
    riskFactors: z
      .array(
        z
          .object({
            id: riskFactorIdSchema,
            displayName: z.string().min(1),
            description: z.string().min(1),
            multipliers: z
              .object({
                LOW: decimalStringSchema,
                NOMINAL: decimalStringSchema,
                HIGH: decimalStringSchema,
                VERY_HIGH: decimalStringSchema,
              })
              .strict(),
          })
          .strict(),
      )
      .min(1),
    phaseLoadingParameters: z
      .array(
        z
          .object({
            phase: crossCuttingPhaseSchema,
            displayName: z.string().min(1),
            defaultRate: decimalStringSchema,
            description: z.string().min(1),
          })
          .strict(),
      )
      .min(1),
    uncertaintyParameters: z
      .array(
        z
          .object({
            level: z.enum(["LOW", "MEDIUM", "HIGH", "VERY_HIGH"]),
            downsideRate: decimalStringSchema,
            upsideRate: decimalStringSchema,
            description: z.string().min(1),
          })
          .strict(),
      )
      .min(1),
    comparison: z
      .object({
        clearlyBelowP50Ratio: decimalStringSchema,
      })
      .strict(),
    calculationPolicy: z
      .object({
        decimalPrecision: z.number().int().min(16).max(100),
        roundingMode: z.literal("ROUND_HALF_UP"),
        intermediateRounding: z.literal("NONE"),
        presentationRounding: z.literal("PRESENTATION_ONLY"),
        p80ZScore: decimalStringSchema,
      })
      .strict(),
    constraints: z
      .object({
        maximumWorkItems: z.number().int().positive(),
        maximumQuantity: decimalStringSchema,
        maximumUnitHours: decimalStringSchema,
        maximumMoney: decimalStringSchema,
        maximumCommercialRate: decimalStringSchema,
        maximumPhaseLoadingRate: decimalStringSchema,
        maximumTotalPhaseLoadingRate: decimalStringSchema,
        maximumHoursPerPersonDay: decimalStringSchema,
        maximumDaysPerPersonMonth: decimalStringSchema,
        riskProductSafetyCap: decimalStringSchema,
      })
      .strict(),
    vendorQuestions: z.array(
      z
        .object({
          id: z.string().min(1),
          priority: z.number().int(),
          text: z.string().min(1),
          triggers: z.array(vendorQuestionTriggerSchema).min(1),
        })
        .strict(),
    ),
    sourceNotes: z.array(z.string().min(1)).min(1),
  })
  .strict();

export const estimateCaseSchema = z
  .object({
    id: z.uuid(),
    schemaVersion: z.literal("1.0.0"),
    modelVersion: z
      .literal("bottom-up-1.0.0")
      .transform(() => CURRENT_MODEL_VERSION),
    name: z
      .string()
      .min(1)
      .max(200)
      .refine((value) => value.trim().length > 0, "不得只有空白"),
    description: z
      .string()
      .min(1)
      .max(1000)
      .refine((value) => value.trim().length > 0, "不得只有空白"),
    currency: z.literal("TWD"),
    input: estimateInputSchema,
    parameterSnapshot: parameterSnapshotSchema,
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
  })
  .strict();

export function safeParseEstimateCase(value: unknown) {
  return estimateCaseSchema.safeParse(value);
}

export function parseEstimateCase(value: unknown): EstimateCaseDocument {
  return estimateCaseSchema.parse(value) as EstimateCaseDocument;
}
