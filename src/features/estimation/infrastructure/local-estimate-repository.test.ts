import { describe, expect, it } from "vitest";

import { createEmptyEstimateCase } from "@/features/estimation/application/create-estimate";

import {
  ESTIMATE_STORAGE_KEY,
  LocalEstimateRepository,
} from "./local-estimate-repository";

class MemoryStorage implements Storage {
  readonly values = new Map<string, string>();
  throwOnRead = false;
  throwOnWrite = false;
  writeCount = 0;

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    if (this.throwOnRead) {
      throw new DOMException("blocked", "SecurityError");
    }
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    if (this.throwOnWrite) {
      throw new DOMException("quota", "QuotaExceededError");
    }
    this.writeCount += 1;
    this.values.set(key, value);
  }
}

function estimate(id: string, updatedAt: string) {
  return {
    ...createEmptyEstimateCase(
      {
        name: `案件 ${id}`,
        description: "fictional／illustrative",
      },
      {
        createId: () => id,
        now: () => updatedAt,
      },
    ),
    updatedAt,
  };
}

describe("LocalEstimateRepository", () => {
  it("透過 repository contract 保存、排序、取得與刪除案件", () => {
    const storage = new MemoryStorage();
    const repository = new LocalEstimateRepository(storage);
    const older = estimate(
      "00000000-0000-4000-8000-000000000001",
      "2026-07-28T08:00:00.000Z",
    );
    const newer = estimate(
      "00000000-0000-4000-8000-000000000002",
      "2026-07-29T08:00:00.000Z",
    );

    expect(repository.save(older)).toEqual({ ok: true, persisted: true });
    expect(repository.save(newer)).toEqual({ ok: true, persisted: true });
    expect(repository.list().map((item) => item.id)).toEqual([
      newer.id,
      older.id,
    ]);
    expect(repository.getById(older.id)?.name).toBe(`案件 ${older.id}`);

    expect(repository.delete(older.id)).toEqual({
      ok: true,
      persisted: true,
    });
    expect(repository.getById(older.id)).toBeNull();
  });

  it("localStorage 寫入失敗時保留 session state 並回報不可持久化", () => {
    const storage = new MemoryStorage();
    const repository = new LocalEstimateRepository(storage);
    storage.throwOnWrite = true;
    const document = estimate(
      "00000000-0000-4000-8000-000000000003",
      "2026-07-29T09:00:00.000Z",
    );

    expect(repository.save(document)).toEqual({
      ok: true,
      persisted: false,
      warning: "STORAGE_WRITE_FAILED",
    });
    expect(repository.getById(document.id)).toEqual(document);
    expect(repository.checkHealth()).toEqual({
      persistent: false,
      warning: "STORAGE_WRITE_FAILED",
    });
  });

  it("corrupted local data 不造成例外或覆寫原始內容", () => {
    const storage = new MemoryStorage();
    storage.setItem(ESTIMATE_STORAGE_KEY, "{not-json");

    const repository = new LocalEstimateRepository(storage);

    expect(repository.list()).toEqual([]);
    expect(repository.checkHealth()).toEqual({
      persistent: false,
      warning: "STORAGE_DATA_CORRUPTED",
    });
    expect(storage.getItem(ESTIMATE_STORAGE_KEY)).toBe("{not-json");
  });

  it("corrupted store 的 session mutation 不覆寫原始內容，clear 可明確復原", () => {
    const storage = new MemoryStorage();
    storage.setItem(ESTIMATE_STORAGE_KEY, "{unknown-corrupted-data");
    const originalWriteCount = storage.writeCount;
    const repository = new LocalEstimateRepository(storage);
    const document = estimate(
      "00000000-0000-4000-8000-000000000004",
      "2026-07-29T10:00:00.000Z",
    );

    expect(repository.save(document)).toEqual({
      ok: true,
      persisted: false,
      warning: "STORAGE_DATA_CORRUPTED",
    });
    expect(repository.getById(document.id)).toEqual(document);
    expect(repository.delete(document.id)).toEqual({
      ok: true,
      persisted: false,
      warning: "STORAGE_DATA_CORRUPTED",
    });
    expect(storage.writeCount).toBe(originalWriteCount);
    expect(storage.getItem(ESTIMATE_STORAGE_KEY)).toBe(
      "{unknown-corrupted-data",
    );

    expect(repository.clear()).toEqual({ ok: true, persisted: true });
    expect(storage.getItem(ESTIMATE_STORAGE_KEY)).toBe("[]");
    expect(repository.checkHealth()).toEqual({ persistent: true });
  });

  it("read-failed store 的 session mutation 不覆寫未知資料，clear 可明確復原", () => {
    const storage = new MemoryStorage();
    storage.setItem(ESTIMATE_STORAGE_KEY, '[{"unknown":"document"}]');
    const originalWriteCount = storage.writeCount;
    storage.throwOnRead = true;
    const repository = new LocalEstimateRepository(storage);
    const document = estimate(
      "00000000-0000-4000-8000-000000000005",
      "2026-07-29T11:00:00.000Z",
    );

    expect(repository.list()).toEqual([]);
    expect(repository.save(document)).toEqual({
      ok: true,
      persisted: false,
      warning: "STORAGE_READ_FAILED",
    });
    expect(repository.getById(document.id)).toEqual(document);
    expect(repository.delete(document.id)).toEqual({
      ok: true,
      persisted: false,
      warning: "STORAGE_READ_FAILED",
    });
    expect(storage.writeCount).toBe(originalWriteCount);

    expect(repository.clear()).toEqual({ ok: true, persisted: true });
    storage.throwOnRead = false;
    expect(storage.getItem(ESTIMATE_STORAGE_KEY)).toBe("[]");
  });

  it.each([
    ["name", { name: " \t " }],
    ["description", { description: "\n  " }],
  ] as const)("拒絕只有空白的案件 %s", (_field, changes) => {
    const repository = new LocalEstimateRepository(new MemoryStorage());
    const document = {
      ...estimate(
        "00000000-0000-4000-8000-000000000006",
        "2026-07-29T12:00:00.000Z",
      ),
      ...changes,
    };

    expect(repository.save(document)).toEqual({
      ok: false,
      persisted: false,
      warning: "INVALID_DOCUMENT",
    });
    expect(repository.getById(document.id)).toBeNull();
  });
});
