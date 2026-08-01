import Link from "next/link";

import { MathFormula } from "@/components/content/math-formula";
import type { EstimateCaseDocument } from "@/features/estimation/application/estimate-case";
import { getCalculationFormulaPresentation } from "@/features/estimation/domain";
import type {
  EstimateResult,
  VendorComparisonBand,
} from "@/features/estimation/domain";

import {
  formatDecimal,
  formatDate,
  formatEffort,
  formatMoney,
  formatRatio,
} from "../formatters";
import {
  CALCULATION_UNIT_LABELS,
  COMPLEXITY_LEVEL_LABELS,
  COST_DRIVER_LABELS,
  formatLegacyParameterText,
  formatTraceMetric,
  formatWorkItemUnit,
  RISK_FACTOR_LABELS,
  RISK_LEVEL_LABELS,
  WORK_ITEM_TYPE_LABELS,
} from "../labels";

const comparisonLabels: Record<VendorComparisonBand, string> = {
  CLEARLY_BELOW_MODEL_RANGE: "明顯低於模型區間，請確認是否漏算項目或風險。",
  NEAR_MODEL_REFERENCE_RANGE: "接近模型參考區間。",
  ABOVE_MODEL_P50: "高於模型 P50，請確認成本來源。",
  ABOVE_MODEL_P80: "高於模型 P80，建議確認工作量和風險明細。",
};

const formulaLinks: Readonly<Record<string, string>> = {
  "work-item-base-effort": "/methodology#base-effort",
  "complexity-adjustment": "/methodology#complexity",
  "risk-factor-adjustment": "/methodology#risk",
  "cross-cutting-effort": "/methodology#cross-cutting",
  "three-point-estimate": "/methodology#three-point",
  "pert-percentiles": "/methodology#percentiles",
  "effort-conversion": "/methodology#terms",
  "engineering-cost": "/methodology#engineering-cost",
  "commercial-loadings": "/methodology#commercial-adjustments",
  "tax-normalization": "/methodology#tax-normalization",
  "vendor-quote-variance": "/methodology#variance",
};

interface ResultViewProps {
  readonly estimate: EstimateCaseDocument;
  readonly result: EstimateResult;
  readonly onExport: () => void;
}

