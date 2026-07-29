import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/config/site";

const publicRoutes = [
  { path: "/", priority: 1, changeFrequency: "monthly" },
  { path: "/methodology", priority: 0.9, changeFrequency: "monthly" },
  { path: "/examples", priority: 0.7, changeFrequency: "monthly" },
  { path: "/about", priority: 0.6, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.5, changeFrequency: "yearly" },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  return publicRoutes.map(({ path, priority, changeFrequency }) => ({
    url: new URL(path, siteUrl).toString(),
    changeFrequency,
    priority,
  }));
}
