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
import {
  COMPLEXITY_LEVEL_LABELS,
  CROSS_CUTTING_PHASE_LABELS,
  formatLegacyParameterText,
  RISK_FACTOR_LABELS,
  RISK_LEVEL_LABELS,
} from "../labels";
import type { WizardStepProps } from "./types";

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
        <p className="eyebrow">步驟 3／5</p>
        <h1 id="wizard-step-title" tabIndex={-1}>
          風險與交付
        </h1>
        <p>
          風險等級是案件層級的選擇；只有工作項目明確勾選的風險因子才會套用對應乘數。
        </p>
      </header>

      <section className="form-stack" aria-labelledby="risk-profile-title">
        <div>
          <h2 id="risk-profile-title">風險因子問卷</h2>
          <p className="field__help">
            所有係數都是公開示範值，請記錄選擇理由，不要只選乘數。
          </p>
        </div>
        <div className="result-grid">
          {estimate.parameterSnapshot.riskFactors.map((factor) => {
            const selection = estimate.input.riskProfile[factor.id];
            return (
              <fieldset key={factor.id}>
                <legend>{RISK_FACTOR_LABELS[factor.id]}</legend>
                <p className="field__help">
                  {formatLegacyParameterText(factor.description)}
                </p>
                <div className="field">
                  <label htmlFor={`risk-level-${factor.id}`}>等級</label>
                  <select
                    id={`risk-level-${factor.id}`}
                    value={selection.level}
                    onChange={(event) =>
                      updateRisk(factor.id, "level", event.currentTarget.value)
                    }
                  >
                    {(Object.keys(RISK_LEVEL_LABELS) as RiskLevel[]).map(
                      (level) => (
                        <option key={level} value={level}>
                          {RISK_LEVEL_LABELS[level]} ×{" "}
                          {factor.multipliers[level]}
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
          <h2 id="phase-title">跨階段工作量</h2>
          <p>
            每個階段以未標記「已包含」的調整後實作工時為計算基礎。示範比例合計：
            {formatRatio(totalPhaseLoading.toString())}。
          </p>
        </div>
        <div className="calculation-warning">
          <strong>避免重複計入</strong>
          <p>
            額外測試、部署與文件工作項目預設排除對應階段；若單位工時已含其他階段，請回工作項目勾選。
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
                {CROSS_CUTTING_PHASE_LABELS[phase.phase]}（%）
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
                {formatLegacyParameterText(phase.description)}
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
          <label htmlFor="fixed-effort">固定額外工時（人時）</label>
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
            只加入不隨調整後工時變動，且未在工作項目或階段中計入的工作。
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
          <h2 id="uncertainty-title">三點估算的不確定性</h2>
          <p>以樂觀下修率與悲觀上修率建立兩端情境；P80 不是固定緩衝。</p>
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
              <option value="CUSTOM">自訂</option>
            ) : null}
            {estimate.parameterSnapshot.uncertaintyParameters.map((entry) => (
              <option key={entry.level} value={entry.level}>
                {COMPLEXITY_LEVEL_LABELS[entry.level]} —{" "}
                {formatLegacyParameterText(entry.description)}
              </option>
            ))}
          </select>
        </div>
        <div className="form-grid form-grid--two">
          <div className="field">
            <label htmlFor="downside-rate">樂觀下修率（%）</label>
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
            <label htmlFor="upside-rate">悲觀上修率（%）</label>
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
