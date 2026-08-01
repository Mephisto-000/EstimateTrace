import {
  ZH_TW_COMPLEXITY_LEVEL_LABELS,
  ZH_TW_CROSS_CUTTING_PHASE_LABELS,
  ZH_TW_RISK_FACTOR_LABELS,
  ZH_TW_WORK_ITEM_TYPE_LABELS,
} from "@/config/locale/zh-tw";
import {
  MODEL_DECIMAL_PRECISION,
  MODEL_INTERMEDIATE_ROUNDING,
  MODEL_MAXIMUM_DAYS_PER_PERSON_MONTH,
  MODEL_MAXIMUM_HOURS_PER_PERSON_DAY,
  MODEL_P80_Z_SCORE,
  MODEL_PRESENTATION_ROUNDING,
  MODEL_ROUNDING_MODE,
  type CrossCuttingPhase,
  type ParameterSnapshot,
  type RiskFactorId,
  type WorkItemType,
} from "@/features/estimation/domain";

const illustrativeSource =
  "公開示範值，不是市場標準；請在私有環境使用經授權的組織歷史資料調整。";

const commonRiskMultipliers = {
  LOW: "0.9",
  NOMINAL: "1",
  HIGH: "1.15",
  VERY_HIGH: "1.3",
} as const;

interface PublicDemoWorkItemCoverage {
  readonly includedActivities: readonly string[];
  readonly includedCrossCuttingPhases: readonly CrossCuttingPhase[];
}

const publicDemoWorkItemCoverageByType = {
  UI: {
    includedActivities: ["implementation"],
    includedCrossCuttingPhases: [],
  },
  REPORT: {
    includedActivities: ["implementation"],
    includedCrossCuttingPhases: [],
  },
  BUSINESS_LOGIC: {
    includedActivities: ["implementation"],
    includedCrossCuttingPhases: [],
  },
  DATABASE: {
    includedActivities: ["implementation"],
    includedCrossCuttingPhases: [],
  },
  INTEGRATION: {
    includedActivities: ["implementation"],
    includedCrossCuttingPhases: [],
  },
  BATCH: {
    includedActivities: ["implementation"],
    includedCrossCuttingPhases: [],
  },
  MIGRATION: {
    includedActivities: ["implementation"],
    includedCrossCuttingPhases: [],
  },
  AUTHORIZATION: {
    includedActivities: ["implementation"],
    includedCrossCuttingPhases: [],
  },
  TESTING: {
    includedActivities: ["test-design", "test-execution"],
    includedCrossCuttingPhases: ["QUALITY_ASSURANCE"],
  },
  DEPLOYMENT: {
    includedActivities: ["deployment", "rollback-plan"],
    includedCrossCuttingPhases: ["DEPLOYMENT_RELEASE"],
  },
  DOCUMENTATION: {
    includedActivities: ["documentation"],
    includedCrossCuttingPhases: ["DOCUMENTATION_TRAINING"],
  },
  CUSTOM: {
    includedActivities: ["implementation"],
    includedCrossCuttingPhases: [],
  },
} as const satisfies Record<WorkItemType, PublicDemoWorkItemCoverage>;

function riskFactor(
  id: RiskFactorId,
  displayName: string,
  description: string,
) {
  return {
    id,
    displayName,
    description,
    multipliers: commonRiskMultipliers,
  } as const;
}

function phase(
  phaseCode: CrossCuttingPhase,
  displayName: string,
  defaultRate: string,
  description: string,
) {
  return {
    phase: phaseCode,
    displayName,
    defaultRate,
    description,
  } as const;
}

