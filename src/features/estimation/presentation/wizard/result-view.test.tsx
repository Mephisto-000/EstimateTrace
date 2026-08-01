import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { EstimateCaseDocument } from "@/features/estimation/application/estimate-case";
import { createEmptyEstimateCase } from "@/features/estimation/application/create-estimate";
import { calculateEstimate } from "@/features/estimation/domain";

import { ResultView } from "./result-view";

afterEach(cleanup);

function createWorkedEstimate(): EstimateCaseDocument {
  const estimate = createEmptyEstimateCase(
    {
      name: "Component worked example",
      description:
        "依公開規格建立的 fictional／illustrative component fixture。",
    },
    {
      createId: () => "component-estimate",
      now: () => "2026-07-29T04:00:00.000Z",
    },
  );

  return {
    ...estimate,
    parameterSnapshot: {
      ...estimate.parameterSnapshot,
      riskFactors: estimate.parameterSnapshot.riskFactors.map((factor) =>
        factor.id === "INTEGRATION_DEPENDENCY"
          ? {
              ...factor,
              multipliers: { ...factor.multipliers, HIGH: "1.2" },
            }
          : factor,
      ),
    },
    input: {
      ...estimate.input,
      workItems: [
        {
          id: "integration-1",
          type: "INTEGRATION",
          title: "示範介接",
          description: "依規格 worked example 建立的虛構介接。",
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
        ...estimate.input.riskProfile,
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
      uncertainty: {
        downsideRate: "0.15",
        upsideRate: "0.3",
      },
      commercialTerms: {
        hourlyRate: "1000",
        directCost: "1000",
        overheadRate: "0.1",
        warrantyCost: "500",
        vendorMarkupRate: "0.2",
        taxRate: "0.05",
        hoursPerPersonDay: "8",
        daysPerPersonMonth: "20",
      },
      vendorQuote: {
        amount: "50000",
        taxBasis: "TAX_INCLUSIVE",
        note: "fictional／illustrative quote。",
        quoteDate: "2026-07-29",
      },
    },
  };
}

describe("ResultView", () => {
  it("呈現 P50／P80 結果、乙方報價依據與可展開的計算軌跡", async () => {
    const user = userEvent.setup();
    const estimate = createWorkedEstimate();
    const outcome = calculateEstimate({
      modelVersion: estimate.modelVersion,
      parameterSnapshot: estimate.parameterSnapshot,
      input: estimate.input,
    });
    const onExport = vi.fn();

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      throw new Error(JSON.stringify(outcome.issues));
    }

    render(
      <ResultView
        estimate={estimate}
        result={outcome.result}
        onExport={onExport}
      />,
    );

    const headline = screen
      .getByRole("heading", { name: "Component worked example" })
      .closest("section");
    expect(headline).not.toBeNull();
    expect(within(headline!).getByText("74.4 小時")).toBeVisible();
    expect(within(headline!).getByText("79.0 小時")).toBeVisible();
    expect(within(headline!).getByText("$105,121")).toBeVisible();
    expect(within(headline!).getByText("$111,470")).toBeVisible();

    const vendorComparison = screen
      .getByRole("heading", {
        name: "明顯低於模型區間，請確認是否漏算項目或風險。",
      })
      .closest("section");
    expect(vendorComparison).not.toBeNull();
    expect(
      within(vendorComparison!).getByText(/換算為未稅後是 \$47,619/u),
    ).toBeVisible();
    expect(
      within(vendorComparison!).getByText(
        "報價是否包含完整的系統整合測試、使用者驗收測試和回歸測試？",
      ),
    ).toBeVisible();
    expect(
      within(vendorComparison!).getAllByText("CLEARLY_BELOW_MODEL_RANGE"),
    ).toHaveLength(2);

    const drivers = screen
      .getByRole("heading", { name: "主要成本來源" })
      .closest("section");
    expect(drivers).not.toBeNull();
    expect(within(drivers!).getByText("P50 人力成本")).toBeVisible();
    expect(within(drivers!).getByText("$74,390")).toBeVisible();
    expect(within(drivers!).getByText("estimate:p50:labor-cost")).toBeVisible();
    expect(within(drivers!).getByText("乙方成本加成")).toBeVisible();
    expect(within(drivers!).getByText("$16,686")).toBeVisible();
    expect(
      within(drivers!).getByText("estimate:p50:vendor-markup-amount"),
    ).toBeVisible();
    expect(within(drivers!).getByText("管銷與間接成本")).toBeVisible();
    expect(within(drivers!).getByText("$7,539")).toBeVisible();
    expect(
      within(drivers!).getByText(
        "這裡列出 P50 參考報價中金額最高的三個成本項目，全部以新臺幣呈現。",
      ),
    ).toBeVisible();

    const trace = screen
      .getByRole("heading", { name: "計算軌跡" })
      .closest("section");
    expect(trace).not.toBeNull();
    const baseEffortSummary = within(trace!).getByText(
      /工作項目基礎工時 — 32 人時/u,
    );
    const baseEffortDetails = baseEffortSummary.closest("details");
    expect(baseEffortDetails).not.toBeNull();
    expect(baseEffortDetails).not.toHaveAttribute("open");

    await user.click(baseEffortSummary);

    expect(baseEffortDetails).toHaveAttribute("open");
    expect(
      within(baseEffortDetails!).getByText(/48 位有效數字/u),
    ).toBeVisible();
    expect(
      within(baseEffortDetails!).getByRole("link", {
        name: "work-item-base-effort",
      }),
    ).toHaveAttribute("href", "/methodology#base-effort");
    const renderedFormula = within(baseEffortDetails!).getByRole("math", {
      name: /第 i 個工作項目的基礎工時 H i base，等於數量 q i 乘以每單位工時 u i/u,
    });
    expect(renderedFormula).toHaveAttribute("data-math-renderer", "katex");
    expect(renderedFormula.querySelector(".katex")).not.toBeNull();
    expect(
      trace!.querySelectorAll('[data-math-renderer="katex"]'),
    ).toHaveLength(outcome.result.calculationTrace.length);
    expect(trace!.querySelectorAll('[data-math-renderer="text"]')).toHaveLength(
      0,
    );

    await user.click(screen.getByRole("button", { name: "匯出可重算 JSON" }));
    expect(onExport).toHaveBeenCalledOnce();
  });
});
