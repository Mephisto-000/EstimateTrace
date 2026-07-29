import { describe, expect, it } from "vitest";

import { publicDemoParameterSet } from "@/config/parameter-sets/public-demo";

import {
  createEmptyEstimateCase,
  createFictionalExamples,
  resetToPublicDemoParameters,
} from "./create-estimate";

const deterministicRuntime = {
  createId: () => "00000000-0000-4000-8000-000000000001",
  now: () => "2026-07-29T08:00:00.000Z",
};

describe("createEmptyEstimateCase", () => {
  it("建立含完整參數快照且可開始編輯的本機案件", () => {
    const estimate = createEmptyEstimateCase(
      {
        name: "公開示範案件",
        description: "fictional／illustrative 測試資料",
      },
      deterministicRuntime,
    );

    expect(estimate).toMatchObject({
      id: "00000000-0000-4000-8000-000000000001",
      schemaVersion: "1.0.0",
      modelVersion: "bottom-up-1.0.0",
      name: "公開示範案件",
      currency: "TWD",
      createdAt: "2026-07-29T08:00:00.000Z",
      updatedAt: "2026-07-29T08:00:00.000Z",
      parameterSnapshot: {
        id: publicDemoParameterSet.id,
        version: publicDemoParameterSet.version,
      },
      input: {
        workItems: [],
        vendorQuote: null,
      },
    });
  });

  it("拒絕缺少必要 scope 的案件", () => {
    expect(() =>
      createEmptyEstimateCase(
        { name: "虛構案件", description: "   " },
        deterministicRuntime,
      ),
    ).toThrow(RangeError);
  });
});

describe("createFictionalExamples", () => {
  it("提供兩筆明確標示 fictional 的可計算範例", () => {
    let sequence = 0;
    const examples = createFictionalExamples({
      createId: () =>
        `00000000-0000-4000-8000-${String(++sequence).padStart(12, "0")}`,
      now: deterministicRuntime.now,
    });

    expect(examples).toHaveLength(2);
    expect(examples.map((item) => item.name)).toEqual([
      "會員資料查詢與匯出（fictional）",
      "公開市場價格批次介接（fictional）",
    ]);
    expect(examples.every((item) => item.input.workItems.length > 0)).toBe(
      true,
    );
    expect(
      examples.every((item) => item.description.includes("illustrative")),
    ).toBe(true);
  });
});

describe("resetToPublicDemoParameters", () => {
  it("保留案件內容並重設 versioned parameter-derived inputs", () => {
    const source = createFictionalExamples(deterministicRuntime)[0]!;
    const modified = {
      ...source,
      input: {
        ...source.input,
        phaseLoading: {
          ...source.input.phaseLoading,
          BUSINESS_ANALYSIS: "0.99",
        },
        commercialTerms: {
          ...source.input.commercialTerms,
          hourlyRate: "9999",
        },
        workItems: source.input.workItems.map((item) => ({
          ...item,
          unitHours: "999",
        })),
      },
    };

    const reset = resetToPublicDemoParameters(modified);

    expect(reset.name).toBe(source.name);
    expect(reset.input.vendorQuote).toEqual(source.input.vendorQuote);
    expect(reset.input.phaseLoading.BUSINESS_ANALYSIS).toBe("0.12");
    expect(reset.input.commercialTerms.hourlyRate).toBe("1800");
    expect(reset.input.workItems.map((item) => item.unitHours)).toEqual([
      "24",
      "24",
      "16",
    ]);
    expect(reset.parameterSnapshot).toBe(publicDemoParameterSet);
  });
});
