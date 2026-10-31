import {
  ShieldCheck,
  Zap,
  Download
} from "lucide-react";
import { ImageToolDirectory } from "@/components/image-tool-directory";

export default function HomePage() {
  return (
    <>
      <section className="container hero">
        <h1>BROBEX IMAGE TOOLS</h1>
        <p className="hero-subtitle">Free online image tools</p>
        <p className="hero-description">
          Edit, resize, compress, convert, and enhance images with practical
          tools designed to work directly in your browser wherever supported.
        </p>

        <div className="feature-pills">
          <span><ShieldCheck size={14} /> Browser-based processing</span>
          <span><Zap size={14} /> Lightweight by design</span>
          <span><Download size={14} /> Easy downloads</span>
        </div>
      </section>

      <section className="container section">
        <ImageToolDirectory />
      </section>
    </>
  );
}
