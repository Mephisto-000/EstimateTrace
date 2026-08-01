import type { Metadata } from "next";
import Link from "next/link";

import { Callout } from "@/components/layout/callout";
import { PageHeader } from "@/components/layout/page-header";
import { createPublicPageMetadata } from "@/config/site";

export const metadata: Metadata = createPublicPageMetadata({
  title: "關於",
  description:
    "了解 EstimateTrace 能幫上什麼忙、適合誰使用，以及公開版的範圍。",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="page-shell content-page">
      <PageHeader eyebrow="關於 EstimateTrace" title="讓估算有依據，溝通更容易">
        <p>
          EstimateTrace
          是公開、免費的軟體需求成本估算工具。它適合需要向需求提出者、主管或採購說明估算依據的人使用。
        </p>
      </PageHeader>

      <Callout title="產品邊界" tone="info">
        <p>
          EstimateTrace
          幫你整理估算依據，但不能取代專業判斷、議價、採購流程、合約審查或法律意見。
        </p>
      </Callout>

      <section className="prose-section" aria-labelledby="purpose-title">
        <h2 id="purpose-title">我們要解決的問題</h2>
        <p>
          很多估算最後只剩總工時或總價，需求、假設和調整條件卻散在不同文件。範圍一改、主管一問，或乙方報價不同，就很難回頭說明數字怎麼算出來。
        </p>
        <p>
          這個工具把工作項目、複雜度、風險、額外工作、成本條件和乙方報價放在一起，讓每個主要結果都找得到來源。
        </p>
      </section>

      <section className="prose-section" aria-labelledby="audience-title">
        <h2 id="audience-title">適用對象</h2>
        <div className="card-grid card-grid--two">
          <article className="feature-card">
            <h3>主要使用者</h3>
            <p>
              需求分析人員、專案經理和產品負責人，可用同一套方式釐清工作量、成本和交付範圍。
            </p>
          </article>
          <article className="feature-card">
            <h3>檢視與溝通者</h3>
            <p>
              需求提出者、主管和採購人員，可以查看估算假設、主要成本來源和建議確認的事項。
            </p>
          </article>
        </div>
      </section>

      <section className="prose-section" aria-labelledby="architecture-title">
        <h2 id="architecture-title">為公開使用而設計</h2>
        <ul className="check-list">
          <li>不需要登入、資料庫、私有服務或正式環境的機密資料。</li>
          <li>案件只留在目前瀏覽器，可自行匯出 JSON 或列印。</li>
          <li>相同輸入和版本一定得到相同結果。</li>
          <li>公式、示範參數、限制和版本資訊都公開可查。</li>
          <li>所有範例都是虛構內容，不含真實公司、乙方、系統或報價。</li>
        </ul>
      </section>

      <section className="prose-section" aria-labelledby="not-goals-title">
        <h2 id="not-goals-title">公開版不做什麼</h2>
        <p>
          公開版不會讓演算法替你決定成本，也不會替任何價格背書。它沒有多人協作、簽核、權限管理、單一登入、伺服器端稽核、文字辨識或需求文件上傳功能。公司專用參數和真實案件，應在獨立的私有系統處理。
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
