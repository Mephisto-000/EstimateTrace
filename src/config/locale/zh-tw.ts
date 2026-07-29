import type {
  ComplexityLevel,
  CrossCuttingPhase,
  RiskFactorId,
  RiskLevel,
  WorkItemType,
} from "@/features/estimation/domain";

export const ZH_TW_WORK_ITEM_TYPE_LABELS = {
  UI: "畫面功能",
  REPORT: "報表",
  BUSINESS_LOGIC: "商業邏輯",
  DATABASE: "資料庫",
  INTEGRATION: "系統介接",
  BATCH: "批次處理",
  MIGRATION: "資料轉置",
  AUTHORIZATION: "權限",
  TESTING: "額外測試",
  DEPLOYMENT: "部署",
  DOCUMENTATION: "文件與教育",
  CUSTOM: "自訂",
} as const satisfies Readonly<Record<WorkItemType, string>>;

export const ZH_TW_COMPLEXITY_LEVEL_LABELS = {
  LOW: "低",
  MEDIUM: "中",
  HIGH: "高",
  VERY_HIGH: "極高",
} as const satisfies Readonly<Record<ComplexityLevel, string>>;

export const ZH_TW_RISK_LEVEL_LABELS = {
  LOW: "低",
  NOMINAL: "一般",
  HIGH: "高",
  VERY_HIGH: "極高",
} as const satisfies Readonly<Record<RiskLevel, string>>;

export const ZH_TW_RISK_FACTOR_LABELS = {
  REQUIREMENT_CLARITY: "需求明確度",
  LEGACY_TECHNICAL_DEBT: "舊有系統與技術債",
  INTEGRATION_DEPENDENCY: "系統介接依賴",
  SECURITY_COMPLIANCE: "資訊安全與法遵",
  DATA_MIGRATION_QUALITY: "資料轉置品質",
  SCHEDULE_COMPRESSION: "時程壓縮",
} as const satisfies Readonly<Record<RiskFactorId, string>>;

export const ZH_TW_CROSS_CUTTING_PHASE_LABELS = {
  BUSINESS_ANALYSIS: "商業分析",
  ARCHITECTURE_DESIGN: "架構與技術設計",
  PROJECT_MANAGEMENT: "專案管理",
  QUALITY_ASSURANCE: "品質保證",
  DEPLOYMENT_RELEASE: "部署與發布",
  DOCUMENTATION_TRAINING: "文件與訓練",
} as const satisfies Readonly<Record<CrossCuttingPhase, string>>;
