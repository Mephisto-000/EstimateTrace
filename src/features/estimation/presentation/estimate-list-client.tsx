"use client";

import Link from "next/link";
import { useMemo, useReducer, useState } from "react";

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
    "這個瀏覽器目前無法儲存資料；這次仍可試算，離開前請下載 JSON 備份。",
  STORAGE_READ_FAILED:
    "無法讀取瀏覽器裡的案件；原始資料沒有被覆寫。請檢查瀏覽器儲存權限。",
  STORAGE_WRITE_FAILED:
    "資料沒有存到瀏覽器；這次操作仍保留內容，離開前請下載 JSON 備份。",
  STORAGE_DATA_CORRUPTED:
    "發現無法安全讀取的本機資料；原始內容沒有被覆寫，暫時不會載入清單。",
};

export function EstimateListClient() {
  const { hydrated, repository } = useBrowserEstimateRepository();
  const [repositoryVersion, refresh] = useReducer(
    (version: number) => version + 1,
    0,
  );
  const [message, setMessage] = useState<string | null>(null);
  const repositorySnapshot = useMemo(() => {
    // Repository mutations are synchronous and intentionally represented by
    // this revision so message-only renders can reuse the calculated cases.
    void repositoryVersion;
    return {
      cases: hydrated ? repository.list() : [],
      storageWarning: hydrated
        ? (repository.checkHealth().warning ?? null)
        : null,
    };
  }, [hydrated, repository, repositoryVersion]);
  const { cases, storageWarning } = repositorySnapshot;
  const summaries = useMemo(
    () =>
      cases.map((estimate) => ({
        estimate,
        outcome: calculateEstimate({
          modelVersion: estimate.modelVersion,
          parameterSnapshot: estimate.parameterSnapshot,
          input: estimate.input,
        }),
      })),
    [cases],
  );

  function persistAll(documents: readonly EstimateCaseDocument[]) {
    for (const document of documents) {
      repository.save(document);
    }
    refresh();
  }

  function loadExamples() {
    persistAll(createFictionalExamples(browserRuntimeServices));
    setMessage("已載入兩筆虛構範例。");
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
    setMessage("已建立案件副本。");
  }

  function deleteEstimate(estimate: EstimateCaseDocument) {
    if (
      !window.confirm(
        `確定要刪除「${estimate.name}」嗎？這只會影響目前瀏覽器，而且無法復原。`,
      )
    ) {
      return;
    }
    const result = repository.delete(estimate.id);
    refresh();
    setMessage(
      result.persisted
        ? "已從目前瀏覽器刪除案件。"
        : "案件只從這次操作移除；因瀏覽器無法儲存，重新開啟後可能還會出現。",
    );
  }

  function clearAll() {
    if (
      !window.confirm(
        "確定要清除目前瀏覽器的所有案件和自訂內容嗎？這個動作無法復原。",
      )
    ) {
      return;
    }
    const result = repository.clear();
    refresh();
    setMessage(
      result.persisted
        ? "已清除所有本機案件；仍可重新載入內建範例。"
        : "案件只從這次操作清除；因瀏覽器無法儲存，重新開啟後可能還會出現。",
    );
  }

  function exportEstimate(estimate: EstimateCaseDocument) {
    if (
      !window.confirm(
        "EstimateTrace 是公開網站。匯出檔可能包含案件內容，請確認沒有公司機密、個人資料、真實乙方名稱、受保密協議（NDA）保護的內容或未公開報價。",
      )
    ) {
      return;
    }
    const result = exportEstimateJson(estimate, browserRuntimeServices.now());
    if (!result.ok) {
      setMessage("案件資料還有問題，暫時無法匯出。");
      return;
    }
    downloadJson(result.filename, result.text);
    setMessage("已下載 JSON 備份；檔案只會下載到你的裝置。");
  }

  async function importFile(file: File | undefined) {
    if (!file) {
      return;
    }
    if (file.size > MAX_IMPORT_BYTES) {
      setMessage("匯入失敗：檔案超過 1 MiB 上限，原本的案件沒有變更。");
      return;
    }

    const result = importEstimateJson(await file.text());
    if (!result.ok) {
      setMessage(
        `匯入失敗（${result.code}，${result.path}），原本的案件沒有變更。`,
      );
      return;
    }

    const existing = repository.getById(result.estimate.id);
    if (
      existing &&
      !window.confirm(
        `匯入檔和「${existing.name}」使用相同案件識別碼。要用匯入內容取代原本的案件嗎？`,
      )
    ) {
      setMessage("已取消匯入，原本的案件沒有變更。");
      return;
    }

    const saveResult = repository.save(result.estimate);
    refresh();
    setMessage(
      result.warnings.length > 0
        ? "已匯入並重新計算，但儲存的結果和現在算出的結果不同，請檢查版本和參數。"
        : saveResult?.persisted === false
          ? "匯入成功，但無法存到瀏覽器；請立刻下載備份。"
          : "匯入成功，重新計算的結果和儲存結果一致。",
    );
  }

  if (!hydrated) {
    return (
      <section className="workspace-card" aria-busy="true">
        <p>正在讀取目前瀏覽器裡的案件…</p>
      </section>
    );
  }

  return (
    <section className="workspace-stack" aria-label="本機估算案件">
      <div className="privacy-banner">
        <strong>EstimateTrace 是公開網站，資料只會存到這個瀏覽器。</strong>
        <p>
          請不要建立或匯入公司機密、個人資料、真實乙方名稱、受保密協議（NDA）保護的內容或未公開報價。資料不會上傳到
          Vercel
          函式或第三方服務。共用裝置上的其他人可能看得到本機資料；清除後也無法復原。
        </p>
      </div>

      {storageWarning ? (
        <div className="storage-banner" role="alert">
          <strong>瀏覽器無法儲存資料</strong>
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
            <h2>這個瀏覽器還沒有估算案件</h2>
            <p>可以從空白案件開始，或先載入虛構範例熟悉流程。</p>
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
                    <Link
                      href={`/estimates/${estimate.id}?step=result`}
                      prefetch={false}
                    >
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
                    <span className="metric__label">P50 工時</span>
                    <strong>
                      {formatEffort(outcome.result.p50EffortHours)}
                    </strong>
                  </div>
                  <div>
                    <span className="metric__label">P80 工時</span>
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
                    <span className="metric__label">P80 未稅模型參考值</span>
                    <strong>{formatMoney(outcome.result.p80QuoteExTax)}</strong>
                  </div>
                </div>
              ) : (
                <p>案件還沒完成：有 {outcome.issues.length} 個欄位需要修正。</p>
              )}

              <div className="estimate-card__actions" data-screen-only="true">
                <Link
                  className="button button--primary"
                  href={`/estimates/${estimate.id}?step=scope`}
                  prefetch={false}
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
