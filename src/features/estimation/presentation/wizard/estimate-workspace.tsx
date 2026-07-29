"use client";

import Decimal from "decimal.js";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import {
  browserRuntimeServices,
  type EstimateCaseDocument,
} from "@/features/estimation/application/estimate-case";
import type {
  LocalEstimateRepository,
  StorageWarning,
} from "@/features/estimation/infrastructure/local-estimate-repository";

import { CommercialStep } from "./commercial-step";
import { ResultStep } from "./result-step";
import { RiskStep } from "./risk-step";
import { ScopeStep } from "./scope-step";
import type { EstimateUpdater, WizardValidationIssue } from "./types";
import { WorkItemsStep } from "./work-items-step";

const steps = [
  { id: "scope", label: "範圍與假設" },
  { id: "items", label: "工作項目" },
  { id: "risk", label: "風險與交付" },
  { id: "commercial", label: "商業參數" },
  { id: "result", label: "結果與報價" },
] as const;

type StepId = (typeof steps)[number]["id"];

const storageMessages: Partial<Record<StorageWarning, string>> = {
  STORAGE_UNAVAILABLE:
    "localStorage 不可用；目前 session 可繼續計算，離開前請匯出備份。",
  STORAGE_READ_FAILED: "本機資料無法讀取；原始內容沒有被覆寫。",
  STORAGE_WRITE_FAILED:
    "自動儲存失敗；目前 session 仍保留內容，離開前請匯出備份。",
  STORAGE_DATA_CORRUPTED: "本機資料無法通過驗證；原始內容沒有被覆寫。",
};

function parseStep(value: string | null): StepId {
  return steps.some((step) => step.id === value) ? (value as StepId) : "scope";
}

const decimalPattern = /^(?:0|[1-9]\d*)(?:\.\d+)?$/u;

function decimalInRange(
  value: string,
  minimum: string,
  maximum?: string,
  minimumExclusive = false,
): boolean {
  if (!decimalPattern.test(value)) {
    return false;
  }
  try {
    const decimal = new Decimal(value);
    const minimumIsValid = minimumExclusive
      ? decimal.greaterThan(minimum)
      : decimal.greaterThanOrEqualTo(minimum);
    return (
      decimal.isFinite() &&
      minimumIsValid &&
      (maximum === undefined || decimal.lessThanOrEqualTo(maximum))
    );
  } catch {
    return false;
  }
}

