import {
  ZH_TW_COMPLEXITY_LEVEL_LABELS,
  ZH_TW_CROSS_CUTTING_PHASE_LABELS,
  ZH_TW_RISK_FACTOR_LABELS,
  ZH_TW_RISK_LEVEL_LABELS,
  ZH_TW_WORK_ITEM_TYPE_LABELS,
} from "@/config/locale/zh-tw";
import type {
  CalculationUnit,
  CostDriverId,
} from "@/features/estimation/domain";

export const WORK_ITEM_TYPE_LABELS = ZH_TW_WORK_ITEM_TYPE_LABELS;
export const COMPLEXITY_LEVEL_LABELS = ZH_TW_COMPLEXITY_LEVEL_LABELS;
export const RISK_LEVEL_LABELS = ZH_TW_RISK_LEVEL_LABELS;
export const RISK_FACTOR_LABELS = ZH_TW_RISK_FACTOR_LABELS;
export const CROSS_CUTTING_PHASE_LABELS = ZH_TW_CROSS_CUTTING_PHASE_LABELS;

export const CALCULATION_UNIT_LABELS = {
  "person-hour": "人時",
  "person-day": "人日",
  "person-month": "人月",
  TWD: "新臺幣",
  "TWD/person-hour": "新臺幣／人時",
  "person-hour/person-day": "人時／人日",
  "person-hour/person-month": "人時／人月",
  ratio: "比率",
  dimensionless: "無量綱",
} as const satisfies Readonly<Record<CalculationUnit, string>>;

export const COST_DRIVER_LABELS = {
  P50_LABOR_COST: "P50 人力成本",
  P50_DIRECT_COST: "直接成本",
  P50_OVERHEAD_COST: "管銷與間接成本",
  P50_WARRANTY_COST: "保固",
  P50_VENDOR_MARKUP_COST: "乙方成本加成",
  P50_TAX_COST: "稅額",
} as const satisfies Readonly<Record<CostDriverId, string>>;

const LEGACY_WORK_ITEM_UNIT_LABELS: Readonly<Record<string, string>> = {
  screen: "畫面",
  report: "份",
  rule: "規則",
  object: "物件",
  endpoint: "端點",
  job: "作業",
  batch: "批次",
  "permission-set": "權限組",
  "test-scope": "測試範圍",
  environment: "環境",
  deliverable: "交付項目",
  item: "項",
  畫面: "畫面",
  報表: "份",
  規則: "規則",
  物件: "物件",
  端點: "端點",
  作業: "作業",
  批次: "批次",
  權限組: "權限組",
  測試範圍: "測試範圍",
  環境: "環境",
  交付項目: "交付項目",
  項目: "項",
};

const LEGACY_INCLUDED_ACTIVITY_LABELS: Readonly<Record<string, string>> = {
  implementation: "實作",
  "test-design": "測試設計",
  "test-execution": "測試執行",
  deployment: "部署",
  "rollback-plan": "復原方案",
  documentation: "文件製作",
  回復計畫: "復原方案",
  文件: "文件製作",
};

const LEGACY_PARAMETER_TEXT_REPLACEMENTS: readonly (readonly [
  string,
  string,
])[] = [
  [
    "是否包含完整 SIT、UAT 與 Regression Test？",
    "報價是否包含完整的系統整合測試、使用者驗收測試和回歸測試？",
  ],
  [
    "是否包含 Production deployment、rollback 與 hypercare？",
    "報價是否包含正式環境部署、復原和上線後密集支援？",
  ],
  ["Warranty 範圍、期間與 SLA 為何？", "保固範圍、期間和服務水準是什麼？"],
  [
    "是否因需求未明而加入 contingency？",
    "需求還不清楚的部分，是否已加入預備金或緩衝？",
  ],
  [
    "乙方是否能提供角色別人日與 blended rate？",
    "乙方能否提供各角色的人日和綜合費率？",
  ],
  ["Regression Test", "回歸測試"],
  ["Production deployment", "正式環境部署"],
  ["REST API", "網頁服務介面"],
  ["blended rate", "綜合費率"],
  ["Security testing", "資安測試"],
  ["Stored Procedure", "預存程序"],
  ["Data Permission", "資料權限"],
  ["Message Queue", "訊息佇列"],
  ["adjusted implementation effort", "調整後實作工時"],
  ["SIT", "系統整合測試"],
  ["UAT", "使用者驗收測試"],
  ["SFTP", "檔案傳輸"],
  ["rollback", "回復"],
  ["hypercare", "上線後密集支援"],
  ["Warranty", "保固"],
  ["SLA", "服務水準"],
  ["contingency", "預備金或緩衝"],
  ["Excel", "試算表"],
  ["Regression", "回歸"],
  ["Performance", "效能"],
  ["implementation", "實作"],
  ["release", "發布"],
  ["effort", "工作量"],
  ["Scope", "範圍"],
  ["Table", "資料表"],
  ["View", "檢視"],
  ["Role", "角色"],
  ["Function", "功能"],
] as const;

