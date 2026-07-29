import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import MethodologyPage from "./page";

afterEach(cleanup);

describe("MethodologyPage", () => {
  it("renders every public formula and symbol with KaTeX and a text alternative", () => {
    const { container } = render(<MethodologyPage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "軟體需求成本估算的公式與定義",
      }),
    ).toBeVisible();

    const mathElements = Array.from(
      container.querySelectorAll<HTMLElement>('[role="math"]'),
    );
    expect(mathElements.length).toBeGreaterThanOrEqual(50);
    const fallbacks = Array.from(
      container.querySelectorAll<HTMLElement>('[data-math-renderer="text"]'),
    ).map((element) => ({
      expression: element.textContent,
      label: element.getAttribute("aria-label"),
    }));
    expect(fallbacks).toEqual([]);

    for (const element of mathElements) {
      expect(element).toHaveAttribute("data-math-renderer", "katex");
      expect(element.getAttribute("aria-label")?.trim()).not.toBe("");
      expect(element.querySelector(".katex")).not.toBeNull();
    }

    expect(
      screen.getByRole("math", {
        name: "P80 等於零與 PERT 期望值加上標準分數 0.8416 乘以標準差兩者中的較大值。",
      }),
    ).toBeVisible();

    const effortConversionVariables = screen.getByRole("table", {
      name: "人日與人月換算變數",
    });
    expect(
      within(effortConversionVariables).getByText(
        "指定百分位工作量(Percentile Effort)",
      ),
    ).toBeVisible();
    expect(
      within(effortConversionVariables).getByText(
        "每人日工時(Hours per Person-day)",
      ),
    ).toBeVisible();
    expect(
      within(effortConversionVariables).getByText(
        "每人月工作日(Days per Person-month)",
      ),
    ).toBeVisible();
    expect(
      within(effortConversionVariables).getByText(
        "指定百分位人日(Person-days)",
      ),
    ).toBeVisible();
    expect(
      within(effortConversionVariables).getByText(
        "指定百分位人月(Person-months)",
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("math", {
        name: "七十八點九七一三九七一二除以八，等於九點八七一四二四六四人日。",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("math", {
        name: "七十八點九七一三九七一二除以八與二十的乘積，等於零點四九三五七一二三二人月。",
      }),
    ).toBeVisible();
  });
});
