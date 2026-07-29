"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isEstimateCaseId } from "@/features/estimation/application/estimate-case";

import { useBrowserEstimateRepository } from "./use-browser-estimate-repository";
import { EstimateWorkspace } from "./wizard/estimate-workspace";

const estimatePathPattern = /^\/estimates\/([^/]+)$/u;

function EstimateUnavailableState({
  title,
  description,
}: {
  readonly title: string;
  readonly description: string;
}) {
  return (
    <section className="empty-state">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="button-group">
        <Link
          className="button button--primary"
          href="/estimates"
          prefetch={false}
        >
          返回我的估算
        </Link>
        <Link
          className="button button--secondary"
          href="/estimates/new"
          prefetch={false}
        >
          建立新案件
        </Link>
      </div>
    </section>
  );
}

export function EstimateEditorClient() {
  const pathname = usePathname();
  const { hydrated, repository } = useBrowserEstimateRepository();

  if (!hydrated) {
    return (
      <section className="workspace-card" aria-busy="true">
        <p>正在讀取本機案件…</p>
      </section>
    );
  }

  const estimateIdCandidate = estimatePathPattern.exec(pathname)?.[1];
  if (!isEstimateCaseId(estimateIdCandidate)) {
    return (
      <EstimateUnavailableState
        title="案件網址無效"
        description="案件網址必須包含有效的識別碼，且不應放入案件內容。"
      />
    );
  }

  const estimate = repository.getById(estimateIdCandidate);
  if (!estimate) {
    return (
      <EstimateUnavailableState
        title="這個瀏覽器找不到案件"
        description="案件可能已刪除、位於另一個瀏覽器，或本機資料無法通過安全驗證。"
      />
    );
  }

  return (
    <EstimateWorkspace
      initialDocument={estimate}
      repository={repository}
      initialStorageWarning={repository.checkHealth().warning ?? null}
    />
  );
}
