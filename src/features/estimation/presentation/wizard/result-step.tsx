"use client";

import { browserRuntimeServices } from "@/features/estimation/application/estimate-case";
import {
  calculateEstimate,
  type CalculationIssue,
  type QuoteTaxBasis,
  type VendorQuote,
} from "@/features/estimation/domain";
import { exportEstimateJson } from "@/features/import-export/estimate-transfer";

import { downloadJson } from "../browser-download";
import { ResultView } from "./result-view";
import type { WizardStepProps } from "./types";

const issueLabels: Record<CalculationIssue["code"], string> = {
  UNSUPPORTED_MODEL_VERSION: "模型版本不受支援",
  INVALID_PARAMETER_SET: "參數集不合法",
  INVALID_DECIMAL: "數值格式不合法",
  OUT_OF_RANGE: "數值超出允許範圍",
  REQUIRED_VALUE: "缺少必要值",
  DUPLICATE_VALUE: "出現重複值",
  UNKNOWN_VALUE: "出現未知值",
  TOO_MANY_WORK_ITEMS: "工作項目數量超過限制",
};

function quoteWithOptionalFields(
  quote: Pick<VendorQuote, "amount" | "taxBasis">,
  note: string,
  quoteDate: string,
): VendorQuote {
  return {
    ...quote,
    ...(note.trim() ? { note } : {}),
    ...(quoteDate ? { quoteDate } : {}),
  };
}

export function ResultStep({ estimate, updateEstimate }: WizardStepProps) {
  const outcome = calculateEstimate({
    modelVersion: estimate.modelVersion,
    parameterSnapshot: estimate.parameterSnapshot,
    input: estimate.input,
  });

  function updateVendorQuote(
    update: (current: VendorQuote) => VendorQuote,
  ): void {
    updateEstimate((current) => {
      const quote = current.input.vendorQuote ?? {
        amount: "0",
        taxBasis: "TAX_EXCLUSIVE",
      };
      return {
        ...current,
        input: {
          ...current.input,
          vendorQuote: update(quote),
        },
      };
    });
  }

  function clearVendorQuote(): void {
    updateEstimate((current) => ({
      ...current,
      input: { ...current.input, vendorQuote: null },
    }));
  }

  function handleExport(): void {
    if (
      !window.confirm(
        "EstimateTrace 是公開網站。JSON 可能包含案件名稱、範圍、假設和成本數字。請確認沒有公司機密、個人資料、真實乙方名稱、受保密協議（NDA）保護的內容或未公開報價，再儲存或分享。",
      )
    ) {
      return;
    }
    const exported = exportEstimateJson(estimate, browserRuntimeServices.now());
    if (!exported.ok) {
      window.alert(`匯出失敗：${exported.code}（${exported.path}）`);
      return;
    }
    downloadJson(exported.filename, exported.text);
  }

  return (
    <div className="result-stack" id="estimate-result">
      <header className="wizard-heading">
        <p className="eyebrow">步驟 5／5</p>
        <h1 id="wizard-step-title" tabIndex={-1}>
          結果與報價比較
        </h1>
        <p>
          結果會依目前的範圍、工作項目、風險、不確定性和成本條件即時計算。這是可回頭查看的參考值，不是正式報價或採購建議。
        </p>
      </header>
      <p className="visually-hidden" aria-live="polite">
        {outcome.ok
          ? "估算結果已產生，可以查看 P50、P80 和計算過程。"
          : "目前無法產生估算，請依錯誤摘要修正。"}
      </p>

      <section
        className="form-stack"
        aria-labelledby="vendor-quote-title"
        id="vendor-quote"
        data-screen-only="true"
      >
        <div>
          <h2 id="vendor-quote-title">乙方報價（選填）</h2>
          <p className="field__help">
            不要輸入乙方名稱；這裡只比較金額和模型參考區間，不替任何品牌背書，也不提供採購建議。
          </p>
        </div>
        {estimate.input.vendorQuote === null ? (
          <button
            className="button button--secondary"
            type="button"
            onClick={() =>
              updateVendorQuote((quote) => ({
                ...quote,
                amount: "0",
                taxBasis: "TAX_EXCLUSIVE",
              }))
            }
          >
            新增乙方報價
          </button>
        ) : (
          <>
            <div className="form-grid form-grid--three">
              <div className="field">
                <label htmlFor="vendor-quote-amount">報價金額（新臺幣）</label>
                <input
                  id="vendor-quote-amount"
                  type="number"
                  min="0"
                  step="1000"
                  inputMode="decimal"
                  value={estimate.input.vendorQuote.amount}
                  onChange={(event) => {
                    const amount = event.currentTarget.value;
                    updateVendorQuote((quote) => ({ ...quote, amount }));
                  }}
                />
              </div>
              <div className="field">
                <label htmlFor="vendor-quote-tax-basis">稅額基礎</label>
                <select
                  id="vendor-quote-tax-basis"
                  value={estimate.input.vendorQuote.taxBasis}
                  onChange={(event) => {
                    const taxBasis = event.currentTarget.value as QuoteTaxBasis;
                    updateVendorQuote((quote) => ({ ...quote, taxBasis }));
                  }}
                >
                  <option value="TAX_EXCLUSIVE">未稅</option>
                  <option value="TAX_INCLUSIVE">含稅</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="vendor-quote-date">報價日期</label>
                <input
                  id="vendor-quote-date"
                  type="date"
                  value={estimate.input.vendorQuote.quoteDate ?? ""}
                  onChange={(event) => {
                    const quoteDate = event.currentTarget.value;
                    updateVendorQuote((quote) =>
                      quoteWithOptionalFields(
                        quote,
                        quote.note ?? "",
                        quoteDate,
                      ),
                    );
                  }}
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="vendor-quote-note">備註</label>
              <textarea
                id="vendor-quote-note"
                maxLength={1000}
                value={estimate.input.vendorQuote.note ?? ""}
                onChange={(event) => {
                  const note = event.currentTarget.value;
                  updateVendorQuote((quote) =>
                    quoteWithOptionalFields(quote, note, quote.quoteDate ?? ""),
                  );
                }}
              />
            </div>
            <button
              className="button button--danger"
              type="button"
              onClick={clearVendorQuote}
            >
              移除乙方報價
            </button>
          </>
        )}
      </section>

      {!outcome.ok ? (
        <section
          className="form-error-summary"
          role="alert"
          aria-labelledby="calculation-errors-title"
        >
          <h2 id="calculation-errors-title">目前無法產生估算</h2>
          <p>為了避免顯示不可靠的數字，請先回到對應步驟修正：</p>
          <ul>
            {outcome.issues.map((issue) => (
              <li key={`${issue.code}:${issue.path}`}>
                {issueLabels[issue.code]}：{issue.path}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <ResultView
          estimate={estimate}
          result={outcome.result}
          onExport={handleExport}
        />
      )}
    </div>
  );
}
