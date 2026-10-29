import type { MetadataRoute } from "next";
import { tools, categories } from "@/lib/tools";
export default function sitemap():MetadataRoute.Sitemap{const base="https://brobeximagetolls.vercel.app";return [{url:base,changeFrequency:"weekly",priority:1},...categories.map(c=>({url:`${base}${c.href}`,changeFrequency:"weekly" as const,priority:.8})),...tools.map(t=>({url:`${base}/tools/${t.slug}`,changeFrequency:"monthly" as const,priority:.6})),...["about","contact","privacy","terms"].map(p=>({url:`${base}/${p}`,changeFrequency:"yearly" as const,priority:.3}))]}

