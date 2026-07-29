"use client";

import Link from "next/link";
import { useReducer, useState } from "react";

import {
  browserRuntimeServices,
  type EstimateCaseDocument,
} from "@/features/estimation/application/estimate-case";
import { createFictionalExamples } from "@/features/estimation/application/create-estimate";
import { calculateEstimate } from "@/features/estimation/domain";
import { type StorageWarning } from "@/features/estimation/infrastructure/local-estimate-repository";
import {
  exportEstimateJson,
  importEstimateJson,
  MAX_IMPORT_BYTES,
} from "@/features/import-export/estimate-transfer";

import { downloadJson } from "./browser-download";
import { formatDate, formatEffort, formatMoney } from "./formatters";
import { useBrowserEstimateRepository } from "./use-browser-estimate-repository";

const storageWarningText: Record<StorageWarning, string> = {
  STORAGE_UNAVAILABLE:
    "這個瀏覽器目前無法使用 localStorage；你仍可在本次操作中計算，請匯出 JSON 備份。",
  STORAGE_READ_FAILED:
    "無法讀取本機案件；原始資料未被覆寫。請檢查瀏覽器儲存權限。",
  STORAGE_WRITE_FAILED:
    "本機儲存失敗；目前 session 仍保留資料，離開前請匯出 JSON 備份。",
  STORAGE_DATA_CORRUPTED:
    "偵測到無法驗證的本機資料；原始內容未被覆寫，清單暫不載入。",
};

