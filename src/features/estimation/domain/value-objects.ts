import type {
  CanonicalDecimalString,
  CanonicalNonNegativeDecimalString,
  EffortHours,
  ModelVersion,
  Money,
  ParameterSetId,
  Quantity,
  Ratio,
} from "./types";

export const MAXIMUM_DECIMAL_CHARACTERS = 256;

const plainNonNegativeDecimalPattern = /^\d+(?:\.\d+)?$/u;
const canonicalNonNegativeDecimalPattern = /^(?:0|[1-9]\d*)(?:\.\d*[1-9])?$/u;
const canonicalDecimalPattern = /^-?(?:0|[1-9]\d*)(?:\.\d*[1-9])?$/u;
const modelVersionPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*-\d+\.\d+\.\d+$/u;
const parameterSetIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

/**
 * Converts a user-editable plain decimal to the canonical representation.
 *
 * No signs, exponent, whitespace, or incomplete decimals are coerced. Returning
 * null lets the UI retain transient input so the user can correct it.
 */
export function normalizeNonNegativeDecimal(
  value: unknown,
): CanonicalNonNegativeDecimalString | null {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > MAXIMUM_DECIMAL_CHARACTERS ||
    !plainNonNegativeDecimalPattern.test(value)
  ) {
    return null;
  }

  const [rawInteger, rawFraction] = value.split(".");
  const integer = rawInteger!.replace(/^0+(?=\d)/u, "");
  const fraction = rawFraction?.replace(/0+$/u, "") ?? "";
  const normalized = fraction.length > 0 ? `${integer}.${fraction}` : integer;

  return canonicalNonNegativeDecimalPattern.test(normalized)
    ? (normalized as CanonicalNonNegativeDecimalString)
    : null;
}

export function isCanonicalNonNegativeDecimal(
  value: unknown,
): value is CanonicalNonNegativeDecimalString {
  return (
    typeof value === "string" &&
    value.length <= MAXIMUM_DECIMAL_CHARACTERS &&
    canonicalNonNegativeDecimalPattern.test(value)
  );
}

export function parseCanonicalDecimal(
  value: unknown,
): CanonicalDecimalString | null {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > MAXIMUM_DECIMAL_CHARACTERS ||
    value === "-0" ||
    !canonicalDecimalPattern.test(value)
  ) {
    return null;
  }
  return value as CanonicalDecimalString;
}

export function asEffortHours(value: CanonicalDecimalString): EffortHours {
  return value as EffortHours;
}

export function asMoney(value: CanonicalDecimalString): Money {
  return value as Money;
}

export function asRatio(value: CanonicalDecimalString): Ratio {
  return value as Ratio;
}

export function asQuantity(value: CanonicalNonNegativeDecimalString): Quantity {
  return value as Quantity;
}

export function parseModelVersion(value: unknown): ModelVersion | null {
  return typeof value === "string" &&
    value.length <= 128 &&
    modelVersionPattern.test(value)
    ? (value as ModelVersion)
    : null;
}

export function defineModelVersion(value: string): ModelVersion {
  const parsed = parseModelVersion(value);
  if (parsed === null) {
    throw new TypeError(`Invalid source-controlled model version: ${value}`);
  }
  return parsed;
}

export function parseParameterSetId(value: unknown): ParameterSetId | null {
  return typeof value === "string" &&
    value.length <= 128 &&
    parameterSetIdPattern.test(value)
    ? (value as ParameterSetId)
    : null;
}
