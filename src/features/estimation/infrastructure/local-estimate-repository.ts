import type { EstimateCaseDocument } from "@/features/estimation/application/estimate-case";

import { safeParseEstimateCase } from "./estimate-case-schema";

export const ESTIMATE_STORAGE_KEY = "estimate-trace:v1:cases";

export type StorageWarning =
  | "STORAGE_UNAVAILABLE"
  | "STORAGE_READ_FAILED"
  | "STORAGE_WRITE_FAILED"
  | "STORAGE_DATA_CORRUPTED";

export type RepositoryMutationResult =
  | {
      readonly ok: true;
      readonly persisted: true;
    }
  | {
      readonly ok: true;
      readonly persisted: false;
      readonly warning: StorageWarning;
    }
  | {
      readonly ok: false;
      readonly persisted: false;
      readonly warning: "INVALID_DOCUMENT";
    };

export interface RepositoryHealth {
  readonly persistent: boolean;
  readonly warning?: StorageWarning;
}

export interface EstimateRepository {
  list(): readonly EstimateCaseDocument[];
  getById(id: string): EstimateCaseDocument | null;
  save(document: EstimateCaseDocument): RepositoryMutationResult;
  delete(id: string): RepositoryMutationResult;
  clear(): RepositoryMutationResult;
  checkHealth(): RepositoryHealth;
}

export class LocalEstimateRepository implements EstimateRepository {
  private readonly documents = new Map<string, EstimateCaseDocument>();
  private initialized = false;
  private health: RepositoryHealth;

  constructor(private readonly storage: Storage | null) {
    this.health = storage
      ? { persistent: true }
      : { persistent: false, warning: "STORAGE_UNAVAILABLE" };
  }

  list(): readonly EstimateCaseDocument[] {
    this.ensureLoaded();
    return [...this.documents.values()].toSorted((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt),
    );
  }

  getById(id: string): EstimateCaseDocument | null {
    this.ensureLoaded();
    return this.documents.get(id) ?? null;
  }

  save(document: EstimateCaseDocument): RepositoryMutationResult {
    this.ensureLoaded();
    const parsed = safeParseEstimateCase(document);
    if (!parsed.success) {
      return {
        ok: false,
        persisted: false,
        warning: "INVALID_DOCUMENT",
      };
    }

    this.documents.set(document.id, document);
    return this.persist();
  }

  delete(id: string): RepositoryMutationResult {
    this.ensureLoaded();
    this.documents.delete(id);
    return this.persist();
  }

  clear(): RepositoryMutationResult {
    this.ensureLoaded();
    this.documents.clear();
    return this.persist();
  }

  checkHealth(): RepositoryHealth {
    this.ensureLoaded();
    return this.health;
  }

  private ensureLoaded() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    if (!this.storage) {
      return;
    }

    let raw: string | null;
    try {
      raw = this.storage.getItem(ESTIMATE_STORAGE_KEY);
    } catch {
      this.health = {
        persistent: false,
        warning: "STORAGE_READ_FAILED",
      };
      return;
    }

    if (raw === null) {
      return;
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        throw new TypeError("Stored estimate collection must be an array.");
      }

      const documents = parsed.map((value) => {
        const result = safeParseEstimateCase(value);
        if (!result.success) {
          throw new TypeError("Stored estimate document failed validation.");
        }
        return result.data as EstimateCaseDocument;
      });

      for (const document of documents) {
        this.documents.set(document.id, document);
      }
    } catch {
      this.documents.clear();
      this.health = {
        persistent: false,
        warning: "STORAGE_DATA_CORRUPTED",
      };
    }
  }

  private persist(): RepositoryMutationResult {
    if (!this.storage) {
      return {
        ok: true,
        persisted: false,
        warning: "STORAGE_UNAVAILABLE",
      };
    }

    try {
      this.storage.setItem(
        ESTIMATE_STORAGE_KEY,
        JSON.stringify([...this.documents.values()]),
      );
      this.health = { persistent: true };
      return { ok: true, persisted: true };
    } catch {
      this.health = {
        persistent: false,
        warning: "STORAGE_WRITE_FAILED",
      };
      return {
        ok: true,
        persisted: false,
        warning: "STORAGE_WRITE_FAILED",
      };
    }
  }
}

export function createBrowserEstimateRepository(): LocalEstimateRepository {
  try {
    return new LocalEstimateRepository(window.localStorage);
  } catch {
    return new LocalEstimateRepository(null);
  }
}
