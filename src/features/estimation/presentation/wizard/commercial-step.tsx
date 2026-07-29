"use client";

import type { CommercialTerms } from "@/features/estimation/domain";

import { percentInputToRatio, ratioToPercentInput } from "../formatters";
import type { WizardStepProps } from "./types";

type CommercialField = keyof CommercialTerms;

const moneyFields = [
  {
    key: "hourlyRate",
    label: "Blended hourly rate（TWD／person-hour）",
    help: "依投入角色與實際成本結構校準；不是公開市場報價。",
  },
  {
    key: "directCost",
    label: "Direct cost（TWD）",
    help: "授權、設備、差旅等可直接歸屬本案的成本。",
  },
  {
    key: "warrantyCost",
    label: "Warranty／hypercare cost（TWD）",
    help: "固定保固與上線後支援成本；不要與工時重複計入。",
  },
] as const;

const rateFields = [
  {
    key: "overheadRate",
    label: "Overhead（%）",
    help: "管銷與間接成本比例。",
  },
  {
    key: "vendorMarkupRate",
    label: "Vendor markup（%）",
    help: "成本加成率（markup），不是 Gross Margin。",
  },
  {
    key: "taxRate",
    label: "Tax rate（%）",
    help: "預設 5% 僅供台灣公開示範，請依交易情境確認。",
  },
] as const;

export function CommercialStep({
  estimate,
  updateEstimate,
  issues,
}: WizardStepProps) {
  const errorFor = (fieldId: string) =>
    issues.find((issue) => issue.fieldId === fieldId);

  function updateTerm(field: CommercialField, value: string) {
    updateEstimate((current) => ({
      ...current,
      input: {
        ...current.input,
        commercialTerms: {
          ...current.input.commercialTerms,
          [field]: value,
        },
      },
    }));
  }

  return (
    <div className="form-stack" id="commercial-terms">
      <header className="wizard-heading">
        <p className="eyebrow">Step 4 of 5</p>
        <h1 id="wizard-step-title" tabIndex={-1}>
          商業參數
        </h1>
        <p>
          先由 effort 推導成本，再依序套用 overhead、warranty、markup 與
          tax。所有值只保存在這個瀏覽器，且可隨 JSON 一起匯出。
        </p>
      </header>

      <div className="calculation-warning">
        <strong>公開示範參數，不是市場基準</strong>
        <p>
          預設 rate 與比例只用來解釋模型。正式決策前，請以組織實際薪資、
          合約、稅務與歷史交付資料校準。
        </p>
      </div>

      <section className="form-stack" aria-labelledby="commercial-cost-title">
        <div>
          <h2 id="commercial-cost-title">成本與報價條件</h2>
          <p className="field__help">
            金額以 TWD 輸入；比例欄位在畫面用百分比，儲存時轉為 decimal ratio。
          </p>
        </div>
        <div className="form-grid form-grid--three">
          {moneyFields.map((field) => (
            <div className="field" key={field.key}>
              <label htmlFor={`commercial-${field.key}`}>{field.label}</label>
              <input
                id={`commercial-${field.key}`}
                type="number"
                min="0"
                max={estimate.parameterSnapshot.constraints.maximumMoney}
                step={field.key === "hourlyRate" ? "100" : "1000"}
                inputMode="decimal"
                value={estimate.input.commercialTerms[field.key]}
                aria-invalid={Boolean(errorFor(`commercial-${field.key}`))}
                aria-describedby={
                  errorFor(`commercial-${field.key}`)
                    ? `commercial-${field.key}-help commercial-${field.key}-error`
                    : `commercial-${field.key}-help`
                }
                onChange={(event) =>
                  updateTerm(field.key, event.currentTarget.value)
                }
              />
              <span className="field__help" id={`commercial-${field.key}-help`}>
                {field.help}
              </span>
              {errorFor(`commercial-${field.key}`) ? (
                <span
                  className="field__error"
                  id={`commercial-${field.key}-error`}
                >
                  {errorFor(`commercial-${field.key}`)?.message}
                </span>
              ) : null}
            </div>
          ))}
        </div>
        <div className="form-grid form-grid--three">
          {rateFields.map((field) => (
            <div className="field" key={field.key}>
              <label htmlFor={`commercial-${field.key}`}>{field.label}</label>
              <input
                id={`commercial-${field.key}`}
                type="number"
                min="0"
                max={ratioToPercentInput(
                  estimate.parameterSnapshot.constraints.maximumCommercialRate,
                )}
                step="0.5"
                inputMode="decimal"
                value={ratioToPercentInput(
                  estimate.input.commercialTerms[field.key],
                )}
                aria-invalid={Boolean(errorFor(`commercial-${field.key}`))}
                aria-describedby={
                  errorFor(`commercial-${field.key}`)
                    ? `commercial-${field.key}-help commercial-${field.key}-error`
                    : `commercial-${field.key}-help`
                }
                onChange={(event) =>
                  updateTerm(
                    field.key,
                    percentInputToRatio(event.currentTarget.value),
                  )
                }
              />
              <span className="field__help" id={`commercial-${field.key}-help`}>
                {field.help}
              </span>
              {errorFor(`commercial-${field.key}`) ? (
                <span
                  className="field__error"
                  id={`commercial-${field.key}-error`}
                >
                  {errorFor(`commercial-${field.key}`)?.message}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="form-stack" aria-labelledby="capacity-title">
        <div>
          <h2 id="capacity-title">Capacity conversion</h2>
          <p className="field__help">
            只用於將 person-hour 換算為 person-day／person-month，不改變
            effort。
          </p>
        </div>
        <div className="form-grid form-grid--two">
          <div className="field">
            <label htmlFor="commercial-hours-per-day">
              Hours per person-day
            </label>
            <input
              id="commercial-hours-per-day"
              type="number"
              min="0.25"
              max={
                estimate.parameterSnapshot.constraints.maximumHoursPerPersonDay
              }
              step="0.25"
              inputMode="decimal"
              value={estimate.input.commercialTerms.hoursPerPersonDay}
              aria-invalid={Boolean(errorFor("commercial-hours-per-day"))}
              aria-describedby={
                errorFor("commercial-hours-per-day")
                  ? "commercial-hours-per-day-error"
                  : undefined
              }
              onChange={(event) =>
                updateTerm("hoursPerPersonDay", event.currentTarget.value)
              }
            />
            {errorFor("commercial-hours-per-day") ? (
              <span
                className="field__error"
                id="commercial-hours-per-day-error"
              >
                {errorFor("commercial-hours-per-day")?.message}
              </span>
            ) : null}
          </div>
          <div className="field">
            <label htmlFor="commercial-days-per-month">
              Days per person-month
            </label>
            <input
              id="commercial-days-per-month"
              type="number"
              min="1"
              max={
                estimate.parameterSnapshot.constraints.maximumDaysPerPersonMonth
              }
              step="0.5"
              inputMode="decimal"
              value={estimate.input.commercialTerms.daysPerPersonMonth}
              aria-invalid={Boolean(errorFor("commercial-days-per-month"))}
              aria-describedby={
                errorFor("commercial-days-per-month")
                  ? "commercial-days-per-month-error"
                  : undefined
              }
              onChange={(event) =>
                updateTerm("daysPerPersonMonth", event.currentTarget.value)
              }
            />
            {errorFor("commercial-days-per-month") ? (
              <span
                className="field__error"
                id="commercial-days-per-month-error"
              >
                {errorFor("commercial-days-per-month")?.message}
              </span>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
