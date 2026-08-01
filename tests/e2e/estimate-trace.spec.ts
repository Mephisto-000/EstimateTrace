import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, type Request, test } from "@playwright/test";

const estimateName = "虛構權限查詢 E2E";
const estimateDescription = "虛構示意：用於自動化驗證的去識別化需求。";
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

async function expectAllTableCellsLeftAligned(page: Page) {
  const tables = page.getByRole("table");
  expect(await tables.count()).toBeGreaterThan(0);

  const misalignedCells = await page
    .locator("table th, table td")
    .evaluateAll((cells) =>
      cells.flatMap((cell, index) => {
        const textAlign = window.getComputedStyle(cell).textAlign;

        return textAlign === "left"
          ? []
          : [
              {
                index,
                tag: cell.tagName.toLowerCase(),
                text: (cell.textContent ?? "").trim().replace(/\s+/gu, " "),
                textAlign,
              },
            ];
      }),
    );

  expect(misalignedCells).toEqual([]);
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
  await page.getByLabel("數量", { exact: true }).fill("2");
  await page.getByLabel(/每單位工時/).fill("12");

  await page.getByRole("button", { name: "繼續：風險與交付" }).click();
  await expect(page.getByRole("heading", { name: "風險與交付" })).toBeVisible();

  await page.getByRole("button", { name: "繼續：商業參數" }).click();
  await expect(page.getByRole("heading", { name: "商業參數" })).toBeVisible();

  await page.getByRole("button", { name: "繼續：結果與報價" }).click();
  await expect(
    page.getByRole("heading", { name: "結果與報價比較" }),
  ).toBeVisible();
  await expect(page.getByText("P50 工時", { exact: true })).toBeVisible();
  await expect(page.getByText("P80 工時", { exact: true })).toBeVisible();
  await expect(page.getByText("P50 參考報價（含稅）")).toBeVisible();
  await expect(page.getByText("P80 參考報價（含稅）")).toBeVisible();
}

function recordRequests(requests: Request[]) {
  return (request: Request) => {
    requests.push(request);
  };
}

const estimatePathPattern =
  /^\/estimates\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

function isEstimateRscRequest(request: Request) {
  return (
    estimatePathPattern.test(new URL(request.url()).pathname) &&
    request.resourceType() === "fetch" &&
    request.headers().rsc === "1"
  );
}

function isRscPrefetch(request: Request) {
  return (
    request.resourceType() === "fetch" &&
    request.headers().rsc === "1" &&
    request.headers()["next-router-prefetch"] === "1"
  );
}

function requestDiagnostics(requests: readonly Request[]) {
  return requests.map((request) => ({
    method: request.method(),
    resourceType: request.resourceType(),
    url: request.url(),
    rsc: request.headers().rsc,
    prefetch: request.headers()["next-router-prefetch"],
  }));
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
});

