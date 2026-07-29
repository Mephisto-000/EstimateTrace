import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, type Request, test } from "@playwright/test";

const estimateName = "虛構權限查詢 E2E";
const estimateDescription =
  "fictional／illustrative：用於自動化驗證的去識別化需求。";
const workItemTitle = "虛構查詢畫面";

async function expectNoSeriousAccessibilityIssues(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const blockingViolations = results.violations
    .filter(
      (violation) =>
        violation.impact === "serious" || violation.impact === "critical",
    )
    .map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      targets: violation.nodes.map((node) => node.target),
    }));

  expect(blockingViolations).toEqual([]);
}

async function createEstimateWithOneItem(page: Page) {
  await page.goto("/");
  await page.getByRole("link", { name: "開始估算", exact: true }).click();

  await expect(
    page.getByRole("heading", { name: "建立估算範圍" }),
  ).toBeVisible();
  await page.getByLabel("案件名稱").fill(estimateName);
  await page.getByLabel("背景摘要").fill(estimateDescription);
  await page.getByRole("button", { name: "建立並拆工作項目" }).click();

  await expect(page).toHaveURL(/\/estimates\/[^/?]+\?step=items$/);
  await expect(
    page.getByRole("heading", { name: "工作項目", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /加入第一筆/ }).click();
  await page.getByLabel("標題", { exact: true }).fill(workItemTitle);
  await page.getByLabel("Quantity", { exact: true }).fill("2");
  await page.getByLabel(/Unit hours/).fill("12");

  await page.getByRole("button", { name: "繼續：風險與交付" }).click();
  await expect(page.getByRole("heading", { name: "風險與交付" })).toBeVisible();

  await page.getByRole("button", { name: "繼續：商業參數" }).click();
  await expect(page.getByRole("heading", { name: "商業參數" })).toBeVisible();

  await page.getByRole("button", { name: "繼續：結果與報價" }).click();
  await expect(
    page.getByRole("heading", { name: "結果與報價比較" }),
  ).toBeVisible();
  await expect(page.getByText("P50 effort", { exact: true })).toBeVisible();
  await expect(page.getByText("P80 effort", { exact: true })).toBeVisible();
  await expect(page.getByText("P50 quote（含稅）")).toBeVisible();
  await expect(page.getByText("P80 quote（含稅）")).toBeVisible();
}

function recordRequests(requests: Request[]) {
  return (request: Request) => {
    requests.push(request);
  };
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
});