function validateStep(
  step: StepId,
  estimate: EstimateCaseDocument,
): readonly WizardValidationIssue[] {
  const issue = (fieldId: string, message: string): WizardValidationIssue => ({
    fieldId,
    message,
  });

  if (step === "scope") {
    return [
      ...(estimate.name.trim() ? [] : [issue("case-name", "案件名稱為必填。")]),
      ...(estimate.name.length <= 200
        ? []
        : [issue("case-name", "案件名稱不可超過 200 字。")]),
      ...(estimate.description.trim()
        ? []
        : [issue("case-description", "背景摘要與 scope 為必填。")]),
      ...(estimate.description.length <= 1000
        ? []
        : [issue("case-description", "背景摘要不可超過 1,000 字。")]),
      ...(decimalInRange(
        estimate.input.commercialTerms.hoursPerPersonDay,
        "0",
        estimate.parameterSnapshot.constraints.maximumHoursPerPersonDay,
        true,
      )
        ? []
        : [
            issue(
              "hours-per-day",
              `每 person-day 小時必須大於 0 且不超過 ${estimate.parameterSnapshot.constraints.maximumHoursPerPersonDay}。`,
            ),
          ]),
      ...(decimalInRange(
        estimate.input.commercialTerms.daysPerPersonMonth,
        "0",
        estimate.parameterSnapshot.constraints.maximumDaysPerPersonMonth,
        true,
      )
        ? []
        : [
            issue(
              "days-per-month",
              `每 person-month 工作日必須大於 0 且不超過 ${estimate.parameterSnapshot.constraints.maximumDaysPerPersonMonth}。`,
            ),
          ]),
    ];
  }
  if (step === "items") {
    if (estimate.input.workItems.length === 0) {
      return [issue("work-items", "至少新增一筆合法工作項目。")];
    }
    return estimate.input.workItems.flatMap((item, index) => [
      ...(item.title.trim()
        ? []
        : [issue(`item-title-${item.id}`, `工作項目 ${index + 1} 缺少標題。`)]),
      ...(item.description.trim()
        ? []
        : [
            issue(
              `item-description-${item.id}`,
              `工作項目 ${index + 1} 缺少工作內容。`,
            ),
          ]),
      ...(decimalInRange(
        item.quantity,
        "0",
        estimate.parameterSnapshot.constraints.maximumQuantity,
        true,
      )
        ? []
        : [
            issue(
              `item-quantity-${item.id}`,
              `工作項目 ${index + 1} 的 quantity 必須大於 0 且未超過上限。`,
            ),
          ]),
      ...(decimalInRange(
        item.unitHours,
        "0.25",
        estimate.parameterSnapshot.constraints.maximumUnitHours,
      )
        ? []
        : [
            issue(
              `item-unit-hours-${item.id}`,
              `工作項目 ${index + 1} 的 unit hours 必須介於 0.25 與參數上限之間。`,
            ),
          ]),
    ]);
  }
  if (step === "risk") {
    const issues: WizardValidationIssue[] = [];
    let total = new Decimal(0);
    for (const phase of estimate.parameterSnapshot.phaseLoadingParameters) {
      const value = estimate.input.phaseLoading[phase.phase];
      if (
        !decimalInRange(
          value,
          "0",
          estimate.parameterSnapshot.constraints.maximumPhaseLoadingRate,
        )
      ) {
        issues.push(
          issue(
            `phase-${phase.phase}`,
            `${phase.displayName} 必須介於 0% 與允許上限之間。`,
          ),
        );
      } else {
        total = total.plus(value);
      }
    }
    if (
      total.greaterThan(
        estimate.parameterSnapshot.constraints.maximumTotalPhaseLoadingRate,
      )
    ) {
      issues.push(
        issue("phase-loading", "Cross-cutting loading 合計超過參數上限。"),
      );
    }
    if (
      !decimalInRange(
        estimate.input.fixedEffortHours ?? "0",
        "0",
        estimate.parameterSnapshot.constraints.maximumUnitHours,
      )
    ) {
      issues.push(
        issue("fixed-effort", "Fixed effort 必須為非負值且未超過參數上限。"),
      );
    }
    if (!decimalInRange(estimate.input.uncertainty.downsideRate, "0", "0.5")) {
      issues.push(issue("downside-rate", "Downside 必須介於 0% 與 50%。"));
    }
    if (!decimalInRange(estimate.input.uncertainty.upsideRate, "0", "2")) {
      issues.push(issue("upside-rate", "Upside 必須介於 0% 與 200%。"));
    }
    return issues;
  }
  if (step === "commercial") {
    const { commercialTerms } = estimate.input;
    const { constraints } = estimate.parameterSnapshot;
    const issues: WizardValidationIssue[] = [];
    const moneyFields = [
      ["hourlyRate", "Blended hourly rate"],
      ["directCost", "Direct cost"],
      ["warrantyCost", "Warranty cost"],
    ] as const;
    const rateFields = [
      ["overheadRate", "Overhead"],
      ["vendorMarkupRate", "Vendor markup"],
      ["taxRate", "Tax rate"],
    ] as const;
    for (const [field, label] of moneyFields) {
      if (
        !decimalInRange(commercialTerms[field], "0", constraints.maximumMoney)
      ) {
        issues.push(
          issue(
            `commercial-${field}`,
            `${label} 必須為非負值且未超過參數上限。`,
          ),
        );
      }
    }
    for (const [field, label] of rateFields) {
      if (
        !decimalInRange(
          commercialTerms[field],
          "0",
          constraints.maximumCommercialRate,
        )
      ) {
        issues.push(
          issue(
            `commercial-${field}`,
            `${label} 必須為非負比例且未超過參數上限。`,
          ),
        );
      }
    }
    if (
      !decimalInRange(
        commercialTerms.hoursPerPersonDay,
        "0",
        constraints.maximumHoursPerPersonDay,
        true,
      )
    ) {
      issues.push(
        issue(
          "commercial-hours-per-day",
          `Hours per person-day 必須大於 0 且不超過 ${constraints.maximumHoursPerPersonDay}。`,
        ),
      );
    }
    if (
      !decimalInRange(
        commercialTerms.daysPerPersonMonth,
        "0",
        constraints.maximumDaysPerPersonMonth,
        true,
      )
    ) {
      issues.push(
        issue(
          "commercial-days-per-month",
          `Days per person-month 必須大於 0 且不超過 ${constraints.maximumDaysPerPersonMonth}。`,
        ),
      );
    }
    return issues;
  }
  return [];
}

