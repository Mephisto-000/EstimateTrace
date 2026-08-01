import Link from "next/link";

import { EstimateListClient } from "@/features/estimation/presentation/estimate-list-client";

export default function EstimatesPage() {
  return (
    <div className="page-shell estimate-page">
      <header className="estimate-page__header">
        <div>
          <p className="eyebrow">資料只留在這個瀏覽器</p>
          <h1>我的估算</h1>
          <p>
            案件只會存到目前瀏覽器。請定期下載 JSON
            備份，也不要在共用裝置留下敏感內容。
          </p>
        </div>
        <Link className="button button--primary" href="/estimates/new">
          建立估算
        </Link>
      </header>
      <EstimateListClient />
    </div>
  );
}
