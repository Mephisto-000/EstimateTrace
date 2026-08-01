import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SkipLink } from "@/components/layout/skip-link";
import { getSiteUrl, siteConfig } from "@/config/site";

import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "EstimateTrace｜軟體需求估算參考",
    template: `%s｜${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "軟體成本估算",
    "需求估算",
    "P50",
    "P80",
    "乙方報價",
    "資訊科技商業分析師",
  ],
  openGraph: {
    type: "website",
    locale: "zh_TW",
    siteName: siteConfig.name,
    title: "EstimateTrace｜軟體需求估算參考",
    description: siteConfig.description,
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "EstimateTrace｜軟體需求估算參考",
    description: siteConfig.description,
  },
  referrer: "strict-origin-when-cross-origin",
  formatDetection: {
    address: false,
    email: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
  themeColor: "#f6f7f4",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang={siteConfig.locale}>
      <body>
        <SkipLink />
        <SiteHeader />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
