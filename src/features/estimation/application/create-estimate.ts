import {
  getPublicDemoWorkItemDefaults,
  publicDemoParameterSet,
} from "@/config/parameter-sets/public-demo";
import {
  CURRENT_MODEL_VERSION,
  type EstimateInput,
  type RiskFactorId,
  type RiskProfile,
  type WorkItemInput,
  type WorkItemType,
} from "@/features/estimation/domain";

import {
  CURRENT_SCHEMA_VERSION,
  type EstimateCaseDocument,
  type RuntimeServices,
} from "./estimate-case";

export const fictionalExampleDescriptors = [
  {
    index: 0,
    id: "member-profile-query-export",
    title: "會員資料查詢與匯出",
    summary:
      "一般 CRUD、角色權限與報表匯出的教學情境，用來示範畫面、授權與報表工作如何拆解。",
    scope: ["查詢與維護畫面", "角色與功能權限", "資料匯出報表"],
    labels: ["UI", "REPORT", "AUTHORIZATION"],
  },
  {
    index: 1,
    id: "public-market-price-batch",
    title: "公開市場價格批次介接",
    summary:
      "公開資料 API、排程批次、資料核對與 rollback 的教學情境，用來示範整合依賴與資料品質風險。",
    scope: [
      "公開 API 介接",
      "排程與 idempotent retry",
      "資料核對與 rollback regression",
      "Production rollout",
    ],
    labels: ["INTEGRATION", "BATCH", "TESTING", "DEPLOYMENT"],
  },
] as const;

interface NewEstimateDetails {
  readonly name: string;
  readonly description: string;
}

function createDefaultRiskProfile(): RiskProfile {
  return Object.fromEntries(
    publicDemoParameterSet.riskFactors.map((factor) => [
      factor.id,
      { level: "NOMINAL", rationale: "" },
    ]),
  ) as unknown as RiskProfile;
}

function createDefaultInput(): EstimateInput {
  return {
    workItems: [],
    riskProfile: createDefaultRiskProfile(),
    phaseLoading: Object.fromEntries(
      publicDemoParameterSet.phaseLoadingParameters.map((phase) => [
        phase.phase,
        phase.defaultRate,
      ]),
    ) as EstimateInput["phaseLoading"],
    fixedEffortHours: "0",
    uncertainty: {
      downsideRate: "0.15",
      upsideRate: "0.3",
    },
    commercialTerms: {
      hourlyRate: "1800",
      directCost: "0",
      overheadRate: "0.12",
      warrantyCost: "0",
      vendorMarkupRate: "0.15",
      taxRate: "0.05",
      hoursPerPersonDay: "8",
      daysPerPersonMonth: "20",
    },
    vendorQuote: null,
  };
}

