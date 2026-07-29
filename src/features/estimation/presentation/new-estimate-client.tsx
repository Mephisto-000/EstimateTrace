"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";

import {
  browserRuntimeServices,
  type EstimateCaseDocument,
} from "@/features/estimation/application/estimate-case";
import { createEmptyEstimateCase } from "@/features/estimation/application/create-estimate";
import type { StorageWarning } from "@/features/estimation/infrastructure/local-estimate-repository";

import { useBrowserEstimateRepository } from "./use-browser-estimate-repository";
import { EstimateWorkspace } from "./wizard/estimate-workspace";

export function NewEstimateClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { repository } = useBrowserEstimateRepository();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [issues, setIssues] = useState<readonly string[]>([]);
  const [sessionEstimate, setSessionEstimate] =
    useState<EstimateCaseDocument | null>(null);
  const [sessionWarning, setSessionWarning] = useState<StorageWarning>(
    "STORAGE_UNAVAILABLE",
  );
  const requestedTarget = searchParams.get("target");
  const targetStep = (() => {
    switch (requestedTarget) {
      case "work-items":
        return "items";
      case "risk-factors":
      case "phase-loading":
      case "uncertainty":
        return "risk";
      case "commercial-terms":
        return "commercial";
      case "vendor-quote":
        return "result";
      default:
        return "items";
    }
  })();
  const targetHash =
    requestedTarget &&
    [
      "work-items",
      "risk-factors",
      "phase-loading",
      "uncertainty",
      "commercial-terms",
      "vendor-quote",
    ].includes(requestedTarget)
      ? `#${requestedTarget}`
      : "";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextIssues: string[] = [];
    if (name.trim().length === 0) {
      nextIssues.push("案件名稱為必填。");
    }
    if (name.length > 200) {
      nextIssues.push("案件名稱不可超過 200 字。");
    }
    if (description.length > 1000) {
      nextIssues.push("背景摘要不可超過 1,000 字。");
    }
    if (description.trim().length === 0) {
      nextIssues.push("背景摘要與範圍為必填。");
    }
    if (nextIssues.length > 0) {
      setIssues(nextIssues);
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>("#new-estimate-errors")?.focus();
      });
      return;
    }

    const estimate = createEmptyEstimateCase(
      {
        name: name.trim(),
        description: description.trim(),
      },
      browserRuntimeServices,
    );
    const saved = repository.save(estimate);
    setIssues([]);

    if (!saved.ok) {
      setIssues(["案件未通過資料驗證，請檢查必要欄位。"]);
      return;
    }
    if (saved.persisted) {
      router.replace(
        `/estimates/${estimate.id}?step=${targetStep}${targetHash}`,
      );
      return;
    }

    setSessionWarning(saved.warning);
    setSessionEstimate(estimate);
    router.replace(`/estimates/new?step=${targetStep}${targetHash}`);
  }

  if (sessionEstimate) {
    return (
      <EstimateWorkspace
        initialDocument={sessionEstimate}
        repository={repository}
        initialStorageWarning={sessionWarning}
      />
    );
  }

  const nameIssue = issues.find((issue) => issue.includes("名稱"));
  const descriptionIssue = issues.find((issue) => issue.includes("背景摘要"));

  return (
    <section className="wizard-panel form-stack" id="scope">
      <header className="wizard-heading">
        <p className="eyebrow">步驟 1／5</p>
        <h1>建立估算範圍</h1>
        <p>
          先用去識別化方式描述案件；建立後可繼續拆工作項目、設定風險與成本。
        </p>
      </header>

      <div className="privacy-banner">
        <strong>EstimateTrace 是公開網站。</strong>
        <p>
          請勿輸入公司機密、個人資料、真實乙方名稱、受保密協議保護的內容或未公開報價。案件只儲存在目前瀏覽器。
        </p>
      </div>

      {issues.length > 0 ? (
        <div
          className="form-error-summary"
          id="new-estimate-errors"
          role="alert"
          tabIndex={-1}
        >
          <strong>請修正以下欄位</strong>
          <ul>
            {issues.map((issue) => (
              <li key={issue}>
                <a
                  href={
                    issue.includes("名稱")
                      ? "#estimate-name"
                      : "#estimate-description"
                  }
                >
                  {issue}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <form className="form-stack" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="estimate-name">案件名稱</label>
          <input
            id="estimate-name"
            name="name"
            value={name}
            maxLength={200}
            required
            aria-invalid={Boolean(nameIssue)}
            aria-describedby={
              nameIssue
                ? "estimate-name-help estimate-name-error"
                : "estimate-name-help"
            }
            autoComplete="off"
            onChange={(event) => {
              setName(event.currentTarget.value);
              setIssues((current) =>
                current.filter((issue) => !issue.includes("名稱")),
              );
            }}
          />
          <span className="field__help" id="estimate-name-help">
            使用中性、去識別化名稱；不要填真實客戶或乙方名稱。
          </span>
          {nameIssue ? (
            <span className="field__error" id="estimate-name-error">
              {nameIssue}
            </span>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor="estimate-description">背景摘要</label>
          <textarea
            id="estimate-description"
            name="description"
            value={description}
            maxLength={1000}
            required
            aria-invalid={Boolean(descriptionIssue)}
            aria-describedby={
              descriptionIssue
                ? "estimate-description-help estimate-description-error"
                : "estimate-description-help"
            }
            onChange={(event) => {
              setDescription(event.currentTarget.value);
              setIssues((current) =>
                current.filter((issue) => !issue.includes("背景摘要")),
              );
            }}
          />
          <span className="field__meta" id="estimate-description-help">
            {description.length} / 1,000 字；請勿貼上需求書或保密協議內容。
          </span>
          {descriptionIssue ? (
            <span className="field__error" id="estimate-description-error">
              {descriptionIssue}
            </span>
          ) : null}
        </div>

        <dl className="form-grid form-grid--three">
          <div className="metric">
            <dt className="metric__label">幣別</dt>
            <dd className="metric__value">新臺幣</dd>
          </div>
          <div className="metric">
            <dt className="metric__label">人日</dt>
            <dd className="metric__value">8 小時</dd>
          </div>
          <div className="metric">
            <dt className="metric__label">示範稅率</dt>
            <dd className="metric__value">5%</dd>
          </div>
        </dl>

        <div className="wizard-actions">
          <Link className="button button--secondary" href="/estimates">
            返回我的估算
          </Link>
          <button className="button button--primary" type="submit">
            建立並拆工作項目
          </button>
        </div>
      </form>
    </section>
  );
}
