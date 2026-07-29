import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { MathFormula } from "@/components/content/math-formula";
import { Callout } from "@/components/layout/callout";
import { PageHeader } from "@/components/layout/page-header";
import { publicDemoParameterSet } from "@/config/parameter-sets/public-demo";
import { createPublicPageMetadata } from "@/config/site";

import "katex/dist/katex.min.css";

export const metadata: Metadata = createPublicPageMetadata({
  title: "公式與定義",
  description:
    "完整說明 EstimateTrace 的 Bottom-up Parametric Model、P50、P80、風險、成本、Vendor Markup 與報價差異公式。",
  path: "/methodology",
});

type VariableRow = {
  symbol: string;
  name: string;
  definition: string;
  unit: string;
  range?: string;
};

type FormulaProps = {
  expression: string;
  description: string;
};

const tableOfContents = [
  { id: "range", label: "為什麼輸出區間" },
  { id: "terms", label: "名詞與計量單位" },
  { id: "base-effort", label: "Work Item Base Effort" },
  { id: "complexity", label: "Complexity Multiplier" },
  { id: "risk", label: "Risk Factor Adjustment" },
  { id: "cross-cutting", label: "Cross-cutting Effort" },
  { id: "three-point", label: "Three-point Estimate" },
  { id: "percentiles", label: "P50 與 P80" },
  { id: "engineering-cost", label: "Engineering Cost" },
  {
    id: "commercial-adjustments",
    label: "Overhead、Warranty、Markup",
  },
  { id: "tax-normalization", label: "Tax normalization" },
  { id: "variance", label: "Vendor Quote Variance" },
  { id: "interpretation", label: "結果如何解讀" },
  { id: "double-counting", label: "常見 double counting" },
  { id: "limitations", label: "模型限制與適用邊界" },
  { id: "future-methods", label: "COCOMO II、COSMIC 與後續" },
] as const;

const commonVariables: readonly VariableRow[] = [
  {
    symbol: "q_i",
    name: "Quantity",
    definition: "第 i 個工作項目的數量。",
    unit: "item unit",
    range: "> 0",
  },
  {
    symbol: "u_i",
    name: "Unit Effort",
    definition: "每單位基礎工時。",
    unit: "person-hour／unit",
    range: "≥ 0.25",
  },
  {
    symbol: "c_i",
    name: "Complexity Multiplier",
    definition: "第 i 個工作項目的複雜度乘數。",
    unit: "dimensionless",
  },
  {
    symbol: "r_{i,k}",
    name: "Risk Multiplier",
    definition: "第 k 個風險對工作項目 i 的乘數。",
    unit: "dimensionless",
  },
  {
    symbol: "\\alpha_p",
    name: "Phase Loading",
    definition: "第 p 個 cross-cutting phase 的比例。",
    unit: "ratio",
  },
  {
    symbol: "H_M",
    name: "Most-likely Effort",
    definition:
      "納入 implementation、cross-cutting 與固定工時後的最可能工作量。",
    unit: "person-hour",
  },
  {
    symbol: "H_O,\\ H_P",
    name: "Optimistic／Pessimistic Effort",
    definition: "Three-point Estimate 的樂觀與悲觀工作量。",
    unit: "person-hour",
  },
  {
    symbol: "R_h",
    name: "Hourly Rate",
    definition: "Delivery labor 的基礎 blended hourly cost。",
    unit: "TWD／person-hour",
    range: "≥ 0",
  },
  {
    symbol: "D",
    name: "Direct Cost",
    definition: "不隨工時變動的授權、設備、差旅等成本。",
    unit: "TWD",
    range: "≥ 0",
  },
  {
    symbol: "o,\\ m,\\ t",
    name: "Overhead／Vendor Markup／Tax Rate",
    definition: "管銷間接成本、成本加成與稅率。",
    unit: "ratio",
    range: "≥ 0",
  },
  {
    symbol: "V",
    name: "Vendor Quote",
    definition: "正規化為未稅口徑後的乙方報價。",
    unit: "TWD",
    range: "≥ 0",
  },
];

function Formula({ expression, description }: FormulaProps) {
  return (
    <MathFormula
      className="formula-block"
      display
      expression={expression}
      label={description}
    />
  );
}

function InlineFormula({ expression, description }: FormulaProps) {
  return <MathFormula expression={expression} label={description} />;
}

