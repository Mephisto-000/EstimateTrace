import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createFictionalExamples } from "@/features/estimation/application/create-estimate";
import { ESTIMATE_STORAGE_KEY } from "@/features/estimation/infrastructure/local-estimate-repository";

import { EstimateListClient } from "./estimate-list-client";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("EstimateListClient", () => {
  it("keeps all local estimates when clear is cancelled and removes them only after confirmation", async () => {
    const user = userEvent.setup();
    const [estimate] = createFictionalExamples({
      createId: (() => {
        let sequence = 0;
        return () =>
          `00000000-0000-4000-8000-${String(++sequence).padStart(12, "0")}`;
      })(),
      now: () => "2026-07-29T04:00:00.000Z",
    });
    if (!estimate) {
      throw new Error("The fictional example fixture is required.");
    }

    window.localStorage.setItem(
      ESTIMATE_STORAGE_KEY,
      JSON.stringify([estimate]),
    );
    const confirm = vi
      .spyOn(window, "confirm")
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    render(<EstimateListClient />);

    const estimateHeading = screen.getByRole("heading", {
      name: estimate.name,
    });
    const clearButton = screen.getByRole("button", {
      name: "清除本機所有資料",
    });

    await user.click(clearButton);

    expect(confirm).toHaveBeenLastCalledWith(
      "確定清除目前瀏覽器的所有案件與自訂內容？這項操作無法復原。",
    );
    expect(estimateHeading).toBeVisible();
    expect(window.localStorage.getItem(ESTIMATE_STORAGE_KEY)).toContain(
      estimate.id,
    );

    await user.click(clearButton);

    expect(confirm).toHaveBeenCalledTimes(2);
    expect(
      screen.queryByRole("heading", { name: estimate.name }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "目前瀏覽器還沒有估算案件" }),
    ).toBeVisible();
    expect(
      screen.getByText("本機案件已全部清除；內建範例仍可重新載入。"),
    ).toBeVisible();
    expect(window.localStorage.getItem(ESTIMATE_STORAGE_KEY)).toBe("[]");
  });
});
