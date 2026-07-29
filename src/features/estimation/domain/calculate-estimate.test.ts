import { describe, expect, it } from "vitest";

import { publicDemoParameterSet } from "@/config/parameter-sets/public-demo";

import {
  CURRENT_MODEL_VERSION,
  calculateEstimate,
  type CalculationOutcome,
  type CalculationRequest,
  type EstimateInput,
  type EstimateResult,
  type ParameterSnapshot,
  type RiskProfile,
} from ".";

const nominalRiskProfile: RiskProfile = {
  REQUIREMENT_CLARITY: { level: "NOMINAL", rationale: "需求已確認。" },
  LEGACY_TECHNICAL_DEBT: { level: "NOMINAL", rationale: "無額外假設。" },
  INTEGRATION_DEPENDENCY: { level: "NOMINAL", rationale: "無額外假設。" },
  SECURITY_COMPLIANCE: { level: "NOMINAL", rationale: "無額外假設。" },
  DATA_MIGRATION_QUALITY: { level: "NOMINAL", rationale: "無額外假設。" },
  SCHEDULE_COMPRESSION: { level: "NOMINAL", rationale: "無額外假設。" },
};

function workedExampleParameterSet(): ParameterSnapshot {
  return {
    ...publicDemoParameterSet,
    riskFactors: publicDemoParameterSet.riskFactors.map((factor) =>
      factor.id === "INTEGRATION_DEPENDENCY"
        ? {
            ...factor,
            multipliers: { ...factor.multipliers, HIGH: "1.2" },
          }
        : factor,
    ),
  };
}

function workedExampleRequest(): CalculationRequest {
  return {
    modelVersion: CURRENT_MODEL_VERSION,
    parameterSnapshot: workedExampleParameterSet(),
    input: {
      workItems: [
        {
          id: "integration-1",
          type: "INTEGRATION",
          title: "示範介接",
          description: "依規格第 10.13 節建立的工作項目。",
          quantity: "2",
          unit: "endpoint",
          unitHours: "16",
          complexity: "HIGH",
          applicableRiskFactorIds: ["INTEGRATION_DEPENDENCY"],
          includedCrossCuttingPhases: [],
          assumptions: ["Integration risk multiplier = 1.2"],
        },
      ],
      riskProfile: {
        ...nominalRiskProfile,
        INTEGRATION_DEPENDENCY: {
          level: "HIGH",
          rationale: "依規格示範採 1.2。",
        },
      },
      phaseLoading: {
        BUSINESS_ANALYSIS: "0.1",
        ARCHITECTURE_DESIGN: "0.1",
        PROJECT_MANAGEMENT: "0.1",
        QUALITY_ASSURANCE: "0.1",
        DEPLOYMENT_RELEASE: "0",
        DOCUMENTATION_TRAINING: "0",
      },
      fixedEffortHours: "0",
      uncertainty: {
        downsideRate: "0.15",
        upsideRate: "0.3",
      },
      commercialTerms: {
        hourlyRate: "0",
        directCost: "0",
        overheadRate: "0",
        warrantyCost: "0",
        vendorMarkupRate: "0",
        taxRate: "0.05",
        hoursPerPersonDay: "8",
        daysPerPersonMonth: "20",
      },
      vendorQuote: null,
    },
  };
}

function withInput(
  request: CalculationRequest,
  input: Partial<EstimateInput>,
): CalculationRequest {
  return {
    ...request,
    input: {
      ...request.input,
      ...input,
    },
  };
}

function expectResult(outcome: CalculationOutcome): EstimateResult {
  expect(outcome.ok).toBe(true);
  if (!outcome.ok) {
    throw new Error(JSON.stringify(outcome.issues));
  }
  return outcome.result;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.freeze(value);
    for (const nestedValue of Object.values(value)) {
      deepFreeze(nestedValue);
    }
  }
  return value;
}

