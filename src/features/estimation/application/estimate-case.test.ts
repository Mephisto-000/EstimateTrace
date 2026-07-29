import { describe, expect, it } from "vitest";

import { isEstimateCaseId } from "./estimate-case";

describe("isEstimateCaseId", () => {
  it.each([
    ["UUID v4", "00000000-0000-4000-8000-999999999999", true],
    ["UUID v7", "11111111-1111-7111-8111-111111111111", true],
    ["nil UUID", "00000000-0000-0000-0000-000000000000", true],
    ["max UUID", "ffffffff-ffff-ffff-ffff-ffffffffffff", true],
    ["不支援的 version", "11111111-1111-9111-8111-111111111111", false],
    ["不合法的 variant", "11111111-1111-4111-7111-111111111111", false],
    ["任意字串", "not-an-estimate-id", false],
    ["非字串", 42, false],
  ])("%s", (_name, value, expected) => {
    expect(isEstimateCaseId(value)).toBe(expected);
  });
});
