import { Suspense } from "react";

import { EstimateEditorClient } from "@/features/estimation/presentation/estimate-editor-client";

interface EstimatePageProps {
  readonly params: Promise<{ id: string }>;
}

export default async function EstimatePage({ params }: EstimatePageProps) {
  const { id } = await params;

  return (
    <div className="page-shell estimate-page">
      <Suspense
        fallback={
          <section className="workspace-card" aria-busy="true">
            <p>正在載入本機案件…</p>
          </section>
        }
      >
        <EstimateEditorClient estimateId={id} />
      </Suspense>
    </div>
  );
}
