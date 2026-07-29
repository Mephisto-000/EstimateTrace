import type {
  EstimateInput,
  ModelVersion,
  ParameterSnapshot,
} from "@/features/estimation/domain";

export const CURRENT_SCHEMA_VERSION = "1.0.0" as const;

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
