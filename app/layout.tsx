import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ThemeProvider } from "@/components/theme-provider";
const siteUrl = "https://brobeximagetolls.vercel.app";
export const metadata: Metadata = {
 metadataBase: new URL(siteUrl),
    title: { default: "BROBEX Image Tools Free Online Image Utilities", template: "%s | BROBEX Image Tools" },
 description: "Edit, resize, compress, crop, and convert images with practical online tools from BROBEX.",

 openGraph: { type: "website", siteName: "BROBEX Image Tools", title: "BROBEX Image Tools", description: "Practical image tools, thoughtfully designed.", url: siteUrl },
 twitter: { card: "summary_large_image", title: "BROBEX Image Tools", description: "Edit and convert images with practical online tools." },
 robots: { index: true, follow: true }
};
export const viewport: Viewport = { themeColor: "#F7F7F5", width: "device-width", initialScale: 1 };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en" suppressHydrationWarning><body><ThemeProvider><Header/><main>{children}</main><Footer/></ThemeProvider><Analytics /></body></html> }