function VariableTable({
  caption,
  rows,
}: {
  caption: string;
  rows: readonly VariableRow[];
}) {
  return (
    <div
      className="table-scroll"
      role="region"
      aria-label={caption}
      tabIndex={0}
    >
      <table className="data-table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">符號</th>
            <th scope="col">名稱</th>
            <th scope="col">定義</th>
            <th scope="col">單位</th>
            <th scope="col">允許範圍</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.symbol}>
              <th scope="row">
                <MathFormula
                  expression={row.symbol}
                  label={`${row.name}：${row.definition}`}
                />
              </th>
              <td>{row.name}</td>
              <td>{row.definition}</td>
              <td>{row.unit}</td>
              <td>{row.range ?? "依參數或輸入定義"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MethodSection({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="method-section" id={id} aria-labelledby={`${id}-title`}>
      <p className="method-section__number">Section {number}</p>
      <h2 id={`${id}-title`}>{title}</h2>
      {children}
    </section>
  );
}

function CalculatorFieldLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const target = href.split("#")[1] ?? "scope";
  return (
    <p className="calculator-field-link">
      <span>計算器對應欄位：</span>
      <Link href={`/estimates/new?target=${encodeURIComponent(target)}`}>
        {children}（建立案件後前往）
      </Link>
    </p>
  );
}

function formatRatio(value: string): string {
  return new Intl.NumberFormat("zh-TW", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(Number(value));
}

export default function MethodologyPage() {
  const parameterLabel = `${publicDemoParameterSet.id}@${publicDemoParameterSet.version}`;

  return (
    <div className="page-shell methodology-page">
      <PageHeader
        eyebrow="Bottom-up Parametric Model"
        title="軟體需求成本估算的公式與定義"
      >
        <p>
          本頁公開 EstimateTrace
          如何從工作項目、複雜度、風險與商業參數產生模型參考區間。每個係數都有名稱、單位與限制；相同輸入、參數快照與模型版本應得到相同結果。
        </p>
      </PageHeader>

      <div className="methodology-notices">
        <Callout title="示範參數，不是產業標準" tone="warning">
          <p>
            本頁目前對應參數集 <code>{parameterLabel}</code>
            。公開預設值只供教學與方法展示，使用者應以經授權、可追溯的組織歷史資料校準。
          </p>
        </Callout>
        <Callout title="如何閱讀 P50 與 P80" tone="info">
          <p>
            P50 與 P80 是透明 scenario range 的近似值，不是保證值；P80 也不是在
            P50 上固定多加一個百分比。
          </p>
        </Callout>
      </div>

      <div className="methodology-layout">
        <aside className="methodology-toc" data-print="hide">
          <nav aria-label="公式與定義章節">
            <p className="methodology-toc__title">本頁章節</p>
            <ol>
              {tableOfContents.map((item, index) => (
                <li key={item.id}>
                  <Link href={`#${item.id}`}>
                    <span aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <article className="methodology-content">
          <MethodSection
            id="range"
            number="01"
            title="為什麼成本估算應輸出區間"
          >
            <p>
              軟體需求在估算時通常仍有資訊缺口、整合依賴與交付風險。只輸出單一數字會隱藏不確定性，也容易讓使用者誤以為結果具保證性。
            </p>
            <dl className="definition-grid">
              <div>
                <dt>P50</dt>
                <dd>
                  模型的中央參考情境，用來討論最可能的工作量與成本，不代表「至少有一半機率準時」的保證。
                </dd>
              </div>
              <div>
                <dt>P80</dt>
                <dd>
                  較保守的 planning reference，反映輸入的不確定性；不是把 P50
                  任意加上固定 buffer。
                </dd>
              </div>
            </dl>
            <p>
              實務上應同時查看範圍、主要 drivers、assumptions、warnings 與完整
              calculation trace，而不是只選一個總價。
            </p>
            <CalculatorFieldLink href="/estimates/new#uncertainty">
              Uncertainty 設定
            </CalculatorFieldLink>
          </MethodSection>

          <MethodSection id="terms" number="02" title="名詞與計量單位">
            <p>
              EstimateTrace 把 person-hour、TWD、ratio 與 dimensionless
              multiplier 視為不同單位。Domain calculation
              保留完整精度，格式化與四捨五入只在顯示邊界進行。
            </p>
            <VariableTable caption="估算模型主要變數" rows={commonVariables} />
            <Callout title="person-month 不是 calendar month" tone="neutral">
              <p>
                Person-day 與 person-month
                只是依每人日工時及每人月工作日進行的工作量換算，不直接等於專案曆月。
              </p>
            </Callout>
            <CalculatorFieldLink href="/estimates/new#scope">
              計量單位與換算假設
            </CalculatorFieldLink>
          </MethodSection>

          <MethodSection
            id="base-effort"
            number="03"
            title="Work Item Base Effort"
          >
            <p>
              先將每個工作項目的數量乘以每單位基礎工時，再加總成 Base
              implementation effort。
            </p>
            <Formula
              expression="H_{i,\mathrm{base}} = q_i \times u_i"
              description="第 i 個工作項目的基礎工時，等於數量乘以每單位工時。"
            />
            <Formula
              expression="H_{\mathrm{base}} = \sum_{i=1}^{n} H_{i,\mathrm{base}}"
              description="全部工作項目的基礎工時，等於各項目基礎工時總和。"
            />
            <VariableTable
              caption="Base Effort 變數"
              rows={[
                commonVariables[0]!,
                commonVariables[1]!,
                {
                  symbol: "H_{i,\\mathrm{base}}",
                  name: "Item Base Effort",
                  definition: "單一工作項目未套用複雜度與風險前的工時。",
                  unit: "person-hour",
                  range: "≥ 0",
                },
              ]}
            />
            <div className="worked-example">
              <h3>代入範例</h3>
              <p>
                兩個 endpoint、每個 16 person-hours：
                <InlineFormula
                  expression="2 \times 16 = 32"
                  description="二乘以十六等於三十二。"
                />{" "}
                person-hours。
              </p>
            </div>
            <p>
              <strong>限制：</strong>
              <code>unitHours</code> 是示範起點。若已包含
              analysis、implementation 與 basic test，後續 phase loading
              不得把相同活動完整加入第二次。
            </p>
            <CalculatorFieldLink href="/estimates/new#work-items">
              Quantity、Unit Effort 與工作項目
            </CalculatorFieldLink>
          </MethodSection>

          <MethodSection
            id="complexity"
            number="04"
            title="Complexity Multiplier"
          >
            <p>
              Complexity
              反映單一工作項目的規則、狀態、角色、例外、整合與非功能要求，不等同於整體專案風險。
            </p>
            <Formula
              expression="H_{i,\mathrm{complex}} = H_{i,\mathrm{base}} \times c_i"
              description="複雜度調整工時，等於項目基礎工時乘以複雜度乘數。"
            />
            <div
              className="table-scroll"
              role="region"
              aria-label="公開示範複雜度參數"
              tabIndex={0}
            >
              <table className="data-table">
                <caption>公開示範 Complexity 參數</caption>
                <thead>
                  <tr>
                    <th scope="col">Level</th>
                    <th scope="col">Multiplier</th>
                    <th scope="col">可觀察定義</th>
                  </tr>
                </thead>
                <tbody>
                  {publicDemoParameterSet.complexityParameters.map((item) => (
                    <tr key={item.level}>
                      <th scope="row">{item.displayName}</th>
                      <td className="numeric-cell">{item.multiplier}</td>
                      <td>{item.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="worked-example">
              <h3>代入範例</h3>
              <p>
                Base Effort 32 person-hours、High complexity 1.35：
                <InlineFormula
                  expression="32 \times 1.35 = 43.2"
                  description="三十二乘以一點三五等於四十三點二。"
                />{" "}
                person-hours。
              </p>
            </div>
            <p>
              <strong>限制：</strong>
              選擇應以可觀察條件為理由，不能只為了把結果調到預期價格。
            </p>
            <CalculatorFieldLink href="/estimates/new#work-items">
              工作項目 Complexity
            </CalculatorFieldLink>
          </MethodSection>

          <MethodSection id="risk" number="05" title="Risk Factor Adjustment">
            <p>
              風險乘數只套用到真正受該 factor
              影響的工作項目。多個乘數以乘法組合，讓每個來源仍能獨立追蹤。
            </p>
            <Formula
              expression="H_{i,\mathrm{adj}} = H_{i,\mathrm{complex}} \times \prod_{k \in K_i} r_{i,k}"
              description="調整後工時，等於複雜度調整工時乘以所有適用的風險乘數。"
            />
            <Formula
              expression="H_{\mathrm{adj}} = \sum_{i=1}^{n} H_{i,\mathrm{adj}}"
              description="全體調整後工時，等於各工作項目調整後工時總和。"
            />
            <div
              className="table-scroll"
              role="region"
              aria-label="公開示範風險參數"
              tabIndex={0}
            >
              <table className="data-table">
                <caption>公開示範 Risk Factors 與 multipliers</caption>
                <thead>
                  <tr>
                    <th scope="col">Factor</th>
                    <th scope="col">Low</th>
                    <th scope="col">Nominal</th>
                    <th scope="col">High</th>
                    <th scope="col">Very High</th>
                    <th scope="col">定義</th>
                  </tr>
                </thead>
                <tbody>
                  {publicDemoParameterSet.riskFactors.map((factor) => (
                    <tr key={factor.id}>
                      <th scope="row">{factor.displayName}</th>
                      <td className="numeric-cell">{factor.multipliers.LOW}</td>
                      <td className="numeric-cell">
                        {factor.multipliers.NOMINAL}
                      </td>
                      <td className="numeric-cell">
                        {factor.multipliers.HIGH}
                      </td>
                      <td className="numeric-cell">
                        {factor.multipliers.VERY_HIGH}
                      </td>
                      <td>{factor.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="worked-example">
              <h3>代入範例</h3>
              <p>
                43.2 person-hours 套用 scenario override Integration risk 1.20
                時（此數值只為對齊 worked example，不是 canonical High 1.15）：
                <InlineFormula
                  expression="43.2 \times 1.20 = 51.84"
                  description="四十三點二乘以一點二零等於五十一點八四。"
                />{" "}
                person-hours。
              </p>
            </div>
            <p>
              <strong>安全限制：</strong>
              風險乘積超過 canonical safety cap{" "}
              <code>
                {publicDemoParameterSet.constraints.riskProductSafetyCap}
              </code>{" "}
              時，系統必須提出 warning 並要求檢視，不得悄悄截斷。Schedule
              Compression 表示協調、平行作業、返工或加班增加的
              effort，不只是縮短日曆。
            </p>
            <CalculatorFieldLink href="/estimates/new#risk-factors">
              Risk Factor 問卷
            </CalculatorFieldLink>
          </MethodSection>

          <MethodSection
            id="cross-cutting"
            number="06"
            title="Cross-cutting Effort"
          >
            <p>
              Business Analysis、Architecture、Project Management、Quality
              Assurance、Deployment 與 Documentation 等活動，以 adjusted
              implementation effort 為基礎計算。對每個 phase{" "}
              <InlineFormula expression="p" description="第 p 個 phase。" />
              ，
              <InlineFormula
                expression="E_p"
                description="第 p 個 phase 尚未被工作項目涵蓋的 eligible item 集合。"
              />{" "}
              只包含尚未在工作項目內涵蓋該 phase 的 eligible items。
            </p>
            <Formula
              expression="H_{\mathrm{cross},p} = \alpha_p \times \sum_{i \in E_p} H_{i,\mathrm{adj}}"
              description="第 p 個 Cross-cutting phase 工時，等於該 phase loading 比例乘以 eligible 工作項目的調整後工時總和。"
            />
            <Formula
              expression="H_{\mathrm{cross}} = \sum_p H_{\mathrm{cross},p}"
              description="Cross-cutting 總工時，等於各 phase 工時的總和。"
            />
            <Formula
              expression="H_M = H_{\mathrm{adj}} + H_{\mathrm{cross}} + H_{\mathrm{fixed}}"
              description="最可能工作量，等於調整後實作工時、跨階段工時與固定額外工時的總和。"
            />
            <div
              className="table-scroll"
              role="region"
              aria-label="公開示範 phase loading"
              tabIndex={0}
            >
              <table className="data-table">
                <caption>公開示範 Phase Loading</caption>
                <thead>
                  <tr>
                    <th scope="col">Phase</th>
                    <th scope="col">Default ratio</th>
                    <th scope="col">說明</th>
                  </tr>
                </thead>
                <tbody>
                  {publicDemoParameterSet.phaseLoadingParameters.map(
                    (phase) => (
                      <tr key={phase.phase}>
                        <th scope="row">{phase.displayName}</th>
                        <td className="numeric-cell">
                          {phase.defaultRate}（{formatRatio(phase.defaultRate)}
                          ）
                        </td>
                        <td>{phase.description}</td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
            <div className="worked-example">
              <h3>代入範例</h3>
              <p>
                Adjusted effort 51.84、loading 合計 40%、無固定工時：
                <InlineFormula
                  expression="51.84 \times (1 + 0.40) = 72.576"
                  description="五十一點八四乘以一加零點四零，等於七十二點五七六。"
                />{" "}
                person-hours。
              </p>
            </div>
            <p>
              <strong>限制：</strong>
              若工作項目已明列 TESTING、DEPLOYMENT 或 DOCUMENTATION 工時，對應
              loading 應降低或設為 0，只加入尚未涵蓋的活動。
            </p>
            <CalculatorFieldLink href="/estimates/new#phase-loading">
              Phase Loading 與固定額外工時
            </CalculatorFieldLink>
          </MethodSection>

          <MethodSection
            id="three-point"
            number="07"
            title="Three-point Estimate"
          >
            <p>
              使用 downside 與 upside uncertainty
              將最可能工作量轉為樂觀、最可能與悲觀三點。介面用風險描述協助選擇，不要求使用者具統計背景。
            </p>
            <Formula
              expression="H_O = H_M \times (1 - d)"
              description="樂觀工作量，等於最可能工作量乘以下行情境比例。"
            />
            <Formula
              expression="H_P = H_M \times (1 + u)"
              description="悲觀工作量，等於最可能工作量乘以上行情境比例。"
            />
            <VariableTable
              caption="Three-point Estimate 變數"
              rows={[
                {
                  symbol: "d",
                  name: "Downside uncertainty",
                  definition: "相對於 Most-likely Effort 的樂觀下降比例。",
                  unit: "ratio",
                  range: "0 ≤ d ≤ 0.50",
                },
                {
                  symbol: "u",
                  name: "Upside uncertainty",
                  definition: "相對於 Most-likely Effort 的悲觀增加比例。",
                  unit: "ratio",
                  range: "0 ≤ u ≤ 2.00",
                },
              ]}
            />
            <div
              className="table-scroll"
              role="region"
              aria-label="公開示範 uncertainty 參數"
              tabIndex={0}
            >
              <table className="data-table">
                <caption>公開示範 Uncertainty 情境</caption>
                <thead>
                  <tr>
                    <th scope="col">Level</th>
                    <th scope="col">Downside</th>
                    <th scope="col">Upside</th>
                    <th scope="col">說明</th>
                  </tr>
                </thead>
                <tbody>
                  {publicDemoParameterSet.uncertaintyParameters.map((item) => (
                    <tr key={item.level}>
                      <th scope="row">{item.level.replace("_", " ")}</th>
                      <td className="numeric-cell">
                        {formatRatio(item.downsideRate)}
                      </td>
                      <td className="numeric-cell">
                        {formatRatio(item.upsideRate)}
                      </td>
                      <td>{item.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="worked-example">
              <h3>代入範例</h3>
              <p>
                <InlineFormula
                  expression="H_M = 72.576,\ d = 0.15,\ u = 0.30"
                  description="最可能工作量七十二點五七六、下行比例零點一五、上行比例零點三零。"
                />{" "}
                時，
                <InlineFormula
                  expression="H_O = 61.6896,\ H_P = 94.3488"
                  description="樂觀工作量六十一點六八九六、悲觀工作量九十四點三四八八。"
                />{" "}
                person-hours，並保持{" "}
                <InlineFormula
                  expression="0 \le H_O \le H_M \le H_P"
                  description="樂觀工作量不大於最可能工作量，最可能工作量不大於悲觀工作量，且皆不小於零。"
                />
                。
              </p>
            </div>
            <CalculatorFieldLink href="/estimates/new#uncertainty">
              Uncertainty 情境
            </CalculatorFieldLink>
          </MethodSection>

          <MethodSection id="percentiles" number="08" title="PERT、P50 與 P80">
            <p>
              MVP 使用 Beta-PERT 的常見近似先取得期望值與標準差，再以 Normal
              approximation 產生 percentile。
            </p>
            <Formula
              expression="\mu = \frac{H_O + 4H_M + H_P}{6}"
              description="PERT 期望工作量，等於樂觀工時加四倍最可能工時再加悲觀工時，總和除以六。"
            />
            <Formula
              expression="\sigma = \frac{H_P - H_O}{6}"
              description="標準差近似，等於悲觀與樂觀工時差除以六。"
            />
            <Formula
              expression="H_{P_x} = \max\left(0, \mu + z_x \sigma\right)"
              description="指定 percentile 的工作量，等於期望值加上 z-score 乘以標準差，最低為零。"
            />
            <Formula
              expression="H_{P50} = \mu"
              description="P50 等於 PERT 期望值。"
            />
            <Formula
              expression={`H_{P80} = \\max\\left(0, \\mu + ${publicDemoParameterSet.calculationPolicy.p80ZScore}\\sigma\\right)`}
              description={`P80 使用 z-score ${publicDemoParameterSet.calculationPolicy.p80ZScore}。`}
            />
            <div className="worked-example">
              <h3>代入範例</h3>
              <p>
                前述三點得到{" "}
                <InlineFormula
                  expression="H_{P50} = 74.3904,\ \sigma = 5.4432"
                  description="P50 為七十四點三九零四，標準差為五點四四三二。"
                />
                ；P80 約為{" "}
                <InlineFormula
                  expression="74.3904 + 0.8416 \times 5.4432 = 78.97139712"
                  description="七十四點三九零四加上零點八四一六乘以五點四四三二，等於七十八點九七一三九七一二。"
                />{" "}
                person-hours。畫面最後才顯示為 74.4 與 79.0 小時。
              </p>
            </div>
            <p>
              <strong>限制：</strong>
              這是近似，不表示真實工作量服從 Normal
              distribution。若三點輸入沒有歷史資料支持，結果只是透明的 scenario
              range；MVP 不執行 Monte Carlo simulation。
            </p>
            <CalculatorFieldLink href="/estimates/new#uncertainty">
              P50／P80 的 Uncertainty 輸入
            </CalculatorFieldLink>
          </MethodSection>

          <MethodSection
            id="engineering-cost"
            number="09"
            title="Engineering Cost"
          >
            <p>
              先用 percentile effort 乘以 blended hourly
              cost，再加入不隨工時變動的 direct cost。
            </p>
            <Formula
              expression="C_{\mathrm{labor},x} = H_{P_x} \times R_h"
              description="指定 percentile 的人力成本，等於該 percentile 工時乘以每小時成本。"
            />
            <Formula
              expression="C_{\mathrm{delivery},x} = C_{\mathrm{labor},x} + D"
              description="交付成本，等於人力成本加上直接成本。"
            />
            <VariableTable
              caption="Engineering Cost 變數"
              rows={[
                {
                  symbol: "H_{P_x}",
                  name: "Percentile Effort",
                  definition: "P50 或 P80 person-hours。",
                  unit: "person-hour",
                  range: "≥ 0",
                },
                commonVariables[7]!,
                commonVariables[8]!,
              ]}
            />
            <div className="worked-example">
              <h3>代入範例</h3>
              <p>
                P50 74.3904 小時、hourly rate 1,000 TWD、direct cost 5,000
                TWD：labor cost 為 74,390.4 TWD，delivery cost 為 79,390.4
                TWD。TWD 只在顯示時格式化成整數。
              </p>
            </div>
            <p>
              <strong>限制：</strong>若 hourly rate 已包含 overhead，Overhead
              Rate 必須設為 0，避免重複計入。
            </p>
            <CalculatorFieldLink href="/estimates/new#commercial-terms">
              Hourly Rate 與 Direct Cost
            </CalculatorFieldLink>
          </MethodSection>

          <MethodSection
            id="commercial-adjustments"
            number="10"
            title="Overhead、Warranty 與 Vendor Markup"
          >
            <p>
              管銷間接成本、保固／hypercare
              與供應商成本加成分開呈現，讓使用者能知道 benchmark quote 如何由
              engineering cost 形成。
            </p>
            <Formula
              expression="C_{\mathrm{full},x} = C_{\mathrm{delivery},x} \times (1 + o) + W"
              description="完整成本，等於交付成本加上 overhead，再加固定 warranty 成本。"
            />
            <Formula
              expression="Q_{\mathrm{exTax},x} = C_{\mathrm{full},x} \times (1 + m)"
              description="未稅模型參考報價，等於完整成本乘以一加 Vendor Markup。"
            />
            <Formula
              expression="Q_{\mathrm{incTax},x} = Q_{\mathrm{exTax},x} \times (1 + t)"
              description="含稅模型參考報價，等於未稅參考報價乘以一加稅率。"
            />
            <VariableTable
              caption="商業加成變數"
              rows={[
                {
                  symbol: "o",
                  name: "Overhead Rate",
                  definition: "供應商管銷與間接成本比例。",
                  unit: "ratio",
                  range: "≥ 0",
                },
                {
                  symbol: "W",
                  name: "Warranty Cost",
                  definition: "保固與 hypercare 的固定成本。",
                  unit: "TWD",
                  range: "≥ 0",
                },
                {
                  symbol: "m",
                  name: "Vendor Markup",
                  definition: "加在成本上的比例，不是 Gross Margin。",
                  unit: "ratio",
                  range: "≥ 0",
                },
                {
                  symbol: "t",
                  name: "Tax Rate",
                  definition: "用於含稅顯示與報價正規化的稅率。",
                  unit: "ratio",
                  range: "≥ 0",
                },
              ]}
            />
            <Callout title="Markup 不等於 Gross Margin" tone="warning">
              <p>
                本模型使用{" "}
                <InlineFormula
                  expression="C \times (1 + m)"
                  description="成本乘以一加 markup。"
                />
                。若使用 Gross Margin{" "}
                <InlineFormula expression="g" description="Gross Margin g。" />
                ，公式會是{" "}
                <InlineFormula
                  expression="\frac{C}{1 - g}"
                  description="成本除以一減 Gross Margin。"
                />
                ；MVP 不混用兩種定義，也不把 P80 uncertainty 再命名為 risk
                reserve 後重複加價。
              </p>
            </Callout>
            <CalculatorFieldLink href="/estimates/new#commercial-terms">
              Overhead、Warranty、Vendor Markup 與 Tax
            </CalculatorFieldLink>
          </MethodSection>

          <MethodSection
            id="tax-normalization"
            number="11"
            title="Tax normalization"
          >
            <p>
              模型與乙方報價預設都正規化成未稅口徑再比較，避免把含稅與未稅數字直接相減。
            </p>
            <Formula
              expression="V_{\mathrm{exTax}} = \frac{V_{\mathrm{incTax}}}{1 + t}"
              description="含稅乙方報價的未稅金額，等於含稅金額除以一加稅率。"
            />
            <p>
              若輸入本來就是未稅報價，則{" "}
              <InlineFormula
                expression="V_{\mathrm{exTax}} = V"
                description="未稅乙方報價等於輸入報價。"
              />
              。結果可另外顯示含稅數字，但 variance 使用相同未稅基準。
            </p>
            <div className="worked-example">
              <h3>代入範例</h3>
              <p>
                含稅報價 105,000 TWD、tax rate 5%：未稅報價為
                <InlineFormula
                  expression="\frac{105{,}000}{1.05} = 100{,}000"
                  description="十萬五千除以一點零五，等於十萬。"
                />{" "}
                TWD。
              </p>
            </div>
            <p>
              <strong>限制：</strong>
              公開預設稅率只是示範值；使用者必須依案件適用稅制確認。
            </p>
            <CalculatorFieldLink href="/estimates/new#vendor-quote">
              Quote Amount 與 Tax Basis
            </CalculatorFieldLink>
          </MethodSection>

          <MethodSection
            id="variance"
            number="12"
            title="Vendor Quote Variance"
          >
            <p>
              先計算乙方未稅報價與 P50／P80 未稅 benchmark 的金額差，再以各
              benchmark 為分母換算差異率與 ratio。
            </p>
            <Formula
              expression="\Delta_{50} = V_{\mathrm{exTax}} - Q_{\mathrm{exTax},50}"
              description="相對 P50 的金額差，等於乙方未稅報價減去 P50 未稅參考報價。"
            />
            <Formula
              expression="\mathrm{Variance}_{50} = \frac{\Delta_{50}}{Q_{\mathrm{exTax},50}},\quad Q_{\mathrm{exTax},50} > 0"
              description="相對 P50 的差異率，在 P50 參考報價大於零時，等於金額差除以 P50 參考報價。"
            />
            <Formula
              expression="\Delta_{80} = V_{\mathrm{exTax}} - Q_{\mathrm{exTax},80}"
              description="相對 P80 的金額差，等於乙方未稅報價減去 P80 未稅參考報價。"
            />
            <Formula
              expression="\mathrm{Variance}_{80} = \frac{\Delta_{80}}{Q_{\mathrm{exTax},80}},\quad Q_{\mathrm{exTax},80} > 0"
              description="相對 P80 的差異率，在 P80 參考報價大於零時，等於金額差除以 P80 參考報價。"
            />
            <Formula
              expression="\mathrm{QuoteRatio}_x = \frac{V_{\mathrm{exTax}}}{Q_{\mathrm{exTax},x}},\quad Q_{\mathrm{exTax},x} > 0"
              description="指定 percentile 的報價比率，在參考報價大於零時，等於乙方未稅報價除以模型未稅參考報價。"
            />
            <VariableTable
              caption="Vendor Quote Variance 變數"
              rows={[
                commonVariables[10]!,
                {
                  symbol: "Q_{\mathrm{exTax},50},\\ Q_{\mathrm{exTax},80}",
                  name: "Benchmark Quote Ex Tax",
                  definition: "模型 P50／P80 的未稅參考報價。",
                  unit: "TWD",
                  range: "≥ 0",
                },
                {
                  symbol: "\\mathrm{Variance}_{50},\\ \\mathrm{Variance}_{80}",
                  name: "Quote Variance",
                  definition: "乙方報價相對模型參考報價的差異率。",
                  unit: "ratio",
                },
              ]}
            />
            <p>
              <strong>除以零：</strong>
              benchmark 為 0 時 variance 與 ratio 沒有定義，UI
              必須顯示「無法計算」，不得顯示 Infinity、NaN 或假裝為 0%。
            </p>
            <CalculatorFieldLink href="/estimates/new#vendor-quote">
              乙方報價比較
            </CalculatorFieldLink>
          </MethodSection>

          <MethodSection id="interpretation" number="13" title="結果如何解讀">
            <p>
              結果先呈現模型來源與假設，再顯示中性的 comparison
              band。標籤不是採購或法律結論，而是下一輪釐清的提示。
            </p>
            <div className="interpretation-list">
              <article>
                <h3>明顯低於模型區間</h3>
                <p>請檢查漏項、交付範圍、追加條件或被低估的風險。</p>
              </article>
              <article>
                <h3>接近模型參考區間</h3>
                <p>仍需確認假設、稅基、工作量分解與合約範圍一致。</p>
              </article>
              <article>
                <h3>高於模型 P50</h3>
                <p>
                  請確認 overhead、warranty、第三方成本與 contingency 來源。
                </p>
              </article>
              <article>
                <h3>高於模型 P80</h3>
                <p>建議要求角色別工時、風險明細、交付與保固邊界。</p>
              </article>
            </div>
            <p>
              應依序查看 P50／P80 effort and quote、Vendor comparison、Top
              drivers、Breakdown、Assumptions and warnings、Full
              trace。正負差異不可只靠紅綠色表示。
            </p>
            <CalculatorFieldLink href="/estimates/new#vendor-quote">
              結果與報價比較
            </CalculatorFieldLink>
          </MethodSection>

          <MethodSection
            id="double-counting"
            number="14"
            title="常見 double counting"
          >
            <p>
              同一成本若同時出現在 Unit Effort、Phase Loading、Risk
              Factor、Overhead 或 P80 uncertainty，結果會被重複放大。
            </p>
            <ul className="warning-list">
              <li>
                <strong>Unit Effort 與 Phase Loading：</strong>若 unit hours
                已含 analysis 與 basic test，不再加入完整 BA／QA loading。
              </li>
              <li>
                <strong>明列工作項目與 Cross-cutting：</strong>
                已建立 TESTING、DEPLOYMENT、DOCUMENTATION item 時，對應 phase
                只加入尚未涵蓋的部分。
              </li>
              <li>
                <strong>Hourly Rate 與 Overhead：</strong>
                Blended rate 已含管銷成本時，overhead rate 設為 0。
              </li>
              <li>
                <strong>Risk 與 Uncertainty：</strong>
                Risk multiplier 調整可預期的額外 effort；P80
                描述估算分布，不再另加同義 contingency。
              </li>
              <li>
                <strong>Warranty 與 Delivery：</strong>
                Delivery cost 已包含 hypercare 時，不再加入相同 Warranty Cost。
              </li>
            </ul>
            <CalculatorFieldLink href="/estimates/new#phase-loading">
              Included Activities 與 Phase Loading
            </CalculatorFieldLink>
          </MethodSection>

          <MethodSection
            id="limitations"
            number="15"
            title="模型限制與適用邊界"
          >
            <ul className="warning-list">
              <li>公開參數沒有宣稱跨產業精準，也不是市場費率或採購底價。</li>
              <li>
                結果品質受需求拆解、unit effort、risk rationale
                與商業假設品質影響。
              </li>
              <li>
                PERT 與 Normal approximation 是透明近似，不代表真實工時分布。
              </li>
              <li>
                模型不處理匯率、自動稅率、通膨、授權行情或第三方報價更新。
              </li>
              <li>
                MVP 不建立實際工時回饋迴圈，需由組織另行以合規歷史資料校準。
              </li>
              <li>
                本工具不作出「報價合理／不合理」的絕對結論，也不取代合約審查。
              </li>
            </ul>
            <p>
              每次分享結果都應保留 <code>modelVersion</code>、
              <code>parameterSetId</code>、<code>parameterSetVersion</code>
              、輸入與 parameter snapshot，讓後續能重算與解釋版本差異。
            </p>
            <CalculatorFieldLink href="/estimates/new#scope">
              案件範圍與估算假設
            </CalculatorFieldLink>
          </MethodSection>

          <MethodSection
            id="future-methods"
            number="16"
            title="COCOMO II、COSMIC 與後續擴充"
          >
            <p>
              COCOMO II 提供 software cost estimation 的重要背景，COSMIC 與
              Function Point
              則從功能規模切入。它們需要不同輸入、校準資料與模型假設，MVP
              不把名稱借來包裝目前的 Bottom-up Parametric Model。
            </p>
            <dl className="definition-grid">
              <div>
                <dt>COCOMO II</dt>
                <dd>
                  適合在具備規模、scale factors、effort multipliers
                  與組織校準資料時作為獨立估算模型或交叉檢查。
                </dd>
              </div>
              <div>
                <dt>COSMIC／Function Point</dt>
                <dd>
                  可建立較一致的功能規模基準，但需要明確 counting rules、review
                  與歷史 productivity 資料。
                </dd>
              </div>
              <div>
                <dt>Monte Carlo</dt>
                <dd>
                  未來可用輸入分布取代單一近似，但必須公開 sampling
                  規則、seed／reproducibility 與結果解讀方式。
                </dd>
              </div>
              <div>
                <dt>Company calibration</dt>
                <dd>
                  應在獨立 private project 處理實際工時、RBAC、immutable
                  versions、Audit Log 與資料保護，不能提交回 public upstream。
                </dd>
              </div>
            </dl>
            <p>
              後續模型若改變公式或結果語意，必須升級 model version、提供
              migration note，且不得無聲覆寫舊案件 snapshot。
            </p>
            <div className="button-group" data-print="hide">
              <Link className="button button--primary" href="/estimates/new">
                開始建立估算
              </Link>
              <Link className="button button--secondary" href="/examples">
                查看虛構範例
              </Link>
            </div>
          </MethodSection>
        </article>
      </div>
    </div>
  );
}
