import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createFictionalExamples } from "@/features/estimation/application/create-estimate";
import {
  ESTIMATE_STORAGE_KEY,
  LocalEstimateRepository,
} from "@/features/estimation/infrastructure/local-estimate-repository";
import { exportEstimateJson } from "@/features/import-export/estimate-transfer";

import { EstimateListClient } from "./estimate-list-client";

const testState = vi.hoisted(() => ({
  calculateCalls: 0,
  repository: null as unknown,
}));

vi.mock("@/features/estimation/domain", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/estimation/domain")>();

  return {
    ...actual,
    calculateEstimate: (
      ...args: Parameters<typeof actual.calculateEstimate>
    ) => {
      testState.calculateCalls += 1;
      return actual.calculateEstimate(...args);
    },
  };
});

vi.mock("./browser-download", () => ({
  downloadJson: vi.fn(),
}));

vi.mock("./use-browser-estimate-repository", () => ({
  useBrowserEstimateRepository: () => ({
    hydrated: true,
    repository: testState.repository,
  }),
}));

class TestStorage implements Storage {
  readonly values = new Map<string, string>();
  throwOnWrite = false;

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    if (this.throwOnWrite) {
      throw new DOMException("quota", "QuotaExceededError");
    }
    this.values.set(key, value);
  }
}

function createExample() {
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
  return estimate;
}

function useStoredExample() {
  const storage = new TestStorage();
  const estimate = createExample();
  storage.setItem(ESTIMATE_STORAGE_KEY, JSON.stringify([estimate]));
  const repository = new LocalEstimateRepository(storage);
  testState.repository = repository;
  return { estimate, repository, storage };
}

function jsonFile(text: string) {
  const file = new File([text], "estimate.json", {
    type: "application/json",
  });
  Object.defineProperty(file, "text", {
    value: () => Promise.resolve(text),
  });
  return file;
}

beforeEach(() => {
  testState.calculateCalls = 0;
  testState.repository = new LocalEstimateRepository(new TestStorage());
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("EstimateListClient", () => {
  it("keeps all local estimates when clear is cancelled and removes them only after confirmation", async () => {
    const user = userEvent.setup();
    const { estimate, storage } = useStoredExample();
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
      "確定要清除目前瀏覽器的所有案件和自訂內容嗎？這個動作無法復原。",
    );
    expect(estimateHeading).toBeVisible();
    expect(storage.getItem(ESTIMATE_STORAGE_KEY)).toContain(estimate.id);

    await user.click(clearButton);

    expect(confirm).toHaveBeenCalledTimes(2);
    expect(
      screen.queryByRole("heading", { name: estimate.name }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "這個瀏覽器還沒有估算案件" }),
    ).toBeVisible();
    expect(
      screen.getByText("已清除所有本機案件；仍可重新載入內建範例。"),
    ).toBeVisible();
    expect(storage.getItem(ESTIMATE_STORAGE_KEY)).toBe("[]");
  });

  it("刪除無法持久化時只宣告本次操作狀態，不宣稱永久刪除", async () => {
    const user = userEvent.setup();
    const { estimate, storage } = useStoredExample();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<EstimateListClient />);
    storage.throwOnWrite = true;

    await user.click(screen.getByRole("button", { name: "刪除" }));

    expect(
      screen.queryByRole("heading", { name: estimate.name }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "案件只從這次操作移除；因瀏覽器無法儲存，重新開啟後可能還會出現。",
      ),
    ).toBeVisible();
    expect(storage.getItem(ESTIMATE_STORAGE_KEY)).toContain(estimate.id);
  });

  it("清除無法持久化時只宣告本次操作狀態，不宣稱永久清除", async () => {
    const user = userEvent.setup();
    const { estimate, storage } = useStoredExample();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<EstimateListClient />);
    storage.throwOnWrite = true;

    await user.click(screen.getByRole("button", { name: "清除本機所有資料" }));

    expect(
      screen.queryByRole("heading", { name: estimate.name }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "案件只從這次操作清除；因瀏覽器無法儲存，重新開啟後可能還會出現。",
      ),
    ).toBeVisible();
    expect(storage.getItem(ESTIMATE_STORAGE_KEY)).toContain(estimate.id);
  });

  it("匯入相同識別碼時必須確認取代，取消後既有案件不變", async () => {
    const user = userEvent.setup();
    const { estimate, repository } = useStoredExample();
    const replacement = {
      ...estimate,
      name: "匯入後的新名稱",
    };
    const exported = exportEstimateJson(
      replacement,
      "2026-07-29T09:00:00.000Z",
    );
    expect(exported.ok).toBe(true);
    if (!exported.ok) {
      return;
    }
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<EstimateListClient />);

    await user.upload(
      screen.getByLabelText("匯入 JSON"),
      jsonFile(exported.text),
    );

    expect(confirm).toHaveBeenCalledWith(
      `匯入檔和「${estimate.name}」使用相同案件識別碼。要用匯入內容取代原本的案件嗎？`,
    );
    expect(
      await screen.findByText("已取消匯入，原本的案件沒有變更。"),
    ).toBeVisible();
    expect(repository.getById(estimate.id)?.name).toBe(estimate.name);
    expect(
      screen.queryByRole("heading", { name: replacement.name }),
    ).not.toBeInTheDocument();
  });

  it("將匯入的 HTML-like metadata 當純文字呈現", async () => {
    const user = userEvent.setup();
    const { estimate } = useStoredExample();
    const maliciousName =
      '<img src="x" onerror="window.__estimateTraceXss = true">';
    const imported = {
      ...estimate,
      id: "00000000-0000-4000-8000-999999999999",
      name: maliciousName,
      description: "<script>window.__estimateTraceXss = true</script>",
    };
    const exported = exportEstimateJson(imported, "2026-07-29T09:00:00.000Z");
    expect(exported.ok).toBe(true);
    if (!exported.ok) {
      return;
    }
    render(<EstimateListClient />);

    await user.upload(
      screen.getByLabelText("匯入 JSON"),
      jsonFile(exported.text),
    );

    expect(
      await screen.findByRole("heading", { name: maliciousName }),
    ).toBeVisible();
    expect(document.querySelector('img[src="x"]')).toBeNull();
    expect(document.querySelector("script")).toBeNull();
  });

  it("message-only render 不重算既有案件", async () => {
    const user = userEvent.setup();
    useStoredExample();
    render(<EstimateListClient />);
    const calculationCountAfterInitialRender = testState.calculateCalls;

    await user.upload(
      screen.getByLabelText("匯入 JSON"),
      jsonFile("{not-json"),
    );

    expect(
      await screen.findByText(
        "匯入失敗（MALFORMED_JSON，$），原本的案件沒有變更。",
      ),
    ).toBeVisible();
    expect(testState.calculateCalls).toBe(calculationCountAfterInitialRender);
  });
});
