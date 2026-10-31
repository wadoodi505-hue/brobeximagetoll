import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ThemeProvider } from "@/components/theme-provider";

const siteUrl = "https://brobeximagetolls.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "Free Online Image Tools | BROBEX Image Tools",
    template: "%s | BROBEX Image Tools",
  },

  description:
    "Use free online image tools to edit, resize, crop, compress, convert, and optimize images. Explore practical browser-based utilities from BROBEX.",

  applicationName: "BROBEX Image Tools",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "BROBEX Image Tools",
    title: "Free Online Image Tools | BROBEX Image Tools",
    description:
      "Edit, resize, crop, compress, and convert images with practical online tools from BROBEX.",
    url: siteUrl,
  },

  twitter: {
    card: "summary_large_image",
    title: "Free Online Image Tools | BROBEX Image Tools",
    description:
      "Explore practical online tools to edit, resize, crop, compress, and convert images.",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#F7F7F5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </ThemeProvider>
                <Script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2771980465268081" crossOrigin="anonymous" strategy="beforeInteractive" />
        <Analytics />
      </body>
    </html>
  );
}

