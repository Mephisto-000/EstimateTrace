import type { Metadata } from "next";
import Link from "next/link";

import { Callout } from "@/components/layout/callout";
import { PageHeader } from "@/components/layout/page-header";
import { createPublicPageMetadata } from "@/config/site";

export const metadata: Metadata = createPublicPageMetadata({
  title: "資料與隱私",
  description:
    "了解 EstimateTrace 的資料會存在哪裡、網站不會收集什麼，以及共用裝置的注意事項。",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="page-shell content-page">
      <PageHeader eyebrow="資料留在你的瀏覽器" title="資料與隱私">
        <p>
          EstimateTrace
          公開版沒有帳號，也不會把案件存到遠端。計算、儲存、匯入和匯出都在目前瀏覽器完成，內容不會傳給
          Vercel 函式或第三方服務。
        </p>
      </PageHeader>

      <Callout title="輸入前請先去識別化" tone="warning">
        <p>
          請不要輸入公司機密、個人資料、真實乙方名稱、受保密協議（NDA）保護的內容、內部系統名稱或未公開報價。資料雖然只留在瀏覽器，但共用裝置上的其他人仍可能看得到。
        </p>
      </Callout>

      <section className="prose-section" aria-labelledby="stored-title">
        <h2 id="stored-title">資料儲存在哪裡</h2>
        <p>
          你建立的案件預設存在瀏覽器本機儲存（localStorage）。網站不會把案件寫進
          Cookie、網址、資料庫或第三方服務。若瀏覽器無法儲存資料，這次仍可試算，但重新整理或離開後內容可能消失。
        </p>
        <p>
          JSON
          匯出檔由你自行保存和分享。檔案包含輸入內容、參數快照、模型版本和結果快照，分享前請再檢查一次。
        </p>
      </section>

      <section className="prose-section" aria-labelledby="not-collected-title">
        <h2 id="not-collected-title">公開版不收集的資料</h2>
        <ul className="check-list">
          <li>案件名稱、背景描述與工作項目。</li>
          <li>工時、費率、成本與乙方報價。</li>
          <li>匯入 JSON 的內容或匯出檔案。</li>
          <li>個人帳號、瀏覽器識別碼或操作歷程重播。</li>
          <li>和表單內容有關的使用分析資料。</li>
        </ul>
      </section>

      <section className="prose-section" aria-labelledby="operational-title">
        <h2 id="operational-title">網站運作資料</h2>
        <p>
          為了讓網站正常運作，託管平台可能保留不含估算內容的建置、部署和基本網頁請求紀錄。公開版沒有使用分析、效能分析、聊天元件或操作歷程重播。
        </p>
      </section>

      <section className="prose-section" aria-labelledby="control-title">
        <h2 id="control-title">你可以如何管理資料</h2>
        <ol className="numbered-list">
          <li>用 JSON 匯出保留需要的版本。</li>
          <li>在「我的估算」刪除單一案件，或清除所有本機資料。</li>
          <li>使用共用裝置後，請清除資料並移除下載的 JSON。</li>
          <li>瀏覽器清除網站資料時，本機案件也會一併刪除，無法復原。</li>
        </ol>
        <div className="button-group">
          <Link
            className="button button--primary"
            href="/estimates"
            prefetch={false}
          >
            管理我的估算
          </Link>
          <Link
            className="button button--secondary"
            href="/methodology"
            prefetch={false}
          >
            查看模型說明
          </Link>
        </div>
      </section>

      <section className="prose-section" aria-labelledby="future-title">
        <h2 id="future-title">未來功能的隱私邊界</h2>
        <p>
          未來若加入遙測、帳號或遠端儲存，會先說明變更、更新本頁並交代保存時間和用途，也會先取得明確同意（opt-in）。不會悄悄改變資料只留在瀏覽器的原則。
        </p>
      </section>
    </div>
  );
}
