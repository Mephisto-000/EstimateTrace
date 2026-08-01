import { describe, expect, it } from "vitest";

import { publicDemoParameterSet } from "@/config/parameter-sets/public-demo";

import {
  COMPLEXITY_LEVEL_LABELS,
  CROSS_CUTTING_PHASE_LABELS,
  formatIncludedActivity,
  formatLegacyParameterText,
  formatTraceMetric,
  formatWorkItemUnit,
  RISK_FACTOR_LABELS,
  WORK_ITEM_TYPE_LABELS,
} from "./labels";

describe("presentation labels", () => {
  it("把既有參數快照的穩定識別碼轉為繁體中文顯示文字", () => {
    expect(formatWorkItemUnit("endpoint")).toBe("端點");
    expect(formatIncludedActivity("rollback-plan")).toBe("復原方案");
    expect(formatTraceMetric("p80VendorMarkupAmount")).toBe("P80 乙方成本加成");
  });

  it("把舊版參數說明與乙方提問轉為繁體中文", () => {
    expect(
      formatLegacyParameterText("是否包含完整 SIT、UAT 與 Regression Test？"),
    ).toBe("報價是否包含完整的系統整合測試、使用者驗收測試和回歸測試？");
    expect(
      formatLegacyParameterText(
        "是否包含 Production deployment、rollback 與 hypercare？",
      ),
    ).toBe("報價是否包含正式環境部署、復原和上線後密集支援？");
    expect(formatLegacyParameterText("Warranty 範圍、期間與 SLA 為何？")).toBe(
      "保固範圍、期間和服務水準是什麼？",
    );
    expect(
      formatLegacyParameterText("乙方是否能提供角色別人日與 blended rate？"),
    ).toBe("乙方能否提供各角色的人日和綜合費率？");
  });

  it("公開參數快照與介面共用同一組繁體中文領域詞彙", () => {
    for (const item of publicDemoParameterSet.workItemCatalog) {
      expect(item.displayName).toBe(WORK_ITEM_TYPE_LABELS[item.code]);
    }
    for (const parameter of publicDemoParameterSet.complexityParameters) {
      expect(parameter.displayName).toBe(
        COMPLEXITY_LEVEL_LABELS[parameter.level],
      );
    }
    for (const factor of publicDemoParameterSet.riskFactors) {
      expect(factor.displayName).toBe(RISK_FACTOR_LABELS[factor.id]);
    }
    for (const phase of publicDemoParameterSet.phaseLoadingParameters) {
      expect(phase.displayName).toBe(CROSS_CUTTING_PHASE_LABELS[phase.phase]);
    }
  });
});
