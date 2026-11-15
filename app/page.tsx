import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Image } from "lucide-react";
import { ImageToolDirectory, DirectorySidebar } from "@/components/image-tool-directory";

export const metadata: Metadata = {
  title: { absolute: "Free Online Image Tools – Compress, Resize, Crop & Convert | BROBEX" },
  description: "Use free online image tools to compress JPG, PNG and WebP files, resize images to exact dimensions, crop photos, add text, and convert formats with BROBEX.",
  keywords: ["free online image tools", "image compressor", "bulk image resizer", "resize image online", "crop image online", "image format converter", "BROBEX Image Tools"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    title: "Free Online Image Tools – BROBEX Image Tools",
    description: "Compress, resize, crop, edit, and convert images with practical free online tools from BROBEX.",
    url: "https://brobeximagetolls.vercel.app/",
    images: [{ url: "/brobex-logo.webp", width: 1254, height: 1254, alt: "BROBEX Image Tools logo" }],
  },
  twitter: { card: "summary_large_image", title: "Free Online Image Tools – BROBEX", description: "Compress, resize, crop, edit, and convert images online with BROBEX.", images: ["/brobex-logo.webp"] },
};

export default function HomePage() {
  return (
    <div className="directory-home">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "BROBEX Image Tools",
            url: "https://brobeximagetolls.vercel.app/",
            description: "Free online tools to compress, resize, crop, edit, and convert images.",
            applicationCategory: "MultimediaApplication",
            operatingSystem: "Web browser",
            isAccessibleForFree: true,
            author: { "@type": "Person", name: "BROBEX", url: "https://brobexportfolio.vercel.app/" },
          }).replace(/</g, "\\u003c"),
        }}
      />
      <main className="directory-main-panel" id="all-tools">
        <div className="directory-page-heading">
          <div>
            <span className="directory-eyebrow">BROBEX IMAGE STUDIO</span>
            <h1>Compress, Resize &amp; Edit Pictures</h1>
            <p>Free online tools to edit, convert, compress, resize and prepare your images.</p>
          </div>
          <span className="directory-heading-mark" aria-hidden="true"><Image size={23} /></span>
        </div>
        <ImageToolDirectory />
        <section className="directory-privacy-note" aria-label="About BROBEX Image Tools">
          <div><strong>Free online image tools by BROBEX</strong><p>BROBEX Image Tools brings together practical utilities for image compression, resizing, cropping, editing, and format conversion. Each tool identifies its current processing availability so you can choose a workflow with clear expectations.</p><p>Built by <a href="https://brobexportfolio.vercel.app/" target="_blank" rel="noopener noreferrer">BROBEX, frontend developer and UI/UX designer</a>.</p></div>
          <Link href="/about">About BROBEX <ArrowRight size={14} /></Link>
        </section>
        <div className="directory-privacy-note">
          <div><strong>Work with your images confidently</strong><p>Each tool displays its current availability. Browser-based tools process files locally where supported.</p></div>
          <Link href="/privacy">Privacy details <ArrowRight size={14} /></Link>
        </div>
      </main>
      <DirectorySidebar />
    </div>
  );
}