function VendorComparisonSection({
  estimate,
  result,
}: {
  estimate: EstimateCaseDocument;
  result: EstimateResult;
}) {
  const comparison = result.vendorComparison;
  if (!comparison) {
    return (
      <section className="result-card">
        <h2>尚未加入乙方報價</h2>
        <p>目前只顯示模型參考值；若要比較，請在本頁上方填入未稅或含稅金額。</p>
      </section>
    );
  }

  return (
    <section
      className="result-card form-stack"
      aria-labelledby="vendor-comparison-title"
    >
      <div>
        <p className="eyebrow">中性比較</p>
        <h2 id="vendor-comparison-title">
          {comparisonLabels[comparison.band]}
        </h2>
        <p>
          乙方報價換算為未稅後是 {formatMoney(comparison.normalizedQuoteExTax)}
          。這個分類只說明和模型的差異，不代表這個價格能不能接受。
        </p>
        <p className="field__meta">
          公開示範門檻：未稅報價／P50 小於{" "}
          {formatRatio(
            estimate.parameterSnapshot.comparison.clearlyBelowP50Ratio,
          )}{" "}
          時會列為明顯低於；這不是產業標準。
        </p>
        {estimate.input.vendorQuote ? (
          <p>
            原始報價 {formatMoney(estimate.input.vendorQuote.amount)}（
            {estimate.input.vendorQuote.taxBasis === "TAX_INCLUSIVE"
              ? "含稅"
              : "未稅"}
            ）
            {estimate.input.vendorQuote.quoteDate
              ? `，日期 ${estimate.input.vendorQuote.quoteDate}`
              : ""}
            {estimate.input.vendorQuote.note
              ? `；備註：${estimate.input.vendorQuote.note}`
              : ""}
          </p>
        ) : null}
      </div>
      <div className="metric-grid">
        <div className="metric">
          <span className="metric__label">與 P50 差額</span>
          <strong className="metric__value">
            {formatMoney(comparison.differenceFromP50)}
          </strong>
          <span>差異率 {formatRatio(comparison.varianceFromP50)}</span>
          <span>報價／P50 {formatRatio(comparison.quoteToP50Ratio)}</span>
        </div>
        <div className="metric">
          <span className="metric__label">與 P80 差額</span>
          <strong className="metric__value">
            {formatMoney(comparison.differenceFromP80)}
          </strong>
          <span>差異率 {formatRatio(comparison.varianceFromP80)}</span>
          <span>報價／P80 {formatRatio(comparison.quoteToP80Ratio)}</span>
        </div>
      </div>
      <div>
        <h3>建議向乙方確認</h3>
        <ol>
          {comparison.questions.map((question) => (
            <li key={question.id}>
              {formatLegacyParameterText(question.text)}
              <ul className="field__meta">
                {question.evidence.map((evidence) => {
                  switch (evidence.kind) {
                    case "BAND":
                      return (
                        <li key={`band:${evidence.band}`}>
                          判斷依據：比較區間 <code>{evidence.band}</code>
                        </li>
                      );
                    case "WORK_ITEM_TYPE":
                      return (
                        <li key={`work-item:${evidence.workItemType}`}>
                          判斷依據：
                          {WORK_ITEM_TYPE_LABELS[evidence.workItemType]}
                          類型的工作項目（
                          {evidence.workItemIds.length} 筆）
                        </li>
                      );
                    case "RISK_FACTOR":
                      return (
                        <li key={`risk:${evidence.factorId}`}>
                          判斷依據：{RISK_FACTOR_LABELS[evidence.factorId]} ={" "}
                          {RISK_LEVEL_LABELS[evidence.level]}
                        </li>
                      );
                  }
                })}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function TraceSection({ result }: { result: EstimateResult }) {
  return (
    <section className="form-stack" aria-labelledby="trace-title">
      <div>
        <h2 id="trace-title">計算軌跡</h2>
        <p>
          每一節都列出公式、代入的數字、資料來源、結果和單位。順序固定，方便檢查和重算。
        </p>
        <p className="calculation-warning">
          避免重複計算：工作項目已包含的階段會由{" "}
          <code>includedCrossCuttingPhases</code>{" "}
          排除；請特別檢查額外測試、部署和文件項目。
        </p>
      </div>
      <div className="trace-list">
        {result.calculationTrace.map((node) => {
          const formulaHref = formulaLinks[node.formulaId];
          const formulaPresentation = getCalculationFormulaPresentation(
            node.formula,
          );
          return (
            <details key={node.id}>
              <summary>
                {formatTraceMetric(node.metric)} —{" "}
                {formatDecimal(node.result, 4)}{" "}
                {CALCULATION_UNIT_LABELS[node.unit]}
              </summary>
              <div className="trace-detail">
                <p>
                  <strong>公式代號：</strong>
                  {formulaHref ? (
                    <Link href={formulaHref} prefetch={false}>
                      <code>{node.formulaId}</code>
                    </Link>
                  ) : (
                    <code>{node.formulaId}</code>
                  )}
                </p>
                <div className="trace-formula-row">
                  <strong>公式：</strong>
                  <MathFormula
                    className="trace-formula"
                    display
                    expression={formulaPresentation?.latex ?? node.formula}
                    label={
                      formulaPresentation?.accessibleLabel ??
                      `${formatTraceMetric(node.metric)}的計算公式：${node.formula}`
                    }
                  />
                </div>
                <p>
                  <strong>計算精度：</strong>
                  {node.precisionPolicy.decimalPrecision} 位有效數字；
                  <code>{node.precisionPolicy.roundingMode}</code>
                  ；中間計算
                  <code>{node.precisionPolicy.intermediateRounding}</code>
                  ；只在顯示時依
                  <code>{node.precisionPolicy.presentationRounding}</code>
                  捨入。
                </p>
                <ul>
                  {node.operands.map((operand, index) => (
                    <li
                      key={`${node.id}:${operand.name}:${operand.source.path}:${index}`}
                    >
                      <code>{operand.name}</code> = {operand.value}{" "}
                      {CALCULATION_UNIT_LABELS[operand.unit]}；來源{" "}
                      <code>{operand.source.path}</code>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}

export function ResultView({ estimate, result, onExport }: ResultViewProps) {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(
    /\/$/u,
    "",
  );
  const methodologyPrintUrl = configuredSiteUrl
    ? `${configuredSiteUrl}/methodology`
    : "/methodology";
  const breakdown = [
    {
      label: "基礎工時",
      p50: formatEffort(result.baseEffortHours),
      p80: formatEffort(result.baseEffortHours),
    },
    {
      label: "複雜度調整",
      p50: formatEffort(result.complexityAggregate.complexityAdjustmentHours),
      p80: formatEffort(result.complexityAggregate.complexityAdjustmentHours),
    },
    {
      label: "風險調整",
      p50: formatEffort(result.complexityAggregate.riskAdjustmentHours),
      p80: formatEffort(result.complexityAggregate.riskAdjustmentHours),
    },
    {
      label: "跨階段工作量",
      p50: formatEffort(result.crossCuttingEffortHours),
      p80: formatEffort(result.crossCuttingEffortHours),
    },
    {
      label: "直接成本",
      p50: formatMoney(result.costWaterfall.p50.directCost),
      p80: formatMoney(result.costWaterfall.p80.directCost),
    },
    {
      label: "管銷間接成本",
      p50: formatMoney(result.costWaterfall.p50.overheadAmount),
      p80: formatMoney(result.costWaterfall.p80.overheadAmount),
    },
    {
      label: "保固與支援",
      p50: formatMoney(result.costWaterfall.p50.warrantyCost),
      p80: formatMoney(result.costWaterfall.p80.warrantyCost),
    },
    {
      label: "乙方成本加成",
      p50: formatMoney(result.costWaterfall.p50.vendorMarkupAmount),
      p80: formatMoney(result.costWaterfall.p80.vendorMarkupAmount),
    },
    {
      label: "稅額",
      p50: formatMoney(result.costWaterfall.p50.taxAmount),
      p80: formatMoney(result.costWaterfall.p80.taxAmount),
    },
  ] as const;
  const assumptions = estimate.input.workItems.flatMap((item) =>
    item.assumptions.map((assumption) => ({
      id: `${item.id}:${assumption}`,
      item: item.title,
      assumption,
    })),
  );

  return (
    <>
      <section
        className="result-card form-stack"
        aria-labelledby="headline-result-title"
      >
        <div>
          <p className="eyebrow">估算參考</p>
          <h2 id="headline-result-title">{estimate.name}</h2>
          <p>最後更新：{formatDate(estimate.updatedAt)}</p>
        </div>
        <div className="metric-grid">
          <div className="metric metric--primary">
            <span className="metric__label">P50 工時</span>
            <strong className="metric__value">
              {formatEffort(result.p50EffortHours)}
            </strong>
            <span>
              {formatDecimal(result.p50PersonDays, 1)} 人日／
              {formatDecimal(result.p50PersonMonths, 2)} 人月
            </span>
          </div>
          <div className="metric metric--primary">
            <span className="metric__label">P80 工時</span>
            <strong className="metric__value">
              {formatEffort(result.p80EffortHours)}
            </strong>
            <span>
              {formatDecimal(result.p80PersonDays, 1)} 人日／
              {formatDecimal(result.p80PersonMonths, 2)} 人月
            </span>
          </div>
          <div className="metric">
            <span className="metric__label">P50 參考報價（含稅）</span>
            <strong className="metric__value">
              {formatMoney(result.p50QuoteIncTax)}
            </strong>
            <span>未稅 {formatMoney(result.p50QuoteExTax)}</span>
          </div>
          <div className="metric">
            <span className="metric__label">P80 參考報價（含稅）</span>
            <strong className="metric__value">
              {formatMoney(result.p80QuoteIncTax)}
            </strong>
            <span>未稅 {formatMoney(result.p80QuoteExTax)}</span>
          </div>
          <div className="metric">
            <span className="metric__label">P50 工程成本</span>
            <strong className="metric__value">
              {formatMoney(result.p50EngineeringCost)}
            </strong>
          </div>
          <div className="metric">
            <span className="metric__label">P80 工程成本</span>
            <strong className="metric__value">
              {formatMoney(result.p80EngineeringCost)}
            </strong>
          </div>
        </div>
      </section>

      {result.warnings.map((warning) => (
        <div
          className="calculation-warning"
          role="alert"
          key={`${warning.code}:${warning.path}`}
        >
          <strong>風險乘積超過安全警戒值，請人工確認</strong>
          <p>
            {warning.path} 的乘積是 {warning.details.actual}，參數集警戒值是{" "}
            {warning.details.safetyCap}。模型沒有悄悄截斷這個值。
          </p>
        </div>
      ))}

      <section className="form-stack" aria-labelledby="breakdown-title">
        <div>
          <h2 id="breakdown-title">工作量與成本分解</h2>
          <p>下表保留每一層結果，方便檢查範圍、是否重複計算和成本條件。</p>
        </div>
        <div className="metric-grid">
          <div className="metric">
            <span className="metric__label">基礎實作工時</span>
            <strong className="metric__value">
              {formatEffort(result.baseEffortHours)}
            </strong>
          </div>
          <div className="metric">
            <span className="metric__label">調整後實作工時</span>
            <strong className="metric__value">
              {formatEffort(result.adjustedEffortHours)}
            </strong>
          </div>
          <div className="metric">
            <span className="metric__label">跨階段工作量</span>
            <strong className="metric__value">
              {formatEffort(result.crossCuttingEffortHours)}
            </strong>
          </div>
          <div className="metric">
            <span className="metric__label">最可能總工時</span>
            <strong className="metric__value">
              {formatEffort(result.mostLikelyEffortHours)}
            </strong>
          </div>
        </div>
        <div
          className="table-region"
          role="region"
          aria-labelledby="breakdown-title"
          tabIndex={0}
        >
          <table className="data-table">
            <caption>估算分解</caption>
            <thead>
              <tr>
                <th scope="col">層級</th>
                <th scope="col">P50／數值</th>
                <th scope="col">P80／數值</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  <td>{row.p50}</td>
                  <td>{row.p80}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <VendorComparisonSection estimate={estimate} result={result} />

      <section className="form-stack" aria-labelledby="drivers-title">
        <div>
          <h2 id="drivers-title">主要成本來源</h2>
          <p>
            這裡列出 P50 參考報價中金額最高的三個成本項目，全部以新臺幣呈現。
          </p>
        </div>
        <div
          className="table-region"
          role="region"
          aria-labelledby="drivers-title"
          tabIndex={0}
        >
          <table className="data-table">
            <caption>主要成本來源</caption>
            <thead>
              <tr>
                <th scope="col">成本構成</th>
                <th scope="col">計算來源</th>
                <th scope="col">P50 成本金額</th>
              </tr>
            </thead>
            <tbody>
              {result.drivers.map((driver) => (
                <tr key={`${driver.kind}:${driver.sourceId}`}>
                  <th scope="row">{COST_DRIVER_LABELS[driver.sourceId]}</th>
                  <td>
                    <code>{driver.source.path}</code>
                  </td>
                  <td>{formatMoney(driver.contributionValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="form-stack" aria-labelledby="scope-review-title">
        <div>
          <h2 id="scope-review-title">範圍與假設</h2>
          <p>{estimate.description || "未填寫背景摘要。"}</p>
        </div>
        {assumptions.length > 0 ? (
          <ul>
            {assumptions.map((entry) => (
              <li key={entry.id}>
                <strong>{entry.item}：</strong>
                {entry.assumption}
              </li>
            ))}
          </ul>
        ) : (
          <p>尚未記錄假設。</p>
        )}
      </section>

      <section className="form-stack" aria-labelledby="work-item-review-title">
        <div>
          <h2 id="work-item-review-title">工作項目分解</h2>
          <p>這裡保留輸入時的拆解內容；實際計算結果請以計算過程為準。</p>
        </div>
        <div
          className="table-region"
          role="region"
          aria-labelledby="work-item-review-title"
          tabIndex={0}
        >
          <table className="data-table">
            <caption>工作項目輸入</caption>
            <thead>
              <tr>
                <th scope="col">項目</th>
                <th scope="col">數量 × 每單位工時</th>
                <th scope="col">複雜度</th>
                <th scope="col">適用風險</th>
              </tr>
            </thead>
            <tbody>
              {estimate.input.workItems.map((item) => (
                <tr key={item.id}>
                  <th scope="row">
                    {item.title}
                    <br />
                    <span className="field__meta">
                      {WORK_ITEM_TYPE_LABELS[item.type]}
                    </span>
                  </th>
                  <td>
                    {item.quantity} {formatWorkItemUnit(item.unit)} ×{" "}
                    {item.unitHours} 小時
                  </td>
                  <td>{COMPLEXITY_LEVEL_LABELS[item.complexity]}</td>
                  <td>
                    {item.applicableRiskFactorIds.length > 0
                      ? item.applicableRiskFactorIds
                          .map((id) => RISK_FACTOR_LABELS[id])
                          .join("、")
                      : "無"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="form-stack" aria-labelledby="risk-review-title">
        <div>
          <h2 id="risk-review-title">風險因子與選擇理由</h2>
          <p>這是案件層級的設定；只會套用到各工作項目明確勾選的風險。</p>
        </div>
        <div
          className="table-region"
          role="region"
          aria-labelledby="risk-review-title"
          tabIndex={0}
        >
          <table className="data-table">
            <caption>風險選擇與理由</caption>
            <thead>
              <tr>
                <th scope="col">風險因子</th>
                <th scope="col">等級</th>
                <th scope="col">選擇理由</th>
              </tr>
            </thead>
            <tbody>
              {estimate.parameterSnapshot.riskFactors.map((factor) => {
                const selection = estimate.input.riskProfile[factor.id];
                return (
                  <tr key={factor.id}>
                    <th scope="row">{RISK_FACTOR_LABELS[factor.id]}</th>
                    <td>{RISK_LEVEL_LABELS[selection.level]}</td>
                    <td>{selection.rationale || "未填寫理由"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <TraceSection result={result} />

      <section className="result-card form-stack">
        <h2>版本與限制</h2>
        <dl className="form-grid form-grid--two">
          <div>
            <dt>模型版本</dt>
            <dd>
              <code>{result.modelVersion}</code>
            </dd>
          </div>
          <div>
            <dt>參數集</dt>
            <dd>
              <code>
                {result.parameterSetId}@{result.parameterSetVersion}
              </code>
              <br />
              {estimate.parameterSnapshot.displayName}
            </dd>
          </div>
        </dl>
        <p>
          這是透明、可重算的示範估算，不能保證結果一定會發生，也不是正式報價、法律、稅務或採購建議。正式使用前，請在私有環境使用經授權的範圍、歷史資料和公司參數調整。
        </p>
        <p>
          資料提醒：這份報告可能包含案件內容和成本數字。匯出、列印或分享前，請確認已去識別化，且不含公司機密、個人資料、真實乙方名稱、受保密協議（NDA）保護的內容或未公開報價。
        </p>
        <p>
          <Link href="/methodology" prefetch={false}>
            查看完整公式、說明和限制
          </Link>
          <span className="print-only">（{methodologyPrintUrl}）</span>
        </p>
      </section>

      <div className="workspace-toolbar" data-screen-only="true">
        <button
          className="button button--primary"
          type="button"
          onClick={onExport}
        >
          匯出可重算 JSON
        </button>
        <button
          className="button button--secondary"
          type="button"
          onClick={() => window.print()}
        >
          列印／另存 PDF
        </button>
      </div>
    </>
  );
}
