"use client";

import { useState } from "react";

import { getPublicDemoWorkItemDefaults } from "@/config/parameter-sets/public-demo";
import { browserRuntimeServices } from "@/features/estimation/application/estimate-case";
import type {
  CrossCuttingPhase,
  RiskFactorId,
  WorkItemInput,
  WorkItemType,
} from "@/features/estimation/domain";

import {
  COMPLEXITY_LEVEL_LABELS,
  CROSS_CUTTING_PHASE_LABELS,
  formatIncludedActivity,
  formatLegacyParameterText,
  formatWorkItemUnit,
  RISK_FACTOR_LABELS,
  WORK_ITEM_TYPE_LABELS,
} from "../labels";
import type { EstimateUpdater, WizardStepProps } from "./types";

interface WorkItemCardProps {
  readonly item: WorkItemInput;
  readonly index: number;
  readonly estimate: WizardStepProps["estimate"];
  readonly updateEstimate: EstimateUpdater;
  readonly issues: WizardStepProps["issues"];
}

function WorkItemCard({
  item,
  index,
  estimate,
  updateEstimate,
  issues,
}: WorkItemCardProps) {
  const catalog = estimate.parameterSnapshot.workItemCatalog;
  const complexity = estimate.parameterSnapshot.complexityParameters;
  const risks = estimate.parameterSnapshot.riskFactors;
  const selectedCatalogEntry = catalog.find(
    (entry) => entry.code === item.type,
  );
  const selectedComplexity = complexity.find(
    (entry) => entry.level === item.complexity,
  );
  const errorFor = (fieldId: string) =>
    issues.find((issue) => issue.fieldId === fieldId);

  function updateItem(update: (current: WorkItemInput) => WorkItemInput) {
    updateEstimate((current) => ({
      ...current,
      input: {
        ...current.input,
        workItems: current.input.workItems.map((candidate) =>
          candidate.id === item.id ? update(candidate) : candidate,
        ),
      },
    }));
  }

  function removeItem() {
    if (
      !window.confirm(`確定刪除工作項目「${item.title || `#${index + 1}`}」？`)
    ) {
      return;
    }
    updateEstimate((current) => ({
      ...current,
      input: {
        ...current.input,
        workItems: current.input.workItems.filter(
          (candidate) => candidate.id !== item.id,
        ),
      },
    }));
  }

  function toggleRisk(riskId: RiskFactorId, checked: boolean) {
    updateItem((current) => ({
      ...current,
      applicableRiskFactorIds: checked
        ? [...new Set([...current.applicableRiskFactorIds, riskId])]
        : current.applicableRiskFactorIds.filter((id) => id !== riskId),
    }));
  }

  function togglePhase(phase: CrossCuttingPhase, checked: boolean) {
    updateItem((current) => ({
      ...current,
      includedCrossCuttingPhases: checked
        ? [...new Set([...current.includedCrossCuttingPhases, phase])]
        : current.includedCrossCuttingPhases.filter((id) => id !== phase),
    }));
  }

  return (
    <li className="work-item-card">
      <div className="work-item-card__header">
        <h3>工作項目 {index + 1}</h3>
        <button
          className="button button--danger"
          type="button"
          onClick={removeItem}
        >
          刪除
        </button>
      </div>

      <div className="form-grid form-grid--two">
        <div className="field">
          <label htmlFor={`item-type-${item.id}`}>類型</label>
          <select
            id={`item-type-${item.id}`}
            value={item.type}
            onChange={(event) => {
              const type = event.currentTarget.value as WorkItemType;
              const defaults = getPublicDemoWorkItemDefaults(type);
              updateItem((current) => ({
                ...current,
                type,
                unit: defaults.unit,
                unitHours: defaults.defaultUnitHours,
                includedCrossCuttingPhases: defaults.includedCrossCuttingPhases,
              }));
            }}
          >
            {catalog.map((entry) => (
              <option key={entry.code} value={entry.code}>
                {WORK_ITEM_TYPE_LABELS[entry.code]}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor={`item-title-${item.id}`}>標題</label>
          <input
            id={`item-title-${item.id}`}
            value={item.title}
            maxLength={200}
            required
            aria-invalid={Boolean(errorFor(`item-title-${item.id}`))}
            aria-describedby={
              errorFor(`item-title-${item.id}`)
                ? `item-title-${item.id}-error`
                : undefined
            }
            onChange={(event) => {
              const value = event.currentTarget.value;
              updateItem((current) => ({ ...current, title: value }));
            }}
          />
          {errorFor(`item-title-${item.id}`) ? (
            <span className="field__error" id={`item-title-${item.id}-error`}>
              {errorFor(`item-title-${item.id}`)?.message}
            </span>
          ) : null}
        </div>
      </div>

      <div className="field">
        <label htmlFor={`item-description-${item.id}`}>工作內容</label>
        <textarea
          id={`item-description-${item.id}`}
          value={item.description}
          maxLength={1000}
          required
          aria-invalid={Boolean(errorFor(`item-description-${item.id}`))}
          aria-describedby={
            errorFor(`item-description-${item.id}`)
              ? `item-description-${item.id}-error`
              : undefined
          }
          onChange={(event) => {
            const value = event.currentTarget.value;
            updateItem((current) => ({ ...current, description: value }));
          }}
        />
        {errorFor(`item-description-${item.id}`) ? (
          <span
            className="field__error"
            id={`item-description-${item.id}-error`}
          >
            {errorFor(`item-description-${item.id}`)?.message}
          </span>
        ) : null}
      </div>

      <div className="form-grid form-grid--three">
        <div className="field">
          <label htmlFor={`item-quantity-${item.id}`}>數量</label>
          <input
            id={`item-quantity-${item.id}`}
            type="number"
            min="0.01"
            max={estimate.parameterSnapshot.constraints.maximumQuantity}
            step="0.25"
            value={item.quantity}
            aria-invalid={Boolean(errorFor(`item-quantity-${item.id}`))}
            aria-describedby={
              errorFor(`item-quantity-${item.id}`)
                ? `item-quantity-${item.id}-error`
                : undefined
            }
            onChange={(event) => {
              const value = event.currentTarget.value;
              updateItem((current) => ({ ...current, quantity: value }));
            }}
          />
          {errorFor(`item-quantity-${item.id}`) ? (
            <span
              className="field__error"
              id={`item-quantity-${item.id}-error`}
            >
              {errorFor(`item-quantity-${item.id}`)?.message}
            </span>
          ) : null}
        </div>
        <div className="field">
          <label htmlFor={`item-unit-hours-${item.id}`}>
            每單位工時（人時／{formatWorkItemUnit(item.unit)}）
          </label>
          <input
            id={`item-unit-hours-${item.id}`}
            type="number"
            min="0.25"
            max={estimate.parameterSnapshot.constraints.maximumUnitHours}
            step="0.25"
            value={item.unitHours}
            aria-invalid={Boolean(errorFor(`item-unit-hours-${item.id}`))}
            aria-describedby={
              errorFor(`item-unit-hours-${item.id}`)
                ? `item-unit-hours-${item.id}-help item-unit-hours-${item.id}-error`
                : `item-unit-hours-${item.id}-help`
            }
            onChange={(event) => {
              const value = event.currentTarget.value;
              updateItem((current) => ({ ...current, unitHours: value }));
            }}
          />
          <span className="field__help" id={`item-unit-hours-${item.id}-help`}>
            這是示範值，不是市場標準；預設只包含{" "}
            {selectedCatalogEntry?.includedActivities
              .map(formatIncludedActivity)
              .join("、") || "未指定活動"}
            。
          </span>
          {errorFor(`item-unit-hours-${item.id}`) ? (
            <span
              className="field__error"
              id={`item-unit-hours-${item.id}-error`}
            >
              {errorFor(`item-unit-hours-${item.id}`)?.message}
            </span>
          ) : null}
        </div>
        <div className="field">
          <label htmlFor={`item-complexity-${item.id}`}>複雜度</label>
          <select
            id={`item-complexity-${item.id}`}
            value={item.complexity}
            onChange={(event) => {
              const value = event.currentTarget
                .value as WorkItemInput["complexity"];
              updateItem((current) => ({ ...current, complexity: value }));
            }}
          >
            {complexity.map((entry) => (
              <option key={entry.level} value={entry.level}>
                {COMPLEXITY_LEVEL_LABELS[entry.level]} × {entry.multiplier} —{" "}
                {formatLegacyParameterText(entry.description)}
              </option>
            ))}
          </select>
          <span className="field__help">
            {selectedComplexity
              ? formatLegacyParameterText(selectedComplexity.description)
              : null}
          </span>
        </div>
      </div>

      <details>
        <summary>風險與避免重複計算</summary>
        <div className="form-stack">
          <fieldset id={`risk-factors-${item.id}`}>
            <legend>只勾選真的會影響這個項目的風險</legend>
            <div className="choice-grid">
              {risks.map((risk) => (
                <label className="choice-row" key={risk.id}>
                  <input
                    type="checkbox"
                    checked={item.applicableRiskFactorIds.includes(risk.id)}
                    onChange={(event) =>
                      toggleRisk(risk.id, event.currentTarget.checked)
                    }
                  />
                  <span>
                    <strong>{RISK_FACTOR_LABELS[risk.id]}</strong>
                    <br />
                    <span className="field__help">
                      {formatLegacyParameterText(risk.description)}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>每單位工時已包含的額外工作</legend>
            <p className="field__help">
              勾選後，這個工作項目不會再算進同一階段，避免重複計算。
            </p>
            <div className="choice-grid">
              {Object.entries(CROSS_CUTTING_PHASE_LABELS).map(
                ([phase, label]) => (
                  <label className="choice-row" key={phase}>
                    <input
                      type="checkbox"
                      checked={item.includedCrossCuttingPhases.includes(
                        phase as CrossCuttingPhase,
                      )}
                      onChange={(event) =>
                        togglePhase(
                          phase as CrossCuttingPhase,
                          event.currentTarget.checked,
                        )
                      }
                    />
                    <span>{label}</span>
                  </label>
                ),
              )}
            </div>
          </fieldset>
        </div>
      </details>

      <div className="field">
        <label htmlFor={`item-assumptions-${item.id}`}>
          備註與假設（每行一項）
        </label>
        <textarea
          id={`item-assumptions-${item.id}`}
          value={item.assumptions.join("\n")}
          onChange={(event) => {
            const assumptions = event.currentTarget.value
              .split("\n")
              .map((value) => value.trim())
              .filter(Boolean);
            updateItem((current) => ({ ...current, assumptions }));
          }}
        />
      </div>
    </li>
  );
}

export function WorkItemsStep({
  estimate,
  updateEstimate,
  issues,
}: WizardStepProps) {
  const [selectedType, setSelectedType] = useState<WorkItemType>("UI");
  const selectedCatalog = estimate.parameterSnapshot.workItemCatalog.find(
    (entry) => entry.code === selectedType,
  );

  function addItem() {
    if (!selectedCatalog) {
      return;
    }
    const defaults = getPublicDemoWorkItemDefaults(selectedCatalog.code);
    const item: WorkItemInput = {
      id: browserRuntimeServices.createId(),
      type: selectedCatalog.code,
      title: WORK_ITEM_TYPE_LABELS[selectedCatalog.code],
      description: formatLegacyParameterText(selectedCatalog.description),
      quantity: "1",
      unit: defaults.unit,
      unitHours: defaults.defaultUnitHours,
      complexity: "MEDIUM",
      applicableRiskFactorIds: [],
      includedCrossCuttingPhases: defaults.includedCrossCuttingPhases,
      assumptions: [
        "這是示範工時，請依實際範圍調整；私有環境才可用經授權的歷史資料校準。",
      ],
    };
    updateEstimate((current) => ({
      ...current,
      input: {
        ...current.input,
        workItems: [...current.input.workItems, item],
      },
    }));
  }

  return (
    <div className="form-stack" id="work-items">
      <header className="wizard-heading">
        <p className="eyebrow">步驟 2／5</p>
        <h1 id="wizard-step-title" tabIndex={-1}>
          工作項目
        </h1>
        <p>
          把需求拆成可以計數的工作項目。單位工時只是公開示範的起點，請依範圍調整；私有環境才可用經授權的歷史資料校準。
        </p>
      </header>

      <div className="workspace-toolbar">
        <div className="field">
          <label htmlFor="catalog-type">工作項目類型</label>
          <select
            id="catalog-type"
            value={selectedType}
            onChange={(event) =>
              setSelectedType(event.currentTarget.value as WorkItemType)
            }
          >
            {estimate.parameterSnapshot.workItemCatalog.map((entry) => (
              <option key={entry.code} value={entry.code}>
                {WORK_ITEM_TYPE_LABELS[entry.code]} —{" "}
                {formatLegacyParameterText(entry.description)}
              </option>
            ))}
          </select>
        </div>
        <button
          className="button button--primary"
          type="button"
          onClick={addItem}
        >
          新增工作項目
        </button>
      </div>

      {estimate.input.workItems.length === 0 ? (
        <div className="empty-state">
          <div>
            <h2>尚未加入工作項目</h2>
            <p>至少加入一筆工作項目，才能得到有意義的結果。</p>
          </div>
          <button
            className="button button--primary"
            type="button"
            onClick={addItem}
          >
            加入第一筆{" "}
            {selectedCatalog
              ? WORK_ITEM_TYPE_LABELS[selectedCatalog.code]
              : "工作項目"}
          </button>
        </div>
      ) : (
        <ol className="work-item-list">
          {estimate.input.workItems.map((item, index) => (
            <WorkItemCard
              key={item.id}
              item={item}
              index={index}
              estimate={estimate}
              updateEstimate={updateEstimate}
              issues={issues}
            />
          ))}
        </ol>
      )}
    </div>
  );
}