describe("calculateEstimate", () => {
  it("reproduces the specification worked example without intermediate rounding", () => {
    const result = expectResult(calculateEstimate(workedExampleRequest()));

    expect(result.baseEffortHours).toBe("32");
    expect(result.adjustedEffortHours).toBe("51.84");
    expect(result.crossCuttingEffortHours).toBe("20.736");
    expect(result.mostLikelyEffortHours).toBe("72.576");
    expect(result.optimisticEffortHours).toBe("61.6896");
    expect(result.pessimisticEffortHours).toBe("94.3488");
    expect(result.p50EffortHours).toBe("74.3904");
    expect(result.p80EffortHours).toBe("78.97139712");
  });

  it("excludes each work item only from cross-cutting phases it already includes", () => {
    const request = workedExampleRequest();
    const [workItem] = request.input.workItems;
    if (workItem === undefined) {
      throw new Error("worked example must contain one work item");
    }

    const result = expectResult(
      calculateEstimate(
        withInput(request, {
          workItems: [
            {
              ...workItem,
              includedCrossCuttingPhases: ["QUALITY_ASSURANCE"],
            },
          ],
        }),
      ),
    );

    expect(result.crossCuttingEffortHours).toBe("15.552");
    expect(
      result.calculationTrace.find(({ id }) => id === "phase:QUALITY_ASSURANCE")
        ?.result,
    ).toBe("0");
  });

  it("applies direct cost, overhead, warranty, markup, and tax in the specified order", () => {
    const request = workedExampleRequest();
    const result = expectResult(
      calculateEstimate(
        withInput(request, {
          commercialTerms: {
            ...request.input.commercialTerms,
            hourlyRate: "1000",
            directCost: "1000",
            overheadRate: "0.1",
            warrantyCost: "500",
            vendorMarkupRate: "0.2",
            taxRate: "0.05",
          },
        }),
      ),
    );

    expect(result.p50EngineeringCost).toBe("75390.4");
    expect(result.p50QuoteExTax).toBe("100115.328");
    expect(result.p50QuoteIncTax).toBe("105121.0944");
  });

  it("normalizes a tax-inclusive vendor quote and orders questions deterministically", () => {
    const request = workedExampleRequest();
    const result = expectResult(
      calculateEstimate({
        ...withInput(request, {
          vendorQuote: {
            amount: "105",
            taxBasis: "TAX_INCLUSIVE",
          },
        }),
        parameterSnapshot: {
          ...request.parameterSnapshot,
          vendorQuestions: [
            { id: "z-last", priority: 20, text: "最後。" },
            { id: "b-second", priority: 10, text: "第二。" },
            { id: "a-first", priority: 10, text: "第一。" },
          ],
        },
      }),
    );

    expect(result.vendorComparison?.normalizedQuoteExTax).toBe("100");
    expect(result.vendorComparison?.questions.map(({ id }) => id)).toEqual([
      "a-first",
      "b-second",
      "z-last",
    ]);
  });

  it("uses null for variance and ratios when the benchmark denominator is zero", () => {
    const request = workedExampleRequest();
    const result = expectResult(
      calculateEstimate(
        withInput(request, {
          vendorQuote: {
            amount: "0",
            taxBasis: "TAX_EXCLUSIVE",
          },
        }),
      ),
    );

    expect(result.p50QuoteExTax).toBe("0");
    expect(result.p80QuoteExTax).toBe("0");
    expect(result.vendorComparison).toMatchObject({
      varianceFromP50: null,
      varianceFromP80: null,
      quoteToP50Ratio: null,
      quoteToP80Ratio: null,
    });
  });

  it("computes vendor differences, variances, ratios, and interval band on the same tax basis", () => {
    const request = workedExampleRequest();
    const [item] = request.input.workItems;
    const result = expectResult(
      calculateEstimate(
        withInput(request, {
          workItems: [
            {
              ...item!,
              quantity: "1",
              unitHours: "8",
              complexity: "MEDIUM",
              applicableRiskFactorIds: [],
            },
          ],
          phaseLoading: {
            BUSINESS_ANALYSIS: "0",
            ARCHITECTURE_DESIGN: "0",
            PROJECT_MANAGEMENT: "0",
            QUALITY_ASSURANCE: "0",
            DEPLOYMENT_RELEASE: "0",
            DOCUMENTATION_TRAINING: "0",
          },
          uncertainty: {
            downsideRate: "0",
            upsideRate: "0",
          },
          commercialTerms: {
            ...request.input.commercialTerms,
            hourlyRate: "100",
            taxRate: "0",
          },
          vendorQuote: {
            amount: "1000",
            taxBasis: "TAX_EXCLUSIVE",
          },
        }),
      ),
    );

    expect(result.p50QuoteExTax).toBe("800");
    expect(result.vendorComparison).toMatchObject({
      normalizedQuoteExTax: "1000",
      differenceFromP50: "200",
      differenceFromP80: "200",
      varianceFromP50: "0.25",
      varianceFromP80: "0.25",
      quoteToP50Ratio: "1.25",
      quoteToP80Ratio: "1.25",
      band: "ABOVE_MODEL_P80",
    });
  });

  it("warns without clamping when a work item's risk product exceeds the safety cap", () => {
    const request = workedExampleRequest();
    const result = expectResult(
      calculateEstimate({
        ...request,
        parameterSnapshot: {
          ...request.parameterSnapshot,
          constraints: {
            ...request.parameterSnapshot.constraints,
            riskProductSafetyCap: "1.1",
          },
        },
      }),
    );

    expect(result.adjustedEffortHours).toBe("51.84");
    expect(result.warnings).toEqual([
      {
        code: "RISK_PRODUCT_SAFETY_CAP_EXCEEDED",
        path: "input.workItems.integration-1.applicableRiskFactorIds",
        details: {
          itemId: "integration-1",
          actual: "1.2",
          safetyCap: "1.1",
        },
      },
    ]);
  });

  it.each([
    {
      name: "unsupported model version",
      mutate: (request: CalculationRequest) => ({
        ...request,
        modelVersion: "bottom-up-2.0.0",
      }),
      code: "UNSUPPORTED_MODEL_VERSION",
      path: "modelVersion",
    },
    {
      name: "non-model decimal precision",
      mutate: (request: CalculationRequest) => ({
        ...request,
        parameterSnapshot: {
          ...request.parameterSnapshot,
          calculationPolicy: {
            ...request.parameterSnapshot.calculationPolicy,
            decimalPrecision: 20,
          },
        },
      }),
      code: "INVALID_PARAMETER_SET",
      path: "parameterSnapshot.calculationPolicy.decimalPrecision",
    },
    {
      name: "empty work item collection",
      mutate: (request: CalculationRequest) =>
        withInput(request, { workItems: [] }),
      code: "REQUIRED_VALUE",
      path: "input.workItems",
    },
    {
      name: "non-canonical quantity",
      mutate: (request: CalculationRequest) => {
        const [item] = request.input.workItems;
        return withInput(request, {
          workItems: [{ ...item!, quantity: "01" }],
        });
      },
      code: "INVALID_DECIMAL",
      path: "input.workItems.0.quantity",
    },
    {
      name: "zero quantity",
      mutate: (request: CalculationRequest) => {
        const [item] = request.input.workItems;
        return withInput(request, {
          workItems: [{ ...item!, quantity: "0" }],
        });
      },
      code: "OUT_OF_RANGE",
      path: "input.workItems.0.quantity",
    },
    {
      name: "unit effort below 0.25",
      mutate: (request: CalculationRequest) => {
        const [item] = request.input.workItems;
        return withInput(request, {
          workItems: [{ ...item!, unitHours: "0.24" }],
        });
      },
      code: "OUT_OF_RANGE",
      path: "input.workItems.0.unitHours",
    },
    {
      name: "downside above 0.50",
      mutate: (request: CalculationRequest) =>
        withInput(request, {
          uncertainty: {
            ...request.input.uncertainty,
            downsideRate: "0.51",
          },
        }),
      code: "OUT_OF_RANGE",
      path: "input.uncertainty.downsideRate",
    },
    {
      name: "zero hours per person day",
      mutate: (request: CalculationRequest) =>
        withInput(request, {
          commercialTerms: {
            ...request.input.commercialTerms,
            hoursPerPersonDay: "0",
          },
        }),
      code: "OUT_OF_RANGE",
      path: "input.commercialTerms.hoursPerPersonDay",
    },
    {
      name: "duplicate applicable risk factor",
      mutate: (request: CalculationRequest) => {
        const [item] = request.input.workItems;
        return withInput(request, {
          workItems: [
            {
              ...item!,
              applicableRiskFactorIds: [
                "INTEGRATION_DEPENDENCY",
                "INTEGRATION_DEPENDENCY",
              ],
            },
          ],
        });
      },
      code: "DUPLICATE_VALUE",
      path: "input.workItems.0.applicableRiskFactorIds.1",
    },
  ])("rejects $name without producing a result", ({ mutate, code, path }) => {
    const outcome = calculateEstimate(mutate(workedExampleRequest()));

    expect(outcome.ok).toBe(false);
    if (outcome.ok) {
      throw new Error("invalid input unexpectedly produced a result");
    }
    expect(outcome.issues).toContainEqual(
      expect.objectContaining({ code, path }),
    );
  });

  it("accepts the documented numeric boundaries", () => {
    const request = workedExampleRequest();
    const [item] = request.input.workItems;
    const result = expectResult(
      calculateEstimate(
        withInput(request, {
          workItems: [
            {
              ...item!,
              quantity: "0.0001",
              unitHours: "0.25",
            },
          ],
          uncertainty: {
            downsideRate: "0.5",
            upsideRate: "2",
          },
        }),
      ),
    );

    expect(result.optimisticEffortHours).toBe("0.00002835");
    expect(Number(result.p80EffortHours)).toBeGreaterThanOrEqual(
      Number(result.p50EffortHours),
    );
  });

  it("is deterministic and emits canonical finite decimals with a complete trace", () => {
    const request = deepFreeze(structuredClone(workedExampleRequest()));
    const first = expectResult(calculateEstimate(request));
    const second = expectResult(calculateEstimate(request));

    expect(second).toEqual(first);

    const decimals = [
      first.baseEffortHours,
      first.adjustedEffortHours,
      first.crossCuttingEffortHours,
      first.mostLikelyEffortHours,
      first.optimisticEffortHours,
      first.pessimisticEffortHours,
      first.p50EffortHours,
      first.p80EffortHours,
      first.p50PersonDays,
      first.p80PersonDays,
      first.p50PersonMonths,
      first.p80PersonMonths,
      first.p50EngineeringCost,
      first.p80EngineeringCost,
      first.p50QuoteExTax,
      first.p80QuoteExTax,
      first.p50QuoteIncTax,
      first.p80QuoteIncTax,
    ];
    for (const decimal of decimals) {
      expect(decimal).toMatch(/^-?(?:0|[1-9]\d*)(?:\.\d*[1-9])?$/);
      expect(Number.isFinite(Number(decimal))).toBe(true);
    }

    expect(Number(first.p80EffortHours)).toBeGreaterThanOrEqual(
      Number(first.p50EffortHours),
    );
    expect(new Set(first.calculationTrace.map(({ id }) => id)).size).toBe(
      first.calculationTrace.length,
    );
    expect(first.calculationTrace.map(({ metric }) => metric)).toEqual(
      expect.arrayContaining([
        "baseEffortHours",
        "adjustedEffortHours",
        "crossCuttingEffortHours",
        "mostLikelyEffortHours",
        "optimisticEffortHours",
        "pessimisticEffortHours",
        "p50EffortHours",
        "p80EffortHours",
        "p50PersonDays",
        "p80PersonDays",
        "p50PersonMonths",
        "p80PersonMonths",
        "p50EngineeringCost",
        "p80EngineeringCost",
        "p50QuoteExTax",
        "p80QuoteExTax",
        "p50QuoteIncTax",
        "p80QuoteIncTax",
      ]),
    );
    for (const node of first.calculationTrace) {
      expect(node.formula).not.toBe("");
      expect(node.formulaId).not.toBe("");
      expect(node.sources.length).toBeGreaterThan(0);
    }
  });

  it("keeps P80 greater than or equal to P50 for every canonical uncertainty profile", () => {
    const request = workedExampleRequest();

    for (const uncertainty of publicDemoParameterSet.uncertaintyParameters) {
      const result = expectResult(
        calculateEstimate(
          withInput(request, {
            uncertainty: {
              downsideRate: uncertainty.downsideRate,
              upsideRate: uncertainty.upsideRate,
            },
          }),
        ),
      );

      expect(Number(result.p80EffortHours)).toBeGreaterThanOrEqual(
        Number(result.p50EffortHours),
      );
      expect(Number.isFinite(Number(result.p50EffortHours))).toBe(true);
      expect(Number.isFinite(Number(result.p80EffortHours))).toBe(true);
    }
  });

  it("orders drivers and item trace nodes independently of caller array order", () => {
    const request = workedExampleRequest();
    const [template] = request.input.workItems;
    if (template === undefined) {
      throw new Error("worked example must contain one work item");
    }
    const firstItem = { ...template, id: "item-a" };
    const secondItem = { ...template, id: "item-b" };

    const forward = expectResult(
      calculateEstimate(
        withInput(request, { workItems: [firstItem, secondItem] }),
      ),
    );
    const reverse = expectResult(
      calculateEstimate(
        withInput(request, { workItems: [secondItem, firstItem] }),
      ),
    );

    expect(reverse.drivers).toEqual(forward.drivers);
    expect(forward.drivers.map(({ sourceId }) => sourceId)).toEqual([
      "item-a",
      "item-b",
      "ARCHITECTURE_DESIGN",
    ]);
    expect(reverse.calculationTrace).toEqual(forward.calculationTrace);
    expect(
      forward.calculationTrace
        .filter(({ metric }) => metric === "workItemBaseEffortHours")
        .map(({ id }) => id),
    ).toEqual(["work-item:item-a:base", "work-item:item-b:base"]);
  });

  it("never lowers effort when quantity increases and all other inputs stay fixed", () => {
    const request = workedExampleRequest();
    const [item] = request.input.workItems;
    const results = ["1", "2", "10"].map((quantity) =>
      expectResult(
        calculateEstimate(
          withInput(request, {
            workItems: [{ ...item!, quantity }],
          }),
        ),
      ),
    );

    expect(
      results.map(({ adjustedEffortHours }) => adjustedEffortHours),
    ).toEqual(["25.92", "51.84", "259.2"]);
    expect(results.map(({ p50EffortHours }) => Number(p50EffortHours))).toEqual(
      [...results.map(({ p50EffortHours }) => Number(p50EffortHours))].sort(
        (left, right) => left - right,
      ),
    );
  });
});
