import { describe, expect, it } from "vitest";

import {
  formatDecimal,
  formatEffort,
  formatMoney,
  formatRatio,
} from "./formatters";

describe("decimal-safe presentation formatters", () => {
  it("不經 JavaScript number 顯示超過安全整數範圍的 TWD", () => {
    expect(formatMoney("36000000000000001")).toBe("$36,000,000,000,000,001");
  });

  it("以 ROUND_HALF_UP 在 presentation boundary 格式化 effort", () => {
    expect(formatEffort("12345678901234567.25")).toBe(
      "12,345,678,901,234,567.3 小時",
    );
  });

  it("保留 ratio 百分比與 typed unavailable 狀態", () => {
    expect(formatRatio("0.1555")).toBe("15.6%");
    expect(formatRatio(null)).toBe("無法計算");
  });

  it("decimal 顯示移除非必要尾零但不遺失大數整數位", () => {
    expect(formatDecimal("9007199254740993.1200", 4)).toBe(
      "9,007,199,254,740,993.12",
    );
  });
});
