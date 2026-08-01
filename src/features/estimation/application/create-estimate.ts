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
      "用新增、查詢、修改、刪除、角色權限和報表匯出，示範怎麼拆出畫面、權限和報表工作。",
    scope: ["查詢與維護畫面", "角色與功能權限", "資料匯出報表"],
    workItemTypes: ["UI", "REPORT", "AUTHORIZATION"],
  },
  {
    index: 1,
    id: "public-market-price-batch",
    title: "公開市場價格批次介接",
    summary:
      "用公開資料介接、排程批次、資料核對和復原，示範系統相依和資料品質的風險。",
    scope: [
      "公開資料介接",
      "排程與冪等重試",
      "資料核對與回復測試",
      "正式環境上線",
    ],
    workItemTypes: ["INTEGRATION", "BATCH", "TESTING", "DEPLOYMENT"],
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
    description: `這是虛構的${defaults.displayName}工作項目。`,
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
      name: `${descriptor.title}（虛構）`,
      description: `虛構示範：${descriptor.summary}不對應任何真實組織或系統。`,
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
          "開發前先確認輸出格式和欄位。",
        ),
        workItem(
          runtime,
          "AUTHORIZATION",
          "查詢與匯出權限",
          "2",
          "HIGH",
          ["SECURITY_COMPLIANCE"],
          "這是角色權限示範，不代表真實權限設定。",
        ),
      ],
      vendorQuote: {
        amount: "420000",
        taxBasis: "TAX_INCLUSIVE",
        note: "虛構示意報價，不含真實乙方名稱。",
        quoteDate: "2026-07-29",
      },
    },
  };
}

function marketBatchExample(runtime: RuntimeServices): EstimateCaseDocument {
  const descriptor = fictionalExampleDescriptors[1];
  const estimate = createEmptyEstimateCase(
    {
      name: `${descriptor.title}（虛構）`,
      description: `虛構示範：${descriptor.summary}不對應真實金融系統。`,
    },
    runtime,
  );

  const riskProfile: RiskProfile = {
    ...estimate.input.riskProfile,
    INTEGRATION_DEPENDENCY: {
      level: "HIGH",
      rationale: "示範外部公開介面的可用性和規格變更。",
    },
    DATA_MIGRATION_QUALITY: {
      level: "HIGH",
      rationale: "示範資料缺漏、重送和核對。",
    },
    SCHEDULE_COMPRESSION: {
      level: "NOMINAL",
      rationale: "不假設壓縮交期。",
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
          "公開價格介接元件",
          "3",
          "HIGH",
          ["INTEGRATION_DEPENDENCY", "SECURITY_COMPLIANCE"],
          "使用 example.com 等保留網域說明，不連到正式環境端點。",
        ),
        workItem(
          runtime,
          "BATCH",
          "價格日批次與冪等重試",
          "2",
          "HIGH",
          ["INTEGRATION_DEPENDENCY", "DATA_MIGRATION_QUALITY"],
          "需要有重跑、對帳和復原方式。",
        ),
        workItem(
          runtime,
          "TESTING",
          "資料核對與回復測試",
          "2",
          "HIGH",
          ["DATA_MIGRATION_QUALITY"],
          "額外測試項目已包含品質保證工時，避免額外工作重複計算。",
        ),
        workItem(
          runtime,
          "DEPLOYMENT",
          "批次排程與正式環境上線",
          "1",
          "MEDIUM",
          ["INTEGRATION_DEPENDENCY"],
          "示範部署、復原和上線後密集支援。",
        ),
      ],
      vendorQuote: {
        amount: "780000",
        taxBasis: "TAX_EXCLUSIVE",
        note: "虛構示意報價。",
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
