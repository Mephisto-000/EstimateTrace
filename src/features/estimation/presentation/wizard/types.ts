import type { EstimateCaseDocument } from "@/features/estimation/application/estimate-case";

export type EstimateUpdater = (
  update: (current: EstimateCaseDocument) => EstimateCaseDocument,
) => void;

export interface WizardValidationIssue {
  readonly fieldId: string;
  readonly message: string;
}

export interface WizardStepProps {
  readonly estimate: EstimateCaseDocument;
  readonly updateEstimate: EstimateUpdater;
  readonly issues: readonly WizardValidationIssue[];
}
