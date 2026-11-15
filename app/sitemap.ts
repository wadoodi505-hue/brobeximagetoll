import type { MetadataRoute } from "next";
import { tools, categories } from "@/lib/tools";

const siteUrl = "https://brobeximagetolls.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const indexableTools = tools.filter((tool) => tool.status === "browser");

  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    ...categories.map((category) => ({
      url: `${siteUrl}${category.href}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...indexableTools.map((tool) => ({
      url: `${siteUrl}/tools/${tool.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...["about", "contact", "privacy", "terms"].map((page) => ({
      url: `${siteUrl}/${page}`,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
