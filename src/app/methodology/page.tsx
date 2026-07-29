import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { MathFormula } from "@/components/content/math-formula";
import { Callout } from "@/components/layout/callout";
import { PageHeader } from "@/components/layout/page-header";
import { publicDemoParameterSet } from "@/config/parameter-sets/public-demo";
import { createPublicPageMetadata } from "@/config/site";
import { METHODOLOGY_MATH } from "@/features/estimation/domain";
import { COMPLEXITY_LEVEL_LABELS } from "@/features/estimation/presentation/labels";

export const metadata: Metadata = createPublicPageMetadata({
  title: "公式與定義",
  description:
    "完整說明 EstimateTrace 的由下而上參數估算模型、P50、P80、風險、成本、乙方成本加成與報價差異公式。",
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

type TerminologyRow = {
  term: string;
  definition: string;
};

const tableOfContents = [
  { id: "range", label: "為什麼輸出區間" },
  { id: "terms", label: "名詞與計量單位" },
  { id: "base-effort", label: "工作項目基礎工時" },
  { id: "complexity", label: "複雜度乘數" },
  { id: "risk", label: "風險因子調整" },
  { id: "cross-cutting", label: "跨階段工作量" },
  { id: "three-point", label: "三點估算" },
  { id: "percentiles", label: "P50 與 P80" },
  { id: "engineering-cost", label: "工程成本" },
  {
    id: "commercial-adjustments",
    label: "管銷、保固與成本加成",
  },
  { id: "tax-normalization", label: "稅基正規化" },
  { id: "variance", label: "乙方報價差異" },
  { id: "interpretation", label: "結果如何解讀" },
  { id: "double-counting", label: "常見重複計入" },
  { id: "limitations", label: "模型限制與適用邊界" },
  { id: "future-methods", label: "其他估算方法與後續" },
] as const;

const terminologyRows: readonly TerminologyRow[] = [
  {
    term: "估算(Estimate)",
    definition: "依現有資訊與假設推算工作量或成本，不是承諾價格。",
  },
  {
    term: "工作量(Effort)",
    definition: "完成交付所需的人力投入，通常以人時、人日或人月計量。",
  },
  {
    term: "工期(Duration)",
    definition: "從開始到完成的日曆經過時間，不等於工作量。",
  },
  {
    term: "由下而上參數估算模型(Bottom-up Parametric Model)",
    definition: "先估算各工作項目的數量、單位工時與調整係數，再逐項加總。",
  },
  {
    term: "資訊科技商業分析師(IT Business Analyst)",
    definition:
      "協助釐清需求、流程、規則與交付範圍，並向利害關係人說明估算依據的角色。",
  },
  {
    term: "工作項目(Work Item)",
    definition: "可明確描述、計量並追溯到交付範圍的估算單位。",
  },
  {
    term: "複雜度乘數(Complexity Multiplier)",
    definition: "依規則、角色、狀態、例外與整合難度調整單一工作項目的係數。",
  },
  {
    term: "風險因子(Risk Factor)",
    definition: "只套用到實際受影響工作項目的可追溯風險來源。",
  },
  {
    term: "跨階段工作量(Cross-cutting Effort)",
    definition:
      "商業分析、架構、專案管理、品質保證、部署與文件等橫跨多個項目的工作量。",
  },
  {
    term: "三點估算(Three-point Estimate)",
    definition: "以樂觀、最可能及悲觀三個值描述估算不確定性。",
  },
  {
    term: "計畫評核術(PERT)",
    definition: "以三點估算的加權平均與範圍近似期望工作量及百分位數。",
  },
  {
    term: "管銷間接成本(Overhead)",
    definition: "無法直接歸屬單一工作項目的供應商間接成本。",
  },
  {
    term: "乙方成本加成率(Vendor Markup)",
    definition: "以成本為分母計算的加成比例。",
  },
  {
    term: "毛利率(Gross Margin)",
    definition: "以售價為分母計算的毛利比例，與成本加成率不同。",
  },
  {
    term: "稅基正規化(Tax Normalization)",
    definition: "將乙方報價與模型結果換算成相同未稅基準後比較。",
  },
  {
    term: "報價差異率(Quote Variance)",
    definition: "乙方未稅報價與模型參考報價的差額，占模型參考報價的比例。",
  },
  {
    term: "參數集(Parameter Set)",
    definition: "一組具版本的單位工時、乘數、比例、限制與計算政策。",
  },
  {
    term: "參數快照(Parameter Snapshot)",
    definition: "案件建立或匯出時保存的完整參數副本，用於日後重算。",
  },
  {
    term: "計算軌跡(Calculation Trace)",
    definition: "公式、代入值、中間結果、單位及來源的完整紀錄。",
  },
] as const;

const commonVariables: readonly VariableRow[] = [
  {
    symbol: METHODOLOGY_MATH.symbols.quantity,
    name: "數量(Quantity)",
    definition: "第 i 個工作項目的數量。",
    unit: "項目單位",
    range: "> 0",
  },
  {
    symbol: METHODOLOGY_MATH.symbols.unitEffort,
    name: "單位工時(Unit Effort)",
    definition: "每單位基礎工時。",
    unit: "人時／單位",
    range: "≥ 0.25",
  },
  {
    symbol: METHODOLOGY_MATH.symbols.complexityMultiplier,
    name: "複雜度乘數(Complexity Multiplier)",
    definition: "第 i 個工作項目的複雜度乘數。",
    unit: "無量綱",
  },
  {
    symbol: METHODOLOGY_MATH.symbols.riskMultiplier,
    name: "風險乘數(Risk Multiplier)",
    definition: "第 k 個風險對工作項目 i 的乘數。",
    unit: "無量綱",
  },
  {
    symbol: METHODOLOGY_MATH.symbols.phaseLoading,
    name: "階段工時比例(Phase Loading)",
    definition: "第 p 個跨階段活動的工時比例。",
    unit: "比率",
  },
  {
    symbol: METHODOLOGY_MATH.symbols.mostLikelyEffort,
    name: "最可能工時(Most-likely Effort)",
    definition: "納入實作、跨階段活動與固定工時後的最可能工作量。",
    unit: "人時",
  },
  {
    symbol: METHODOLOGY_MATH.symbols.threePointBounds,
    name: "樂觀／悲觀工時(Optimistic/Pessimistic Effort)",
    definition: "三點估算中的樂觀與悲觀工作量。",
    unit: "人時",
  },
  {
    symbol: METHODOLOGY_MATH.symbols.hourlyRate,
    name: "綜合每小時成本(Blended Hourly Cost)",
    definition: "交付人力的基礎綜合每小時成本。",
    unit: "新臺幣／人時",
    range: "≥ 0",
  },
  {
    symbol: METHODOLOGY_MATH.symbols.directCost,
    name: "直接成本(Direct Cost)",
    definition: "不隨工時變動的授權、設備、差旅等成本。",
    unit: "新臺幣",
    range: "≥ 0",
  },
  {
    symbol: METHODOLOGY_MATH.symbols.commercialRates,
    name: "管銷／乙方成本加成／稅率",
    definition: "管銷間接成本、成本加成與稅率。",
    unit: "比率",
    range: "≥ 0",
  },
  {
    symbol: METHODOLOGY_MATH.symbols.vendorQuote,
    name: "乙方報價(Vendor Quote)",
    definition: "正規化為未稅口徑後的乙方報價。",
    unit: "新臺幣",
    range: "≥ 0",
  },
] as const;

const effortConversionVariables: readonly VariableRow[] = [
  {
    symbol: METHODOLOGY_MATH.symbols.percentileEffort,
    name: "指定百分位工作量(Percentile Effort)",
    definition: "要換算的 P50、P80 或其他指定百分位工作量。",
    unit: "人時",
    range: "≥ 0",
  },
  {
    symbol: METHODOLOGY_MATH.symbols.hoursPerPersonDay,
    name: "每人日工時(Hours per Person-day)",
    definition: "一個人日換算成多少人時；公開示範預設為 8。",
    unit: "人時／人日",
    range: `> 0 且 ≤ ${publicDemoParameterSet.constraints.maximumHoursPerPersonDay}`,
  },
  {
    symbol: METHODOLOGY_MATH.symbols.daysPerPersonMonth,
    name: "每人月工作日(Days per Person-month)",
    definition: "一個人月換算成多少工作日；公開示範預設為 20。",
    unit: "工作日／人月",
    range: `> 0 且 ≤ ${publicDemoParameterSet.constraints.maximumDaysPerPersonMonth}`,
  },
  {
    symbol: METHODOLOGY_MATH.symbols.personDays,
    name: "指定百分位人日(Person-days)",
    definition: "指定百分位工作量換算後的人日。",
    unit: "人日",
    range: "≥ 0",
  },
  {
    symbol: METHODOLOGY_MATH.symbols.personMonths,
    name: "指定百分位人月(Person-months)",
    definition: "指定百分位工作量換算後的人月。",
    unit: "人月",
    range: "≥ 0",
  },
] as const;

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

function TerminologyTable() {
  return (
    <div
      className="table-scroll"
      role="region"
      aria-label="估算名詞中英對照"
      tabIndex={0}
    >
      <table className="data-table">
        <caption>估算名詞中英對照</caption>
        <thead>
          <tr>
            <th scope="col">名詞</th>
            <th scope="col">定義</th>
          </tr>
        </thead>
        <tbody>
          {terminologyRows.map((row) => (
            <tr key={row.term}>
              <th scope="row">{row.term}</th>
              <td>{row.definition}</td>
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
      <p className="method-section__number">第 {number} 節</p>
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
        eyebrow="由下而上參數估算模型"
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
            P50 與 P80 是透明情境區間的近似值，不是保證值；P80 也不是在 P50
            上固定多加一個百分比。
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
                  較保守的規劃參考，反映輸入的不確定性；不是把 P50
                  任意加上固定緩衝。
                </dd>
              </div>
            </dl>
            <p>
              實務上應同時查看範圍、主要驅動因素、假設、警示與完整計算軌跡，而不是只選一個總價。
            </p>
            <CalculatorFieldLink href="/estimates/new#uncertainty">
              不確定性設定
            </CalculatorFieldLink>
          </MethodSection>

          <MethodSection id="terms" number="02" title="名詞與計量單位">
            <p>
              本頁集中列出必要的中英名詞對照；其他頁面以中文為主，避免重複標示造成閱讀干擾。EstimateTrace
              把人時、新臺幣、比率與無量綱乘數視為不同單位。領域計算保留完整精度，格式化與四捨五入只在顯示邊界進行。
            </p>
            <TerminologyTable />
            <VariableTable caption="估算模型主要變數" rows={commonVariables} />
            <Formula
              expression={METHODOLOGY_MATH.formulas.personDays}
              description="指定百分位數的人日，等於該百分位工作量除以每人日工時。"
            />
            <Formula
              expression={METHODOLOGY_MATH.formulas.personMonths}
              description="指定百分位數的人月，等於該百分位工作量除以每人日工時與每人月工作日的乘積。"
            />
            <VariableTable
              caption="人日與人月換算變數"
              rows={effortConversionVariables}
            />
            <div className="worked-example">
              <h3>代入範例</h3>
              <p>
                以 P80 工作量 78.97139712 人時、每人日 8 人時、每人月 20
                工作日換算：
              </p>
              <Formula
                expression={METHODOLOGY_MATH.examples.personDays}
                description="七十八點九七一三九七一二除以八，等於九點八七一四二四六四人日。"
              />
              <Formula
                expression={METHODOLOGY_MATH.examples.personMonths}
                description="七十八點九七一三九七一二除以八與二十的乘積，等於零點四九三五七一二三二人月。"
              />
            </div>
            <Callout title="人月不是日曆月" tone="neutral">
              <p>
                人日與人月只是依每人日工時及每人月工作日進行的工作量換算，不直接等於專案曆月。
              </p>
            </Callout>
            <CalculatorFieldLink href="/estimates/new#scope">
              計量單位與換算假設
            </CalculatorFieldLink>
          </MethodSection>

          <MethodSection id="base-effort" number="03" title="工作項目基礎工時">
            <p>
              先將每個工作項目的數量乘以每單位基礎工時，再加總成基礎實作工時。
            </p>
            <Formula
              expression={METHODOLOGY_MATH.formulas.workItemBaseEffort}
              description="第 i 個工作項目的基礎工時，等於數量乘以每單位工時。"
            />
            <Formula
              expression={METHODOLOGY_MATH.formulas.aggregateBaseEffort}
              description="全部工作項目的基礎工時，等於各項目基礎工時總和。"
            />
            <VariableTable
              caption="基礎工時變數"
              rows={[
                commonVariables[0]!,
                commonVariables[1]!,
                {
                  symbol: METHODOLOGY_MATH.symbols.itemBaseEffort,
                  name: "單一項目基礎工時",
                  definition: "單一工作項目未套用複雜度與風險前的工時。",
                  unit: "人時",
                  range: "≥ 0",
                },
              ]}
            />
            <div className="worked-example">
              <h3>代入範例</h3>
              <p>
                兩個端點、每個 16 人時：
                <InlineFormula
                  expression={METHODOLOGY_MATH.examples.baseEffort}
                  description="二乘以十六等於三十二。"
                />{" "}
                人時。
              </p>
            </div>
            <p>
              <strong>限制：</strong>
              <code>unitHours</code>{" "}
              是示範起點。若已包含分析、實作與基本測試，後續階段工時比例不得把相同活動完整加入第二次。
            </p>
            <CalculatorFieldLink href="/estimates/new#work-items">
              數量、單位工時與工作項目
            </CalculatorFieldLink>
          </MethodSection>

          <MethodSection id="complexity" number="04" title="複雜度乘數">
            <p>
              複雜度反映單一工作項目的規則、狀態、角色、例外、整合與非功能要求，不等同於整體專案風險。
            </p>
            <Formula
              expression={METHODOLOGY_MATH.formulas.workItemComplexity}
              description="複雜度調整工時，等於項目基礎工時乘以複雜度乘數。"
            />
            <div
              className="table-scroll"
              role="region"
              aria-label="公開示範複雜度參數"
              tabIndex={0}
            >
              <table className="data-table">
                <caption>公開示範複雜度參數</caption>
                <thead>
                  <tr>
                    <th scope="col">程度</th>
                    <th scope="col">乘數</th>
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
                基礎工時 32 人時、高複雜度 1.35：
                <InlineFormula
                  expression={METHODOLOGY_MATH.examples.complexity}
                  description="三十二乘以一點三五等於四十三點二。"
                />{" "}
                人時。
              </p>
            </div>
            <p>
              <strong>限制：</strong>
              選擇應以可觀察條件為理由，不能只為了把結果調到預期價格。
            </p>
            <CalculatorFieldLink href="/estimates/new#work-items">
              工作項目複雜度
            </CalculatorFieldLink>
          </MethodSection>

          <MethodSection id="risk" number="05" title="風險因子調整">
            <p>
              風險乘數只套用到真正受該風險因子影響的工作項目。多個乘數以乘法組合，讓每個來源仍能獨立追蹤。
            </p>
            <Formula
              expression={METHODOLOGY_MATH.formulas.workItemRiskAdjusted}
              description="調整後工時，等於複雜度調整工時乘以所有適用的風險乘數。"
            />
            <Formula
              expression={METHODOLOGY_MATH.formulas.aggregateAdjustedEffort}
              description="全體調整後工時，等於各工作項目調整後工時總和。"
            />
            <div
              className="table-scroll"
              role="region"
              aria-label="公開示範風險參數"
              tabIndex={0}
            >
              <table className="data-table">
                <caption>公開示範風險因子與乘數</caption>
                <thead>
                  <tr>
                    <th scope="col">風險因子</th>
                    <th scope="col">低</th>
                    <th scope="col">一般</th>
                    <th scope="col">高</th>
                    <th scope="col">極高</th>
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
                43.2 人時套用情境覆寫的介接風險 1.20
                時（此數值只為對齊代入範例，不是正式的高風險乘數 1.15）：
                <InlineFormula
                  expression={METHODOLOGY_MATH.examples.risk}
                  description="四十三點二乘以一點二零等於五十一點八四。"
                />{" "}
                人時。
              </p>
            </div>
            <p>
              <strong>安全限制：</strong>
              風險乘積超過正式安全警戒值{" "}
              <code>
                {publicDemoParameterSet.constraints.riskProductSafetyCap}
              </code>{" "}
              時，系統必須提出警示並要求檢視，不得悄悄截斷。時程壓縮表示協調、平行作業、返工或加班增加的工作量，不只是縮短日曆。
            </p>
            <CalculatorFieldLink href="/estimates/new#risk-factors">
              風險因子問卷
            </CalculatorFieldLink>
          </MethodSection>

          <MethodSection id="cross-cutting" number="06" title="跨階段工作量">
            <p>
              商業分析、架構、專案管理、品質保證、部署與文件等活動，以調整後實作工時為基礎計算。對每個階段{" "}
              <InlineFormula
                expression={METHODOLOGY_MATH.symbols.phase}
                description="第 p 個階段。"
              />
              ，
              <InlineFormula
                expression={METHODOLOGY_MATH.symbols.eligibleItemSet}
                description="第 p 個階段尚未被工作項目涵蓋的適用項目集合。"
              />{" "}
              只包含尚未在工作項目內涵蓋該階段的適用項目。
            </p>
            <Formula
              expression={METHODOLOGY_MATH.formulas.phaseCrossCutting}
              description="第 p 個跨階段工時，等於該階段工時比例乘以適用工作項目的調整後工時總和。"
            />
            <Formula
              expression={METHODOLOGY_MATH.formulas.aggregateCrossCutting}
              description="跨階段總工時，等於各階段工時的總和。"
            />
            <Formula
              expression={METHODOLOGY_MATH.formulas.mostLikelyEffort}
              description="最可能工作量，等於調整後實作工時、跨階段工時與固定額外工時的總和。"
            />
            <div
              className="table-scroll"
              role="region"
              aria-label="公開示範階段工時比例"
              tabIndex={0}
            >
              <table className="data-table">
                <caption>公開示範階段工時比例</caption>
                <thead>
                  <tr>
                    <th scope="col">階段</th>
                    <th scope="col">預設比例</th>
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
                調整後工時 51.84、階段工時比例合計 40%、無固定工時：
                <InlineFormula
                  expression={METHODOLOGY_MATH.examples.crossCutting}
                  description="五十一點八四乘以一加零點四零，等於七十二點五七六。"
                />{" "}
                人時。
              </p>
            </div>
            <p>
              <strong>限制：</strong>
              若工作項目已明列額外測試、部署或文件工時，對應比例應降低或設為
              0，只加入尚未涵蓋的活動。
            </p>
            <CalculatorFieldLink href="/estimates/new#phase-loading">
              階段工時比例與固定額外工時
            </CalculatorFieldLink>
          </MethodSection>

          <MethodSection id="three-point" number="07" title="三點估算">
            <p>
              使用樂觀下修率與悲觀上修率，將最可能工作量轉為樂觀、最可能與悲觀三點。介面用風險描述協助選擇，不要求使用者具統計背景。
            </p>
            <Formula
              expression={METHODOLOGY_MATH.formulas.optimisticEffort}
              description="樂觀工作量，等於最可能工作量乘以下行情境比例。"
            />
            <Formula
              expression={METHODOLOGY_MATH.formulas.pessimisticEffort}
              description="悲觀工作量，等於最可能工作量乘以上行情境比例。"
            />
            <VariableTable
              caption="三點估算變數"
              rows={[
                {
                  symbol: METHODOLOGY_MATH.symbols.downsideRatio,
                  name: "樂觀下修率",
                  definition: "相對於最可能工時的樂觀下降比例。",
                  unit: "比率",
                  range: "0 ≤ d ≤ 0.50",
                },
                {
                  symbol: METHODOLOGY_MATH.symbols.upsideRatio,
                  name: "悲觀上修率",
                  definition: "相對於最可能工時的悲觀增加比例。",
                  unit: "比率",
                  range: "0 ≤ u ≤ 2.00",
                },
              ]}
            />
            <div
              className="table-scroll"
              role="region"
              aria-label="公開示範不確定性參數"
              tabIndex={0}
            >
              <table className="data-table">
                <caption>公開示範不確定性情境</caption>
                <thead>
                  <tr>
                    <th scope="col">程度</th>
                    <th scope="col">樂觀下修率</th>
                    <th scope="col">悲觀上修率</th>
                    <th scope="col">說明</th>
                  </tr>
                </thead>
                <tbody>
                  {publicDemoParameterSet.uncertaintyParameters.map((item) => (
                    <tr key={item.level}>
                      <th scope="row">{COMPLEXITY_LEVEL_LABELS[item.level]}</th>
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
                  expression={METHODOLOGY_MATH.examples.threePointInputs}
                  description="最可能工作量七十二點五七六、下行比例零點一五、上行比例零點三零。"
                />{" "}
                時，
                <InlineFormula
                  expression={METHODOLOGY_MATH.examples.threePointBounds}
                  description="樂觀工作量六十一點六八九六、悲觀工作量九十四點三四八八。"
                />{" "}
                人時，並保持{" "}
                <InlineFormula
                  expression={
                    METHODOLOGY_MATH.invariants.orderedThreePointEffort
                  }
                  description="樂觀工作量不大於最可能工作量，最可能工作量不大於悲觀工作量，且皆不小於零。"
                />
                。
              </p>
            </div>
            <CalculatorFieldLink href="/estimates/new#uncertainty">
              不確定性情境
            </CalculatorFieldLink>
          </MethodSection>

          <MethodSection id="percentiles" number="08" title="PERT、P50 與 P80">
            <p>
              公開版使用貝塔計畫評核術(Beta-PERT)
              的常見近似先取得期望值與標準差，再以常態近似產生百分位數。
            </p>
            <Formula
              expression={METHODOLOGY_MATH.formulas.pertMean}
              description="PERT 期望工作量，等於樂觀工時加四倍最可能工時再加悲觀工時，總和除以六。"
            />
            <Formula
              expression={METHODOLOGY_MATH.formulas.standardDeviation}
              description="標準差近似，等於悲觀與樂觀工時差除以六。"
            />
            <Formula
              expression={METHODOLOGY_MATH.formulas.percentileEffort}
              description="指定百分位數的工作量，等於期望值加上標準分數乘以標準差，最低為零。"
            />
            <Formula
              expression={METHODOLOGY_MATH.formulas.p50Effort}
              description="P50 等於 PERT 期望值。"
            />
            <Formula
              expression={METHODOLOGY_MATH.formulas.p80Effort}
              description={`P80 等於零與 PERT 期望值加上標準分數 ${publicDemoParameterSet.calculationPolicy.p80ZScore} 乘以標準差兩者中的較大值。`}
            />
            <div className="worked-example">
              <h3>代入範例</h3>
              <p>
                前述三點得到{" "}
                <InlineFormula
                  expression={METHODOLOGY_MATH.examples.p50AndSigma}
                  description="P50 為七十四點三九零四，標準差為五點四四三二。"
                />
                ；P80 約為{" "}
                <InlineFormula
                  expression={METHODOLOGY_MATH.examples.p80}
                  description="七十四點三九零四加上零點八四一六乘以五點四四三二，等於七十八點九七一三九七一二。"
                />{" "}
                人時。畫面最後才顯示為 74.4 與 79.0 小時。
              </p>
            </div>
            <p>
              <strong>限制：</strong>
              這是近似，不表示真實工作量服從常態分布。若三點輸入沒有歷史資料支持，結果只是透明的情境區間；公開版不執行蒙地卡羅模擬。
            </p>
            <CalculatorFieldLink href="/estimates/new#uncertainty">
              P50／P80 的不確定性輸入
            </CalculatorFieldLink>
          </MethodSection>

          <MethodSection id="engineering-cost" number="09" title="工程成本">
            <p>
              先用百分位工作量乘以綜合每小時成本，再加入不隨工時變動的直接成本。
            </p>
            <Formula
              expression={METHODOLOGY_MATH.formulas.laborCost}
              description="指定百分位數的人力成本，等於該百分位工時乘以每小時成本。"
            />
            <Formula
              expression={METHODOLOGY_MATH.formulas.deliveryCost}
              description="交付成本，等於人力成本加上直接成本。"
            />
            <VariableTable
              caption="工程成本變數"
              rows={[
                {
                  symbol: METHODOLOGY_MATH.symbols.percentileEffort,
                  name: "百分位工作量",
                  definition: "P50 或 P80 人時。",
                  unit: "人時",
                  range: "≥ 0",
                },
                commonVariables[7]!,
                commonVariables[8]!,
              ]}
            />
            <div className="worked-example">
              <h3>代入範例</h3>
              <p>
                P50 74.3904 小時、每小時成本 1,000 新臺幣、直接成本 5,000
                新臺幣：人力成本為 74,390.4 新臺幣，交付成本為 79,390.4
                新臺幣。金額只在顯示時格式化成整數。
              </p>
            </div>
            <p>
              <strong>限制：</strong>
              若每小時成本已包含管銷間接成本，管銷間接成本率必須設為
              0，避免重複計入。
            </p>
            <CalculatorFieldLink href="/estimates/new#commercial-terms">
              每小時成本與直接成本
            </CalculatorFieldLink>
          </MethodSection>

          <MethodSection
            id="commercial-adjustments"
            number="10"
            title="管銷、保固與乙方成本加成"
          >
            <p>
              管銷間接成本、保固與上線後密集支援，以及乙方成本加成分開呈現，讓使用者能知道模型參考報價如何由工程成本形成。
            </p>
            <Formula
              expression={METHODOLOGY_MATH.formulas.fullCost}
              description="完整成本，等於交付成本加上管銷間接成本，再加固定保固成本。"
            />
            <Formula
              expression={METHODOLOGY_MATH.formulas.quoteExTax}
              description="未稅模型參考報價，等於完整成本乘以一加乙方成本加成率。"
            />
            <Formula
              expression={METHODOLOGY_MATH.formulas.quoteIncTax}
              description="含稅模型參考報價，等於未稅參考報價乘以一加稅率。"
            />
            <VariableTable
              caption="商業加成變數"
              rows={[
                {
                  symbol: METHODOLOGY_MATH.symbols.overheadRatio,
                  name: "管銷間接成本率",
                  definition: "供應商管銷與間接成本比例。",
                  unit: "比率",
                  range: "≥ 0",
                },
                {
                  symbol: METHODOLOGY_MATH.symbols.warrantyCost,
                  name: "保固與上線後支援成本",
                  definition: "保固與上線後密集支援的固定成本。",
                  unit: "新臺幣",
                  range: "≥ 0",
                },
                {
                  symbol: METHODOLOGY_MATH.symbols.markupRatio,
                  name: "乙方成本加成率",
                  definition: "加在成本上的比例，不是毛利率。",
                  unit: "比率",
                  range: "≥ 0",
                },
                {
                  symbol: METHODOLOGY_MATH.symbols.taxRate,
                  name: "稅率",
                  definition: "用於含稅顯示與報價正規化的稅率。",
                  unit: "比率",
                  range: "≥ 0",
                },
              ]}
            />
            <Callout title="成本加成率不等於毛利率" tone="warning">
              <p>
                本模型使用{" "}
                <InlineFormula
                  expression={METHODOLOGY_MATH.formulas.markup}
                  description="成本乘以一加成本加成率。"
                />
                。若使用毛利率{" "}
                <InlineFormula
                  expression={METHODOLOGY_MATH.symbols.grossMargin}
                  description="毛利率 g。"
                />
                ，公式會是{" "}
                <InlineFormula
                  expression={METHODOLOGY_MATH.formulas.grossMargin}
                  description="成本除以一減毛利率。"
                />
                ；公開版不混用兩種定義，也不把 P80
                不確定性再命名為風險準備金後重複加價。
              </p>
            </Callout>
            <CalculatorFieldLink href="/estimates/new#commercial-terms">
              管銷、保固、乙方成本加成與稅率
            </CalculatorFieldLink>
          </MethodSection>

          <MethodSection id="tax-normalization" number="11" title="稅基正規化">
            <p>
              模型與乙方報價預設都正規化成未稅口徑再比較，避免把含稅與未稅數字直接相減。
            </p>
            <Formula
              expression={METHODOLOGY_MATH.formulas.normalizeTaxInclusiveQuote}
              description="含稅乙方報價的未稅金額，等於含稅金額除以一加稅率。"
            />
            <p>
              若輸入本來就是未稅報價，則{" "}
              <InlineFormula
                expression={
                  METHODOLOGY_MATH.formulas.normalizeTaxExclusiveQuote
                }
                description="未稅乙方報價等於輸入報價。"
              />
              。結果可另外顯示含稅數字，但差異率使用相同未稅基準。
            </p>
            <div className="worked-example">
              <h3>代入範例</h3>
              <p>
                含稅報價 105,000 新臺幣、稅率 5%：未稅報價為
                <InlineFormula
                  expression={METHODOLOGY_MATH.examples.normalizeTax}
                  description="十萬五千除以一點零五，等於十萬。"
                />{" "}
                新臺幣。
              </p>
            </div>
            <p>
              <strong>限制：</strong>
              公開預設稅率只是示範值；使用者必須依案件適用稅制確認。
            </p>
            <CalculatorFieldLink href="/estimates/new#vendor-quote">
              報價金額與稅額基礎
            </CalculatorFieldLink>
          </MethodSection>

          <MethodSection id="variance" number="12" title="乙方報價差異">
            <p>
              先計算乙方未稅報價與 P50／P80
              未稅模型參考報價的金額差，再以各參考報價為分母換算差異率與比率。
            </p>
            <Formula
              expression={METHODOLOGY_MATH.formulas.vendorDifferenceP50}
              description="相對 P50 的金額差，等於乙方未稅報價減去 P50 未稅參考報價。"
            />
            <Formula
              expression={METHODOLOGY_MATH.formulas.vendorVarianceP50}
              description="相對 P50 的差異率，在 P50 參考報價大於零時，等於金額差除以 P50 參考報價。"
            />
            <Formula
              expression={METHODOLOGY_MATH.formulas.vendorDifferenceP80}
              description="相對 P80 的金額差，等於乙方未稅報價減去 P80 未稅參考報價。"
            />
            <Formula
              expression={METHODOLOGY_MATH.formulas.vendorVarianceP80}
              description="相對 P80 的差異率，在 P80 參考報價大於零時，等於金額差除以 P80 參考報價。"
            />
            <Formula
              expression={METHODOLOGY_MATH.formulas.vendorQuoteRatio}
              description="指定百分位數的報價比率，在參考報價大於零時，等於乙方未稅報價除以模型未稅參考報價。"
            />
            <VariableTable
              caption="乙方報價差異變數"
              rows={[
                commonVariables[10]!,
                {
                  symbol: METHODOLOGY_MATH.symbols.benchmarkQuotes,
                  name: "未稅模型參考報價",
                  definition: "模型 P50／P80 的未稅參考報價。",
                  unit: "新臺幣",
                  range: "≥ 0",
                },
                {
                  symbol: METHODOLOGY_MATH.symbols.benchmarkVariances,
                  name: "報價差異率",
                  definition: "乙方報價相對模型參考報價的差異率。",
                  unit: "比率",
                },
              ]}
            />
            <p>
              <strong>除以零：</strong>
              模型參考報價為 0
              時，差異率與比率沒有定義，介面必須顯示「無法計算」，不得顯示無限值、非數值或假裝為
              0%。
            </p>
            <CalculatorFieldLink href="/estimates/new#vendor-quote">
              乙方報價比較
            </CalculatorFieldLink>
          </MethodSection>

          <MethodSection id="interpretation" number="13" title="結果如何解讀">
            <p>
              結果先呈現模型來源與假設，再顯示中性的比較區間。標籤不是採購或法律結論，而是下一輪釐清的提示。
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
                <p>請確認管銷間接成本、保固、第三方成本與風險準備金來源。</p>
              </article>
              <article>
                <h3>高於模型 P80</h3>
                <p>建議要求角色別工時、風險明細、交付與保固邊界。</p>
              </article>
            </div>
            <p>
              應依序查看 P50／P80
              工作量與報價、乙方報價比較、主要驅動因素、分解明細、假設與警示，以及完整計算軌跡。正負差異不可只靠紅綠色表示。
            </p>
            <CalculatorFieldLink href="/estimates/new#vendor-quote">
              結果與報價比較
            </CalculatorFieldLink>
          </MethodSection>

          <MethodSection id="double-counting" number="14" title="常見重複計入">
            <p>
              同一成本若同時出現在單位工時、階段工時比例、風險因子、管銷間接成本或
              P80 不確定性，結果會被重複放大。
            </p>
            <ul className="warning-list">
              <li>
                <strong>單位工時與階段工時比例：</strong>
                若每單位工時已含分析與基本測試，不再加入完整的商業分析或品質保證工時。
              </li>
              <li>
                <strong>明列工作項目與跨階段活動：</strong>
                已建立額外測試、部署或文件工作項目時，對應階段只加入尚未涵蓋的部分。
              </li>
              <li>
                <strong>每小時成本與管銷間接成本：</strong>
                綜合費率已含管銷成本時，管銷間接成本率設為 0。
              </li>
              <li>
                <strong>風險與不確定性：</strong>
                風險乘數調整可預期的額外工作量；P80
                描述估算分布，不再另加同義的風險準備金。
              </li>
              <li>
                <strong>保固與交付：</strong>
                交付成本已包含上線後密集支援時，不再加入相同保固成本。
              </li>
            </ul>
            <CalculatorFieldLink href="/estimates/new#phase-loading">
              已包含活動與階段工時比例
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
                結果品質受需求拆解、單位工時、風險選擇理由與商業假設品質影響。
              </li>
              <li>PERT 與常態近似是透明近似，不代表真實工時分布。</li>
              <li>
                模型不處理匯率、自動稅率、通膨、授權行情或第三方報價更新。
              </li>
              <li>
                公開版不建立實際工時回饋迴圈，需由組織另行以合規歷史資料校準。
              </li>
              <li>
                本工具不作出「報價合理／不合理」的絕對結論，也不取代合約審查。
              </li>
            </ul>
            <p>
              每次分享結果都應保留 <code>modelVersion</code>、
              <code>parameterSetId</code>、<code>parameterSetVersion</code>
              、輸入與參數快照，讓後續能重算與解釋版本差異。
            </p>
            <CalculatorFieldLink href="/estimates/new#scope">
              案件範圍與估算假設
            </CalculatorFieldLink>
          </MethodSection>

          <MethodSection
            id="future-methods"
            number="16"
            title="其他估算方法與後續擴充"
          >
            <p>
              建構性成本模型二代(COCOMO
              II)提供軟體成本估算的重要背景；功能規模度量法(COSMIC)與功能點(Function
              Point)則從功能規模切入。它們需要不同輸入、校準資料與模型假設，公開版不把名稱借來包裝目前的由下而上參數估算模型。
            </p>
            <dl className="definition-grid">
              <div>
                <dt>建構性成本模型二代(COCOMO II)</dt>
                <dd>
                  適合在具備規模、尺度因子、工作量乘數與組織校準資料時作為獨立估算模型或交叉檢查。
                </dd>
              </div>
              <div>
                <dt>功能規模度量法(COSMIC)／功能點(Function Point)</dt>
                <dd>
                  可建立較一致的功能規模基準，但需要明確的計數規則、檢視流程與歷史生產力資料。
                </dd>
              </div>
              <div>
                <dt>蒙地卡羅模擬(Monte Carlo simulation)</dt>
                <dd>
                  未來可用輸入分布取代單一近似，但必須公開抽樣規則、亂數種子、可重現性與結果解讀方式。
                </dd>
              </div>
              <div>
                <dt>組織校準</dt>
                <dd>
                  應在獨立私有專案處理實際工時、角色權限控管、不可變更的版本、稽核紀錄與資料保護，不能提交回公開上游專案。
                </dd>
              </div>
            </dl>
            <p>
              後續模型若改變公式或結果語意，必須升級模型版本、提供遷移說明，且不得無聲覆寫舊案件快照。
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
