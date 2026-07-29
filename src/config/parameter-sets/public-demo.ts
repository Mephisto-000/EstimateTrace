import type {
  CrossCuttingPhase,
  ParameterSnapshot,
  RiskFactorId,
} from "@/features/estimation/domain";
import {
  MODEL_DECIMAL_PRECISION,
  MODEL_P80_Z_SCORE,
  MODEL_ROUNDING_MODE,
} from "@/features/estimation/domain";

const illustrativeSource =
  "公開教學示範值，非市場標準；使用者應以經授權的歷史資料校準。";

const commonRiskMultipliers = {
  LOW: "0.9",
  NOMINAL: "1",
  HIGH: "1.15",
  VERY_HIGH: "1.3",
} as const;

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
  version: "1.0.0",
  displayName: "公開示範參數（繁體中文）",
  description:
    "供 EstimateTrace 教學與方法展示使用；不代表任何產業、公司或市場的標準工時與價格。",
  workItemCatalog: [
    {
      code: "UI",
      displayName: "畫面功能",
      description: "查詢、維護或審核畫面。",
      defaultUnitHours: "24",
      unit: "screen",
      includedActivities: ["analysis", "implementation", "basic-test"],
      sourceNote: illustrativeSource,
    },
    {
      code: "REPORT",
      displayName: "報表",
      description: "Excel、PDF 或監管報表。",
      defaultUnitHours: "24",
      unit: "report",
      includedActivities: ["analysis", "implementation", "basic-test"],
      sourceNote: illustrativeSource,
    },
    {
      code: "BUSINESS_LOGIC",
      displayName: "商業邏輯",
      description: "計算、規則或狀態流程。",
      defaultUnitHours: "16",
      unit: "rule",
      includedActivities: ["analysis", "implementation", "basic-test"],
      sourceNote: illustrativeSource,
    },
    {
      code: "DATABASE",
      displayName: "資料庫",
      description: "Table、View 或 Stored Procedure。",
      defaultUnitHours: "8",
      unit: "object",
      includedActivities: ["analysis", "implementation", "basic-test"],
      sourceNote: illustrativeSource,
    },
    {
      code: "INTEGRATION",
      displayName: "系統介接",
      description: "REST API、SFTP 或 Message Queue。",
      defaultUnitHours: "24",
      unit: "endpoint",
      includedActivities: ["analysis", "implementation", "basic-test"],
      sourceNote: illustrativeSource,
    },
    {
      code: "BATCH",
      displayName: "批次處理",
      description: "排程、日終或月結作業。",
      defaultUnitHours: "24",
      unit: "job",
      includedActivities: ["analysis", "implementation", "basic-test"],
      sourceNote: illustrativeSource,
    },
    {
      code: "MIGRATION",
      displayName: "資料轉置",
      description: "資料清理、轉換與核對。",
      defaultUnitHours: "32",
      unit: "batch",
      includedActivities: ["analysis", "implementation", "basic-test"],
      sourceNote: illustrativeSource,
    },
    {
      code: "AUTHORIZATION",
      displayName: "權限",
      description: "Role、Function 或 Data Permission。",
      defaultUnitHours: "16",
      unit: "permission-set",
      includedActivities: ["analysis", "implementation", "basic-test"],
      sourceNote: illustrativeSource,
    },
    {
      code: "TESTING",
      displayName: "額外測試",
      description: "Regression、Performance 或 Security testing。",
      defaultUnitHours: "16",
      unit: "test-scope",
      includedActivities: ["test-design", "test-execution"],
      sourceNote: illustrativeSource,
    },
    {
      code: "DEPLOYMENT",
      displayName: "部署",
      description: "SIT、UAT 或 Production deployment。",
      defaultUnitHours: "16",
      unit: "environment",
      includedActivities: ["deployment", "rollback-plan"],
      sourceNote: illustrativeSource,
    },
    {
      code: "DOCUMENTATION",
      displayName: "文件與教育",
      description: "操作手冊、技術文件或訓練。",
      defaultUnitHours: "8",
      unit: "deliverable",
      includedActivities: ["documentation"],
      sourceNote: illustrativeSource,
    },
    {
      code: "CUSTOM",
      displayName: "自訂",
      description: "由使用者明確定義的其他可估算工作。",
      defaultUnitHours: "8",
      unit: "item",
      includedActivities: [],
      sourceNote: illustrativeSource,
    },
  ],
  complexityParameters: [
    {
      level: "LOW",
      displayName: "Low",
      multiplier: "0.8",
      description: "單一路徑、規則明確、低整合依賴。",
    },
    {
      level: "MEDIUM",
      displayName: "Medium",
      multiplier: "1",
      description: "一般企業功能、少量例外與驗證。",
    },
    {
      level: "HIGH",
      displayName: "High",
      multiplier: "1.35",
      description: "多路徑、多角色、多例外或高整合依賴。",
    },
    {
      level: "VERY_HIGH",
      displayName: "Very High",
      multiplier: "1.7",
      description: "核心交易、複雜狀態、嚴格效能或高度法遵。",
    },
  ],
  riskFactors: [
    riskFactor(
      "REQUIREMENT_CLARITY",
      "Requirement Clarity",
      "需求完整度、例外與驗收條件的不確定性。",
    ),
    riskFactor(
      "LEGACY_TECHNICAL_DEBT",
      "Legacy／Technical Debt",
      "既有設計限制、歷史相依與技術債造成的額外 effort。",
    ),
    riskFactor(
      "INTEGRATION_DEPENDENCY",
      "Integration Dependency",
      "外部介接、協調、測試環境與契約穩定性的風險。",
    ),
    riskFactor(
      "SECURITY_COMPLIANCE",
      "Security／Compliance",
      "資安、權限、稽核與法遵要求造成的額外 effort。",
    ),
    riskFactor(
      "DATA_MIGRATION_QUALITY",
      "Data Migration Quality",
      "來源資料品質、轉換與核對的不確定性。",
    ),
    riskFactor(
      "SCHEDULE_COMPRESSION",
      "Schedule Compression",
      "平行作業、協調、返工或加班造成的額外 effort。",
    ),
  ],
  phaseLoadingParameters: [
    phase(
      "BUSINESS_ANALYSIS",
      "Business Analysis",
      "0.12",
      "以未包含此活動的 adjusted implementation effort 為分母。",
    ),
    phase(
      "ARCHITECTURE_DESIGN",
      "Architecture／Technical Design",
      "0.08",
      "跨工作項目的架構與技術設計。",
    ),
    phase(
      "PROJECT_MANAGEMENT",
      "Project Management",
      "0.1",
      "規劃、協調、追蹤與風險管理。",
    ),
    phase(
      "QUALITY_ASSURANCE",
      "Quality Assurance",
      "0.18",
      "額外的整合、回歸與品質保證活動。",
    ),
    phase(
      "DEPLOYMENT_RELEASE",
      "Deployment／Release",
      "0.05",
      "跨環境部署、release 與上線協調。",
    ),
    phase(
      "DOCUMENTATION_TRAINING",
      "Documentation／Training",
      "0.05",
      "交付文件、操作說明與訓練。",
    ),
  ],
  uncertaintyParameters: [
    {
      level: "LOW",
      downsideRate: "0.1",
      upsideRate: "0.15",
      description: "Scope 清楚、依賴少。",
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
      description: "核心系統、轉置或重大法遵不確定性。",
    },
  ],
  comparison: {
    clearlyBelowP50Ratio: "0.8",
  },
  calculationPolicy: {
    decimalPrecision: MODEL_DECIMAL_PRECISION,
    roundingMode: MODEL_ROUNDING_MODE,
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
    riskProductSafetyCap: "3",
  },
  vendorQuestions: [
    {
      id: "testing-scope",
      priority: 10,
      text: "是否包含完整 SIT、UAT 與 Regression Test？",
    },
    {
      id: "impact-analysis",
      priority: 20,
      text: "是否包含既有系統影響分析與資料核對？",
    },
    {
      id: "release-rollback",
      priority: 30,
      text: "是否包含 Production deployment、rollback 與 hypercare？",
    },
    {
      id: "warranty-sla",
      priority: 40,
      text: "Warranty 範圍、期間與 SLA 為何？",
    },
    {
      id: "contingency",
      priority: 50,
      text: "是否因需求未明而加入 contingency？",
    },
    {
      id: "role-rate",
      priority: 60,
      text: "乙方是否能提供角色別人日與 blended rate？",
    },
    {
      id: "quote-inclusions",
      priority: 70,
      text: "報價是否包含稅、授權、第三方服務與差旅？",
    },
  ],
  sourceNotes: [illustrativeSource],
} as const satisfies ParameterSnapshot;
