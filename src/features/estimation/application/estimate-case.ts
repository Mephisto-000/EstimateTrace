import type {
  EstimateInput,
  ModelVersion,
  ParameterSnapshot,
} from "@/features/estimation/domain";

export const CURRENT_SCHEMA_VERSION = "1.0.0" as const;

const estimateCaseIdPattern =
  /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/iu;

export function isEstimateCaseId(value: unknown): value is string {
  return typeof value === "string" && estimateCaseIdPattern.test(value);
}

export interface EstimateCaseDocument {
  readonly id: string;
  readonly schemaVersion: typeof CURRENT_SCHEMA_VERSION;
  readonly modelVersion: ModelVersion;
  readonly name: string;
  readonly description: string;
  readonly currency: "TWD";
  readonly input: EstimateInput;
  readonly parameterSnapshot: ParameterSnapshot;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface RuntimeServices {
  readonly createId: () => string;
  readonly now: () => string;
}

export const browserRuntimeServices: RuntimeServices = {
  createId: () => crypto.randomUUID(),
  now: () => new Date().toISOString(),
};
