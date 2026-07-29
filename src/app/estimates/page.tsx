import Link from "next/link";

import { EstimateListClient } from "@/features/estimation/presentation/estimate-list-client";

export default function EstimatesPage() {
  return (
    <div className="page-shell estimate-page">
      <header className="estimate-page__header">
        <div>
          <p className="eyebrow">僅限瀏覽器的工作區</p>
          <h1>我的估算</h1>
          <p>
            案件只儲存在目前瀏覽器。請定期匯出 JSON
            備份，並避免在共享裝置保存敏感內容。
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
