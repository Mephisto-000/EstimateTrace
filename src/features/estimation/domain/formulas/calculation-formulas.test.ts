import { describe, expect, it } from "vitest";

import {
  CALCULATION_FORMULAS,
  getCalculationFormulaPresentation,
} from "./calculation-formulas";

const V0_1_0_SNAPSHOT_FORMULAS = [
  "H_i,base = q_i × u_i",
  "H_i,complex = H_i,base × c_i",
  "R_i = ∏ r_i,k",
  "H_i,adj = H_i,complex × R_i",
  "H_base = Σ H_i,base",
  "H_complex = Σ H_i,complex",
  "ΔH_complex = H_complex − H_base",
  "c_effective = H_complex ÷ H_base",
  "H_adj = Σ H_i,adj",
  "ΔH_risk = H_adj − H_complex",
  "H_cross,p = α_p × Σ H_i,adj (eligible)",
  "H_cross = Σ H_cross,p",
  "H_M = H_adj + H_cross + H_fixed",
  "H_O = H_M × (1 − d)",
  "H_P = H_M × (1 + u)",
  "H_P50 = (H_O + 4H_M + H_P) ÷ 6",
  "σ = (H_P − H_O) ÷ 6",
  "H_P80 = max(0, H_P50 + z_80σ)",
  "PersonDays_x = H_Px ÷ hoursPerPersonDay",
  "PersonMonths_x = H_Px ÷ (hoursPerPersonDay × daysPerPersonMonth)",
  "C_labor,x = H_Px × R_h",
  "D_x = D",
  "C_delivery,x = C_labor,x + D",
  "C_engineering,x = C_delivery,x",
  "C_overhead,x = C_delivery,x × o",
  "C_afterOverhead,x = C_delivery,x + C_overhead,x",
  "W_x = W",
  "C_full,x = C_afterOverhead,x + W",
  "C_markup,x = C_full,x × m",
  "Q_exTax,x = C_full,x + C_markup,x",
  "C_tax,x = Q_exTax,x × t",
  "Q_incTax,x = Q_exTax,x + C_tax,x",
  "V_exTax = V_incTax ÷ (1 + t)",
  "V_exTax = V",
  "Δ_x = V_exTax − Q_exTax,x",
  "Variance_x = Δ_x ÷ Q_exTax,x",
  "QuoteRatio_x = V_exTax ÷ Q_exTax,x",
] as const;

describe("CALCULATION_FORMULAS", () => {
  it("保留 v0.1.0 calculation trace 的 stable snapshot text", () => {
    expect(
      Object.values(CALCULATION_FORMULAS).map(
        (definition) => definition.snapshotText,
      ),
    ).toEqual(V0_1_0_SNAPSHOT_FORMULAS);
  });

  it("每個 snapshot text 都可解析為 canonical LaTeX 與完整文字替代", () => {
    for (const definition of Object.values(CALCULATION_FORMULAS)) {
      expect(getCalculationFormulaPresentation(definition.snapshotText)).toBe(
        definition,
      );
      expect(definition.latex).not.toBe("");
      expect(definition.accessibleLabel).toMatch(/。$/);
    }
  });

  it("未知 snapshot text 不會被誤配到其他公式", () => {
    expect(
      getCalculationFormulaPresentation("unknown formula"),
    ).toBeUndefined();
  });

  it("person-month 文字替代保留分母乘積的運算順序", () => {
    expect(CALCULATION_FORMULAS.personMonths.accessibleLabel).toBe(
      "指定百分位數的人月，等於該百分位工時 H P x，除以每日工時 h d 與每月工作日 d m 的乘積。",
    );
  });
});
