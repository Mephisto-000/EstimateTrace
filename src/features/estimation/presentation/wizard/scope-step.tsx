"use client";

import { resetToPublicDemoParameters } from "@/features/estimation/application/create-estimate";

import type { WizardStepProps } from "./types";

export function ScopeStep({
  estimate,
  updateEstimate,
  issues,
}: WizardStepProps) {
  const errorFor = (fieldId: string) =>
    issues.find((issue) => issue.fieldId === fieldId);

  return (
    <div className="form-stack" id="scope">
      <header className="wizard-heading">
        <p className="eyebrow">步驟 1／5</p>
        <h1 id="wizard-step-title" tabIndex={-1}>
          範圍與假設
        </h1>
        <p>
          使用中性描述界定範圍。名稱與背景只會保存在目前瀏覽器，但仍不應包含敏感資料。
        </p>
      </header>

      <div className="privacy-banner">
        <strong>公開網站資料提醒</strong>
        <p>
          請勿輸入公司機密、個人資料、真實乙方名稱、受保密協議保護的內容或未公開報價；共享裝置上的其他使用者可能看見本機資料。
        </p>
      </div>

      <div className="workspace-toolbar" data-screen-only="true">
        <button
          className="button button--secondary"
          type="button"
          onClick={() => {
            if (
              window.confirm(
                "確定重設為公開示範參數？這會重設單位工時、跨階段工作量、不確定性與商業參數，但保留範圍、工作項目內容、風險選擇與乙方報價。",
              )
            ) {
              updateEstimate(resetToPublicDemoParameters);
            }
          }}
        >
          重設為公開預設參數
        </button>
      </div>

      <div className="field">
        <label htmlFor="case-name">案件名稱</label>
        <input
          id="case-name"
          value={estimate.name}
          maxLength={200}
          required
          autoComplete="off"
          aria-invalid={Boolean(errorFor("case-name"))}
          aria-describedby={
            errorFor("case-name")
              ? "case-name-help case-name-error"
              : "case-name-help"
          }
          onChange={(event) =>
            updateEstimate((current) => ({
              ...current,
              name: event.currentTarget.value,
            }))
          }
        />
        <span className="field__help" id="case-name-help">
          不要使用真實客戶、乙方或內部系統名稱。
        </span>
        {errorFor("case-name") ? (
          <span className="field__error" id="case-name-error">
            {errorFor("case-name")?.message}
          </span>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="case-description">背景摘要與範圍</label>
        <textarea
          id="case-description"
          value={estimate.description}
          maxLength={1000}
          required
          aria-invalid={Boolean(errorFor("case-description"))}
          aria-describedby={
            errorFor("case-description")
              ? "case-description-help case-description-error"
              : "case-description-help"
          }
          onChange={(event) =>
            updateEstimate((current) => ({
              ...current,
              description: event.currentTarget.value,
            }))
          }
        />
        <span className="field__meta" id="case-description-help">
          {estimate.description.length} / 1,000
          字；請列出假設，不要貼需求書原文。
        </span>
        {errorFor("case-description") ? (
          <span className="field__error" id="case-description-error">
            {errorFor("case-description")?.message}
          </span>
        ) : null}
      </div>

      <fieldset>
        <legend>工時計量假設</legend>
        <p className="field__help">只用於工作量換算；人月不等於日曆月。</p>
        <div className="form-grid form-grid--two">
          <div className="field">
            <label htmlFor="hours-per-day">每人日小時</label>
            <input
              id="hours-per-day"
              type="number"
              min="1"
              max={
                estimate.parameterSnapshot.constraints.maximumHoursPerPersonDay
              }
              step="0.25"
              value={estimate.input.commercialTerms.hoursPerPersonDay}
              aria-invalid={Boolean(errorFor("hours-per-day"))}
              aria-describedby={
                errorFor("hours-per-day") ? "hours-per-day-error" : undefined
              }
              onChange={(event) =>
                updateEstimate((current) => ({
                  ...current,
                  input: {
                    ...current.input,
                    commercialTerms: {
                      ...current.input.commercialTerms,
                      hoursPerPersonDay: event.currentTarget.value,
                    },
                  },
                }))
              }
            />
            {errorFor("hours-per-day") ? (
              <span className="field__error" id="hours-per-day-error">
                {errorFor("hours-per-day")?.message}
              </span>
            ) : null}
          </div>
          <div className="field">
            <label htmlFor="days-per-month">每人月工作日</label>
            <input
              id="days-per-month"
              type="number"
              min="1"
              max={
                estimate.parameterSnapshot.constraints.maximumDaysPerPersonMonth
              }
              step="0.5"
              value={estimate.input.commercialTerms.daysPerPersonMonth}
              aria-invalid={Boolean(errorFor("days-per-month"))}
              aria-describedby={
                errorFor("days-per-month") ? "days-per-month-error" : undefined
              }
              onChange={(event) =>
                updateEstimate((current) => ({
                  ...current,
                  input: {
                    ...current.input,
                    commercialTerms: {
                      ...current.input.commercialTerms,
                      daysPerPersonMonth: event.currentTarget.value,
                    },
                  },
                }))
              }
            />
            {errorFor("days-per-month") ? (
              <span className="field__error" id="days-per-month-error">
                {errorFor("days-per-month")?.message}
              </span>
            ) : null}
          </div>
        </div>
      </fieldset>
    </div>
  );
}