interface EstimateWorkspaceProps {
  readonly initialDocument: EstimateCaseDocument;
  readonly repository: LocalEstimateRepository;
  readonly initialStorageWarning: StorageWarning | null;
}

export function EstimateWorkspace({
  initialDocument,
  repository,
  initialStorageWarning,
}: EstimateWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [estimate, setEstimate] = useState(initialDocument);
  const [storageWarning, setStorageWarning] = useState<StorageWarning | null>(
    initialStorageWarning,
  );
  const [saveMessage, setSaveMessage] = useState("已載入本機案件。");
  const [stepIssues, setStepIssues] = useState<
    readonly WizardValidationIssue[]
  >([]);
  const currentStep = parseStep(searchParams.get("step"));
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  const updateEstimate: EstimateUpdater = (update) => {
    const updated = {
      ...update(estimate),
      updatedAt: browserRuntimeServices.now(),
    };
    setEstimate(updated);
    if (stepIssues.length > 0) {
      setStepIssues(validateStep(currentStep, updated));
    }
    const result = repository.save(updated);
    if (!result.ok) {
      setSaveMessage("尚未儲存：請先修正不合法欄位。");
      return;
    }
    if (!result.persisted) {
      setStorageWarning(result.warning);
      setSaveMessage("目前只保留在本次 session。");
      return;
    }
    setStorageWarning(null);
    setSaveMessage("已自動儲存在此瀏覽器。");
  };

  function goTo(step: StepId) {
    setStepIssues([]);
    router.replace(`/estimates/${estimate.id}?step=${step}`);
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>("#wizard-step-title")?.focus();
    });
  }

  function goNext() {
    const issues = validateStep(currentStep, estimate);
    if (issues.length > 0) {
      setStepIssues(issues);
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>("#wizard-errors")?.focus();
      });
      return;
    }
    const next = steps[currentIndex + 1];
    if (next) {
      goTo(next.id);
    }
  }

  const stepProps = { estimate, updateEstimate, issues: stepIssues };

  return (
    <article className="workspace-stack">
      {storageWarning ? (
        <div className="storage-banner" role="alert">
          <strong>本機儲存提醒</strong>
          <p>{storageMessages[storageWarning]}</p>
        </div>
      ) : null}

      <nav className="wizard-progress" aria-label="估算步驟" data-print="hide">
        <ol>
          {steps.map((step, index) => (
            <li key={step.id}>
              <Link
                href={`/estimates/${estimate.id}?step=${step.id}`}
                aria-current={step.id === currentStep ? "step" : undefined}
              >
                <span>Step {index + 1}</span>
                {step.label}
              </Link>
            </li>
          ))}
        </ol>
      </nav>

      <section className="wizard-panel form-stack">
        {stepIssues.length > 0 ? (
          <div
            className="form-error-summary"
            id="wizard-errors"
            role="alert"
            tabIndex={-1}
          >
            <strong>請先修正這個步驟</strong>
            <ul>
              {stepIssues.map((issue) => (
                <li key={`${issue.fieldId}:${issue.message}`}>
                  <a href={`#${issue.fieldId}`}>{issue.message}</a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {currentStep === "scope" ? <ScopeStep {...stepProps} /> : null}
        {currentStep === "items" ? <WorkItemsStep {...stepProps} /> : null}
        {currentStep === "risk" ? <RiskStep {...stepProps} /> : null}
        {currentStep === "commercial" ? (
          <CommercialStep {...stepProps} />
        ) : null}
        {currentStep === "result" ? <ResultStep {...stepProps} /> : null}

        <div className="wizard-actions" data-screen-only="true">
          <div>
            {currentIndex > 0 ? (
              <button
                className="button button--secondary"
                type="button"
                onClick={() => goTo(steps[currentIndex - 1]!.id)}
              >
                返回上一步
              </button>
            ) : (
              <Link className="button button--secondary" href="/estimates">
                返回我的估算
              </Link>
            )}
          </div>
          <p className="field__meta">{saveMessage}</p>
          {currentIndex < steps.length - 1 ? (
            <button
              className="button button--primary"
              type="button"
              onClick={goNext}
            >
              繼續：{steps[currentIndex + 1]!.label}
            </button>
          ) : (
            <Link className="button button--secondary" href="/estimates">
              完成並返回清單
            </Link>
          )}
        </div>
      </section>
    </article>
  );
}