test.describe("公開內容", () => {
  test("首頁與方法論公開公式、變數與限制，且無重大 accessibility 問題", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const consoleErrors: string[] = [];
    const failedFontRequests: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });
    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });
    page.on("requestfailed", (request) => {
      if (request.resourceType() === "font") {
        failedFontRequests.push(request.url());
      }
    });

    const homeResponse = await page.goto("/");
    expect(homeResponse).not.toBeNull();
    const headers = homeResponse!.headers();
    expect(headers["content-security-policy"]).toContain("default-src 'self'");
    expect(headers["content-security-policy"]).not.toContain("'unsafe-eval'");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("camera=()");
    expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://estimate-trace.vercel.app",
    );
    const estimatesResponse = await page.request.get("/estimates");
    expect(estimatesResponse.headers()["x-robots-tag"]).toBe(
      "noindex, nofollow, noarchive",
    );
    const robotsResponse = await page.request.get("/robots.txt");
    expect(await robotsResponse.text()).toContain(
      "Sitemap: https://estimate-trace.vercel.app/sitemap.xml",
    );
    const sitemapResponse = await page.request.get("/sitemap.xml");
    expect(await sitemapResponse.text()).toContain(
      "<loc>https://estimate-trace.vercel.app/</loc>",
    );
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "讓每一筆估算，都能被檢查、重算與說明。",
      }),
    ).toBeVisible();
    await expect(
      page.getByText("資料留在瀏覽器", { exact: true }),
    ).toBeVisible();
    await expectNoSeriousAccessibilityIssues(page);

    await page.evaluate(() => {
      (
        window as Window & { __estimateTraceSoftNavProbe?: boolean }
      ).__estimateTraceSoftNavProbe = true;
    });
    await page.locator('a[href="/methodology"]:visible').first().click();
    await expect(page).toHaveURL(/\/methodology$/);
    expect(
      await page.evaluate(
        () =>
          (window as Window & { __estimateTraceSoftNavProbe?: boolean })
            .__estimateTraceSoftNavProbe,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "軟體需求成本估算的公式與定義",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("table", { name: "估算模型主要變數" }),
    ).toBeVisible();
    const methodologyMath = page.locator('[role="math"]');
    expect(await methodologyMath.count()).toBeGreaterThanOrEqual(50);
    await expect(methodologyMath.first()).toBeVisible();
    await expect(methodologyMath.first().locator(".katex")).toBeVisible();
    const displayMathTypography = await page
      .locator(".formula-block .katex")
      .first()
      .evaluate(async (element) => {
        await document.fonts.ready;
        const verticalList = element.querySelector(".vlist-t");
        const mathVariable = element.querySelector(".mathnormal");

        return {
          fontFamily: window.getComputedStyle(element).fontFamily,
          fontSize: Number.parseFloat(
            window.getComputedStyle(element).fontSize,
          ),
          fontLoaded: document.fonts.check('16px "KaTeX_Main"'),
          mathFontFamily: mathVariable
            ? window.getComputedStyle(mathVariable).fontFamily
            : null,
          mathFontStyle: mathVariable
            ? window.getComputedStyle(mathVariable).fontStyle
            : null,
          verticalListDisplay: verticalList
            ? window.getComputedStyle(verticalList).display
            : null,
        };
      });
    expect(displayMathTypography.fontFamily).toContain("KaTeX_Main");
    expect(displayMathTypography.fontSize).toBeGreaterThanOrEqual(30);
    expect(displayMathTypography.fontLoaded).toBe(true);
    expect(displayMathTypography.mathFontFamily).toContain("KaTeX_Math");
    expect(displayMathTypography.mathFontStyle).toBe("italic");
    expect(displayMathTypography.verticalListDisplay).toBe("inline-table");
    const displayFormulaFailures = await page
      .locator(".formula-block")
      .evaluateAll((elements) =>
        elements.flatMap((element, index) => {
          const renderedMath = element.querySelector(".katex");
          const bounds = element.getBoundingClientRect();
          const failures: string[] = [];

          if (
            !renderedMath ||
            Number.parseFloat(window.getComputedStyle(renderedMath).fontSize) <
              30
          ) {
            failures.push(`${index}:display-font`);
          }
          if (
            /\\(?:frac|times|mathrm|sum|prod|sqrt)\b/.test(
              element.textContent ?? "",
            )
          ) {
            failures.push(`${index}:raw-latex`);
          }
          if (bounds.left < -1 || bounds.right > window.innerWidth + 1) {
            failures.push(`${index}:viewport-overflow`);
          }

          return failures;
        }),
      );
    expect(displayFormulaFailures).toEqual([]);
    const loadedKatexFontCount = await page.evaluate(async () => {
      await document.fonts.ready;
      return Array.from(document.fonts).filter(
        (font) => font.family.includes("KaTeX") && font.status === "loaded",
      ).length;
    });
    expect(loadedKatexFontCount).toBeGreaterThan(0);
    await expect(page.locator('[data-math-renderer="text"]')).toHaveCount(0);
    const missingMathLabels = await methodologyMath.evaluateAll(
      (elements) =>
        elements.filter(
          (element) => !(element.getAttribute("aria-label") ?? "").trim(),
        ).length,
    );
    expect(missingMathLabels).toBe(0);
    await expect(
      page.getByRole("heading", { name: "常見 double counting" }),
    ).toBeVisible();
    await expectNoSeriousAccessibilityIssues(page);
    expect(consoleErrors).toEqual([]);
    expect(failedFontRequests).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test("方法論公式在 200% reflow 等效寬度內局部捲動且可鍵盤操作", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 640, height: 900 });
    await page.goto("/methodology");

    const firstFormula = page.locator(".formula-block").first();
    await expect(firstFormula).toBeVisible();
    await firstFormula.focus();
    await expect(firstFormula).toBeFocused();

    const hasDocumentOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(hasDocumentOverflow).toBe(false);
    const overflowingFormulaIndex = await page
      .locator(".formula-block")
      .evaluateAll((elements) =>
        elements.findIndex(
          (element) => element.scrollWidth > element.clientWidth + 1,
        ),
      );
    if (overflowingFormulaIndex >= 0) {
      const overflowingFormula = page
        .locator(".formula-block")
        .nth(overflowingFormulaIndex);
      await expect(overflowingFormula).toHaveAttribute("tabindex", "0");
      expect(
        await overflowingFormula.evaluate(
          (element) => window.getComputedStyle(element).overflowX,
        ),
      ).toBe("auto");
      await overflowingFormula.focus();
      const initialScrollLeft = await overflowingFormula.evaluate(
        (element) => element.scrollLeft,
      );
      await page.keyboard.press("ArrowRight");
      await expect
        .poll(() =>
          overflowingFormula.evaluate((element) => element.scrollLeft),
        )
        .toBeGreaterThan(initialScrollLeft);
    }
    await expect(page.locator('[data-math-renderer="text"]')).toHaveCount(0);
    await expectNoSeriousAccessibilityIssues(page);

    await page.setViewportSize({ width: 360, height: 800 });
    await page.reload();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      ),
    ).toBe(false);
  });

  test("鍵盤可操作錯誤摘要，且 200% reflow 等效寬度無水平溢位", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 640, height: 900 });
    await page.goto("/estimates/new");

    const submit = page.getByRole("button", { name: "建立並拆工作項目" });
    await submit.focus();
    await page.keyboard.press("Enter");

    const errorSummary = page.locator("#new-estimate-errors");
    await expect(errorSummary).toBeFocused();
    await expect(errorSummary).toContainText("案件名稱為必填。");
    await expect(errorSummary).toContainText("背景摘要與 scope 為必填。");
    await expect(page.getByLabel("案件名稱")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(page.getByLabel("背景摘要")).toHaveAttribute(
      "aria-describedby",
      /estimate-description-error/,
    );

    const nameErrorLink = page.getByRole("link", {
      name: "案件名稱為必填。",
    });
    await nameErrorLink.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByLabel("案件名稱")).toBeFocused();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
    await expectNoSeriousAccessibilityIssues(page);
  });
});

