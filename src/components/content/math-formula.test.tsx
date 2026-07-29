import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MathFormula } from "./math-formula";

afterEach(cleanup);

describe("MathFormula", () => {
  it("renders source-controlled LaTeX as accessible KaTeX math", () => {
    const { container } = render(
      <MathFormula
        expression="H_{i,\mathrm{base}} = q_i \times u_i"
        label="第 i 個工作項目的基礎工時，等於數量乘以每單位工時。"
        display
      />,
    );

    expect(
      screen.getByRole("math", {
        name: "第 i 個工作項目的基礎工時，等於數量乘以每單位工時。",
      }),
    ).toBeVisible();
    expect(container.querySelector(".katex-display")).not.toBeNull();
    expect(container.querySelector(".katex")).not.toBeNull();
  });

  it("falls back to escaped text when the expression is invalid", () => {
    const expression = String.raw`\notACommand{<img src=x onerror=alert(1)>}`;
    const { container } = render(
      <MathFormula expression={expression} label="無效公式的文字替代" />,
    );

    expect(
      screen.getByRole("math", { name: "無效公式的文字替代" }),
    ).toHaveTextContent(expression);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
  });

  it("keeps untrusted KaTeX extensions inert", () => {
    const expression = String.raw`\href{javascript:alert(1)}{\htmlClass{injected}{click}}`;
    const { container } = render(
      <MathFormula expression={expression} label="不可信 extension 測試" />,
    );

    expect(container.querySelector('a[href^="javascript:"]')).toBeNull();
    expect(container.querySelector(".injected")).toBeNull();
    expect(container.querySelector("[onclick], [onerror]")).toBeNull();
  });
});