export function EstimateListClient() {
  const { hydrated, repository } = useBrowserEstimateRepository();
  const [, refresh] = useReducer((version: number) => version + 1, 0);
  const [message, setMessage] = useState<string | null>(null);
  const cases = hydrated ? repository.list() : [];
  const storageWarning: StorageWarning | null = hydrated
    ? (repository.checkHealth().warning ?? null)
    : null;

  const summaries = cases.map((estimate) => ({
    estimate,
    outcome: calculateEstimate({
      modelVersion: estimate.modelVersion,
      parameterSnapshot: estimate.parameterSnapshot,
      input: estimate.input,
    }),
  }));

  function persistAll(documents: readonly EstimateCaseDocument[]) {
    for (const document of documents) {
      repository.save(document);
    }
    refresh();
  }

  function loadExamples() {
    persistAll(createFictionalExamples(browserRuntimeServices));
    setMessage("已載入兩筆 fictional／illustrative 範例。");
  }

  function duplicateEstimate(source: EstimateCaseDocument) {
    const timestamp = browserRuntimeServices.now();
    const duplicate: EstimateCaseDocument = {
      ...source,
      id: browserRuntimeServices.createId(),
      name: `${source.name}（副本）`,
      createdAt: timestamp,
      updatedAt: timestamp,
      input: {
        ...source.input,
        workItems: source.input.workItems.map((item) => ({
          ...item,
          id: browserRuntimeServices.createId(),
        })),
      },
    };
    persistAll([duplicate]);
    setMessage("案件副本已建立。");
  }

  function deleteEstimate(estimate: EstimateCaseDocument) {
    if (
      !window.confirm(
        `確定刪除「${estimate.name}」？這只影響目前瀏覽器，且無法復原。`,
      )
    ) {
      return;
    }
    repository.delete(estimate.id);
    refresh();
    setMessage("案件已從目前瀏覽器刪除。");
  }

  function clearAll() {
    if (
      !window.confirm(
        "確定清除目前瀏覽器的所有案件與自訂內容？這項操作無法復原。",
      )
    ) {
      return;
    }
    repository.clear();
    refresh();
    setMessage("本機案件已全部清除；內建範例仍可重新載入。");
  }

  function exportEstimate(estimate: EstimateCaseDocument) {
    if (
      !window.confirm(
        "匯出檔可能含有你輸入的內容。請確認不含公司機密、個人資料、真實乙方名稱或受 NDA 保護資訊。",
      )
    ) {
      return;
    }
    const result = exportEstimateJson(estimate, browserRuntimeServices.now());
    if (!result.ok) {
      setMessage("案件輸入尚未通過驗證，暫時無法匯出。");
      return;
    }
    downloadJson(result.filename, result.text);
    setMessage("JSON 備份已建立；檔案只在你的瀏覽器中下載。");
  }

  async function importFile(file: File | undefined) {
    if (!file) {
      return;
    }
    if (file.size > MAX_IMPORT_BYTES) {
      setMessage("匯入失敗：檔案超過 1 MiB 上限，既有案件未變更。");
      return;
    }

    const result = importEstimateJson(await file.text());
    if (!result.ok) {
      setMessage(
        `匯入失敗（${result.code}，${result.path}），既有案件未變更。`,
      );
      return;
    }

    const saveResult = repository.save(result.estimate);
    refresh();
    setMessage(
      result.warnings.length > 0
        ? "已匯入並重新計算，但 result snapshot 與目前重算結果不同，請檢查版本與參數。"
        : saveResult?.persisted === false
          ? "匯入成功，但無法持久化；請立即匯出備份。"
          : "匯入成功，重算結果與 snapshot 一致。",
    );
  }

  if (!hydrated) {
    return (
      <section className="workspace-card" aria-busy="true">
        <p>正在讀取目前瀏覽器的本機案件…</p>
      </section>
    );
  }

  return (
    <section className="workspace-stack" aria-label="本機估算案件">
      <div className="privacy-banner">
        <strong>EstimateTrace 是公開網站；資料只儲存在此瀏覽器。</strong>
        <p>
          請勿建立或匯入公司機密、個人資料、真實乙方名稱、受 NDA
          保護內容或未公開報價。不會上傳到 Vercel function
          或第三方；共享裝置上的其他使用者可能看見本機資料，清除後本站也無法復原。
        </p>
      </div>

      {storageWarning ? (
        <div className="storage-banner" role="alert">
          <strong>本機儲存不可用</strong>
          <p>{storageWarningText[storageWarning]}</p>
        </div>
      ) : null}

      <div className="workspace-toolbar" data-screen-only="true">
        <button
          className="button button--secondary"
          type="button"
          onClick={loadExamples}
        >
          載入兩筆虛構範例
        </button>
        <label className="button button--secondary">
          匯入 JSON
          <input
            className="visually-hidden"
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              void importFile(event.currentTarget.files?.[0]);
              event.currentTarget.value = "";
            }}
          />
        </label>
        {cases.length > 0 ? (
          <button
            className="button button--danger"
            type="button"
            onClick={clearAll}
          >
            清除本機所有資料
          </button>
        ) : null}
      </div>

      <p aria-live="polite">{message}</p>

      {summaries.length === 0 ? (
        <div className="empty-state">
          <div>
            <h2>目前瀏覽器還沒有估算案件</h2>
            <p>從空白案件開始，或先載入 fictional example 熟悉流程。</p>
          </div>
          <div className="button-group">
            <Link className="button button--primary" href="/estimates/new">
              建立估算
            </Link>
            <button
              className="button button--secondary"
              type="button"
              onClick={loadExamples}
            >
              載入範例
            </button>
          </div>
        </div>
      ) : (
        <ul className="estimate-list">
          {summaries.map(({ estimate, outcome }) => (
            <li className="estimate-card" key={estimate.id}>
              <div className="estimate-card__header">
                <div>
                  <h2>
                    <Link href={`/estimates/${estimate.id}?step=result`}>
                      {estimate.name}
                    </Link>
                  </h2>
                  <p className="estimate-card__meta">
                    最後更新：{formatDate(estimate.updatedAt)}
                  </p>
                </div>
                <span className="tag-list">
                  {outcome.ok ? "可計算" : "待修正"} · 本機
                </span>
              </div>

              {outcome.ok ? (
                <div className="estimate-card__metrics">
                  <div>
                    <span className="metric__label">P50 effort</span>
                    <strong>
                      {formatEffort(outcome.result.p50EffortHours)}
                    </strong>
                  </div>
                  <div>
                    <span className="metric__label">P80 effort</span>
                    <strong>
                      {formatEffort(outcome.result.p80EffortHours)}
                    </strong>
                  </div>
                  <div>
                    <span className="metric__label">乙方報價</span>
                    <strong>
                      {estimate.input.vendorQuote
                        ? formatMoney(estimate.input.vendorQuote.amount)
                        : "未提供"}
                    </strong>
                  </div>
                  <div>
                    <span className="metric__label">P80 benchmark 未稅</span>
                    <strong>{formatMoney(outcome.result.p80QuoteExTax)}</strong>
                  </div>
                </div>
              ) : (
                <p>案件尚未完成：{outcome.issues.length} 個欄位需要修正。</p>
              )}

              <div className="estimate-card__actions" data-screen-only="true">
                <Link
                  className="button button--primary"
                  href={`/estimates/${estimate.id}?step=scope`}
                >
                  開啟
                </Link>
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => duplicateEstimate(estimate)}
                >
                  複製
                </button>
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => exportEstimate(estimate)}
                >
                  匯出
                </button>
                <button
                  className="button button--danger"
                  type="button"
                  onClick={() => deleteEstimate(estimate)}
                >
                  刪除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