test.describe("估算核心流程", () => {
  test("建立估算、加入工作項目並產生 P50／P80 與乙方報價比較", async ({
    page,
  }) => {
    const requests: Request[] = [];
    page.on("request", recordRequests(requests));

    await createEstimateWithOneItem(page);

    await page.getByRole("button", { name: "新增乙方報價" }).click();
    await page.getByLabel("報價金額（TWD）").fill("450000");
    await page.getByLabel("稅額基礎").selectOption("TAX_INCLUSIVE");

    await expect(
      page.getByRole("heading", {
        name: /^(明顯低於模型區間，請檢查漏項或追加風險。|接近模型參考區間。|高於模型 P50，請確認成本來源。|高於模型 P80，建議要求工作量與風險明細。)$/,
      }),
    ).toBeVisible();
    await expect(page.getByText(/乙方報價正規化為未稅/)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Calculation trace", exact: true }),
    ).toBeVisible();
    const firstTrace = page.locator(".trace-list details").first();
    await firstTrace.locator("summary").click();
    const traceFormula = firstTrace.getByRole("math");
    await expect(traceFormula).toHaveAttribute("data-math-renderer", "katex");
    await expect(traceFormula.locator(".katex")).toBeVisible();
    const traceTypography = await traceFormula
      .locator(".katex")
      .evaluate((element) => ({
        fontFamily: window.getComputedStyle(element).fontFamily,
        fontSize: Number.parseFloat(window.getComputedStyle(element).fontSize),
        hasRawLatex: /\\(?:frac|times|mathrm|sum|prod|sqrt)\b/.test(
          element.textContent ?? "",
        ),
      }));
    expect(traceTypography.fontFamily).toContain("KaTeX_Main");
    expect(traceTypography.fontSize).toBeGreaterThanOrEqual(20);
    expect(traceTypography.hasRawLatex).toBe(false);
    await expect(
      page.locator('.trace-list [data-math-renderer="text"]'),
    ).toHaveCount(0);
    const overflowDiagnostics = await page.evaluate(() => {
      const viewportWidth = document.documentElement.clientWidth;
      const overflowingElements = Array.from(
        document.querySelectorAll<HTMLElement>("body *"),
      )
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);

          return {
            selector: [
              element.tagName.toLowerCase(),
              element.id ? `#${element.id}` : "",
              ...Array.from(element.classList, (name) => `.${name}`),
            ].join(""),
            clientWidth: element.clientWidth,
            scrollWidth: element.scrollWidth,
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            overflowX: style.overflowX,
            minWidth: style.minWidth,
          };
        })
        .filter(
          (element) =>
            element.right > viewportWidth + 1 ||
            element.left < -1 ||
            element.scrollWidth > element.clientWidth + 1,
        )
        .slice(0, 20);

      return {
        clientWidth: viewportWidth,
        hasPageOverflow:
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
        overflowingElements,
        scrollWidth: document.documentElement.scrollWidth,
      };
    });
    expect(
      overflowDiagnostics.hasPageOverflow,
      `Horizontal overflow diagnostics: ${JSON.stringify(overflowDiagnostics)}`,
    ).toBe(false);
    await expectNoSeriousAccessibilityIssues(page);

    const transmittedContent = requests
      .map((request) => `${request.url()}\n${request.postData() ?? ""}`)
      .join("\n");
    expect(transmittedContent).not.toContain(estimateName);
    expect(transmittedContent).not.toContain(estimateDescription);
    expect(transmittedContent).not.toContain(workItemTitle);
    expect(transmittedContent).not.toContain("450000");

    await page.emulateMedia({ media: "print" });
    await expect(
      page.getByRole("heading", { name: "Work item breakdown" }),
    ).toBeVisible();
    await expect(page.locator(".site-header")).toBeHidden();
    await expect(
      page.getByRole("button", { name: "匯出可重算 JSON" }),
    ).toBeHidden();
  });

  test("JSON 匯出、清除與重新匯入後保留相同結果", async ({ page }) => {
    test.setTimeout(60_000);
    await createEstimateWithOneItem(page);

    const p50Before = await page
      .locator(".metric")
      .filter({ hasText: "P50 effort" })
      .locator("strong")
      .innerText();
    const p80Before = await page
      .locator(".metric")
      .filter({ hasText: "P80 effort" })
      .locator("strong")
      .innerText();

    page.once("dialog", (dialog) => dialog.accept());
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "匯出可重算 JSON" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.json$/);
    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    await page.goto("/estimates");
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "清除本機所有資料" }).click();
    await expect(
      page.getByRole("heading", { name: "目前瀏覽器還沒有估算案件" }),
    ).toBeVisible();

    await page.locator('input[type="file"]').setInputFiles(downloadPath!);
    await expect(
      page.getByText("匯入成功，重算結果與 snapshot 一致。"),
    ).toBeVisible();
    await page
      .getByRole("heading", { name: estimateName })
      .getByRole("link")
      .click();

    await expect(page).toHaveURL(/\/estimates\/[^/?]+\?step=result$/);
    await expect(
      page
        .locator(".metric")
        .filter({ hasText: "P50 effort" })
        .locator("strong"),
    ).toHaveText(p50Before);
    await expect(
      page
        .locator(".metric")
        .filter({ hasText: "P80 effort" })
        .locator("strong"),
    ).toHaveText(p80Before);
  });

  test("載入兩筆 fictional examples 並跨 reload 保存在此瀏覽器", async ({
    page,
  }) => {
    await page.goto("/estimates");
    await page.getByRole("button", { name: "載入兩筆虛構範例" }).click();

    await expect(
      page.getByText("已載入兩筆 fictional／illustrative 範例。"),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "會員資料查詢與匯出（fictional）",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "公開市場價格批次介接（fictional）",
      }),
    ).toBeVisible();
    await expect(page.getByText("P50 effort", { exact: true })).toHaveCount(2);

    await page.reload();
    await expect(
      page.getByRole("heading", {
        name: "會員資料查詢與匯出（fictional）",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "公開市場價格批次介接（fictional）",
      }),
    ).toBeVisible();
  });

  test("localStorage 寫入失敗時仍可在 session 完成一次計算", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Storage.prototype.setItem = () => {
        throw new DOMException("Simulated quota failure", "QuotaExceededError");
      };
    });

    await page.goto("/estimates/new");
    await page.getByLabel("案件名稱").fill("虛構 storage fallback");
    await page
      .getByLabel("背景摘要")
      .fill("fictional／illustrative：驗證 browser storage failure fallback。");
    await page.getByRole("button", { name: "建立並拆工作項目" }).click();

    await expect(page).toHaveURL("/estimates/new?step=items");
    await expect(
      page.getByRole("heading", { name: "工作項目", exact: true }),
    ).toBeVisible();
    const storageAlert = page
      .getByRole("alert")
      .filter({ hasText: "本機儲存提醒" });
    await expect(storageAlert).toContainText("本機儲存提醒");
    await expect(storageAlert).toContainText("目前 session");

    await page.getByRole("button", { name: /加入第一筆/ }).click();
    await page.getByRole("button", { name: "繼續：風險與交付" }).click();
    await expect(page).toHaveURL(/\/estimates\/[^/?]+\?step=risk$/);
    await page.getByRole("button", { name: "繼續：商業參數" }).click();
    await page.getByRole("button", { name: "繼續：結果與報價" }).click();

    await expect(page.getByText("P50 effort", { exact: true })).toBeVisible();
    await expect(page.getByText("P80 effort", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "匯出可重算 JSON" }),
    ).toBeVisible();
  });
});
