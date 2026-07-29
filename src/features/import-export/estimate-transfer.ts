import { z } from "zod";

import type { EstimateCaseDocument } from "@/features/estimation/application/estimate-case";
import {
  CURRENT_MODEL_VERSION,
  calculateEstimate,
  type EstimateResult,
} from "@/features/estimation/domain";
import { estimateCaseSchema } from "@/features/estimation/infrastructure/estimate-case-schema";

export const MAX_IMPORT_BYTES = 1024 * 1024;

const exportEstimateSchema = estimateCaseSchema.omit({
  schemaVersion: true,
  modelVersion: true,
  parameterSnapshot: true,
});

const transferEnvelopeSchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    modelVersion: z.literal(CURRENT_MODEL_VERSION),
    exportedAt: z.iso.datetime({ offset: true }),
    estimate: exportEstimateSchema,
    parameterSnapshot: estimateCaseSchema.shape.parameterSnapshot,
    resultSnapshot: z.unknown(),
  })
  .strict();

export type TransferErrorCode =
  | "FILE_TOO_LARGE"
  | "MALFORMED_JSON"
  | "DANGEROUS_KEY"
  | "UNSUPPORTED_SCHEMA_VERSION"
  | "INVALID_SCHEMA"
  | "CALCULATION_FAILED";

export interface TransferFailure {
  readonly ok: false;
  readonly code: TransferErrorCode;
  readonly path: string;
}

export interface ImportSuccess {
  readonly ok: true;
  readonly estimate: EstimateCaseDocument;
  readonly result: EstimateResult;
  readonly warnings: readonly "RESULT_SNAPSHOT_MISMATCH"[];
}

export type ImportResult = TransferFailure | ImportSuccess;

export type ExportResult =
  | TransferFailure
  | {
      readonly ok: true;
      readonly filename: string;
      readonly text: string;
      readonly result: EstimateResult;
    };

const dangerousKeys = new Set(["__proto__", "prototype", "constructor"]);

function dangerousPath(value: unknown, path = "$"): string | null {
  if (value === null || typeof value !== "object") {
    return null;
  }

  if (Array.isArray(value)) {
    for (const [index, entry] of value.entries()) {
      const found = dangerousPath(entry, `${path}[${index}]`);
      if (found) {
        return found;
      }
    }
    return null;
  }

  for (const key of Object.keys(value)) {
    if (dangerousKeys.has(key)) {
      return `${path}.${key}`;
    }
    const found = dangerousPath(
      (value as Record<string, unknown>)[key],
      `${path}.${key}`,
    );
    if (found) {
      return found;
    }
  }

  return null;
}

function issuePath(path: readonly PropertyKey[]): string {
  return path.reduce<string>((result, segment) => {
    if (typeof segment === "number") {
      return `${result}[${segment}]`;
    }
    return `${result}.${String(segment)}`;
  }, "$");
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .toSorted()
      .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function exportEstimateJson(
  estimate: EstimateCaseDocument,
  exportedAt: string,
): ExportResult {
  const outcome = calculateEstimate({
    modelVersion: estimate.modelVersion,
    parameterSnapshot: estimate.parameterSnapshot,
    input: estimate.input,
  });

  if (!outcome.ok) {
    return {
      ok: false,
      code: "CALCULATION_FAILED",
      path: outcome.issues[0]?.path ?? "$.estimate.input",
    };
  }

  const {
    schemaVersion,
    modelVersion,
    parameterSnapshot,
    ...estimateWithoutEnvelopeFields
  } = estimate;
  const envelope = {
    schemaVersion,
    modelVersion,
    exportedAt,
    estimate: estimateWithoutEnvelopeFields,
    parameterSnapshot,
    resultSnapshot: outcome.result,
  };

  return {
    ok: true,
    filename: `estimate-trace-${exportedAt.slice(0, 10)}.json`,
    text: JSON.stringify(envelope, null, 2),
    result: outcome.result,
  };
}

export function importEstimateJson(text: string): ImportResult {
  if (new TextEncoder().encode(text).byteLength > MAX_IMPORT_BYTES) {
    return { ok: false, code: "FILE_TOO_LARGE", path: "$" };
  }

  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { ok: false, code: "MALFORMED_JSON", path: "$" };
  }

  const unsafePath = dangerousPath(value);
  if (unsafePath) {
    return { ok: false, code: "DANGEROUS_KEY", path: unsafePath };
  }

  const versionProbe = z
    .object({ schemaVersion: z.string() })
    .passthrough()
    .safeParse(value);
  if (versionProbe.success && versionProbe.data.schemaVersion !== "1.0.0") {
    return {
      ok: false,
      code: "UNSUPPORTED_SCHEMA_VERSION",
      path: "$.schemaVersion",
    };
  }

  const parsed = transferEnvelopeSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      code: "INVALID_SCHEMA",
      path: issuePath(parsed.error.issues[0]?.path ?? []),
    };
  }

  const estimate = {
    ...parsed.data.estimate,
    schemaVersion: parsed.data.schemaVersion,
    modelVersion: parsed.data.modelVersion,
    parameterSnapshot: parsed.data.parameterSnapshot,
  } as EstimateCaseDocument;

  const outcome = calculateEstimate({
    modelVersion: estimate.modelVersion,
    parameterSnapshot: estimate.parameterSnapshot,
    input: estimate.input,
  });
  if (!outcome.ok) {
    return {
      ok: false,
      code: "CALCULATION_FAILED",
      path: outcome.issues[0]?.path ?? "$.estimate.input",
    };
  }

  const snapshotMatches =
    stableJson(parsed.data.resultSnapshot) === stableJson(outcome.result);

  return {
    ok: true,
    estimate,
    result: outcome.result,
    warnings: snapshotMatches ? [] : ["RESULT_SNAPSHOT_MISMATCH"],
  };
}
