import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Clock3,
  FileImage,
  Grid3X3,
  Image,
  ImagePlus,
  PenLine,
  PenTool,
  Ruler,
  ScanText,
  Scaling,
  UserRound,
  WandSparkles,
} from "lucide-react";
import { ImageToolDirectory } from "@/components/image-tool-directory";
import { imageToolCategories, getDirectoryToolState } from "@/lib/image-tool-directory";

const popularIcons = [
  UserRound,
  FileImage,
  Scaling,
  PenLine,
  ScanText,
  Grid3X3,
  PenTool,
  ImagePlus,
  WandSparkles,
  PenTool,
  Ruler,
  Image,
];

const popularTools = imageToolCategories[0].tools;

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
          <div>
            <span className="home-overline">START HERE</span>
            <h2 id="popular-heading">Most used tools</h2>
            <p>Jump straight into the tools people reach for most.</p>
          </div>
          <a href="#all-tools" className="home-text-link">View full directory <ArrowRight size={15} /></a>
        </div>
        <div className="popular-tool-grid popular-tool-grid--twelve">
          {popularTools.map((tool, index) => {
            const Icon = popularIcons[index] ?? Image;
            const state = getDirectoryToolState(tool);
            const content = (
              <>
                <span className="popular-tool-icon"><Icon size={19} strokeWidth={1.8} /></span>
                <span className="popular-tool-content">
                  <strong>{tool.name}</strong>
                  <small>{tool.description}</small>
                  {!state.available && <span className="popular-tool-coming"><Clock3 size={11} /> Coming Soon</span>}
                </span>
                {state.available ? <ArrowUpRight className="popular-tool-arrow" size={17} /> : <span className="popular-tool-soon-mark">Soon</span>}
              </>
            );

            return state.available && state.href ? (
              <Link href={state.href} className="popular-tool-card" key={`${tool.name}-${index}`}>
                {content}
              </Link>
            ) : (
              <div className="popular-tool-card popular-tool-card--soon" key={`${tool.name}-${index}`} aria-label={`${tool.name}, coming soon`}>
                {content}
              </div>
            );
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
