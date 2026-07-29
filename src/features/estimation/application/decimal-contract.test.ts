import { describe, expect, it } from "vitest";

import { calculateEstimate, normalizeEstimateInputDecimals } from "../domain";
import {
  parseEstimateCase,
  safeParseEstimateCase,
} from "../infrastructure/estimate-case-schema";
import { createFictionalExamples } from "./create-estimate";

const runtime = {
  createId: (() => {
    let sequence = 0;
    return () =>
      `00000000-0000-4000-8000-${String(++sequence).padStart(12, "0")}`;
  })(),
  now: () => "2026-07-29T08:00:00.000Z",
};

describe("editable decimal application flow", () => {
  it("normalizes trailing-zero form values before storage validation and calculation", () => {
    const source = createFictionalExamples(runtime)[0]!;
    const draft = {
      ...source,
      input: {
        ...source.input,
        workItems: source.input.workItems.map((item, index) =>
          index === 0 ? { ...item, quantity: "12.0", unitHours: "24.0" } : item,
        ),
        phaseLoading: {
          ...source.input.phaseLoading,
          BUSINESS_ANALYSIS: "0.1200",
        },
        fixedEffortHours: "0.0",
        uncertainty: {
          downsideRate: "0.150",
          upsideRate: "0.300",
        },
        commercialTerms: {
          hourlyRate: "1800.0",
          directCost: "0.0",
          overheadRate: "0.120",
          warrantyCost: "0.0",
          vendorMarkupRate: "0.150",
          taxRate: "0.050",
          hoursPerPersonDay: "8.0",
          daysPerPersonMonth: "20.0",
        },
        vendorQuote:
          source.input.vendorQuote === null
            ? null
            : { ...source.input.vendorQuote, amount: "420000.0" },
      },
    };

    expect(safeParseEstimateCase(draft).success).toBe(false);

    const normalized = {
      ...draft,
      input: normalizeEstimateInputDecimals(draft.input),
    };

    expect(normalized.input.workItems[0]).toMatchObject({
      quantity: "12",
      unitHours: "24",
    });
    expect(normalized.input.phaseLoading.BUSINESS_ANALYSIS).toBe("0.12");
    expect(normalized.input.fixedEffortHours).toBe("0");
    expect(normalized.input.commercialTerms).toMatchObject({
      hourlyRate: "1800",
      directCost: "0",
      overheadRate: "0.12",
      warrantyCost: "0",
      vendorMarkupRate: "0.15",
      taxRate: "0.05",
      hoursPerPersonDay: "8",
      daysPerPersonMonth: "20",
    });
    expect(normalized.input.vendorQuote?.amount).toBe("420000");

    expect(safeParseEstimateCase(normalized).success).toBe(true);
    const parsed = parseEstimateCase(normalized);

    const outcome = calculateEstimate({
      modelVersion: parsed.modelVersion,
      parameterSnapshot: parsed.parameterSnapshot,
      input: parsed.input,
    });
    expect(outcome.ok).toBe(true);
  });

  it("preserves transient invalid text so the wizard can display and correct it", () => {
    const source = createFictionalExamples(runtime)[0]!;
    const input = normalizeEstimateInputDecimals({
      ...source.input,
      fixedEffortHours: "1.",
    });

    expect(input.fixedEffortHours).toBe("1.");
    expect(
      calculateEstimate({
        modelVersion: source.modelVersion,
        parameterSnapshot: source.parameterSnapshot,
        input,
      }),
    ).toMatchObject({
      ok: false,
      issues: [
        expect.objectContaining({
          code: "INVALID_DECIMAL",
          path: "input.fixedEffortHours",
        }),
      ],
    });
  });
});
