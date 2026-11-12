import type { Metadata, Viewport } from "next";
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
    "Edit, resize, crop, compress, convert, and optimize images online for free with BROBEX Image Tools. Fast, easy-to-use image utilities for creators, developers, and businesses.",

  applicationName: "BROBEX Image Tools",

  authors: [
    {
      name: "BROBEX",
      url: siteUrl,
    },
  ],

  creator: "BROBEX",
  publisher: "BROBEX",

  category: "Technology",

  keywords: [
    "BROBEX",
    "BROBEX Image Tools",
    "free online image tools",
    "image editor online",
    "image compressor",
    "compress image online",
    "resize image online",
    "crop image online",
    "convert image online",
    "image format converter",
    "photo editing tools",
    "online image optimizer",
    "free photo tools",
    "image resizer",
    "PNG tools",
    "JPG tools",
    "WebP converter",
    "browser-based image editor",
  ],

  icons: {
    icon: [
      {
        url: "/brobex-logo.png",
        type: "image/png",
      },
    ],
    shortcut: "/brobex-logo.png",
    apple: "/brobex-logo.png",
  },

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "BROBEX Image Tools",
    url: siteUrl,
    title: "Free Online Image Tools | BROBEX Image Tools",
    description:
      "Discover free online tools to edit, resize, crop, compress, convert, and optimize images with BROBEX Image Tools.",
    images: [
      {
        url: "/brobex-logo.png",
        width: 512,
        height: 512,
        alt: "BROBEX Image Tools Logo",
      },
    ],
  },

  twitter: {
    card: "summary",
    title: "Free Online Image Tools | BROBEX Image Tools",
    description:
      "Edit, resize, crop, compress, and convert images online for free with BROBEX Image Tools.",
    images: ["/brobex-logo.png"],
    creator: "@brobex",
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

  other: {
    "contact:email": "brobex.ffx@gmail.com",
    "brand": "BROBEX",
  },
};


export const viewport: Viewport = {
  themeColor: "#ffffff",
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
      <head>
        <meta
          name="google-adsense-account"
          content="ca-pub-2771980465268081"
        />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2771980465268081"
          crossOrigin="anonymous"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `try { var savedTheme = localStorage.getItem("brobex-theme"); var preferredTheme = savedTheme === "light" || savedTheme === "dark" ? savedTheme : (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"); document.documentElement.dataset.theme = preferredTheme; } catch (e) { document.documentElement.dataset.theme = "light"; }`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}