export const publicDemoParameterSet = {
  id: "public-demo-zh-tw",
  version: "1.0.1",
  displayName: "公開示範參數（繁體中文）",
  description:
    "供 EstimateTrace 示範使用；不代表任何產業、公司或市場的標準工時和價格。",
  workItemCatalog: [
    {
      code: "UI",
      displayName: ZH_TW_WORK_ITEM_TYPE_LABELS.UI,
      description: "查詢、維護或審核畫面。",
      defaultUnitHours: "24",
      unit: "screen",
      includedActivities:
        publicDemoWorkItemCoverageByType.UI.includedActivities,
      sourceNote: illustrativeSource,
    },
    {
      code: "REPORT",
      displayName: ZH_TW_WORK_ITEM_TYPE_LABELS.REPORT,
      description: "試算表、PDF 或監管報表。",
      defaultUnitHours: "24",
      unit: "report",
      includedActivities:
        publicDemoWorkItemCoverageByType.REPORT.includedActivities,
      sourceNote: illustrativeSource,
    },
    {
      code: "BUSINESS_LOGIC",
      displayName: ZH_TW_WORK_ITEM_TYPE_LABELS.BUSINESS_LOGIC,
      description: "計算、規則或狀態流程。",
      defaultUnitHours: "16",
      unit: "rule",
      includedActivities:
        publicDemoWorkItemCoverageByType.BUSINESS_LOGIC.includedActivities,
      sourceNote: illustrativeSource,
    },
    {
      code: "DATABASE",
      displayName: ZH_TW_WORK_ITEM_TYPE_LABELS.DATABASE,
      description: "資料表、檢視或預存程序。",
      defaultUnitHours: "8",
      unit: "object",
      includedActivities:
        publicDemoWorkItemCoverageByType.DATABASE.includedActivities,
      sourceNote: illustrativeSource,
    },
    {
      code: "INTEGRATION",
      displayName: ZH_TW_WORK_ITEM_TYPE_LABELS.INTEGRATION,
      description: "網頁服務介面、檔案傳輸或訊息佇列。",
      defaultUnitHours: "24",
      unit: "endpoint",
      includedActivities:
        publicDemoWorkItemCoverageByType.INTEGRATION.includedActivities,
      sourceNote: illustrativeSource,
    },
    {
      code: "BATCH",
      displayName: ZH_TW_WORK_ITEM_TYPE_LABELS.BATCH,
      description: "排程、日終或月結作業。",
      defaultUnitHours: "24",
      unit: "job",
      includedActivities:
        publicDemoWorkItemCoverageByType.BATCH.includedActivities,
      sourceNote: illustrativeSource,
    },
    {
      code: "MIGRATION",
      displayName: ZH_TW_WORK_ITEM_TYPE_LABELS.MIGRATION,
      description: "資料清理、轉換與核對。",
      defaultUnitHours: "32",
      unit: "batch",
      includedActivities:
        publicDemoWorkItemCoverageByType.MIGRATION.includedActivities,
      sourceNote: illustrativeSource,
    },
    {
      code: "AUTHORIZATION",
      displayName: ZH_TW_WORK_ITEM_TYPE_LABELS.AUTHORIZATION,
      description: "角色、功能或資料權限。",
      defaultUnitHours: "16",
      unit: "permission-set",
      includedActivities:
        publicDemoWorkItemCoverageByType.AUTHORIZATION.includedActivities,
      sourceNote: illustrativeSource,
    },
    {
      code: "TESTING",
      displayName: ZH_TW_WORK_ITEM_TYPE_LABELS.TESTING,
      description: "回歸、效能或資安測試。",
      defaultUnitHours: "16",
      unit: "test-scope",
      includedActivities:
        publicDemoWorkItemCoverageByType.TESTING.includedActivities,
      sourceNote: illustrativeSource,
    },
    {
      code: "DEPLOYMENT",
      displayName: ZH_TW_WORK_ITEM_TYPE_LABELS.DEPLOYMENT,
      description: "系統整合測試、使用者驗收測試或正式環境部署。",
      defaultUnitHours: "16",
      unit: "environment",
      includedActivities:
        publicDemoWorkItemCoverageByType.DEPLOYMENT.includedActivities,
      sourceNote: illustrativeSource,
    },
    {
      code: "DOCUMENTATION",
      displayName: ZH_TW_WORK_ITEM_TYPE_LABELS.DOCUMENTATION,
      description: "操作手冊、技術文件或訓練。",
      defaultUnitHours: "8",
      unit: "deliverable",
      includedActivities:
        publicDemoWorkItemCoverageByType.DOCUMENTATION.includedActivities,
      sourceNote: illustrativeSource,
    },
    {
      code: "CUSTOM",
      displayName: ZH_TW_WORK_ITEM_TYPE_LABELS.CUSTOM,
      description: "由你自行定義的其他可估算工作。",
      defaultUnitHours: "8",
      unit: "item",
      includedActivities:
        publicDemoWorkItemCoverageByType.CUSTOM.includedActivities,
      sourceNote: illustrativeSource,
    },
  ],
  complexityParameters: [
    {
      level: "LOW",
      displayName: ZH_TW_COMPLEXITY_LEVEL_LABELS.LOW,
      multiplier: "0.8",
      description: "流程單純、規則清楚、很少依賴其他系統。",
    },
    {
      level: "MEDIUM",
      displayName: ZH_TW_COMPLEXITY_LEVEL_LABELS.MEDIUM,
      multiplier: "1",
      description: "一般功能，只有少量例外和驗證。",
    },
    {
      level: "HIGH",
      displayName: ZH_TW_COMPLEXITY_LEVEL_LABELS.HIGH,
      multiplier: "1.35",
      description: "流程、角色或例外很多，或高度依賴其他系統。",
    },
    {
      level: "VERY_HIGH",
      displayName: ZH_TW_COMPLEXITY_LEVEL_LABELS.VERY_HIGH,
      multiplier: "1.7",
      description: "核心交易、狀態複雜，或有嚴格的效能與法遵要求。",
    },
  ],
  riskFactors: [
    riskFactor(
      "REQUIREMENT_CLARITY",
      ZH_TW_RISK_FACTOR_LABELS.REQUIREMENT_CLARITY,
      "需求是否完整、例外情況和驗收條件是否清楚。",
    ),
    riskFactor(
      "LEGACY_TECHNICAL_DEBT",
      ZH_TW_RISK_FACTOR_LABELS.LEGACY_TECHNICAL_DEBT,
      "既有設計限制、舊系統相依和技術債可能增加的工作量。",
    ),
    riskFactor(
      "INTEGRATION_DEPENDENCY",
      ZH_TW_RISK_FACTOR_LABELS.INTEGRATION_DEPENDENCY,
      "外部系統介接、協調、測試環境和介面規格是否穩定。",
    ),
    riskFactor(
      "SECURITY_COMPLIANCE",
      ZH_TW_RISK_FACTOR_LABELS.SECURITY_COMPLIANCE,
      "資安、權限、稽核和法遵要求可能增加的工作量。",
    ),
    riskFactor(
      "DATA_MIGRATION_QUALITY",
      ZH_TW_RISK_FACTOR_LABELS.DATA_MIGRATION_QUALITY,
      "來源資料品質、轉換和核對工作是否有不確定性。",
    ),
    riskFactor(
      "SCHEDULE_COMPRESSION",
      ZH_TW_RISK_FACTOR_LABELS.SCHEDULE_COMPRESSION,
      "平行作業、協調、返工或加班可能增加的工作量。",
    ),
  ],
  phaseLoadingParameters: [
    phase(
      "BUSINESS_ANALYSIS",
      ZH_TW_CROSS_CUTTING_PHASE_LABELS.BUSINESS_ANALYSIS,
      "0.12",
      "以尚未包含這項工作的調整後實作工時為基礎。",
    ),
    phase(
      "ARCHITECTURE_DESIGN",
      ZH_TW_CROSS_CUTTING_PHASE_LABELS.ARCHITECTURE_DESIGN,
      "0.08",
      "跨工作項目的架構和技術設計工作。",
    ),
    phase(
      "PROJECT_MANAGEMENT",
      ZH_TW_CROSS_CUTTING_PHASE_LABELS.PROJECT_MANAGEMENT,
      "0.1",
      "規劃、協調、追蹤與風險管理。",
    ),
    phase(
      "QUALITY_ASSURANCE",
      ZH_TW_CROSS_CUTTING_PHASE_LABELS.QUALITY_ASSURANCE,
      "0.18",
      "額外的整合、回歸和品質保證工作。",
    ),
    phase(
      "DEPLOYMENT_RELEASE",
      ZH_TW_CROSS_CUTTING_PHASE_LABELS.DEPLOYMENT_RELEASE,
      "0.05",
      "不同環境的部署、發布和上線協調。",
    ),
    phase(
      "DOCUMENTATION_TRAINING",
      ZH_TW_CROSS_CUTTING_PHASE_LABELS.DOCUMENTATION_TRAINING,
      "0.05",
      "交付文件、操作說明與訓練。",
    ),
  ],
  uncertaintyParameters: [
    {
      level: "LOW",
      downsideRate: "0.1",
      upsideRate: "0.15",
      description: "範圍清楚、依賴少。",
    },
    {
      level: "MEDIUM",
      downsideRate: "0.15",
      upsideRate: "0.3",
      description: "一般企業需求。",
    },
    {
      level: "HIGH",
      downsideRate: "0.2",
      upsideRate: "0.55",
      description: "多系統依賴或需求未定。",
    },
    {
      level: "VERY_HIGH",
      downsideRate: "0.25",
      upsideRate: "0.9",
      description: "核心系統、資料轉置，或有重大法遵不確定性。",
    },
  ],
  comparison: {
    clearlyBelowP50Ratio: "0.8",
  },
  calculationPolicy: {
    decimalPrecision: MODEL_DECIMAL_PRECISION,
    roundingMode: MODEL_ROUNDING_MODE,
    intermediateRounding: MODEL_INTERMEDIATE_ROUNDING,
    presentationRounding: MODEL_PRESENTATION_ROUNDING,
    p80ZScore: MODEL_P80_Z_SCORE,
  },
  constraints: {
    maximumWorkItems: 500,
    maximumQuantity: "1000000",
    maximumUnitHours: "100000",
    maximumMoney: "1000000000000000",
    maximumCommercialRate: "5",
    maximumPhaseLoadingRate: "1",
    maximumTotalPhaseLoadingRate: "3",
    maximumHoursPerPersonDay: MODEL_MAXIMUM_HOURS_PER_PERSON_DAY,
    maximumDaysPerPersonMonth: MODEL_MAXIMUM_DAYS_PER_PERSON_MONTH,
    riskProductSafetyCap: "3",
  },
  vendorQuestions: [
    {
      id: "testing-scope",
      priority: 10,
      text: "報價是否包含完整的系統整合測試、使用者驗收測試和回歸測試？",
      triggers: [
        {
          kind: "BAND",
          bands: ["CLEARLY_BELOW_MODEL_RANGE"],
        },
      ],
    },
    {
      id: "impact-analysis",
      priority: 20,
      text: "報價是否包含舊系統影響分析和資料核對？",
      triggers: [
        {
          kind: "WORK_ITEM_TYPE",
          workItemTypes: ["DATABASE", "INTEGRATION", "BATCH", "MIGRATION"],
        },
        {
          kind: "RISK_FACTOR",
          factorIds: [
            "LEGACY_TECHNICAL_DEBT",
            "INTEGRATION_DEPENDENCY",
            "DATA_MIGRATION_QUALITY",
          ],
          minimumLevel: "HIGH",
        },
      ],
    },
    {
      id: "release-rollback",
      priority: 30,
      text: "報價是否包含正式環境部署、復原和上線後密集支援？",
      triggers: [
        {
          kind: "WORK_ITEM_TYPE",
          workItemTypes: ["INTEGRATION", "BATCH", "MIGRATION", "DEPLOYMENT"],
        },
        {
          kind: "RISK_FACTOR",
          factorIds: ["SCHEDULE_COMPRESSION"],
          minimumLevel: "HIGH",
        },
      ],
    },
    {
      id: "warranty-sla",
      priority: 40,
      text: "保固範圍、期間和服務水準是什麼？",
      triggers: [
        {
          kind: "BAND",
          bands: ["ABOVE_MODEL_P50", "ABOVE_MODEL_P80"],
        },
      ],
    },
    {
      id: "contingency",
      priority: 50,
      text: "需求還不清楚的部分，是否已加入預備金或緩衝？",
      triggers: [
        {
          kind: "RISK_FACTOR",
          factorIds: ["REQUIREMENT_CLARITY", "SCHEDULE_COMPRESSION"],
          minimumLevel: "HIGH",
        },
      ],
    },
    {
      id: "role-rate",
      priority: 60,
      text: "乙方能否提供各角色的人日和綜合費率？",
      triggers: [
        {
          kind: "BAND",
          bands: ["ABOVE_MODEL_P50", "ABOVE_MODEL_P80"],
        },
      ],
    },
    {
      id: "quote-inclusions",
      priority: 70,
      text: "報價是否已包含稅、授權、第三方服務和差旅？",
      triggers: [
        {
          kind: "BAND",
          bands: [
            "CLEARLY_BELOW_MODEL_RANGE",
            "NEAR_MODEL_REFERENCE_RANGE",
            "ABOVE_MODEL_P50",
            "ABOVE_MODEL_P80",
          ],
        },
      ],
    },
  ],
  sourceNotes: [illustrativeSource],
} as const satisfies ParameterSnapshot;

/**
 * Returns the canonical catalog values and the matching double-counting guard.
 * UI creation, fictional examples, and parameter reset must all use this seam.
 */
export function getPublicDemoWorkItemDefaults(type: WorkItemType) {
  const catalog = publicDemoParameterSet.workItemCatalog.find(
    (entry) => entry.code === type,
  );

  if (!catalog) {
    throw new Error(`Missing canonical public demo work item: ${type}`);
  }

  return {
    ...catalog,
    includedCrossCuttingPhases:
      publicDemoWorkItemCoverageByType[type].includedCrossCuttingPhases,
  };
}
