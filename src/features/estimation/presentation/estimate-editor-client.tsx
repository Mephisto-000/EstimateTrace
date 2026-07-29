"use client";

import Link from "next/link";

import { useBrowserEstimateRepository } from "./use-browser-estimate-repository";
import { EstimateWorkspace } from "./wizard/estimate-workspace";

interface EstimateEditorClientProps {
  readonly estimateId: string;
}

export function EstimateEditorClient({
  estimateId,
}: EstimateEditorClientProps) {
  const { hydrated, repository } = useBrowserEstimateRepository();

  if (!hydrated) {
    return (
      <section className="workspace-card" aria-busy="true">
        <p>正在讀取本機案件…</p>
      </section>
    );
  }

  const estimate = repository.getById(estimateId);
  if (!estimate) {
    return (
      <section className="empty-state">
        <div>
          <h1>這個瀏覽器找不到案件</h1>
          <p>案件可能已刪除、位於另一個瀏覽器，或本機資料無法通過安全驗證。</p>
        </div>
        <div className="button-group">
          <Link className="button button--primary" href="/estimates">
            返回我的估算
          </Link>
          <Link className="button button--secondary" href="/estimates/new">
            建立新案件
          </Link>
        </div>
      </section>
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
