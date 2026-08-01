"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { browserRuntimeServices } from "@/features/estimation/application/estimate-case";
import { createFictionalExamples } from "@/features/estimation/application/create-estimate";

import { useBrowserEstimateRepository } from "./use-browser-estimate-repository";

interface ExampleLoadButtonProps {
  readonly exampleIndex: 0 | 1;
}

export function ExampleLoadButton({ exampleIndex }: ExampleLoadButtonProps) {
  const router = useRouter();
  const { hydrated, repository } = useBrowserEstimateRepository();
  const [message, setMessage] = useState<string | null>(null);

  function loadExample() {
    const estimate = createFictionalExamples(browserRuntimeServices)[
      exampleIndex
    ];
    if (!estimate) {
      setMessage("找不到指定的內建範例。");
      return;
    }
    const saved = repository.save(estimate);
    if (!saved.ok) {
      setMessage("範例資料有問題，沒有存到瀏覽器。");
      return;
    }
    if (!saved.persisted) {
      setMessage(
        "目前無法使用瀏覽器本機儲存，無法開啟範例；請到「建立估算」進行單次試算。",
      );
      return;
    }
    router.push(`/estimates/${estimate.id}?step=result`);
  }

  return (
    <div>
      <button
        className="button button--secondary"
        type="button"
        disabled={!hydrated}
        onClick={loadExample}
      >
        載入此虛構範例
      </button>
      <p className="field__meta" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
