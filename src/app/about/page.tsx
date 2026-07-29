import type { Metadata } from "next";
import Link from "next/link";

import { Callout } from "@/components/layout/callout";
import { PageHeader } from "@/components/layout/page-header";
import { createPublicPageMetadata } from "@/config/site";

export const metadata: Metadata = createPublicPageMetadata({
  title: "關於",
  description:
    "了解 EstimateTrace 的產品目的、適用對象、設計原則與公開版限制。",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="page-shell content-page">
      <PageHeader eyebrow="關於 EstimateTrace" title="讓估算成為可討論的軌跡">
        <p>
          EstimateTrace
          是公開、免費的軟體需求成本估算方法展示與本機工具，主要服務需要向需求提出者、主管或採購說明估算依據的甲方
          資訊科技商業分析師。
        </p>
      </PageHeader>

      <Callout title="產品邊界" tone="info">
        <p>
          EstimateTrace
          提供決策輔助，不替代專業判斷、議價、採購程序、合約審查或法律意見。
        </p>
      </Callout>

      <section className="prose-section" aria-labelledby="purpose-title">
        <h2 id="purpose-title">我們要解決的問題</h2>
        <p>
          很多估算最後只留下總工時或總價，需求、假設與係數卻散落在不同文件。當範圍改變、主管追問或乙方報價出現差異時，原本的數字很難被重算或說明。
        </p>
        <p>
          本工具把工作項目、複雜度、風險因子、跨階段工作量、商業加成與乙方報價放進同一條估算軌跡，讓主要輸出都能回到明確來源。
        </p>
      </section>

      <section className="prose-section" aria-labelledby="audience-title">
        <h2 id="audience-title">適用對象</h2>
        <div className="card-grid card-grid--two">
          <article className="feature-card">
            <h3>主要使用者</h3>
            <p>
              資訊科技商業分析師、專案經理與產品負責人，可用一致的工作量與成本口徑釐清交付範圍。
            </p>
          </article>
          <article className="feature-card">
            <h3>檢視與溝通者</h3>
            <p>
              需求提出者、主管與採購，可檢查模型假設、主要成本驅動因素與建議追問事項。
            </p>
          </article>
        </div>
      </section>

      <section className="prose-section" aria-labelledby="architecture-title">
        <h2 id="architecture-title">為公開使用而設計</h2>
        <ul className="check-list">
          <li>不需要登入、資料庫、私有服務或正式環境機密。</li>
          <li>案件留在目前瀏覽器，可自行匯出 JSON 檔案與列印。</li>
          <li>核心模型採確定性計算；相同輸入與版本得到相同結果。</li>
          <li>公式、示範參數、限制與版本資訊公開可查。</li>
          <li>範例完全虛構，不包含真實公司、乙方、系統或報價。</li>
        </ul>
      </section>

      <section className="prose-section" aria-labelledby="not-goals-title">
        <h2 id="not-goals-title">公開版不做什麼</h2>
        <p>
          公開版不以人工智慧決定成本、不宣稱市場公允價，也不提供多人協作、正式簽核、角色權限控管、單一登入、伺服器端稽核紀錄、文字辨識或需求文件上傳。公司專用參數與真實案件應在獨立的私有專案中處理。
        </p>
      </section>

      <div className="button-group">
        <Link className="button button--primary" href="/estimates/new">
          開始估算
        </Link>
        <Link
          className="button button--secondary"
          href="/methodology"
          prefetch={false}
        >
          閱讀公式與限制
        </Link>
      </div>
    </div>
  );
}
