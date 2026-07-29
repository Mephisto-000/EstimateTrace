import { Suspense } from "react";

import { NewEstimateClient } from "@/features/estimation/presentation/new-estimate-client";

export default function NewEstimatePage() {
  return (
    <div className="page-shell estimate-page">
      <Suspense
        fallback={
          <section className="workspace-card" aria-busy="true">
            <p>正在準備估算表單…</p>
          </section>
        }
      >
        <NewEstimateClient />
      </Suspense>
    </div>
  );
}
