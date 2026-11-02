import Link from "next/link";
import { ArrowRight, Image, WandSparkles } from "lucide-react";
import { ImageToolDirectory } from "@/components/image-tool-directory";

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="container home-hero">
        <div className="home-hero-copy">
          <span className="home-kicker"><span className="home-kicker-dot" /> FREE ONLINE IMAGE UTILITIES</span>
          <h1>Image tools for <span>everyday work.</span></h1>
          <p className="home-lead">Compress, resize, convert, crop, and edit your images with a practical collection of free online tools.</p>
          <a className="home-primary-link" href="#all-tools">Explore all tools <ArrowRight size={17} /></a>
          <div className="home-benefits">
            <span><i /> Simple to use</span>
            <span><i /> No account required</span>
            <span><i /> Browser-based tools</span>
          </div>
        </div>
        <div className="home-hero-art" aria-hidden="true">
          <div className="hero-art-window">
            <div className="hero-art-top"><span /><span /><span /><b>IMAGE STUDIO</b></div>
            <div className="hero-art-canvas"><div className="hero-art-sun" /><div className="hero-art-hill hero-art-hill-one" /><div className="hero-art-hill hero-art-hill-two" /></div>
            <div className="hero-art-tools"><span /><span /><span /><span /><span /></div>
          </div>
          <div className="hero-art-chip hero-art-chip-one"><Image size={16} /> Image ready</div>
          <div className="hero-art-chip hero-art-chip-two"><WandSparkles size={16} /> Quick edits</div>
        </div>
      </section>

      <section className="container home-directory-section" id="all-tools" aria-labelledby="directory-heading">
        <div className="home-section-heading directory-intro">
          <div><span className="home-overline">THE BROBEX TOOLBOX</span><h2 id="directory-heading">Explore all image tools</h2><p>Choose a focused tool, upload your image, and get a ready-to-use result. Search by category or task.</p></div>
        </div>
        <ImageToolDirectory />
      </section>

      <section className="home-privacy-strip">
        <div className="container home-privacy-inner">
          <span className="home-privacy-icon"><Image size={21} /></span>
          <div><strong>Work with your images confidently</strong><p>Each tool shows its processing method and availability. Browser-based tools process files locally where supported.</p></div>
          <Link href="/privacy">Privacy details <ArrowRight size={15} /></Link>
        </div>
      </section>
    </div>
  );
}
