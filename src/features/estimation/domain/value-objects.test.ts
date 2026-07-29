import { describe, expect, expectTypeOf, it } from "vitest";

import type {
  EffortHours,
  ModelVersion,
  Money,
  ParameterSetId,
  Quantity,
  Ratio,
} from "./types";
import {
  asEffortHours,
  asMoney,
  asQuantity,
  asRatio,
  isCanonicalNonNegativeDecimal,
  normalizeNonNegativeDecimal,
  parseModelVersion,
  parseParameterSetId,
} from "./value-objects";

describe("canonical non-negative decimal contract", () => {
  it.each([
    ["12.0", "12"],
    ["0.0", "0"],
    ["0012.3400", "12.34"],
    ["000", "0"],
    ["0.0100", "0.01"],
  ])("normalizes plain decimal input %s to %s", (input, expected) => {
    expect(normalizeNonNegativeDecimal(input)).toBe(expected);
  });

  it.each(["", "1.", ".5", "-0", "-1", "+1", "1e3", " 1", "1 "])(
    "does not coerce invalid or transient input %j",
    (input) => {
      expect(normalizeNonNegativeDecimal(input)).toBeNull();
    },
  );

  it("uses one strict canonical predicate after normalization", () => {
    expect(isCanonicalNonNegativeDecimal("0")).toBe(true);
    expect(isCanonicalNonNegativeDecimal("12.34")).toBe(true);
    expect(isCanonicalNonNegativeDecimal("12.0")).toBe(false);
    expect(isCanonicalNonNegativeDecimal("01")).toBe(false);
  });
});

describe("domain value objects", () => {
  it("keeps domain units nominally distinct while retaining decimal serialization", () => {
    const canonical = normalizeNonNegativeDecimal("12.0");
    expect(canonical).not.toBeNull();
    if (canonical === null) {
      throw new Error("test fixture must be a valid decimal");
    }

    expect(asEffortHours(canonical)).toBe("12");
    expect(asMoney(canonical)).toBe("12");
    expect(asRatio(canonical)).toBe("12");
    expect(asQuantity(canonical)).toBe("12");

    expectTypeOf<EffortHours>().not.toEqualTypeOf<Money>();
    expectTypeOf<EffortHours>().not.toEqualTypeOf<Ratio>();
    expectTypeOf<Quantity>().not.toEqualTypeOf<Money>();
    expectTypeOf<ModelVersion>().not.toEqualTypeOf<ParameterSetId>();
  });

  it("validates versioned identifiers at their domain boundary", () => {
    expect(parseModelVersion("bottom-up-1.0.0")).toBe("bottom-up-1.0.0");
    expect(parseModelVersion("bottom-up-latest")).toBeNull();
    expect(parseParameterSetId("public-demo-zh-tw")).toBe("public-demo-zh-tw");
    expect(parseParameterSetId(" public-demo-zh-tw ")).toBeNull();
  });
});
