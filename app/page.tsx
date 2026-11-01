import Link from "next/link";
import { ArrowRight, Image, ScanText, Scaling, UserRound, WandSparkles, FileImage, Layers3 } from "lucide-react";
import { ImageToolDirectory } from "@/components/image-tool-directory";

const popularTools = [
  { name: "Passport Photo Maker", description: "Prepare passport and ID photos with custom document sizes.", href: "/tools/passport-photo-maker", icon: UserRound },
  { name: "Compress Image", description: "Reduce image file size for websites, forms, and sharing.", href: "/tools/compress-image-size", icon: Image },
  { name: "Resize Image", description: "Set exact pixel dimensions while keeping proportions.", href: "/tools/resize-image-dimensions", icon: Scaling },
  { name: "Remove Background", description: "Create a transparent background with the configured remover.", href: "/tools/remove-background-from-image", icon: WandSparkles },
  { name: "Image to Text", description: "Extract editable text from an image with OCR.", href: "/tools/image-to-text", icon: ScanText },
  { name: "Image Splitter", description: "Divide an image into a grid and export the tiles.", href: "/tools/image-splitter", icon: Layers3 },
  { name: "Convert Image", description: "Convert supported image formats in your browser.", href: "/tools/jpg-to-png", icon: FileImage },
  { name: "Upscale Image", description: "Increase image dimensions with browser resampling.", href: "/tools/upscale-image", icon: WandSparkles },
];

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

      <section className="container home-popular" aria-labelledby="popular-heading">
        <div className="home-section-heading">
          <div><span className="home-overline">START HERE</span><h2 id="popular-heading">Most used tools</h2><p>Jump straight into the tools people reach for most.</p></div>
          <a href="#all-tools" className="home-text-link">View full directory <ArrowRight size={15} /></a>
        </div>
        <div className="popular-tool-grid">
          {popularTools.map((tool) => {
            const Icon = tool.icon;
            return <Link href={tool.href} className="popular-tool-card" key={tool.href}>
              <span className="popular-tool-icon"><Icon size={20} strokeWidth={1.8} /></span>
              <span className="popular-tool-content"><strong>{tool.name}</strong><small>{tool.description}</small></span>
              <ArrowRight className="popular-tool-arrow" size={17} />
            </Link>;
          })}
        </div>
      </section>

      <section className="container home-directory-section" id="all-tools" aria-labelledby="directory-heading">
        <div className="home-section-heading directory-intro">
          <div><span className="home-overline">THE TOOLBOX</span><h2 id="directory-heading">Explore all image tools</h2><p>Find the right tool by category, or search by the task you want to complete.</p></div>
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
