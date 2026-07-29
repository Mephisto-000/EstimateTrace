"use client";

import Decimal from "decimal.js";

import type {
  CrossCuttingPhase,
  RiskFactorId,
  RiskLevel,
} from "@/features/estimation/domain";

import {
  formatRatio,
  percentInputToRatio,
  ratioToPercentInput,
} from "../formatters";
import type { WizardStepProps } from "./types";

const riskLevelLabels: Record<RiskLevel, string> = {
  LOW: "Low",
  NOMINAL: "Nominal",
  HIGH: "High",
  VERY_HIGH: "Very High",
};

export function RiskStep({
  estimate,
  updateEstimate,
  issues,
}: WizardStepProps) {
  const errorFor = (fieldId: string) =>
    issues.find((issue) => issue.fieldId === fieldId);
  const uncertaintyPreset =
    estimate.parameterSnapshot.uncertaintyParameters.find(
      (entry) =>
        entry.downsideRate === estimate.input.uncertainty.downsideRate &&
        entry.upsideRate === estimate.input.uncertainty.upsideRate,
    )?.level ?? "CUSTOM";

  const totalPhaseLoading = Object.values(estimate.input.phaseLoading).reduce(
    (total, value) => {
      try {
        return total.add(value || "0");
      } catch {
        return total;
      }
    },
    new Decimal(0),
  );

  function updateRisk(
    id: RiskFactorId,
    field: "level" | "rationale",
    value: string,
  ) {
    updateEstimate((current) => ({
      ...current,
      input: {
        ...current.input,
        riskProfile: {
          ...current.input.riskProfile,
          [id]: {
            ...current.input.riskProfile[id],
            [field]: value,
          },
        },
      },
    }));
  }

  function updatePhase(phase: CrossCuttingPhase, percentage: string) {
    updateEstimate((current) => ({
      ...current,
      input: {
        ...current.input,
        phaseLoading: {
          ...current.input.phaseLoading,
          [phase]: percentInputToRatio(percentage),
        },
      },
    }));
  }

  return (
    <div className="form-stack" id="risk-factors">
      <header className="wizard-heading">
        <p className="eyebrow">Step 3 of 5</p>
        <h1 id="wizard-step-title" tabIndex={-1}>
          風險與交付
        </h1>
        <p>
          Risk level 是案件層級的選擇；只有 work item 明確勾選的 factor
          才會套用該 multiplier。
        </p>
      </header>

      <section className="form-stack" aria-labelledby="risk-profile-title">
        <div>
          <h2 id="risk-profile-title">Risk Factor Questionnaire</h2>
          <p className="field__help">
            所有係數都是公開示範值，請記錄 rationale，不要只選乘數。
          </p>
        </div>
        <div className="result-grid">
          {estimate.parameterSnapshot.riskFactors.map((factor) => {
            const selection = estimate.input.riskProfile[factor.id];
            return (
              <fieldset key={factor.id}>
                <legend>{factor.displayName}</legend>
                <p className="field__help">{factor.description}</p>
                <div className="field">
                  <label htmlFor={`risk-level-${factor.id}`}>Level</label>
                  <select
                    id={`risk-level-${factor.id}`}
                    value={selection.level}
                    onChange={(event) =>
                      updateRisk(factor.id, "level", event.currentTarget.value)
                    }
                  >
                    {(Object.keys(riskLevelLabels) as RiskLevel[]).map(
                      (level) => (
                        <option key={level} value={level}>
                          {riskLevelLabels[level]} × {factor.multipliers[level]}
                        </option>
                      ),
                    )}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor={`risk-rationale-${factor.id}`}>
                    選擇理由
                  </label>
                  <textarea
                    id={`risk-rationale-${factor.id}`}
                    value={selection.rationale}
                    maxLength={1000}
                    onChange={(event) =>
                      updateRisk(
                        factor.id,
                        "rationale",
                        event.currentTarget.value,
                      )
                    }
                  />
                </div>
              </fieldset>
            );
          })}
        </div>
      </section>

      <section
        className="form-stack"
        id="phase-loading"
        aria-labelledby="phase-title"
      >
        <div>
          <h2 id="phase-title">Cross-cutting Effort</h2>
          <p>
            每個 phase 以未標記「已包含」的 adjusted implementation effort
            為分母。合計示範 loading：
            {formatRatio(totalPhaseLoading.toString())}。
          </p>
        </div>
        <div className="calculation-warning">
          <strong>避免 double counting</strong>
          <p>
            `TESTING`、`DEPLOYMENT`、`DOCUMENTATION` item 預設排除對應 phase；若
            unit effort 已含其他 phase，請回工作項目勾選。
          </p>
        </div>
        {errorFor("phase-loading") ? (
          <p className="field__error" id="phase-loading-error">
            {errorFor("phase-loading")?.message}
          </p>
        ) : null}
        <div className="form-grid form-grid--two">
          {estimate.parameterSnapshot.phaseLoadingParameters.map((phase) => (
            <div className="field" key={phase.phase}>
              <label htmlFor={`phase-${phase.phase}`}>
                {phase.displayName}（%）
              </label>
              <input
                id={`phase-${phase.phase}`}
                type="number"
                min="0"
                max={ratioToPercentInput(
                  estimate.parameterSnapshot.constraints
                    .maximumPhaseLoadingRate,
                )}
                step="0.5"
                value={ratioToPercentInput(
                  estimate.input.phaseLoading[phase.phase],
                )}
                aria-invalid={Boolean(errorFor(`phase-${phase.phase}`))}
                aria-describedby={
                  errorFor(`phase-${phase.phase}`)
                    ? `phase-${phase.phase}-help phase-${phase.phase}-error`
                    : `phase-${phase.phase}-help`
                }
                onChange={(event) =>
                  updatePhase(phase.phase, event.currentTarget.value)
                }
              />
              <span className="field__help" id={`phase-${phase.phase}-help`}>
                {phase.description}
              </span>
              {errorFor(`phase-${phase.phase}`) ? (
                <span
                  className="field__error"
                  id={`phase-${phase.phase}-error`}
                >
                  {errorFor(`phase-${phase.phase}`)?.message}
                </span>
              ) : null}
            </div>
          ))}
        </div>
        <div className="field">
          <label htmlFor="fixed-effort">Fixed effort（person-hour）</label>
          <input
            id="fixed-effort"
            type="number"
            min="0"
            max={estimate.parameterSnapshot.constraints.maximumUnitHours}
            step="0.25"
            value={estimate.input.fixedEffortHours ?? "0"}
            aria-invalid={Boolean(errorFor("fixed-effort"))}
            aria-describedby={
              errorFor("fixed-effort")
                ? "fixed-effort-help fixed-effort-error"
                : "fixed-effort-help"
            }
            onChange={(event) => {
              const value = event.currentTarget.value;
              updateEstimate((current) => ({
                ...current,
                input: { ...current.input, fixedEffortHours: value },
              }));
            }}
          />
          <span className="field__help" id="fixed-effort-help">
            只加入不隨 adjusted effort 變動且未在 item／phase 計入的工作。
          </span>
          {errorFor("fixed-effort") ? (
            <span className="field__error" id="fixed-effort-error">
              {errorFor("fixed-effort")?.message}
            </span>
          ) : null}
        </div>
      </section>

      <section
        className="form-stack"
        id="uncertainty"
        aria-labelledby="uncertainty-title"
      >
        <div>
          <h2 id="uncertainty-title">Three-point Uncertainty</h2>
          <p>
            以 downside／upside 建立 optimistic 與 pessimistic scenario；P80
            不是固定 buffer。
          </p>
        </div>
        <div className="field">
          <label htmlFor="uncertainty-preset">敘述式預設</label>
          <select
            id="uncertainty-preset"
            value={uncertaintyPreset}
            onChange={(event) => {
              const preset =
                estimate.parameterSnapshot.uncertaintyParameters.find(
                  (entry) => entry.level === event.currentTarget.value,
                );
              if (!preset) {
                return;
              }
              updateEstimate((current) => ({
                ...current,
                input: {
                  ...current.input,
                  uncertainty: {
                    downsideRate: preset.downsideRate,
                    upsideRate: preset.upsideRate,
                  },
                },
              }));
            }}
          >
            {uncertaintyPreset === "CUSTOM" ? (
              <option value="CUSTOM">Custom</option>
            ) : null}
            {estimate.parameterSnapshot.uncertaintyParameters.map((entry) => (
              <option key={entry.level} value={entry.level}>
                {entry.level} — {entry.description}
              </option>
            ))}
          </select>
        </div>
        <div className="form-grid form-grid--two">
          <div className="field">
            <label htmlFor="downside-rate">Downside（%）</label>
            <input
              id="downside-rate"
              type="number"
              min="0"
              max="50"
              step="0.5"
              value={ratioToPercentInput(
                estimate.input.uncertainty.downsideRate,
              )}
              aria-invalid={Boolean(errorFor("downside-rate"))}
              aria-describedby={
                errorFor("downside-rate") ? "downside-rate-error" : undefined
              }
              onChange={(event) => {
                const value = percentInputToRatio(event.currentTarget.value);
                updateEstimate((current) => ({
                  ...current,
                  input: {
                    ...current.input,
                    uncertainty: {
                      ...current.input.uncertainty,
                      downsideRate: value,
                    },
                  },
                }));
              }}
            />
            {errorFor("downside-rate") ? (
              <span className="field__error" id="downside-rate-error">
                {errorFor("downside-rate")?.message}
              </span>
            ) : null}
          </div>
          <div className="field">
            <label htmlFor="upside-rate">Upside（%）</label>
            <input
              id="upside-rate"
              type="number"
              min="0"
              max="200"
              step="0.5"
              value={ratioToPercentInput(estimate.input.uncertainty.upsideRate)}
              aria-invalid={Boolean(errorFor("upside-rate"))}
              aria-describedby={
                errorFor("upside-rate") ? "upside-rate-error" : undefined
              }
              onChange={(event) => {
                const value = percentInputToRatio(event.currentTarget.value);
                updateEstimate((current) => ({
                  ...current,
                  input: {
                    ...current.input,
                    uncertainty: {
                      ...current.input.uncertainty,
                      upsideRate: value,
                    },
                  },
                }));
              }}
            />
            {errorFor("upside-rate") ? (
              <span className="field__error" id="upside-rate-error">
                {errorFor("upside-rate")?.message}
              </span>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