test.describe("公開內容", () => {
  test("公開頁背景預抓取只保留主要建立估算行動", async ({ context }) => {
    for (const path of [
      "/",
      "/methodology",
      "/examples",
      "/about",
      "/privacy",
    ]) {
      const probePage = await context.newPage();
      const requests: Request[] = [];
      probePage.on("request", recordRequests(requests));
      await probePage.goto(path);
      await probePage.getByRole("main").waitFor();
      await probePage.waitForTimeout(500);

      const prefetches = requests.filter(isRscPrefetch);
      const nonCriticalPrefetches = prefetches.filter(
        (request) => new URL(request.url()).pathname !== "/estimates/new",
      );

      expect(
        requestDiagnostics(nonCriticalPrefetches),
        `Unexpected background prefetches from ${path}`,
      ).toEqual([]);
      expect(
        prefetches.length,
        `Too many background prefetches from ${path}: ${JSON.stringify(
          requestDiagnostics(prefetches),
        )}`,
      ).toBeLessThanOrEqual(6);
      await probePage.close();
    }
  });

  test("主要頁面使用繁體中文，完整中英對照集中在公式與定義", async ({
    page,
  }) => {
    const legacyMixedLanguageCopy = [
      "Traceable software estimation",
      "Explainability first",
      "About EstimateTrace",
      "Privacy by design",
      "Fictional examples",
      "Browser-only workspace",
    ];

    for (const path of ["/", "/about", "/privacy", "/examples", "/estimates"]) {
      await page.goto(path);
      const visibleCopy = await page.locator("body").innerText();

      for (const legacyCopy of legacyMixedLanguageCopy) {
        expect(visibleCopy).not.toContain(legacyCopy);
      }
    }

    await page.goto("/methodology");
    const terminologyTable = page.getByRole("table", {
      name: "估算名詞中英對照",
    });
    await expect(terminologyTable).toBeVisible();
    await expect(terminologyTable).toContainText("工作項目(Work Item)");
    await expect(terminologyTable).toContainText("風險因子(Risk Factor)");
    await expect(terminologyTable).toContainText(
      "跨階段工作量(Cross-cutting Effort)",
    );
  });

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
        name: "軟體需求估算參考",
      }),
    ).toBeVisible();
    await expect(page.locator(".hero__privacy-note")).toHaveText(
      "無需登入 · 資料只留在瀏覽器",
    );
    for (const removedCopy of [
      "可追溯的軟體估算",
      "不啟用使用分析",
      "一條清楚的估算路徑",
      "可說明性優先",
      "準備開始",
    ]) {
      await expect(page.getByText(removedCopy, { exact: true })).toHaveCount(0);
    }
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
      page.getByRole("heading", { name: "常見重複計算" }),
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
    await expect(errorSummary).toContainText("請填寫案件名稱。");
    await expect(errorSummary).toContainText("請填寫背景摘要與範圍。");
    await expect(page.getByLabel("案件名稱")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(page.getByLabel("背景摘要")).toHaveAttribute(
      "aria-describedby",
      /estimate-description-error/,
    );

    const nameErrorLink = page.getByRole("link", {
      name: "請填寫案件名稱。",
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

test.describe("表格排版", () => {
  test("方法論與估算結果的表頭和內容皆靠左對齊", async ({ page }) => {
    await page.goto("/methodology");
    await expectAllTableCellsLeftAligned(page);

    await createEstimateWithOneItem(page);
    await expectAllTableCellsLeftAligned(page);

    const methodologyLink = page.locator('main a[href="/methodology"]');
    await expect(methodologyLink).toHaveCount(1);
    await expect(methodologyLink).toBeVisible();
    await methodologyLink.focus();
    await methodologyLink.press("Enter");
    await expect(page).toHaveURL(/\/methodology$/);
    await expectAllTableCellsLeftAligned(page);
  });
});

test.describe("估算核心流程", () => {
  test("案件網址使用可快取的靜態殼層，且內容維持不被索引", async ({ page }) => {
    const estimateId = "11111111-1111-7111-8111-111111111111";
    const response = await page.goto(`/estimates/${estimateId}?step=scope`);

    expect(response).not.toBeNull();
    expect(response!.headers()["cache-control"] ?? "").not.toMatch(
      /\b(?:private|no-store)\b/u,
    );
    expect(response!.headers()["x-robots-tag"]).toBe(
      "noindex, nofollow, noarchive",
    );
    await expect(page).toHaveURL(
      new RegExp(`/estimates/${estimateId}\\?step=scope$`, "u"),
    );
    await expect(
      page.getByRole("heading", { name: "這個瀏覽器找不到案件" }),
    ).toBeVisible();
  });

  test("估算清單不預抓案件，編輯器不背景預抓 RSC", async ({ page }) => {
    const requests: Request[] = [];
    page.on("request", recordRequests(requests));

    await page.goto("/estimates");
    await page.getByRole("button", { name: "載入兩筆虛構範例" }).click();

    const estimateHeading = page.getByRole("heading", {
      name: "會員資料查詢與匯出（虛構）",
    });
    await expect(estimateHeading).toBeVisible();
    await estimateHeading.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const listPrefetches = requests.filter(isEstimateRscRequest);
    const estimateHref = await estimateHeading
      .getByRole("link")
      .getAttribute("href");
    expect(estimateHref).not.toBeNull();

    requests.length = 0;
    await page.goto(estimateHref!);
    await expect(
      page.getByRole("heading", { name: "結果與報價比較" }),
    ).toBeVisible();
    const firstTrace = page.locator(".trace-list details").first();
    await firstTrace.locator("summary").click();
    await firstTrace.getByRole("link").scrollIntoViewIfNeeded();
    await page.locator(".wizard-actions").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const editorPrefetches = requests.filter(isRscPrefetch);

    expect({
      list: requestDiagnostics(listPrefetches),
      editor: requestDiagnostics(editorPrefetches),
    }).toEqual({ list: [], editor: [] });
  });

  test("切換估算步驟只更新本機網址與畫面，不發送網路請求", async ({ page }) => {
    await page.goto("/estimates");
    await page.getByRole("button", { name: "載入兩筆虛構範例" }).click();

    await page
      .getByRole("heading", {
        name: "會員資料查詢與匯出（虛構）",
      })
      .getByRole("link")
      .click();
    await expect(
      page.getByRole("heading", { name: "結果與報價比較" }),
    ).toBeVisible();
    await page.waitForLoadState("networkidle");

    const estimatePath = new URL(page.url()).pathname;
    const requests: Request[] = [];
    page.on("request", recordRequests(requests));

    await page.getByRole("link", { name: /範圍與假設/u }).click();

    await expect(page).toHaveURL(
      new RegExp(
        `${estimatePath.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}\\?step=scope$`,
        "u",
      ),
    );
    await expect(
      page.getByRole("heading", { name: "範圍與假設", exact: true }),
    ).toBeVisible();

    expect(requestDiagnostics(requests)).toEqual([]);
  });

  test("建立估算、加入工作項目並產生 P50／P80 與乙方報價比較", async ({
    page,
  }) => {
    const requests: Request[] = [];
    page.on("request", recordRequests(requests));

    await createEstimateWithOneItem(page);

    await page.getByRole("button", { name: "新增乙方報價" }).click();
    await page.getByLabel("報價金額（新臺幣）").fill("450000");
    await page.getByLabel("稅額基礎").selectOption("TAX_INCLUSIVE");

    await expect(
      page.getByRole("heading", {
        name: /^(明顯低於模型區間，請確認是否漏算項目或風險。|接近模型參考區間。|高於模型 P50，請確認成本來源。|高於模型 P80，建議確認工作量和風險明細。)$/,
      }),
    ).toBeVisible();
    await expect(page.getByText(/乙方報價換算為未稅後是/)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "計算軌跡", exact: true }),
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
      const containingOverflowValues = new Set([
        "auto",
        "clip",
        "hidden",
        "scroll",
      ]);
      const getSelector = (element: HTMLElement) =>
        [
          element.tagName.toLowerCase(),
          element.id ? `#${element.id}` : "",
          ...Array.from(element.classList, (name) => `.${name}`),
        ].join("");
      const overflowingElements = Array.from(
        document.querySelectorAll<HTMLElement>("body *"),
      )
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          let clippingAncestor: string | null = null;
          let ancestor = element.parentElement;

          while (ancestor && ancestor !== document.body) {
            const ancestorStyle = window.getComputedStyle(ancestor);
            if (containingOverflowValues.has(ancestorStyle.overflowX)) {
              clippingAncestor = getSelector(ancestor);
              break;
            }
            ancestor = ancestor.parentElement;
          }

          return {
            selector: getSelector(element),
            clientWidth: element.clientWidth,
            scrollWidth: element.scrollWidth,
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            overflowX: style.overflowX,
            minWidth: style.minWidth,
            clippingAncestor,
            text: (element.textContent ?? "")
              .trim()
              .replace(/\s+/gu, " ")
              .slice(0, 120),
          };
        })
        .filter(
          (element) =>
            !element.clippingAncestor &&
            (element.right > viewportWidth + 1 ||
              element.left < -1 ||
              (element.scrollWidth > element.clientWidth + 1 &&
                !containingOverflowValues.has(element.overflowX))),
        )
        .slice(0, 50);

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
      page.getByRole("heading", { name: "工作項目分解" }),
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
      .filter({ hasText: "P50 工時" })
      .locator("strong")
      .innerText();
    const p80Before = await page
      .locator(".metric")
      .filter({ hasText: "P80 工時" })
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
      page.getByRole("heading", { name: "這個瀏覽器還沒有估算案件" }),
    ).toBeVisible();

    await page.locator('input[type="file"]').setInputFiles(downloadPath!);
    await expect(
      page.getByText("匯入成功，重新計算的結果和儲存結果一致。"),
    ).toBeVisible();
    await page
      .getByRole("heading", { name: estimateName })
      .getByRole("link")
      .click();

    await expect(page).toHaveURL(/\/estimates\/[^/?]+\?step=result$/);
    await expect(
      page.locator(".metric").filter({ hasText: "P50 工時" }).locator("strong"),
    ).toHaveText(p50Before);
    await expect(
      page.locator(".metric").filter({ hasText: "P80 工時" }).locator("strong"),
    ).toHaveText(p80Before);
  });

  test("載入兩筆虛構範例並在重新載入後保存在此瀏覽器", async ({ page }) => {
    await page.goto("/estimates");
    await page.getByRole("button", { name: "載入兩筆虛構範例" }).click();

    await expect(page.getByText("已載入兩筆虛構範例。")).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "會員資料查詢與匯出（虛構）",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "公開市場價格批次介接（虛構）",
      }),
    ).toBeVisible();
    await expect(page.getByText("P50 工時", { exact: true })).toHaveCount(2);

    await page.reload();
    await expect(
      page.getByRole("heading", {
        name: "會員資料查詢與匯出（虛構）",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "公開市場價格批次介接（虛構）",
      }),
    ).toBeVisible();
  });

  test("瀏覽器本機儲存失敗時仍可在本次操作完成一次計算", async ({ page }) => {
    await page.addInitScript(() => {
      Storage.prototype.setItem = () => {
        throw new DOMException("Simulated quota failure", "QuotaExceededError");
      };
    });

    await page.goto("/estimates/new");
    await page.getByLabel("案件名稱").fill("虛構本機儲存備援");
    await page
      .getByLabel("背景摘要")
      .fill("虛構示意：驗證瀏覽器本機儲存失敗時的備援流程。");
    await page.getByRole("button", { name: "建立並拆工作項目" }).click();

    await expect(page).toHaveURL("/estimates/new?step=items");
    await expect(
      page.getByRole("heading", { name: "工作項目", exact: true }),
    ).toBeVisible();
    const storageAlert = page
      .getByRole("alert")
      .filter({ hasText: "本機儲存提醒" });
    await expect(storageAlert).toContainText("本機儲存提醒");
    await expect(storageAlert).toContainText("這次");

    await page.getByRole("button", { name: /加入第一筆/ }).click();
    await page.getByRole("button", { name: "繼續：風險與交付" }).click();
    await expect(page).toHaveURL(/\/estimates\/[^/?]+\?step=risk$/);
    await page.getByRole("button", { name: "繼續：商業參數" }).click();
    await page.getByRole("button", { name: "繼續：結果與報價" }).click();

    await expect(page.getByText("P50 工時", { exact: true })).toBeVisible();
    await expect(page.getByText("P80 工時", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "匯出可重算 JSON" }),
    ).toBeVisible();
  });
});
