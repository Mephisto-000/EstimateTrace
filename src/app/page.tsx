import type { Metadata } from "next";
import Link from "next/link";

import { Callout } from "@/components/layout/callout";
import { createPublicPageMetadata } from "@/config/site";

export const metadata: Metadata = createPublicPageMetadata({
  title: "EstimateTrace｜可追溯的軟體需求成本估算",
  description:
    "把需求、工作量、風險、成本與乙方報價連成一條可檢查、可重算、可說明的估算軌跡。",
  path: "/",
  absoluteTitle: true,
});

const workflowSteps = [
  {
    number: "01",
    title: "拆需求",
    description:
      "用畫面、報表、規則、介接、測試與部署等工作項目，明確描述交付範圍。",
  },
  {
    number: "02",
    title: "估工作量",
    description:
      "套用透明的複雜度、風險與交付參數，計算 P50 與 P80 工作量區間。",
  },
  {
    number: "03",
    title: "比報價",
    description: "統一稅基後比較模型參考區間與乙方報價，整理可追問的成本來源。",
  },
] as const;

const productPrinciples = [
  {
    title: "每個數字都有來源",
    description:
      "結果可展開到公式、代入值、單位、工作項目與參數版本，不只留下最後總價。",
  },
  {
    title: "相同輸入得到相同結果",
    description:
      "核心採 deterministic Bottom-up Parametric Model，不使用 AI 或隱藏係數決定價格。",
  },
  {
    title: "資料留在瀏覽器",
    description:
      "MVP 不登入、沒有資料庫，也不把估算案件送到伺服器；可用 JSON 自行備份。",
  },
] as const;

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero__inner">
          <div className="hero__copy">
            <p className="eyebrow">Traceable software estimation</p>
            <h1>讓每一筆估算，都能被檢查、重算與說明。</h1>
            <p className="hero__lead">
              EstimateTrace 協助甲方 IT Business Analyst
              將需求拆成工作項目，產生 P50、P80
              工作量與價格區間，再用一致的成本口徑比較乙方報價。
            </p>
            <div className="button-group">
              <Link className="button button--primary" href="/estimates/new">
                開始估算
              </Link>
              <Link className="button button--secondary" href="/methodology">
                查看公式與定義
              </Link>
            </div>
            <p className="hero__privacy-note">
              無需登入 · Browser-only storage · 不預設啟用 Analytics
            </p>
          </div>
          <aside className="hero__trace" aria-label="估算軌跡示意">
            <p className="hero__trace-label">Estimate trace</p>
            <ol>
              <li>
                <span>需求範圍</span>
                <strong>可拆解</strong>
              </li>
              <li>
                <span>工作量與風險</span>
                <strong>可重算</strong>
              </li>
              <li>
                <span>P50／P80</span>
                <strong>可解釋</strong>
              </li>
              <li>
                <span>乙方報價</span>
                <strong>可比較</strong>
              </li>
            </ol>
          </aside>
        </div>
      </section>

      <div className="page-shell page-shell--home">
        <section className="notice-grid" aria-label="使用前提醒">
          <Callout title="公開網站資料提醒" tone="warning">
            <p>
              請勿輸入公司機密、個人資料、真實乙方名稱、受 NDA
              保護內容或未公開報價。使用共享裝置時，本機資料仍可能被其他使用者看到。
            </p>
          </Callout>
          <Callout title="決策輔助免責聲明" tone="info">
            <p>
              本工具提供透明的模型參考區間，不構成正式報價、採購或法律意見，也不判定乙方報價「正確」或「不合理」。
            </p>
          </Callout>
        </section>

        <section className="content-section" aria-labelledby="workflow-title">
          <div className="section-heading">
            <p className="eyebrow">一條清楚的估算路徑</p>
            <h2 id="workflow-title">三步驟，把討論從總價帶回成本來源</h2>
          </div>
          <ol className="workflow-grid">
            {workflowSteps.map((step) => (
              <li key={step.number} className="workflow-card">
                <span className="workflow-card__number" aria-hidden="true">
                  {step.number}
                </span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="content-section" aria-labelledby="principles-title">
          <div className="section-heading">
            <p className="eyebrow">Explainability first</p>
            <h2 id="principles-title">適合拿來說明，不是假裝精準的黑盒子</h2>
          </div>
          <div className="card-grid card-grid--three">
            {productPrinciples.map((principle) => (
              <article className="feature-card" key={principle.title}>
                <h3>{principle.title}</h3>
                <p>{principle.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="closing-panel" aria-labelledby="closing-title">
          <div>
            <p className="eyebrow">準備開始</p>
            <h2 id="closing-title">先用虛構或去識別化內容完成一筆估算。</h2>
            <p>
              新使用者可從內建範例理解輸入方式，再依組織歷史資料校準示範參數。
            </p>
          </div>
          <div className="button-group">
            <Link className="button button--primary" href="/estimates/new">
              建立估算
            </Link>
            <Link className="button button--secondary" href="/examples">
              查看虛構範例
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
