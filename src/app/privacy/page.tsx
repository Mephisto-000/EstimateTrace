import type { Metadata } from "next";
import Link from "next/link";

import { Callout } from "@/components/layout/callout";
import { PageHeader } from "@/components/layout/page-header";
import { createPublicPageMetadata } from "@/config/site";

export const metadata: Metadata = createPublicPageMetadata({
  title: "資料與隱私",
  description:
    "了解 EstimateTrace 如何在瀏覽器本機保存估算、哪些資料不會被收集，以及共享裝置的注意事項。",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="page-shell content-page">
      <PageHeader eyebrow="隱私優先設計" title="資料與隱私">
        <p>
          EstimateTrace 的公開版
          不提供帳號或遠端案件儲存。估算內容由目前瀏覽器處理，不會因計算、儲存、匯入或匯出而送到
          Vercel 函式或第三方服務。
        </p>
      </PageHeader>

      <Callout title="輸入前請先去識別化" tone="warning">
        <p>
          請勿輸入公司機密、個人資料、真實乙方名稱、受保密協議保護的內容、內部系統名稱或未公開報價。資料只留在瀏覽器，不代表共享裝置上的其他使用者無法看見資料。
        </p>
      </Callout>

      <section className="prose-section" aria-labelledby="stored-title">
        <h2 id="stored-title">資料儲存在哪裡</h2>
        <p>
          使用者建立的案件預設儲存在瀏覽器本機儲存(localStorage)。網站不把案件同步到
          瀏覽器小型文字檔(Cookie)、網址、伺服器動作、資料庫或第三方應用程式介面。若瀏覽器儲存空間不可用，單次估算仍可在本次操作中進行，但重新整理或離開後可能遺失。
        </p>
        <p>
          JSON
          匯出檔由使用者自行保存與分享。匯出檔會包含輸入、參數快照、模型版本與結果快照，因此分享前仍應再次檢查內容。
        </p>
      </section>

      <section className="prose-section" aria-labelledby="not-collected-title">
        <h2 id="not-collected-title">公開版不收集的資料</h2>
        <ul className="check-list">
          <li>案件名稱、背景描述與工作項目。</li>
          <li>工時、費率、成本與乙方報價。</li>
          <li>匯入 JSON 的內容或匯出檔案。</li>
          <li>個人帳號、瀏覽器識別碼或操作歷程重播。</li>
          <li>表單內容相關的使用分析事件。</li>
        </ul>
      </section>

      <section className="prose-section" aria-labelledby="operational-title">
        <h2 id="operational-title">網站運作資料</h2>
        <p>
          託管平台可能保留不含估算內容的建置、部署與基礎網頁請求記錄，以維護網站可用性。公開版不啟用網站使用分析、效能分析、聊天元件或操作歷程重播。
        </p>
      </section>

      <section className="prose-section" aria-labelledby="control-title">
        <h2 id="control-title">你可以如何管理資料</h2>
        <ol className="numbered-list">
          <li>使用 JSON 匯出保留需要的版本。</li>
          <li>在「我的估算」刪除單一案件或清除本機所有資料。</li>
          <li>使用共享裝置後，確認已清除資料並移除下載的 JSON。</li>
          <li>瀏覽器清除網站資料也會移除本機案件，且無法復原。</li>
        </ol>
        <div className="button-group">
          <Link className="button button--primary" href="/estimates">
            管理我的估算
          </Link>
          <Link className="button button--secondary" href="/methodology">
            查看模型說明
          </Link>
        </div>
      </section>

      <section className="prose-section" aria-labelledby="future-title">
        <h2 id="future-title">未來功能的隱私邊界</h2>
        <p>
          若未來加入
          遙測、帳號或遠端儲存，必須另行提出變更、更新本頁、說明保存期間與用途，並在需要時取得明確同意；不得無聲改變目前僅限瀏覽器的資料邊界。
        </p>
      </section>
    </div>
  );
}
