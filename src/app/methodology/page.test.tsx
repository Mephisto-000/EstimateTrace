import { cleanup, render, screen } from "@testing-library/react";
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
        name: "P80 等於零與 PERT 期望值加上 z-score 0.8416 乘以標準差兩者中的較大值。",
      }),
    ).toBeVisible();
  });
});