export function createEmptyEstimateCase(
  details: NewEstimateDetails,
  runtime: RuntimeServices,
): EstimateCaseDocument {
  if (!details.name.trim() || details.name.length > 200) {
    throw new RangeError("Estimate name must contain 1 to 200 characters.");
  }
  if (!details.description.trim() || details.description.length > 1000) {
    throw new RangeError(
      "Estimate description must contain 1 to 1000 characters.",
    );
  }
  const timestamp = runtime.now();

  return {
    id: runtime.createId(),
    schemaVersion: CURRENT_SCHEMA_VERSION,
    modelVersion: CURRENT_MODEL_VERSION,
    name: details.name,
    description: details.description,
    currency: "TWD",
    input: createDefaultInput(),
    parameterSnapshot: publicDemoParameterSet,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function workItem(
  runtime: RuntimeServices,
  type: WorkItemType,
  title: string,
  quantity: string,
  complexity: WorkItemInput["complexity"],
  applicableRiskFactorIds: readonly RiskFactorId[],
  assumption: string,
): WorkItemInput {
  const defaults = getPublicDemoWorkItemDefaults(type);

  return {
    id: runtime.createId(),
    type,
    title,
    description: `${defaults.displayName}的 fictional／illustrative 工作項目。`,
    quantity,
    unit: defaults.unit,
    unitHours: defaults.defaultUnitHours,
    complexity,
    applicableRiskFactorIds,
    includedCrossCuttingPhases: defaults.includedCrossCuttingPhases,
    assumptions: [assumption],
  };
}

function memberLookupExample(runtime: RuntimeServices): EstimateCaseDocument {
  const descriptor = fictionalExampleDescriptors[0];
  const estimate = createEmptyEstimateCase(
    {
      name: `${descriptor.title}（fictional）`,
      description: `fictional／illustrative：${descriptor.summary}不對應任何真實組織或系統。`,
    },
    runtime,
  );

  return {
    ...estimate,
    input: {
      ...estimate.input,
      workItems: [
        workItem(
          runtime,
          "UI",
          "會員資料查詢與維護畫面",
          "2",
          "MEDIUM",
          ["REQUIREMENT_CLARITY", "SECURITY_COMPLIANCE"],
          "只使用虛構欄位，不含個人資料。",
        ),
        workItem(
          runtime,
          "REPORT",
          "會員資料匯出報表",
          "1",
          "MEDIUM",
          ["REQUIREMENT_CLARITY", "SECURITY_COMPLIANCE"],
          "輸出格式與欄位在開發前確認。",
        ),
        workItem(
          runtime,
          "AUTHORIZATION",
          "查詢與匯出權限",
          "2",
          "HIGH",
          ["SECURITY_COMPLIANCE"],
          "示範 Role-based permission，不代表真實權限模型。",
        ),
      ],
      vendorQuote: {
        amount: "420000",
        taxBasis: "TAX_INCLUSIVE",
        note: "fictional／illustrative quote，不含真實乙方名稱。",
        quoteDate: "2026-07-29",
      },
    },
  };
}

function marketBatchExample(runtime: RuntimeServices): EstimateCaseDocument {
  const descriptor = fictionalExampleDescriptors[1];
  const estimate = createEmptyEstimateCase(
    {
      name: `${descriptor.title}（fictional）`,
      description: `fictional／illustrative：${descriptor.summary}不對應真實金融系統。`,
    },
    runtime,
  );

  const riskProfile: RiskProfile = {
    ...estimate.input.riskProfile,
    INTEGRATION_DEPENDENCY: {
      level: "HIGH",
      rationale: "示範外部 public API availability 與契約變更。",
    },
    DATA_MIGRATION_QUALITY: {
      level: "HIGH",
      rationale: "示範資料缺漏、重送與 reconciliation。",
    },
    SCHEDULE_COMPRESSION: {
      level: "NOMINAL",
      rationale: "未假設壓縮交期。",
    },
  };

  return {
    ...estimate,
    input: {
      ...estimate.input,
      riskProfile,
      workItems: [
        workItem(
          runtime,
          "INTEGRATION",
          "公開價格 API adapter",
          "3",
          "HIGH",
          ["INTEGRATION_DEPENDENCY", "SECURITY_COMPLIANCE"],
          "使用 example.com 等保留網域描述，不連到 production endpoint。",
        ),
        workItem(
          runtime,
          "BATCH",
          "價格日批次與 idempotent retry",
          "2",
          "HIGH",
          ["INTEGRATION_DEPENDENCY", "DATA_MIGRATION_QUALITY"],
          "需保留重跑、對帳與 rollback strategy。",
        ),
        workItem(
          runtime,
          "TESTING",
          "資料核對與 rollback regression",
          "2",
          "HIGH",
          ["DATA_MIGRATION_QUALITY"],
          "額外測試 item 已包含 QA effort，避免 phase loading 重複。",
        ),
        workItem(
          runtime,
          "DEPLOYMENT",
          "批次排程與 production rollout",
          "1",
          "MEDIUM",
          ["INTEGRATION_DEPENDENCY"],
          "示範 deployment、rollback 與 hypercare。",
        ),
      ],
      vendorQuote: {
        amount: "780000",
        taxBasis: "TAX_EXCLUSIVE",
        note: "fictional／illustrative quote。",
        quoteDate: "2026-07-29",
      },
    },
  };
}

export function createFictionalExamples(
  runtime: RuntimeServices,
): readonly EstimateCaseDocument[] {
  return [memberLookupExample(runtime), marketBatchExample(runtime)];
}

export function resetToPublicDemoParameters(
  estimate: EstimateCaseDocument,
): EstimateCaseDocument {
  const defaults = createDefaultInput();

  return {
    ...estimate,
    parameterSnapshot: publicDemoParameterSet,
    input: {
      ...estimate.input,
      workItems: estimate.input.workItems.map((item) => {
        const defaults = getPublicDemoWorkItemDefaults(item.type);
        return {
          ...item,
          unit: defaults.unit,
          unitHours: defaults.defaultUnitHours,
          includedCrossCuttingPhases: defaults.includedCrossCuttingPhases,
        };
      }),
      phaseLoading: defaults.phaseLoading,
      uncertainty: defaults.uncertainty,
      commercialTerms: defaults.commercialTerms,
    },
  };
}