const TRACE_METRIC_LABELS: Readonly<Record<string, string>> = {
  workItemBaseEffortHours: "工作項目基礎工時",
  workItemComplexityAdjustedEffortHours: "複雜度調整後工時",
  workItemRiskProduct: "風險乘數乘積",
  workItemAdjustedEffortHours: "風險調整後工時",
  baseEffortHours: "基礎實作工時",
  complexityAdjustedEffortHours: "複雜度調整後總工時",
  complexityAdjustmentHours: "複雜度增減工時",
  effectiveComplexityMultiplier: "有效複雜度乘數",
  adjustedEffortHours: "調整後實作工時",
  riskAdjustmentHours: "風險增減工時",
  phaseEffortHours: "階段工時",
  crossCuttingEffortHours: "跨階段總工時",
  mostLikelyEffortHours: "最可能工時",
  optimisticEffortHours: "樂觀工時",
  pessimisticEffortHours: "悲觀工時",
  p50EffortHours: "P50 工時",
  standardDeviationHours: "工時標準差",
  p80EffortHours: "P80 工時",
  normalizedQuoteExTax: "換算後未稅乙方報價",
};

const PERCENTILE_TRACE_METRIC_LABELS = {
  PersonDays: "人日",
  PersonMonths: "人月",
  LaborCost: "人力成本",
  DirectCost: "直接成本",
  DeliveryCost: "交付成本",
  EngineeringCost: "工程成本",
  OverheadAmount: "管銷與間接成本",
  CostAfterOverhead: "計入管銷後成本",
  WarrantyCost: "保固成本",
  FullCost: "完整成本",
  VendorMarkupAmount: "乙方成本加成",
  QuoteExTax: "未稅參考報價",
  TaxAmount: "稅額",
  QuoteIncTax: "含稅參考報價",
} as const;

function formatLegacyLabel(
  value: string,
  labels: Readonly<Record<string, string>>,
): string {
  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    return "未指定";
  }

  return labels[normalizedValue.toLowerCase()] ?? normalizedValue;
}

export function formatWorkItemUnit(unit: string): string {
  return formatLegacyLabel(unit, LEGACY_WORK_ITEM_UNIT_LABELS);
}

export function formatIncludedActivity(activity: string): string {
  return formatLegacyLabel(activity, LEGACY_INCLUDED_ACTIVITY_LABELS);
}

export function formatLegacyParameterText(value: string): string {
  return LEGACY_PARAMETER_TEXT_REPLACEMENTS.reduce(
    (localized, [source, replacement]) =>
      localized.replaceAll(source, replacement),
    value,
  );
}

export function formatTraceMetric(metric: string): string {
  const normalizedMetric = metric.trim();
  const directLabel = TRACE_METRIC_LABELS[normalizedMetric];

  if (directLabel !== undefined) {
    return directLabel;
  }

  const percentileMetric = normalizedMetric.match(/^p(50|80)([A-Z][A-Za-z]+)$/);
  if (percentileMetric !== null) {
    const [, percentile, metricName] = percentileMetric;
    const metricLabel =
      PERCENTILE_TRACE_METRIC_LABELS[
        metricName as keyof typeof PERCENTILE_TRACE_METRIC_LABELS
      ];

    if (metricLabel !== undefined) {
      return `P${percentile} ${metricLabel}`;
    }
  }

  const differenceMetric = normalizedMetric.match(/^differenceFromP(50|80)$/);
  if (differenceMetric !== null) {
    return `相對 P${differenceMetric[1]} 報價差額`;
  }

  const varianceMetric = normalizedMetric.match(/^varianceFromP(50|80)$/);
  if (varianceMetric !== null) {
    return `相對 P${varianceMetric[1]} 差異率`;
  }

  const quoteRatioMetric = normalizedMetric.match(/^quoteToP(50|80)Ratio$/);
  if (quoteRatioMetric !== null) {
    return `報價與 P${quoteRatioMetric[1]} 比率`;
  }

  return normalizedMetric || "未指定";
}
