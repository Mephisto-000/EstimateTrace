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
  | "PAYLOAD_TOO_COMPLEX"
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
const MAX_JSON_DEPTH = 100;
const MAX_JSON_NODES = 50_000;

type JsonInspection =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly code: "DANGEROUS_KEY" | "PAYLOAD_TOO_COMPLEX";
      readonly path: string;
    };

interface JsonFrame {
  readonly value: unknown;
  readonly path: string;
  readonly depth: number;
}

function inspectJsonStructure(value: unknown): JsonInspection {
  const frames: JsonFrame[] = [{ value, path: "$", depth: 0 }];
  let scheduledNodes = 1;

  while (frames.length > 0) {
    const frame = frames.pop();
    if (!frame || frame.value === null || typeof frame.value !== "object") {
      continue;
    }

    if (Array.isArray(frame.value)) {
      for (let index = frame.value.length - 1; index >= 0; index -= 1) {
        const path = `${frame.path}[${index}]`;
        const depth = frame.depth + 1;
        if (depth > MAX_JSON_DEPTH) {
          return { ok: false, code: "PAYLOAD_TOO_COMPLEX", path };
        }
        scheduledNodes += 1;
        if (scheduledNodes > MAX_JSON_NODES) {
          return { ok: false, code: "PAYLOAD_TOO_COMPLEX", path };
        }
        frames.push({ value: frame.value[index], path, depth });
      }
      continue;
    }

    const record = frame.value as Record<string, unknown>;
    const keys = Object.keys(record);
    for (let index = keys.length - 1; index >= 0; index -= 1) {
      const key = keys[index];
      if (key === undefined) {
        continue;
      }
      const path = `${frame.path}.${key}`;
      if (dangerousKeys.has(key)) {
        return { ok: false, code: "DANGEROUS_KEY", path };
      }
      const depth = frame.depth + 1;
      if (depth > MAX_JSON_DEPTH) {
        return { ok: false, code: "PAYLOAD_TOO_COMPLEX", path };
      }
      scheduledNodes += 1;
      if (scheduledNodes > MAX_JSON_NODES) {
        return { ok: false, code: "PAYLOAD_TOO_COMPLEX", path };
      }
      frames.push({ value: record[key], path, depth });
    }
  }

  return { ok: true };
}

function issuePath(path: readonly PropertyKey[]): string {
  return path.reduce<string>((result, segment) => {
    if (typeof segment === "number") {
      return `${result}[${segment}]`;
    }
    return `${result}.${String(segment)}`;
  }, "$");
}

type StableJsonResult =
  | { readonly ok: true; readonly text: string }
  | {
      readonly ok: false;
      readonly code: "PAYLOAD_TOO_COMPLEX";
      readonly path: string;
    };

function stableJson(
  value: unknown,
  path = "$",
  depth = 0,
  budget: { nodes: number } = { nodes: 0 },
): StableJsonResult {
  budget.nodes += 1;
  if (depth > MAX_JSON_DEPTH || budget.nodes > MAX_JSON_NODES) {
    return { ok: false, code: "PAYLOAD_TOO_COMPLEX", path };
  }

  if (Array.isArray(value)) {
    const entries: string[] = [];
    for (const [index, entry] of value.entries()) {
      const serialized = stableJson(
        entry,
        `${path}[${index}]`,
        depth + 1,
        budget,
      );
      if (!serialized.ok) {
        return serialized;
      }
      entries.push(serialized.text);
    }
    return { ok: true, text: `[${entries.join(",")}]` };
  }
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const entries: string[] = [];
    for (const key of Object.keys(record).toSorted()) {
      const serialized = stableJson(
        record[key],
        `${path}.${key}`,
        depth + 1,
        budget,
      );
      if (!serialized.ok) {
        return serialized;
      }
      entries.push(`${JSON.stringify(key)}:${serialized.text}`);
    }
    return { ok: true, text: `{${entries.join(",")}}` };
  }
  return { ok: true, text: JSON.stringify(value) ?? "null" };
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

  const inspection = inspectJsonStructure(value);
  if (!inspection.ok) {
    return inspection;
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

  const importedSnapshot = stableJson(
    parsed.data.resultSnapshot,
    "$.resultSnapshot",
  );
  if (!importedSnapshot.ok) {
    return importedSnapshot;
  }
  const recalculatedSnapshot = stableJson(
    outcome.result,
    "$.recalculatedResult",
  );
  if (!recalculatedSnapshot.ok) {
    return recalculatedSnapshot;
  }
  const snapshotMatches = importedSnapshot.text === recalculatedSnapshot.text;

  return {
    ok: true,
    estimate,
    result: outcome.result,
    warnings: snapshotMatches ? [] : ["RESULT_SNAPSHOT_MISMATCH"],
  };
}
