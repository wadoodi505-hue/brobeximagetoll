import Link from "next/link";
import { ArrowRight, Image } from "lucide-react";
import { ImageToolDirectory, DirectorySidebar } from "@/components/image-tool-directory";

export default function HomePage() {
  return (
    <div className="directory-home">
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
        <div className="directory-privacy-note">
          <div><strong>Work with your images confidently</strong><p>Each tool displays its current availability. Browser-based tools process files locally where supported.</p></div>
          <Link href="/privacy">Privacy details <ArrowRight size={14} /></Link>
        </div>
      </main>
      <DirectorySidebar />
    </div>
  );
}
