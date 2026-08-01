"use client";

import type { CommercialTerms } from "@/features/estimation/domain";

import { percentInputToRatio, ratioToPercentInput } from "../formatters";
import type { WizardStepProps } from "./types";

type CommercialField = keyof CommercialTerms;

const moneyFields = [
  {
    key: "hourlyRate",
    label: "綜合每小時成本（新臺幣／人時）",
    help: "請依投入角色和實際成本調整；這不是公開市場報價。",
  },
  {
    key: "directCost",
    label: "直接成本（新臺幣）",
    help: "例如授權、設備和差旅等可直接算在這個案件的成本。",
  },
  {
    key: "warrantyCost",
    label: "保固與上線後支援成本（新臺幣）",
    help: "固定的保固和上線後支援成本；不要和工時重複計算。",
  },
] as const;

const rateFields = [
  {
    key: "overheadRate",
    label: "管銷間接成本（%）",
    help: "管理、銷售和其他間接成本的比例。",
  },
  {
    key: "vendorMarkupRate",
    label: "乙方成本加成率（%）",
    help: "這是加在成本上的比例，不是用售價計算的毛利率。",
  },
  {
    key: "taxRate",
    label: "稅率（%）",
    help: "預設 5% 只供台灣公開示範，請依實際交易確認。",
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
        <p className="eyebrow">步驟 4／5</p>
        <h1 id="wizard-step-title" tabIndex={-1}>
          商業參數
        </h1>
        <p>
          先從工作量算出成本，再加上管理費、保固、乙方加成和稅率。所有資料只會留在這個瀏覽器，也可以一起匯出成
          JSON。
        </p>
      </header>

      <div className="calculation-warning">
        <strong>公開示範值，不是市場基準</strong>
        <p>
          預設費率和比例只用來說明模型。做正式決策前，請在私有環境使用經授權的薪資、合約、稅務和過往交付資料調整。
        </p>
      </div>

      <section className="form-stack" aria-labelledby="commercial-cost-title">
        <div>
          <h2 id="commercial-cost-title">成本與報價條件</h2>
          <p className="field__help">
            金額以新臺幣輸入；比例欄位用百分比顯示，儲存時會轉成小數。
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
          <h2 id="capacity-title">工作量換算</h2>
          <p className="field__help">
            這只用來把人時換算成人日和人月，不會改變工作量。
          </p>
        </div>
        <div className="form-grid form-grid--two">
          <div className="field">
            <label htmlFor="commercial-hours-per-day">每人日小時</label>
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
            <label htmlFor="commercial-days-per-month">每人月工作日</label>
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
