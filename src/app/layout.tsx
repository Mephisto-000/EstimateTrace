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
    default: "EstimateTrace｜可追溯的軟體需求成本估算",
    template: `%s｜${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "軟體成本估算",
    "需求估算",
    "P50",
    "P80",
    "Vendor Quote",
    "IT Business Analyst",
  ],
  openGraph: {
    type: "website",
    locale: "zh_TW",
    siteName: siteConfig.name,
    title: "EstimateTrace｜可追溯的軟體需求成本估算",
    description: siteConfig.description,
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "EstimateTrace｜可追溯的軟體需求成本估算",
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
