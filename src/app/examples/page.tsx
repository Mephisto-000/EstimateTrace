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
  description: "查看兩筆完全虛構的 EstimateTrace 軟體需求成本估算範例。",
  path: "/examples",
});

export default function ExamplesPage() {
  return (
    <div className="page-shell content-page">
      <PageHeader eyebrow="虛構教學範例" title="從虛構範例理解估算方式">
        <p>
          以下案例只為教學而設計，名稱、範圍與數字皆為虛構示意，不對應任何真實公司、系統、乙方或市場報價。
        </p>
      </PageHeader>

      <Callout title="不可作為市場基準" tone="warning">
        <p>
          範例中的單位工時、風險乘數與商業參數只用來展示模型，不代表任何產業或組織的標準。
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
          <h2 id="examples-next-title">依實際範圍調整，不直接套用範例結果。</h2>
          <p>
            建立自己的估算時，請使用去識別化描述，並依組織歷史資料校準參數。
          </p>
        </div>
        <Link className="button button--primary" href="/estimates/new">
          建立估算
        </Link>
      </section>
    </div>
  );
}
