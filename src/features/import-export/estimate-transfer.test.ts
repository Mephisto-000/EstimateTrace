import { describe, expect, it } from "vitest";

import { createFictionalExamples } from "@/features/estimation/application/create-estimate";

import { exportEstimateJson, importEstimateJson } from "./estimate-transfer";

function createExample() {
  let sequence = 0;
  return createFictionalExamples({
    createId: () =>
      `00000000-0000-4000-8000-${String(++sequence).padStart(12, "0")}`,
    now: () => "2026-07-29T08:00:00.000Z",
  })[0]!;
}

describe("importEstimateJson", () => {
  it("拒絕 malformed JSON 且不回傳可保存案件", () => {
    expect(importEstimateJson("{not-json")).toEqual({
      ok: false,
      code: "MALFORMED_JSON",
      path: "$",
    });
  });

  it("在 parse 後、schema merge 前拒絕 prototype pollution key", () => {
    const payload = '{"schemaVersion":"1.0.0","__proto__":{"polluted":true}}';

    expect(importEstimateJson(payload)).toEqual({
      ok: false,
      code: "DANGEROUS_KEY",
      path: "$.__proto__",
    });
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
  });

  it("在 JSON.parse 前拒絕超過 1 MiB 的檔案", () => {
    const payload = "x".repeat(1024 * 1024 + 1);

    expect(importEstimateJson(payload)).toEqual({
      ok: false,
      code: "FILE_TOO_LARGE",
      path: "$",
    });
  });

  it("拒絕不支援的 schema version 且不建構案件", () => {
    expect(importEstimateJson('{"schemaVersion":"2.0.0"}')).toEqual({
      ok: false,
      code: "UNSUPPORTED_SCHEMA_VERSION",
      path: "$.schemaVersion",
    });
  });

  it("匯出完整參數與結果 snapshot，匯入後重算為相同 canonical result", () => {
    const source = createExample();
    const exported = exportEstimateJson(source, "2026-07-29T09:00:00.000Z");

    expect(exported.ok).toBe(true);
    if (!exported.ok) {
      return;
    }

    expect(exported.result.calculationTrace[0]?.formula).toBe(
      "H_i,base = q_i × u_i",
    );

    const imported = importEstimateJson(exported.text);
    expect(imported.ok).toBe(true);
    if (!imported.ok) {
      return;
    }

    expect(imported.estimate).toEqual(source);
    expect(imported.result).toEqual(exported.result);
    expect(imported.warnings).toEqual([]);
  });

  it("匯入時不信任 result snapshot，發現差異後以重算結果回傳 warning", () => {
    const exported = exportEstimateJson(
      createExample(),
      "2026-07-29T09:00:00.000Z",
    );
    expect(exported.ok).toBe(true);
    if (!exported.ok) {
      return;
    }
    const payload = JSON.parse(exported.text) as {
      resultSnapshot: { p50EffortHours: string };
    };
    payload.resultSnapshot.p50EffortHours = "999999";

    const imported = importEstimateJson(JSON.stringify(payload));

    expect(imported.ok).toBe(true);
    if (imported.ok) {
      expect(imported.warnings).toEqual(["RESULT_SNAPSHOT_MISMATCH"]);
      expect(imported.result.p50EffortHours).not.toBe("999999");
    }
  });

  it("拒絕過深的 dangerous-key traversal，不因 call stack overflow 拋出例外", () => {
    const nested = '{"next":'.repeat(150) + "null" + "}".repeat(150);
    const payload = `{"schemaVersion":"1.0.0","resultSnapshot":${nested}}`;

    expect(importEstimateJson(payload)).toEqual({
      ok: false,
      code: "PAYLOAD_TOO_COMPLEX",
      path: expect.stringMatching(/^\$\.resultSnapshot(?:\.next)+$/),
    });
  });

  it("snapshot comparison 對深層 untrusted 結構回傳 typed error", () => {
    const exported = exportEstimateJson(
      createExample(),
      "2026-07-29T09:00:00.000Z",
    );
    expect(exported.ok).toBe(true);
    if (!exported.ok) {
      return;
    }

    const payload = JSON.parse(exported.text) as {
      resultSnapshot: unknown;
    };
    let nested: unknown = null;
    for (let index = 0; index < 150; index += 1) {
      nested = { next: nested };
    }
    payload.resultSnapshot = nested;

    expect(importEstimateJson(JSON.stringify(payload))).toMatchObject({
      ok: false,
      code: "PAYLOAD_TOO_COMPLEX",
    });
  });
});
