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
        description="案件網址需要有效的識別碼，請不要把案件內容放進網址。"
      />
    );
  }

  const estimate = repository.getById(estimateIdCandidate);
  if (!estimate) {
    return (
      <EstimateUnavailableState
        title="這個瀏覽器找不到案件"
        description="案件可能已刪除、存在其他瀏覽器，或本機資料無法安全讀取。"
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
