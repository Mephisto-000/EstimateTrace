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
  it("renders the worked P50/P80 result, vendor evidence, and expandable calculation trace", async () => {
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
        name: "明顯低於模型區間，請檢查漏項或追加風險。",
      })
      .closest("section");
    expect(vendorComparison).not.toBeNull();
    expect(
      within(vendorComparison!).getByText(/正規化為未稅 \$47,619/u),
    ).toBeVisible();
    expect(
      within(vendorComparison!).getByText(
        "是否包含完整 SIT、UAT 與 Regression Test？",
      ),
    ).toBeVisible();
    expect(
      within(vendorComparison!).getAllByText(
        "觸發依據：comparison band CLEARLY_BELOW_MODEL_RANGE",
      ),
    ).toHaveLength(2);

    const drivers = screen
      .getByRole("heading", { name: "主要成本 drivers" })
      .closest("section");
    expect(drivers).not.toBeNull();
    expect(within(drivers!).getByText("P50 labor cost")).toBeVisible();
    expect(within(drivers!).getByText("$74,390")).toBeVisible();
    expect(within(drivers!).getByText("estimate:p50:labor-cost")).toBeVisible();
    expect(within(drivers!).getByText("Vendor markup")).toBeVisible();
    expect(within(drivers!).getByText("$16,686")).toBeVisible();
    expect(
      within(drivers!).getByText("estimate:p50:vendor-markup-amount"),
    ).toBeVisible();
    expect(within(drivers!).getByText("Overhead")).toBeVisible();
    expect(within(drivers!).getByText("$7,539")).toBeVisible();
    expect(
      within(drivers!).getByText(
        "P50 benchmark quote 的前三大可加總成本構成；全部以 TWD 比較。",
      ),
    ).toBeVisible();

    const trace = screen
      .getByRole("heading", { name: "Calculation trace" })
      .closest("section");
    expect(trace).not.toBeNull();
    const baseEffortSummary = within(trace!).getByText(
      /workItemBaseEffortHours — 32 person-hour/u,
    );
    const baseEffortDetails = baseEffortSummary.closest("details");
    expect(baseEffortDetails).not.toBeNull();
    expect(baseEffortDetails).not.toHaveAttribute("open");

    await user.click(baseEffortSummary);

    expect(baseEffortDetails).toHaveAttribute("open");
    expect(
      within(baseEffortDetails!).getByText(/48 significant digits/u),
    ).toBeVisible();
    expect(
      within(baseEffortDetails!).getByRole("link", {
        name: "work-item-base-effort",
      }),
    ).toHaveAttribute("href", "/methodology#base-effort");
    const renderedFormula = within(baseEffortDetails!).getByRole("math", {
      name: "workItemBaseEffortHours 的計算公式",
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
