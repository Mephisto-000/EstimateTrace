import type { Metadata } from "next";

export const siteConfig = {
  name: "EstimateTrace",
  description:
    "可追溯的軟體需求成本估算與乙方報價合理性分析工具，協助 IT Business Analyst 說明估算來源與假設。",
  locale: "zh-TW",
  navigation: [
    { href: "/", label: "首頁" },
    { href: "/estimates", label: "我的估算" },
    { href: "/estimates/new", label: "建立估算" },
    { href: "/methodology", label: "公式與定義" },
    { href: "/examples", label: "範例" },
    { href: "/about", label: "關於" },
  ],
} as const;

export const PRODUCTION_SITE_URL = "https://estimate-trace.vercel.app";
const DEVELOPMENT_SITE_URL = "http://localhost:3000";

type PublicPageMetadata = {
  title: string;
  description: string;
  path: string;
  absoluteTitle?: boolean;
};

export function createPublicPageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
}: PublicPageMetadata): Metadata {
  const resolvedTitle = absoluteTitle ? title : `${title}｜${siteConfig.name}`;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "website",
      locale: "zh_TW",
      siteName: siteConfig.name,
      title: resolvedTitle,
      description,
      url: path,
    },
    twitter: {
      card: "summary",
      title: resolvedTitle,
      description,
    },
  };
}

function withProtocol(value: string): string {
  return /^https?:\/\//u.test(value) ? value : `https://${value}`;
}

export function getSiteUrl(): URL {
  const fallbackUrl =
    process.env.NODE_ENV === "production"
      ? PRODUCTION_SITE_URL
      : DEVELOPMENT_SITE_URL;
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    fallbackUrl;

  try {
    return new URL(withProtocol(configuredUrl));
  } catch {
    return new URL(fallbackUrl);
  }
}
