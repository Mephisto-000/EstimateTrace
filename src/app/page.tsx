import type { Metadata } from "next";
import Link from "next/link";

import { Callout } from "@/components/layout/callout";
import { createPublicPageMetadata } from "@/config/site";

export const metadata: Metadata = createPublicPageMetadata({
  title: "EstimateTrace｜軟體需求估算參考",
  description:
    "把需求、工時、風險、成本與乙方報價整理在一起，讓你看得懂、算得回、說得清。",
  path: "/",
  absoluteTitle: true,
});

const workflowSteps = [
  {
    number: "01",
    title: "拆需求",
    description:
      "把畫面、報表、規則、介接、測試和部署拆成工作項目，先說清楚要交付什麼。",
  },
  {
    number: "02",
    title: "估工作量",
    description: "設定複雜度、風險和交付項目，算出 P50 與 P80 的工時範圍。",
  },
  {
    number: "03",
    title: "比報價",
    description:
      "先統一未稅基準，再比較參考區間和乙方報價，找出需要確認的成本。",
  },
] as const;

const productPrinciples = [
  {
    title: "每個數字都有來源",
    description:
      "你可以看到公式、代入值、單位、工作項目和參數版本，不只看到最後總價。",
  },
  {
    title: "相同輸入得到相同結果",
    description:
      "同一份輸入和版本會算出同樣結果；工具不會用人工智慧或隱藏係數決定價格。",
  },
  {
    title: "資料留在瀏覽器",
    description:
      "不必登入，也沒有資料庫；案件不會傳到伺服器，可自行下載 JSON 備份。",
  },
] as const;

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero__inner">
          <div className="hero__copy">
            <h1>軟體需求估算參考</h1>
            <p className="hero__lead">
              給提出需求、做商業分析、管理專案或採購的人使用。EstimateTrace
              幫你把需求拆成工作項目，算出 P50、P80
              的工時與價格範圍，再用同一個基準看乙方報價。
            </p>
            <div className="button-group">
              <Link className="button button--primary" href="/estimates/new">
                開始估算
              </Link>
              <Link
                className="button button--secondary"
                href="/methodology"
                prefetch={false}
              >
                查看公式與定義
              </Link>
            </div>
            <p className="hero__privacy-note">無需登入 · 資料只留在瀏覽器</p>
          </div>
          <aside className="hero__trace" aria-label="估算軌跡示意">
            <p className="hero__trace-label">估算軌跡</p>
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
              EstimateTrace
              是公開網站。請不要輸入公司機密、個人資料、真實乙方名稱、受保密協議（NDA）保護的內容或未公開報價。共用裝置上的其他人仍可能看到瀏覽器裡的資料。
            </p>
          </Callout>
          <Callout title="決策輔助免責聲明" tone="info">
            <p>
              這個工具只作為決策輔助，提供可追溯的模型參考區間，不構成正式報價、採購或法律意見，也不會替乙方報價下結論。
            </p>
          </Callout>
        </section>

        <section className="content-section" aria-labelledby="workflow-title">
          <div className="section-heading">
            <h2 id="workflow-title">三步驟，從總價回頭看成本怎麼來</h2>
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
            <h2 id="principles-title">看得懂，也說得清</h2>
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
            <h2 id="closing-title">先用虛構或去識別化的內容試算一筆。</h2>
            <p>
              可以先用內建範例熟悉輸入方式，再在私有環境使用經授權的組織歷史資料調整示範參數。
            </p>
          </div>
          <div className="button-group">
            <Link
              className="button button--primary"
              href="/estimates/new"
              prefetch={false}
            >
              建立估算
            </Link>
            <Link
              className="button button--secondary"
              href="/examples"
              prefetch={false}
            >
              查看虛構範例
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
