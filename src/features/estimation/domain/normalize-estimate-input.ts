import type { DecimalString, EstimateInput } from "./types";
import { CROSS_CUTTING_PHASES } from "./validation";
import { normalizeNonNegativeDecimal } from "./value-objects";

function normalizeOrKeep(value: DecimalString): DecimalString {
  return normalizeNonNegativeDecimal(value) ?? value;
}

/**
 * Canonicalizes complete decimal values at the editable-input boundary while
 * preserving incomplete or invalid text for field-level correction.
 */
export function normalizeEstimateInputDecimals(
  input: EstimateInput,
): EstimateInput {
  return {
    ...input,
    workItems: input.workItems.map((item) => ({
      ...item,
      quantity: normalizeOrKeep(item.quantity),
      unitHours: normalizeOrKeep(item.unitHours),
    })),
    phaseLoading: Object.fromEntries(
      CROSS_CUTTING_PHASES.map((phase) => [
        phase,
        normalizeOrKeep(input.phaseLoading[phase]),
      ]),
    ) as EstimateInput["phaseLoading"],
    ...(input.fixedEffortHours === undefined
      ? {}
      : { fixedEffortHours: normalizeOrKeep(input.fixedEffortHours) }),
    uncertainty: {
      downsideRate: normalizeOrKeep(input.uncertainty.downsideRate),
      upsideRate: normalizeOrKeep(input.uncertainty.upsideRate),
    },
    commercialTerms: {
      hourlyRate: normalizeOrKeep(input.commercialTerms.hourlyRate),
      directCost: normalizeOrKeep(input.commercialTerms.directCost),
      overheadRate: normalizeOrKeep(input.commercialTerms.overheadRate),
      warrantyCost: normalizeOrKeep(input.commercialTerms.warrantyCost),
      vendorMarkupRate: normalizeOrKeep(input.commercialTerms.vendorMarkupRate),
      taxRate: normalizeOrKeep(input.commercialTerms.taxRate),
      hoursPerPersonDay: normalizeOrKeep(
        input.commercialTerms.hoursPerPersonDay,
      ),
      daysPerPersonMonth: normalizeOrKeep(
        input.commercialTerms.daysPerPersonMonth,
      ),
    },
    vendorQuote:
      input.vendorQuote === null
        ? null
        : {
            ...input.vendorQuote,
            amount: normalizeOrKeep(input.vendorQuote.amount),
          },
  };
}
