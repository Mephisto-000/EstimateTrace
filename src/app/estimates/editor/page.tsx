import { Suspense } from "react";

import { EstimateEditorClient } from "@/features/estimation/presentation/estimate-editor-client";

export const dynamic = "error";

export default function EstimateEditorPage() {
  return (
    <div className="page-shell estimate-page">
      <Suspense
        fallback={
          <section className="workspace-card" aria-busy="true">
            <p>正在載入本機案件…</p>
          </section>
        }
      >
        <EstimateEditorClient />
      </Suspense>
    </div>
  );
}
