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
    default: "BROBEX Image Tools – Free Online Image Utilities & Editors",
    template: "%s | BROBEX Image Tools",
  },

  description:
    "Use free online image tools to compress, resize, crop, edit, and convert pictures in your browser. Explore practical image utilities from BROBEX.",

  applicationName: "BROBEX Image Tools",

  authors: [
    {
      name: "BROBEX",
      url: "https://brobexportfolio.vercel.app/",
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
    title: "BROBEX Image Tools – Free Online Image Utilities & Editors",
    description:
      "Free online tools to compress, resize, crop, edit, and convert images. Practical browser-based utilities from BROBEX.",
    images: [
      {
        url: "/brobex-logo.webp",
        width: 1254,
        height: 1254,
        alt: "BROBEX Image Tools Logo",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "BROBEX Image Tools – Free Online Image Utilities & Editors",
    description:
      "Compress, resize, crop, edit, and convert images online with free BROBEX Image Tools.",
    images: ["/brobex-logo.webp"],
    creator: "BROBEX",
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
    "author:url": "https://brobexportfolio.vercel.app/",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "BROBEX",
                url: "https://brobexportfolio.vercel.app/",
                email: "brobex.ffx@gmail.com",
                logo: `${siteUrl}/brobex-logo.webp`,
                sameAs: ["https://brobexportfolio.vercel.app/"],
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "BROBEX Image Tools",
                url: siteUrl,
                publisher: { "@type": "Organization", name: "BROBEX", url: "https://brobexportfolio.vercel.app/" },
              },
            ]).replace(/</g, "\\u003c"),
          }}
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


