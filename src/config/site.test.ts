import { afterEach, describe, expect, it, vi } from "vitest";

import { getSiteUrl, PRODUCTION_SITE_URL } from "./site";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getSiteUrl", () => {
  it("uses the explicit public canonical URL when configured", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");

    expect(getSiteUrl().toString()).toBe("https://example.com/");
  });

  it("uses the stable production URL when Vercel system variables are absent", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", undefined);
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", undefined);

    expect(getSiteUrl().toString()).toBe(`${PRODUCTION_SITE_URL}/`);
  });

  it("keeps localhost as the development fallback", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", undefined);
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", undefined);

    expect(getSiteUrl().toString()).toBe("http://localhost:3000/");
  });

  it("falls back safely when a configured URL is invalid", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://[invalid");

    expect(getSiteUrl().toString()).toBe(`${PRODUCTION_SITE_URL}/`);
  });
});
