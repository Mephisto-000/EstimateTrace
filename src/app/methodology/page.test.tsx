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
  });
});
