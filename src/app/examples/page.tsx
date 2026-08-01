import type { Metadata } from "next";
import Link from "next/link";

import { Callout } from "@/components/layout/callout";
import { PageHeader } from "@/components/layout/page-header";
import { createPublicPageMetadata } from "@/config/site";
import { fictionalExampleDescriptors } from "@/features/estimation/application/create-estimate";
import { ExampleLoadButton } from "@/features/estimation/presentation/example-load-button";
import { WORK_ITEM_TYPE_LABELS } from "@/features/estimation/presentation/labels";

export const metadata: Metadata = createPublicPageMetadata({
  title: "範例",
  description: "查看兩筆完全虛構的 EstimateTrace 軟體需求估算範例。",
  path: "/examples",
});

export default function ExamplesPage() {
  return (
    <div className="page-shell content-page">
      <PageHeader eyebrow="虛構教學範例" title="先從範例認識估算方式">
        <p>
          這些案例只用來示範。名稱、範圍和數字都是虛構的，不對應真實公司、系統、乙方或市場報價。
        </p>
      </PageHeader>

      <Callout title="不可作為市場基準" tone="warning">
        <p>
          範例中的工時、風險係數和成本條件只用來說明工具，不是任何產業或公司的標準。
        </p>
      </Callout>

      <section className="examples-grid" aria-label="內建虛構範例">
        {fictionalExampleDescriptors.map((example) => (
          <article
            className="example-card"
            data-example-id={example.id}
            key={example.id}
          >
            <div>
              <p className="example-card__label">虛構教學案例</p>
              <h2>{example.title}</h2>
              <p>{example.summary}</p>
            </div>
            <div>
              <h3>示範範圍</h3>
              <ul className="check-list">
                {example.scope.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <ul className="tag-list" aria-label="工作項目類型">
              {example.workItemTypes.map((workItemType) => (
                <li key={workItemType}>
                  {WORK_ITEM_TYPE_LABELS[workItemType]}
                </li>
              ))}
            </ul>
            <ExampleLoadButton exampleIndex={example.index} />
          </article>
        ))}
      </section>

      <section className="closing-panel" aria-labelledby="examples-next-title">
        <div>
          <p className="eyebrow">你的情境會不同</p>
          <h2 id="examples-next-title">
            請依自己的範圍調整，不要直接套用範例結果。
          </h2>
          <p>
            建立自己的估算時，請用去識別化的描述，並在私有環境使用經授權的組織歷史資料調整參數。
          </p>
        </div>
        <Link className="button button--primary" href="/estimates/new">
          建立估算
        </Link>
      </section>
    </div>
  );
}
