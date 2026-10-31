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
        <span className="eyebrow">A BETTER WAY TO GET IT DONE</span>
        <h1>Image Tools</h1>
        <p className="hero-subtitle">BROBEX free image tools website</p>
        <p className="hero-description">
          Edit, resize, compress, convert, and enhance images with a focused
          collection of practical tools. Start in your browser wherever supported.
        </p>

        <div className="feature-pills">
          <span><ShieldCheck size={14} /> Browser-based processing</span>
          <span><Zap size={14} /> Lightweight by design</span>
          <span><Download size={14} /> Easy downloads</span>
        </div>
      </section>

      <section className="container section">
        <div className="section-heading directory-main-heading">
          <div>
            <span className="eyebrow">BROBEX IMAGE TOOLS</span>
            <h2>Most Used Tools</h2>
            <p>Find the right tool quickly. Search or explore the collection below.</p>
          </div>
        </div>

        <ImageToolDirectory />
      </section>
    </>
  );
}
